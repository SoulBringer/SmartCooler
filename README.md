SmartCooler
-----------

An experimental project of converting water dispenser into part of Smart-office.

It's going to be a Smart Cooler and it's part of our Smart #IoT Office experiment.  
Smart Cooler will be able to:  
- show the level/amount of water in the bottle;
- notify us about the temperature of cold and hot water;
- send notifications to our Slack channel that drinking water in the office will finish soon;
- send an automatic SMS notification to the water supplier with an order of next batch of water in advance.


Contents
--------
- [Tasks](#tasks)
- [MQTT](#mqtt)
- [Data notes](#data-notes)
- [Endpoints](#endpoints)


Tasks
-----
- formalize and document required MQTT topics and HTTP endpoints;
- forward data into AWS (via AWS MQTT endpoint OR via internal MQTT bridge on Mosquitto);
- configure AWS to collect and visualize data;
- configure Slack notifications via AWS Lambda;
- configure SMS notifications via AWS Lambda (and AWS SNS OR external service);
- create UI to configure device and view device status;


MQTT
----

Local MQTT AWS brigge:  
`192.168.1.126:1883`

Dispenser output data topic:  
`office/sensors/cooler/data`

JSON payload example:
```
{  
	"temp1":15,
	"temp2":15,
	"weight":650000
}
```


Response topic for settings update:  
`office/sensors/cooler/setting`

Payload example:
```
{
	"interval":30000
}
```


Test topic for connectivity checks, turns internal LED on/off:  
`office/sensors/cooler/setting/light`

Payload example:
```
off
```


Sets output data update interval:  
`office/sensors/cooler/setting/interval`

Payload example _(30 sec)_:
```
30000
```


Calls immediate update:
`office/sensors/cooler/setting/refresh'

Payload example:
```
```


Data notes
----------
- Dispenser is empty, no bottle value: `241550`
- Dispenser is empty, with bottle value: `260000`
- Dispenser is full, with bottle value: `685000`

- 1kg ~= `22450`
- empty bottle ~= 0.8kg (should be 0.75kg)
- full bottle (should be 0.75kg + 19kg) ~= 443390
- cup ~= `7500` ~= 0.33kg

- 685000 = 100%
- 260000 = 0%
- 241550 = no bottle


Endpoints
---------

Get current state:
```
GET https://fkgcx8b7kd.execute-api.eu-west-1.amazonaws.com/prod/getSmartCoolerState
```

Payload example:
```
{
  "temp1":33,
  "temp2":0,
  "weight":"83.64"
}
```