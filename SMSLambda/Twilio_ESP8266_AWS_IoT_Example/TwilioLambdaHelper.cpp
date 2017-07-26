#include "TwilioLambdaHelper.hpp"

long TwilioLambdaHelper::connection = 0;
long TwilioLambdaHelper::arrivedcount = 0;

/*
 * The TwilioLambdaHelper constructor sets up the AWS
 * Websocket client, IPStack, and MQTT client, while
 * saving the ssl port and endpoint in case we are
 * later disconnected.
 */
TwilioLambdaHelper::TwilioLambdaHelper(
        const int&      ssl_port_in,
        const char*     aws_region,
        const char*     aws_key,
        const char*     aws_secret,
        char*           aws_endpoint_in,
        Stream*         serial_ptr_in
)    
        : awsWSclient(1000)
        , ipstack(awsWSclient)
        , ssl_port(ssl_port_in)
        , endpoint(aws_endpoint_in)
        , client(nullptr)
        , serial_ptr(serial_ptr_in)
                  
{
        awsWSclient.setAWSRegion(aws_region);
        awsWSclient.setAWSDomain(endpoint);
        awsWSclient.setAWSKeyID(aws_key);
        awsWSclient.setAWSSecretKey(aws_secret);
        awsWSclient.setUseSSL(true);
}


/* 
 * Send an SMS/MMS from the ESP8266 Through AWS IoT and Lambda.
 * 
 * Creates a JSON object set up for our Twilio Lambda function, then converts 
 * to a C String and publishes it to a topic.
 */
void TwilioLambdaHelper::send_twilio_message(
        const char* topic,
        const String& to_number,
        const String& from_number, 
        const String& message_body,
        const String& picture_url
)
{       
        if (message_body.length() + picture_url.length() > \
                (maxMQTTpackageSize/2) ) {
                // Be mindful of your message size on the ESP8266; 
                // break it up into multiple messages.
                // We're being extra safe here with the max size/2, you may
                // need to tweak it for your purposes.
                return;
        }
        
        StaticJsonBuffer<maxMQTTpackageSize> jsonBuffer;
        JsonObject& root = jsonBuffer.createObject();
        root["To"] = to_number.c_str();
        root["From"] = from_number.c_str();
        root["Type"] = "Outgoing";
        root["Body"] = message_body.c_str();
        if (picture_url.length() > 0) {
                root["Image"] = picture_url.c_str();
        }
        
        std::unique_ptr<char []> buffer(new char[maxMQTTpackageSize]());
        root.printTo(buffer.get(), maxMQTTpackageSize);
        publish_to_topic(topic, buffer.get());
}


/* 
 * Wraps the MQTT Client's yield() function, which must be called at 
 * an interval to keep the MQTT connection alive.
 */
void TwilioLambdaHelper::handleRequests()
{
        client->yield();
}


/* Subscribe to a MQTT Topic with QoS 0 */
void TwilioLambdaHelper::subscribe_to_topic(
        const char* topic, 
        void (*callback)(MQTT::MessageData&) 
) 
{
        int rc = client->subscribe(topic, MQTT::QOS0, callback);
        if (rc != 0) {
                print_to_serial("rc from MQTT subscribe is ");
                print_to_serial(rc);
                print_to_serial("\n\r");
                return;
        }
        print_to_serial("MQTT subscribed\r\n");
}


/* Wraps the AWS Client's connected() function */
bool TwilioLambdaHelper::AWSConnected()
{
        return awsWSclient.connected();
}


/* Publish to a MQTT Topic from an Arduino String */
void TwilioLambdaHelper::publish_to_topic(
        const char* topic, 
        const String& message 
) 
{
        MQTT::Message mqtt_message;
        std::unique_ptr<char []> buf(new char[message.length() + 1]());
        strcpy(buf.get(), message.c_str());
        mqtt_message.qos = MQTT::QOS0;
        mqtt_message.retained = false;
        mqtt_message.dup = false;
        mqtt_message.payload = (void*)buf.get();
        mqtt_message.payloadlen = strlen(buf.get())+1;
        client->publish(topic, mqtt_message); 
}


/* Publish to a MQTT Topic from a C String */
void TwilioLambdaHelper::publish_to_topic(
        const char* topic, 
        const char* message 
) 
{
        MQTT::Message mqtt_message;
        mqtt_message.qos = MQTT::QOS0;
        mqtt_message.retained = false;
        mqtt_message.dup = false;
        mqtt_message.payload = (void*)message;
        mqtt_message.payloadlen = strlen(message)+1;
        client->publish(topic, mqtt_message); 
}


/* Connects to the AWS IoT Websocket layer, then the MQTT layer */
bool TwilioLambdaHelper::connectAWS() 
{

        if (!client) {
                client.reset(new MQTT::Client<
                        IPStack, 
                        Countdown, 
                        maxMQTTpackageSize, 
                        maxMQTTMessageHandlers>(ipstack));
        } else {
                if (client->isConnected ()) {    
                        client->disconnect();
                }
                client.reset(new MQTT::Client<
                        IPStack, 
                        Countdown, 
                        maxMQTTpackageSize, 
                        maxMQTTMessageHandlers>(ipstack));
        }

        int rc = ipstack.connect(endpoint, ssl_port);
        if (rc != 1) {
                print_to_serial("Failed to connect the websocket layer.\r\n");
                return false;
        } else {
                print_to_serial("Websocket layer connected.\r\n");
        }

        MQTTPacket_connectData data = MQTTPacket_connectData_initializer;
        data.MQTTVersion = 3;
        data.clientID.cstring = "ESP8266";
        rc = client->connect(data);
        if (rc != 0) {
                print_to_serial("Failed to connect the MQTT layer.\r\n");
                return false;
        }
        print_to_serial("MQTT layer connected.\r\n");
        return true;
}


/* 
 * Static function to handle printing out the metainformation of a 
 * received message 
 */
void TwilioLambdaHelper::list_message_info(MQTT::Message &message) 
{
        print_to_serial("Message #");
        print_to_serial(++arrivedcount);
        print_to_serial(" arrived: qos ");
        print_to_serial(message.qos);
        print_to_serial(", retained ");
        print_to_serial(message.retained);
        print_to_serial(", dup ");
        print_to_serial(message.dup);
        print_to_serial(", packetid ");
        print_to_serial(message.id);
        print_to_serial("\n\r");
        print_to_serial("Payload ");
}
