"""
Very simple example of how to forward incoming Twilio webhooks to your IoT
devices using Lambda to publish to MQTT topics.

As a webhook comes in, we'll verify the webhook is from Twilio then extract the
key information and send to our IoT device(s) subscribed to our
topic.  Those devices will then presumably handle the information and react,
perhaps by sending a message back.
"""

from __future__ import print_function

import json
import os
import boto3
import urllib
from twilio.request_validator import RequestValidator


def twilio_webhook_handler(event, context):
    """Receive request from Twilio and passes through to a topic."""
    print("Received event: " + str(event))
    null_response = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>' + \
                    '<Response></Response>'

    # Trap no X-Twilio-Signature Header
    if u'twilioSignature' not in event:
        return null_response

    form_parameters = {
        k: urllib.unquote_plus(v) for k, v in event.items()
        if k != u'twilioSignature'
    }

    validator = RequestValidator(os.environ['AUTH_TOKEN'])
    request_valid = validator.validate(
        os.environ['REQUEST_URL'],
        form_parameters,
        event[u'twilioSignature']
    )

    # Trap invalid requests not from Twilio
    if not request_valid:
        return null_response

    # Trap fields missing
    if u'Body' not in form_parameters or u'To' not in form_parameters \
            or u'From' not in form_parameters:
        return null_response

    # Don't let through messages with > 160 characters
    if len(form_parameters['Body']) > 160:
        return '<?xml version=\"1.0\" encoding=\"UTF-8\"?>' + \
               '<Response><Message>Keep it under 160!</Message></Response>'

    # Now we package up the From, To, and Body field and publish it to the
    # 'twilio' topic (or whatever you have set).  Boto3 lets us easily publish
    # to any topic in a particular region, but ensure you have correctly set
    # permissions for the role.  'iot:Publish' needs to be included for these
    # next lines to work.

    aws_region = os.environ['AWS_IOT_REGION']
    aws_topic = os.environ['AWS_TOPIC']
    client = boto3.client('iot-data', region_name=aws_region)

    client.publish(
        topic=aws_topic,
        qos=0,
        payload=json.dumps({
            "To": form_parameters[u'To'],
            "From": form_parameters[u'From'],
            "Body": form_parameters[u'Body'],
            "Type": "Incoming"
        })
    )

    # A blank response informs Twilio not to take any actions.
    # Since we are reacting asynchronously, if we are to respond
    # it will come through a different channel.
    #
    # Even though we aren't responding to the webhook directly, this will all
    # happen very quickly.
    return null_response
