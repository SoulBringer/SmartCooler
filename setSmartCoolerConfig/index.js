const AWS = require('aws-sdk');

exports.handler = handler;

function handler(event, context, next) {
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
            return next(err);
        }

        const config = data && data.Item && data.Item.value;
    if (!config) {
        return next('Config is empty');
    }
    console.log('Config:', JSON.stringify(config));

    next(null, config);
});
}
