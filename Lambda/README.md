Integration AWS Lambda with Slack
-----------

Step by step process to integrate Lambda with Slack:

 

Task 1: Create an Incoming Webhook in slack.
----------

- Step 1: Go to `https://slack.com/apps`;
- Step 2: You will find the application site of Slack. Type “incoming” in the 
          search box and select the Incoming WebHooks. Install the app in your respective Team.;
- Step 3: Select the channel and click on Add Incoming WebHook;
- Step 4: All you need is a Webhook URL that you can find as below and you can also 
          customize name and image of the sender and save the setting;
          
![alt text](https://image.prntscr.com/image/OW0PKxM9TBiirEhooDuLYw.png)

Task 2: Create a Lambda function which sends the notification to the slack.
----------

- Step 1: Go to AWS Lambda Console and click on Get Started Now;
- Step 2: Insert Name, Description for your Lambda function and copy the code in the editor.
          Don’t forget to put your own webhook URL as “slack_url” value.
          
Task 3: Make the Lambda function subscribe to the SNS Topic.
----------

- Step 1: Choose SNS (Simple Notification Service) in AWS services and click on Create Topic;
- Step 2: Fill in some fields with names. Now we will create a subscription for the lambda function;
          Click on Create Subscription.
- Step 3: Select Lambda Function as protocol and Endpoint as your lambda function ARN;
- Step 4: Your Function is now read to get notifications from SNS. You can Test, click on Action and 
          select Configure test event. You can get a sample event from test-lambda.json.