"""Example of how to send SMS or MMS messages as a middleman for AWS IoT.

When rules with type 'Outgoing' are posted in the 'twilio' topic, IoT will
forward them to the iot_handler() function.  Here we demonstrate very basic
sanity checks and (if valid) send an MMS or SMS for our IoT Device.
"""
from __future__ import print_function

import os
from twilio.rest import Client
import json


def send_message(message):
    """Wrap the Twilio Python library and send SMS/MMS messages."""
    auth_token = message['AUTH_TOKEN']
    account_sid = message['ACCOUNT_SID']
    client = Client(account_sid, auth_token)

    message_dict = {}
    message_dict['to'] = message['To']
    message_dict['from_'] = message['From']
    message_dict['body'] = message['Body']
    if 'Image' in message:
        message_dict['media_url'] = message['Image']

    # Send a SMS or MMS with Twilio!!!
    client.messages.create(**message_dict)


def iot_handler(event, context):
    """Handle incoming messages from AWS IoT."""
    print("Received event: " + str(event))
    print("Received event message: " + event['Records'][0]['Sns']['Message'])

    message = json.loads(event['Records'][0]['Sns']['Message']);

    if 'To' not in message or 'From' not in message or 'Body' not in message \
            or 'Type' not in message or message['Type'] != 'Outgoing':
        # Guard against malformed events being sent to us
        return

    send_message(message)

    return
