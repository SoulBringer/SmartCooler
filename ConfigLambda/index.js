const AWS = require("aws-sdk");

exports.handler = (event, context, callback) => {
  const docClient = new AWS.DynamoDB.DocumentClient();

  const table = "smart_cooler_config";

  const params = {
    TableName: table,
    Key:{
      "id": "0",
    }
  };

  docClient.get(params, (err, data) => {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      const configJsonString = data && data.Item && data.Item.value;
      if (!configJsonString) {
        return callback('Config is empty');
      }
      const config = JSON.parse(configJsonString);
      console.log('Config:', JSON.stringify(config));

      const lambda = new AWS.Lambda();
      const pullParams = {
        FunctionName: 'slotPull',
        InvocationType: 'RequestResponse',
        LogType: 'None',
        Payload: JSON.stringify({ config })
      };
      let pullResults;

      lambda.invoke(pullParams, (error, data) => {
        if (error) {
          return callback(error);
        } else {
          pullResults = JSON.parse(data.Payload);
        }
      });
    }
  });
};