const AWS = require('aws-sdk');

exports.handler = handler;

function handler(event, context, next) {
    const docClient = new AWS.DynamoDB.DocumentClient();

    const table = "smart_cooler_config";

    const params = {
        TableName: table,
        Key:{
            "id": "1"
        },
        UpdateExpression: 'set bottlesLeft = :bottlesLeft',
        ExpressionAttributeValues: {
            ':bottlesLeft': value
        },
        ReturnValues:"UPDATED_NEW"
    };

    return docClient.update(params, (err, data) => {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            return next(err);
        }
        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    return next();
});
}
