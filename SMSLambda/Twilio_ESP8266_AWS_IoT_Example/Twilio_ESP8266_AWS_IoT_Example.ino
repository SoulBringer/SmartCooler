/*
 * Twilio send and receive SMS/MMS messages through AWS IoT, Lambda, and API 
 * Gateway.
 * 
 * This application demonstrates sending out an SMS or MMS from an ESP8266 via
 * MQTT over Websocket to AWS IoT, which forwards it through AWS Lambda on to 
 * Twilio.  No local Twilio keys need be stored on the ESP8266.
 * 
 * It also demonstrates receiving an SMS or MMS via AWS API Gateway, Lambda, 
 * and AWS IoT.  An empty response is returned at the Lambda level and the 
 * ESP8266 uses the same path as the sending route to deliver the message.
 * 
 * This code owes much thanks to Fábio Toledo, odelot on Github.  It is based 
 * on his example of connecting to AWS over MQTT over Websockets:
 * https://github.com/odelot/aws-mqtt-websockets
 */
 
#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>

// AWS WebSocket Client 
#include "AWSWebSocketClient.h"

// Embedded Paho WebSocket Client
#include <MQTTClient.h>
#include <IPStack.h>
#include <Countdown.h>

// Handle incoming messages
#include <ArduinoJson.h>

// Local Includes
#include "TwilioLambdaHelper.hpp"

/* CONFIGURATION:
 *  
 * Start here for configuration variables.
 */

/* 
 * IoT/Network Configuration.  Fill these with the values from WiFi and AWS.
 * You can use your AWS Master key/secret, but it's better to create a 
 * new user with all IoT roles. 
*/
char wifi_ssid[]                = "YOUR NETWORK";
char wifi_password[]            = "NETWORK PASSWORD";
char aws_key[]                  = "IAM USER ACCESS KEY";
char aws_secret[]               = "IAM USER SECRET KEY";
char aws_region[]               = "IoT REGION";
char* aws_endpoint              = "ENDPOINT FROM AWS IoT";
const char* shadow_topic        = "$aws/things/YOUR_THING/shadow/update";

/* Twilio Settings - First is a Twilio number, second your number. */
char* your_device_number        = "+18005551212";
char* number_to_text            = "+18005551212";
char* your_sms_message          = "'RacecaR is a palindrome!";
//char* optional_image_path       = "";
char* optional_image_path       = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Three-wide_multiple_row_back.JPG/800px-Three-wide_multiple_row_back.JPG";

/* Optional Settings.  You probably do not need to change these. */
const char* twilio_topic        = "twilio";
int ssl_port = 443;

/* You can use either software, hardware, or no serial port for debugging. */
#define USE_SOFTWARE_SERIAL 1
#define USE_HARDWARE_SERIAL 0

/* Pointer to the serial object, currently for a Sparkfun ESP8266 Thing */
#if USE_SOFTWARE_SERIAL == 1
#include <SoftwareSerial.h>
extern SoftwareSerial swSer(13, 4, false, 256);
Stream* serial_ptr = &swSer;
#elif USE_HARDWARE_SERIAL == 1
Stream* serial_ptr = &Serial;
#else
Stream* serial_ptr = NULL;
#endif

/* Global TwilioLambdaHelper  */
TwilioLambdaHelper lambdaHelper(
        ssl_port,
        aws_region,
        aws_key,
        aws_secret,
        aws_endpoint,
        serial_ptr
);


/* 
 * Our Twilio message handling callback.  This is passed as a callback function
 * when we subscribe to the Twilio topic, and will handle any incoming messages
 * on that topic.
 * 
 * You'll want to add your own application logic inside of here.  For this 
 * demo, we'll take the first 160 characters of the message body and send it 
 * back in reverse and optionally write to a serial connection.
 * 
 * No, this doesn't handle unicode - prepare for weird results if you send
 * any non-ASCII characters!
 */
void handle_incoming_message_twilio(MQTT::MessageData& md)
{     
        MQTT::Message &message = md.message;
        std::unique_ptr<char []> msg(new char[message.payloadlen+1]());
        memcpy (msg.get(),message.payload,message.payloadlen);
        StaticJsonBuffer<maxMQTTpackageSize> jsonBuffer;
        JsonObject& root = jsonBuffer.parseObject(msg.get());
        
        String to_number           = root["To"];
        String from_number         = root["From"];
        String message_body        = root["Body"];
        String message_type        = root["Type"];

        // Only handle messages to the ESP's number
        if (strcmp(to_number.c_str(), your_device_number) != 0) {
                return;
        }
        // Only handle incoming messages
        if (!message_type.equals("Incoming")) {
                return;
        }

        // Basic demonstration of rejecting a message based on which 'device'
        // it is sent to, if devices get one Twilio number each.
        lambdaHelper.list_message_info(message);
        lambdaHelper.print_to_serial("\n\rNew Message from Twilio!");
        lambdaHelper.print_to_serial("\r\nTo: ");
        lambdaHelper.print_to_serial(to_number);
        lambdaHelper.print_to_serial("\n\rFrom: ");
        lambdaHelper.print_to_serial(from_number);
        lambdaHelper.print_to_serial("\n\r");
        lambdaHelper.print_to_serial(message_body);
        lambdaHelper.print_to_serial("\n\r");

        // Now reverse the body and send it back.
        std::unique_ptr<char []> return_body(new char[161]());
        int16_t r = message_body.length()-1, i = 0;

        // Lambda will limit body size, but we should be defensive anyway.
        // uint16_t is fine because 'maxMQTTpackageSize' limits the total 
        // incoming message size.
        
        // 160 characters is _index_ 159.
        r = (r < 160) ? r : 159; 
        return_body.get()[r+1] = '\0';
        while (r >= 0) {
                return_body.get()[i++] = message_body[r--];
        }
        
        lambdaHelper.print_to_serial(return_body.get());
        lambdaHelper.print_to_serial("\n\r");
        
        // Send a message, reversing the to and from number
        lambdaHelper.send_twilio_message(
                twilio_topic,
                from_number,
                to_number, 
                String(return_body.get()),
                String("")
        );
}


/* 
 * Our device shadow update handler.  When AWS has a Shadow update, you should
 * do whatever you need to do (flip pins, light LEDs, etc.) in this function.
 * 
 * (By default we'll just dump everything to serial if it's enabled.)
 */
void handle_incoming_message_shadow(MQTT::MessageData& md)
{
        MQTT::Message &message = md.message;
        
        lambdaHelper.list_message_info(message);
        lambdaHelper.print_to_serial("Current Remaining Heap Size: ");
        lambdaHelper.print_to_serial(ESP.getFreeHeap());

        std::unique_ptr<char []> msg(new char[message.payloadlen+1]());
        memcpy (msg.get(), message.payload, message.payloadlen);

        lambdaHelper.print_to_serial(msg.get());
        lambdaHelper.print_to_serial("\n\r");
}


/* Setup function for the ESP8266 Amazon Lambda Twilio Example */
void setup() {
        WiFi.begin(wifi_ssid, wifi_password);
    
        #if USE_SOFTWARE_SERIAL == 1
        swSer.begin(115200);
        #elif USE_HARDWARE_SERIAL == 1
        Serial.begin(115200);
        #endif
        
        while (WiFi.status() != WL_CONNECTED) {
                delay(1000);
                lambdaHelper.print_to_serial(".\r\n");
        }
        lambdaHelper.print_to_serial("Connected to WiFi, IP address: ");
        lambdaHelper.print_to_serial(WiFi.localIP());
        lambdaHelper.print_to_serial("\n\r");

        if (lambdaHelper.connectAWS()){
                lambdaHelper.subscribe_to_topic(
                        shadow_topic, 
                        handle_incoming_message_shadow
                );
                lambdaHelper.subscribe_to_topic(
                        twilio_topic, 
                        handle_incoming_message_twilio
                );
                lambdaHelper.send_twilio_message(
                        twilio_topic,
                        number_to_text,
                        your_device_number, 
                        String(your_sms_message),
                        String(optional_image_path)
                );
        }

}


/* 
 * Our loop checks that the AWS Client is still connected, and if so calls its
 * yield() function encapsulated in lambdaHelper.  If it isn't connected, the 
 * ESP8266 will attempt to reconnect. 
 */
void loop() {
        if (lambdaHelper.AWSConnected()) {
                lambdaHelper.handleRequests();
        } else {
                // Handle reconnection if necessary.
                if (lambdaHelper.connectAWS()){
                        lambdaHelper.subscribe_to_topic(
                                shadow_topic, 
                                handle_incoming_message_shadow
                        );
                        lambdaHelper.subscribe_to_topic(
                                twilio_topic, 
                                handle_incoming_message_twilio
                        );
                }
        }
}
