# Twilio-AWS-IoT-ESP8266-Example

An example application that demonstrates sending and receiving SMS and MMS Messages on an ESP8266 with Amazon IoT, Lambda, and Twilio.  Change the Wireless Network account information, AWS credentials and Twilio settings at the top of the .ino file before beginning.

By default, the ESP8266 will account to an AWS IoT Account on the topic 'twilio' and send an SMS message.  It will then listen on that topic, and respond to any incoming messages with a return message inverting the message body.

For a complete writeup, see these four articles on Twilio's documentation site where we'll take you from beginner to AWS ecosystem master:
* https://www.twilio.com/docs/guides/receive-reply-sms-mms-messages-using-amazon-api-gateway-lambda
* https://www.twilio.com/docs/guides/secure-amazon-lambda-python-app-validating-incoming-twilio-requests
* https://www.twilio.com/docs/guides/reply-sms-messages-esp8266-amazon-aws-iot-lambda-and-api-gateway
* https://www.twilio.com/docs/guides/send-sms-or-mms-messages-esp8266-amazon-aws-iot-lambda

## Build example:


### AWS Lambda, IoT, Gateway Explorer
You will need an AWS account.  Set up Lambda IoT and add the security necessary for your ESP8266.

Note: Both Lambda functions require the Twilio Python helper library.  To see how to install external libraries on Lambda, see [this article](http://docs.aws.amazon.com/lambda/latest/dg/lambda-python-how-to-create-deployment-package.html)

For sending SMS/MMS messages, use IoT on the 'twilio' channel as a trigger with the SQL of "SELECT * FROM 'twilio' WHERE Type='Outgoing'".  You must not use SQL version 2016-3-23, it will not work with null-terminated strings!

For receiving messages, use API Gateway and pass through form parameters.  Return the empty response to Twilio with application/xml.  The 'response' will come from a new 'send' originating on the ESP8266.


### ESP8266
<pre>
git clone https://github.com/pkamp3/Twilio-AWS-IoT-ESP8266-Example.git
</pre>

#### Install the following packages with the Arduino Package Manager:
* ArduinoJSON by Benoit Blanchon
* WebSockets by Markus Sattler

#### Install the following packages [manually](https://www.arduino.cc/en/guide/libraries#toc5)
* [AWS-MQTT-WebSockets](https://github.com/odelot/aws-mqtt-websockets) by odelot
* [Eclipse Paho Arduino Client](https://projects.eclipse.org/projects/technology.paho/downloads)

Open 'Twilio_ESP8266_AWS_IoT_Example in Arduino IDE
# Edit the credentials, change desired settings
Compile and Upload to the board!

## Run example:
(Should send an MMS automatically when uploaded to ESP8266 or power is restored)

## Motivations

The show the skeleton for a Twilio starter application using an ESP8266 connected to WiFi with AWS IoT, Lambda, and API Gateway handling the backend.  With luck, this gets you closer to your goal of an embedded Twilio thing!

## Meta & Licensing

* [MIT License](http://www.opensource.org/licenses/mit-license.html)
* Lovingly crafted by Twilio Developer Education.

