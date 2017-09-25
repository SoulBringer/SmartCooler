const AWS = require('aws-sdk');
const REGION = 'eu-west-1';
  AWS.config.update({ region: REGION });
const LAMBDA = new AWS.Lambda();

function getFunctionArn() {
  return new Promise(function (resolve, reject) {
    LAMBDA.listFunctions({ "MasterRegion": REGION }, function (error, data) {
      if (!data) {
        reject(error);
      }
      else {
        let functionArn = data["Functions"].find(function (functionData) {
          return functionData["FunctionName"].indexOf("StateFunction") !== -1;
        })["FunctionArn"];
        resolve(functionArn);
      }
    })
  });
}


function getState(callback) {
  const params = {
    FunctionName: 'arn:aws:lambda:eu-west-1:091953829232:function:getSmartCoolerState',
    Payload: '{"httpMethod":"GET"}'
  };
  LAMBDA.invoke(params, function (err, data) {
    if (err) {
      console.log(err, err.stack); // an error occurred
      return;
    }
    const payload = JSON.parse(data.Payload);
    const body = JSON.parse(payload.body);
    callback(body.weight);
  });
}

function updateShadow(state) {
  AWS.config.update({ region: 'us-east-2' });
  const iotdata = new AWS.IotData({ endpoint: 'a172ulhf1fm9p3.iot.us-east-2.amazonaws.com' });
  const params = {
    payload: '{"state": {"reported":{"value":' + state + '}}}',
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