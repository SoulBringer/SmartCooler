const _ = require('lodash');
/**
 * Account ID
 * @type {Number}
 */
const ASYNC = require('async');
const AWS = require('aws-sdk');
const CONFIG_TABLE_NAME = [
  process.env.STACK_NAME,
  "ConfigTable",
  process.env.STAGE_NAME
]
  .join("-");
const DYNAMODB = new AWS.DynamoDB();
const IAM = new AWS.IAM();
const METADATA = new AWS.MetadataService();
const SLACK_TOPIC_ARN = [
  "arn",
  "aws",
  "sns",
  process.env.REGION,
  process.env.ACCOUNT_ID,
  "SlackTopic"
].join(":");
const SMS_TOPIC_ARN = [
  "arn",
  "aws",
  "sns",
  process.env.REGION,
  process.env.ACCOUNT_ID,
  "SmsTopic"
].join(":");
const SNS = new AWS.SNS();
const STATE_TABLE_NAME = [
  process.env.STACK_NAME,
  "StateTable",
  process.env.STAGE_NAME
]
  .join("-");

exports.handler = handler;

function handler(event, context, next) {
  ASYNC.auto({
    config: [getConfig],
    stateOne: [getStateOne],
    stateTwo: [getStateTwo],
    checkState: ['config', 'stateOne', 'stateTwo', checkState],
  }, (err, data) => {
    next(err, data);
  })
}
function getConfig(callback) {
  const docClient = new AWS.DynamoDB.DocumentClient();

  // const table = "smart_cooler_config";

  const params = {
    TableName: CONFIG_TABLE_NAME,
    Key: {
      "id": 0,
    }
  };

  return docClient.get(params, (err, data) => {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      return callback(err);
    }

    const config = data && data.Item && data.Item.payload;
    if (!config) {
      return callback('Config is empty');
    }
    console.log('Config:', JSON.stringify(config));

    callback(null, config);
  });
}

function getStateOne(cb) {
  const docClient = new AWS.DynamoDB.DocumentClient();

  // const table = "smart_cooler_state";

  const params = {
    TableName: STATE_TABLE_NAME,
    Key: {
      "id": 0,
    }
  };

  return docClient.get(params, (err, data) => {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      return cb(err);
    }

    const payload = data && data.Item && data.Item.payload;
    console.log('State one payload:', payload);

    cb(null, payload);
  });
}

function getStateTwo(cb) {
  const docClient = new AWS.DynamoDB.DocumentClient();

  // const table = "smart_cooler_state";

  const params = {
    TableName: STATE_TABLE_NAME,
    Key: {
      "id": 1,
    }
  };

  return docClient.get(params, (err, data) => {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      return cb(err);
    }

    const payload = data && data.Item && data.Item;
    console.log('State one payload:', payload);

    cb(null, payload);
  });
}

function checkState({ config, stateOne, stateTwo }, next) {
  const waterLvl = (stateOne.weight - config.EMPTY_BOTTLE) / config.FULL_BOTTLE * 100;

  console.log('waterLvl:', waterLvl);

  let routines = {};

  if (waterLvl >= 90 && stateTwo.smsNotificationFlag && stateTwo.bottlesLeft <= 0) { // when we got new order and put new bottle
    routines = _.assign({}, routines, {
      refreshStock: cb => refreshStock({ config }, cb),
      resetSentSmsNotificationFlag,
    });
  }

  if (waterLvl >= 90 && stateTwo.slackNotificationFlag) { // when we put next bottle from stock
    routines = _.assign({}, routines, {
      decreaseBottles: cb => decreaseBottles({ stateTwo }, cb),
      resetSentSlackNotificationFlag,
    });
  }

  if (waterLvl <= config.BOTTLE_LEVEL_TO_NOTIFY_SLACK && !stateTwo.slackNotificationFlag) { // when we need to change bottle
    routines = _.assign({}, routines, {
      sendSlackNotification: cb => sendSlackNotification({ config }, cb),
      setSentSlackNotificationFlag: ['sendSlackNotification', (__, cb) => setSentSlackNotificationFlag(cb)],
    });
  }

  if (waterLvl <= config.BOTTLE_LEVEL_TO_NOTIFY_SMS && !stateTwo.smsNotificationFlag && stateTwo.bottlesLeft <= 0) { // when we need to order new bottles
    routines = _.assign({}, routines, {
      sendSmsNotification: cb => sendSmsNotification({ config }, cb),
      setSentSmsNotificationFlag: ['sendSmsNotification', (__, cb) => setSentSmsNotificationFlag(cb)],
    });
  }

  console.log('Routines:', Object.keys(routines));

  return ASYNC.auto(routines, next);
}

function refreshStock({ config }, cb) { // we got order, put one to cooler and put others to stock
  return changeStock(config.BOTTLES_TO_ORDER - 1, cb);
}

function changeStock(payload, cb) {
  const docClient = new AWS.DynamoDB.DocumentClient();

  // const table = "smart_cooler_state";

  const params = {
    TableName: STATE_TABLE_NAME,
    Key: {
      "id": 1,
    },
    UpdateExpression: 'set bottlesLeft = :bottlesLeft',
    ExpressionAttributeValues: {
      ':bottlesLeft': payload
    },
    ReturnValues: "UPDATED_NEW"
  };

  return docClient.update(params, (err, data) => {
    if (err) {
      console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
      return cb(err);
    }
    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    return cb();
  });
}

function sendSmsNotification({ config }, cb) { // send notification to sns
  const sns = new AWS.SNS();

  const snsMsg = JSON.stringify({
    Body: config.SMS_MESSAGE,
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
    TargetArn: SMS_TOPIC_ARN
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

function sendSlackNotification({ config }, cb) { // send notification to sns
  const sns = new AWS.SNS();

  const snsMsg = JSON.stringify({
    slackUrl: config.SLACK_URL,
    message: config.SLACK_MESSAGE
  });

  let payload = {
    default: snsMsg,
  };

  // then have to stringify the entire message payload
  payload = JSON.stringify(payload);

  console.log('sending push');
  sns.publish({
    Message: payload,
    Subject: config.SLACK_MESSAGE,
    MessageStructure: 'json',
    TargetArn: SLACK_TOPIC_ARN
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

function setSentSmsNotificationFlag(cb) {
  return changeSentSmsNotificationFlag(true, cb);
}

function setSentSlackNotificationFlag(cb) {
  return changeSentSlackNotificationFlag(true, cb);
}

function resetSentSmsNotificationFlag(cb) {
  return changeSentSmsNotificationFlag(false, cb);
}

function resetSentSlackNotificationFlag(cb) {
  return changeSentSlackNotificationFlag(false, cb);
}

function changeSentSmsNotificationFlag(payload, cb) {
  const docClient = new AWS.DynamoDB.DocumentClient();

  // const table = "smart_cooler_state";

  const params = {
    TableName: STATE_TABLE_NAME,
    Key: {
      "id": 1,
    },
    UpdateExpression: 'set smsNotificationFlag = :smsNotificationFlag',
    ExpressionAttributeValues: {
      ':smsNotificationFlag': payload,
    },
    ReturnValues: "UPDATED_NEW"
  };

  return docClient.update(params, (err, data) => {
    if (err) {
      console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
      return cb(err);
    }
    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    return cb();
  });
}

function changeSentSlackNotificationFlag(payload, cb) {
  const docClient = new AWS.DynamoDB.DocumentClient();

  // const table = "smart_cooler_state";

  const params = {
    TableName: STATE_TABLE_NAME,
    Key: {
      "id": 1,
    },
    UpdateExpression: 'set slackNotificationFlag = :slackNotificationFlag',
    ExpressionAttributeValues: {
      ':slackNotificationFlag': payload,
    },
    ReturnValues: "UPDATED_NEW"
  };

  return docClient.update(params, (err, data) => {
    if (err) {
      console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
      return cb(err);
    }
    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    return cb();
  });
}

function decreaseBottles({ stateTwo }, cb) {
  console.log(`A bottle was used, we have put another from stock to cooler, so decrease the stock from ${stateTwo.bottlesLeft} to ${stateTwo.bottlesLeft - 1}`);
  return changeStock(stateTwo.bottlesLeft - 1, cb);
}