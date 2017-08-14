const AWS = require('aws-sdk');

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

    const table = "smart_cooler_config";

    const params = {
        TableName: table,
        Key:{
            "id": "0"
        }
    };

    return docClient.get(params, (err, data) => {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            return next(err);
        }

        const config = data && data.Item && data.Item.value;
    if (!config) {
        return done('Config is empty' + err);
    }
    console.log('Config:', JSON.stringify(config));

    done(null, config);
});
}
