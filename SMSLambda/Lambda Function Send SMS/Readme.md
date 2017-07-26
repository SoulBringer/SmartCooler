The Twilio Send SMS/MMS Example requires the [Python Twilio Helper Library](https://www.twilio.com/docs/libraries/python).

This example also requires a few environmental variables from your [Twilio Console](https://twilio.com/console):

* AUTH_TOKEN
* ACCOUNT_SID

Merely create those in the Lambda console for this function and you should be ready.

Test event:

```javascript
{
  "To": "+380966852997",
  "From": "+18635460380",
  "Body": "test",
  "Type": "Outgoing"
}
```

Notice: we have a whitelist of numbers in trial mode
