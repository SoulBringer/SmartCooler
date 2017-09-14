const AWS = require('aws-sdk');

function getState(cb) {
  AWS.config.update({region: 'eu-west-1'});
  const lambda = new AWS.Lambda();
  const params = {
    FunctionName: 'arn:aws:lambda:eu-west-1:091953829232:function:getSmartCoolerState',
    Payload: '{"httpMethod":"GET"}'
    };
  lambda.invoke(params, function(err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      return;
    }
    const payload = JSON.parse(data.Payload);
    const body = JSON.parse(payload.body);
    cb(body.weight);
  });
}

function updateShadow(state) {
  AWS.config.update({region: 'us-east-2'});
  const iotdata = new AWS.IotData({endpoint: 'a172ulhf1fm9p3.iot.us-east-2.amazonaws.com'});
  const params = {
    payload: '{"state": {"reported":{"value":' + state +'}}}',
    thingName: 'SmartCooler'
  };
  iotdata.updateThingShadow(params, (err, data) => {
    if (err) console.log(err); // an error occurred
    else console.log(data);           // successful response
  });
}

exports.handler = (event, context) => {
  getState(state => {
    updateShadow(state);
  });
};