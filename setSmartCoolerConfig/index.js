const AWS = require('aws-sdk');
/**
 * AWS' DynamoDB API object
 * 
 * @type {AWS.DynamoDB}
 */
const dynamodb = new AWS.DynamoDB();
const CONFIG_TABLE_NAME = "ConfigTable";
exports.handler = handler;

function handler(event, context, next) {

    /**
     * fetches the config's table name
     * 
     * @return {Promise}
     */
    function fetchTableName() {
        return new Promise((resolve, reject) => {
            resolve([
                process.env.STACK_NAME,
                CONFIG_TABLE_NAME,
                process.env.STAGE_NAME
            ]
                .join("-"));
        });

    }
    /**
     * updates config data to dynamodb
     * 
     * @param {String} table 
     */
    function updateConfigData(table) {

        const params = {
            "TableName": table,
            "Key": {
                "id": 0
            },
            "UpdateExpression": 'set payload.BOTTLE_LEVEL_TO_NOTIFY_SLACK = :BOTTLE_LEVEL_TO_NOTIFY_SLACK,' +
            'payload.BOTTLE_LEVEL_TO_NOTIFY_SMS = :BOTTLE_LEVEL_TO_NOTIFY_SMS,' +
            'payload.BOTTLES_TO_ORDER = :BOTTLES_TO_ORDER,' +
            'payload.EMPTY_BOTTLE = :EMPTY_BOTTLE,' +
            'payload.FULL_BOTTLE = :FULL_BOTTLE,' +
            'payload.SLACK_MESSAGE = :SLACK_MESSAGE,' +
            'payload.SLACK_URL = :SLACK_URL,' +
            'payload.SMS_MESSAGE = :SMS_MESSAGE,' +
            'payload.TWILLIO_ACCOUNT_SID = :TWILLIO_ACCOUNT_SID,' +
            'payload.TWILLIO_AUTH_TOKEN = :TWILLIO_AUTH_TOKEN,' +
            'payload.TWILLIO_PHONE_NUMBER_FROM = :TWILLIO_PHONE_NUMBER_FROM,' +
            'payload.TWILLIO_PHONE_NUMBER_TO = :TWILLIO_PHONE_NUMBER_TO',

            "ExpressionAttributeValues": {
                ':BOTTLE_LEVEL_TO_NOTIFY_SLACK': event.BOTTLE_LEVEL_TO_NOTIFY_SLACK,
                ':BOTTLE_LEVEL_TO_NOTIFY_SMS': event.BOTTLE_LEVEL_TO_NOTIFY_SMS,
                ':BOTTLES_TO_ORDER': event.BOTTLES_TO_ORDER,
                ':EMPTY_BOTTLE': event.EMPTY_BOTTLE,
                ':FULL_BOTTLE': event.FULL_BOTTLE,
                ':SLACK_MESSAGE': event.SLACK_MESSAGE,
                ':SLACK_URL': event.SLACK_URL,
                ':SMS_MESSAGE': event.SMS_MESSAGE,
                ':TWILLIO_ACCOUNT_SID': event.TWILLIO_ACCOUNT_SID,
                ':TWILLIO_AUTH_TOKEN': event.TWILLIO_AUTH_TOKEN,
                ':TWILLIO_PHONE_NUMBER_FROM': event.TWILLIO_PHONE_NUMBER_FROM,
                ':TWILLIO_PHONE_NUMBER_TO': event.TWILLIO_PHONE_NUMBER_TO
            },
            "ReturnValues": "UPDATED_NEW"
        };
        return new Promise((resolve, reject) => {
            return docClient.update(params, (err, data) => {
                if (err) {
                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                    reject(err);
                }
                else {
                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                    resolve();
                }
            });
        })
    }
    const docClient = new AWS.DynamoDB.DocumentClient();
    console.log('Event', event);

    const done = (err, res) => next(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });



    fetchTableName()
        .then(updateConfigData)
        .then(() => {
            done(null, {});
        })
        .catch((error) => {
            done(error, null);
        });
}