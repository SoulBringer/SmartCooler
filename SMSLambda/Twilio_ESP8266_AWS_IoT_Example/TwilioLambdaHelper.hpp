#pragma once

/* 
 *  Only increase these if you have a need to listen to additional topics.
 *  Note our severe memory limitations.
 */
const int maxMQTTpackageSize = 512;
const int maxMQTTMessageHandlers = 2;

#if USE_SOFTWARE_SERIAL == 1
#include <SoftwareSerial.h>
extern SoftwareSerial swSer;
#endif

// AWS WebSocket Client 
#include "AWSWebSocketClient.h"

// Embedded Paho WebSocket Client
#include <MQTTClient.h>
#include <IPStack.h>
#include <Countdown.h>

// Handle JSON
#include <ArduinoJson.h>

/*
 * The TwilioLambdaHelper class encapsulates some of the more complex 
 * handshaking going on in this example.
 * 
 * We've wrapped the AWS Websocket Client, IP Stack object, and the MQTT client
 * and made it easy to send SMS or MMS messages through AWS IoT and our lambda 
 * function.
 * 
 * To see the serverless server side setup, please visit the article (link 
 * in Readme)
 */
class TwilioLambdaHelper {
public:
        TwilioLambdaHelper(
                const int&                              ssl_port_in,
                const char*                             aws_region,
                const char*                             aws_key,
                const char*                             aws_secret,
                char*                                   aws_endpoint_in,
                Stream*                                 serial_ptr_in
        );

        // Connect to AWS Websocket and MQTT Layer
        bool connectAWS();

        // Check that AWS is currently connected
        bool AWSConnected();

        // Keeps the MQTT connection alive
        void handleRequests();

        // Subscribe to a topic and register a callback function
        // to handle incoming messages
        void subscribe_to_topic(
                const char* topic, 
                void (*callback)(MQTT::MessageData&) 
        );

        // Publish a c string message to a topic
        void publish_to_topic(const char* topic, const char* message);

        // Publish an Arduino string message to a topic
        void publish_to_topic(const char* topic, const String& message);

        // Intelligently publish a JSON message for Lambda to 
        // send a MMS or SMS
        void send_twilio_message(
                const char* topic,
                const String& to_number,
                const String& from_number, 
                const String& message_body,
                const String& picture_url
        );

        // Print (to serial) incoming message data
        void list_message_info(MQTT::Message &message);

        // Print to serial helper function
        template<typename T> void print_to_serial(const T& input);
        
private:
        uint16_t                                        ssl_port;
        char*                                           endpoint;
        std::unique_ptr<MQTT::Client<
                        IPStack, 
                        Countdown, 
                        maxMQTTpackageSize, 
                        maxMQTTMessageHandlers>>        client;
        AWSWebSocketClient                              awsWSclient;
        IPStack                                         ipstack;
        Stream*                                         serial_ptr;
        
        // Incoming message and connection bookeeping.
        static long                                     connection;
        static long                                     arrivedcount;
};


/* 
 *  Serial Wrapper to make it easy to turn on and off serial printing
 */
template<typename T>
void TwilioLambdaHelper::print_to_serial(const T& input) 
{
        if (serial_ptr) {
                serial_ptr->print(input);
        }
}

