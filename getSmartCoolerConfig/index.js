const AWS = require('aws-sdk');
/**
 * AWS' DynamoDB API object
 * 
 * @type {AWS.DynamoDB}
 */
const dynamodb = new AWS.DynamoDB();
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
     * fetches the config's table name
     * 
     * @return {Promise}
     */
    function fetchTableName() {
        let promise = new Promise();

        dynamodb.listTables({}, (error, data) => {
            if (error) {
                console.error(error, error.stack);
                promise.reject();
            }
            else {
                /**
                 * A variable for an index of the config table in the array of tables' names.
                 * 
                 * @type {Number}
                 */
                let table_index = data["TableNames"].find(isConfigTableName);
                if (table_index === -1) {
                    console.error("ConfigTable not found.");
                    promise.reject();
                }
                else {
                    table = data["TableNames"][table_index];
                    promise.resolve();
                }
            }
        });
        return promise;

    }
    /**
     * The variable for the certain name of the config table in DynamoDB.
     * 
     * @type {String}
     */
    let table = undefined;

    const params = {
        TableName: table,
        Key: {
            "id": "0"
        }
    };

    return docClient.get(params, (err, data) => {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            return next(err);
        }

        const config = data && data.Item && data.Item.payload;
        if (!config) {
            return done('Config is empty' + err);
        }
        console.log('Config:', JSON.stringify(config));

        done(null, config);
    });
}

/**
 * Checks whether a a table is the config table.
 * 
 * @param {String} tableName 
 * @returns {Boolean}
 */
function isConfigTableName(tableName) {
    return tableName.indexOf("ConfigTable") !== -1;
}
