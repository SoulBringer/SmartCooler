const AWS = require('aws-sdk');
/**
 * AWS' DynamoDB API object
 * 
 * @type {AWS.DynamoDB}
 */
const dynamodb = new AWS.DynamoDB();
const CONFIG_TABLE_NAME = [
    process.env.STACK_NAME,
    "ConfigTable",
    process.env.STAGE_NAME
]
    .join("-");
exports.handler = handler;

function handler(event, context, next) {
    const docClient = new AWS.DynamoDB.DocumentClient();

    const done = (err, res) => next(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
    /**
     * Fetches config data
     * @return {Promise}
     */
    function fetchConfigData() {
        return new Promise((resolve, reject) => {
            docClient.get({
                TableName: CONFIG_TABLE_NAME,
                Key: {
                    "id": 0
                }
            }, (err, data) => {
                if (err) {
                    console.log("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                    reject(err);
                }

                const config = data && data.Item && data.Item.payload;
                if (!config) {
                    console.log('Config is empty', err);
                    reject(err);
                }
                console.log('Config:', JSON.stringify(config));

                resolve(config);
            })
        });
    }
    fetchConfigData()
        .then((config) => {
            done(null, config);
        })
        .catch((error) => {
            done(error, null);
        });

}