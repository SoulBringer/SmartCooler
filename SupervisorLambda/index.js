const async = require('async');
const AWS = require("aws-sdk");

exports.handler = handler;

function handler(event, context, next) {
  async.auto({
    config: getConfig,
    sendSmsNotification: ['config', sendSmsNotification],
    sendSlackNotification: ['config', sendSlackNotification],
  }, (err, data) => {
    next(err, data);
  })
}

function getConfig(cb) {
  const docClient = new AWS.DynamoDB.DocumentClient();

  const table = "smart_cooler_config";

  const params = {
    TableName: table,
    Key:{
      "id": "0",
    }
  };

  return docClient.get(params, (err, data) => {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      return cb(err);
    }

    const configJsonString = data && data.Item && data.Item.value;
    if (!configJsonString) {
      return cb('Config is empty');
    }
    const config = JSON.parse(configJsonString);
    console.log('Config:', JSON.stringify(config));

    cb(null, config);
  });
}

function sendSmsNotification({ config }, cb) {
  const sns = new AWS.SNS();

  const snsMsg = JSON.stringify({
    Body: 'Test',
    Type: 'Outgoing',
    To: config.TWILLIO_PHONE_NUMBER_TO,
    From: config.TWILLIO_PHONE_NUMBER_FROM,
    AUTH_TOKEN: config.TWILLIO_AUTH_TOKEN,
    ACCOUNT_SID: config.TWILLIO_ACCOUNT_SID,
  });

  let payload = {
    default: snsMsg,
  };

  // then have to stringify the entire message payload
  payload = JSON.stringify(payload);

  console.log('sending push');
  sns.publish({
    Message: payload,
    MessageStructure: 'json',
    TargetArn: 'arn:aws:sns:eu-west-1:091953829232:smsNotification'
  }, (err, data) => {
    if (err) {
      console.log(err.stack);
      return;
    }

    console.log('push sent');
    console.log(data);
    cb();
  });
}

function sendSlackNotification({ config }, cb) {
  const sns = new AWS.SNS();

  const snsMsg = JSON.stringify({
    slackUrl: config.SLACK_URL
  });

  let payload = {
    default: snsMsg,
  };

  // then have to stringify the entire message payload
  payload = JSON.stringify(payload);

  console.log('sending push');
  sns.publish({
    Message: payload,
    Subject: 'Test',
    MessageStructure: 'json',
    TargetArn: 'arn:aws:sns:eu-west-1:091953829232:slackNotiffication'
  }, (err, data) => {
    if (err) {
      console.log(err.stack);
      return;
    }

    console.log('push sent');
    console.log(data);
    cb();
  });
}
