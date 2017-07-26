The Twilio Receive SMS/MMS Example requires the [Python Twilio Helper Library](https://www.twilio.com/docs/libraries/python).

This example also requires a few environmental variables from your [Twilio Console](https://twilio.com/console) and setup:

* AUTH_TOKEN
* AWS_IOT_REGION (where your IoT Account and ESP8266 will live)
* REQUEST_URL (the messaging webhook from the Twilio Console)
    * Example: https://SOMETHING.execute-api.REGION.amazonaws.com/prod/message
* AWS Topic
    * 'twilio' (if changed, also change all references in the code)

You also need to add inline security to your Lambda role (In IAM) for this Lambda function to be able to publish to a topic in your region.  Here is how it should look:

<pre>
Show Policy
 {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "iot:Publish"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
</pre>