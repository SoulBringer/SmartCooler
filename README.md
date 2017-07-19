SmartCooler
-----------

An experimental project of converting water dispenser into part of Smart-office.

It's going to be a Smart Cooler and it's part of our Smart #IoT Office experiment.  
Smart Cooler will be able to:  
- show the level/amount of water in the bottle;
- notify us about the temperature of cold and hot water;
- send notifications to our Slack channel that drinking water in the office will finish soon;
- send an automatic SMS notification to the water supplier with an order of next batch of water in advance.


Team members
------------
- andrew.oleksiyuk@eliftech.com
- mykhailo.koval@eliftech.com
- taras.tymoshchuk@eliftech.com


Tasks
-----
- formalize and document required MQTT topics and HTTP endpoints;
- forward data into AWS (via AWS MQTT endpoint OR via internal MQTT bridge on Mosquitto);
- configure AWS to collect and visualize data;
- configure Slack notifications via AWS Lambda;
- configure SMS notifications via AWS Lambda (and AWS SNS OR external service);
- create UI to configure device and view device status;


MTQQ
----

