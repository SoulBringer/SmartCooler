"""Example of how to send SMS or MMS messages as a middleman for AWS IoT.

When rules with type 'Outgoing' are posted in the 'twilio' topic, IoT will
forward them to the iot_handler() function.  Here we demonstrate very basic
sanity checks and (if valid) send an MMS or SMS for our IoT Device.
"""
from __future__ import print_function

import os
from twilio.rest import Client


def send_message(to_number, from_number, message_body, picture_url=""):
    """Wrap the Twilio Python library and send SMS/MMS messages."""
    auth_token = os.environ['AUTH_TOKEN']
    account_sid = os.environ['ACCOUNT_SID']
    client = Client(account_sid, auth_token)

    message_dict = {}
    message_dict['to'] = to_number
    message_dict['from_'] = from_number
    message_dict['body'] = message_body
    if picture_url != "":
        message_dict['media_url'] = picture_url

    # Send a SMS or MMS with Twilio!!!
    client.messages.create(**message_dict)


def iot_handler(event, context):
    """Handle incoming messages from AWS IoT."""
    print("Received event: " + str(event))
    if 'To' not in event or 'From' not in event or 'Body' not in event \
            or 'Type' not in event or event['Type'] != 'Outgoing':
        # Guard against malformed events being sent to us
        return

    picture_url = ""
    if 'Image' in event:
        picture_url = event['Image']

    send_message(event['To'], event['From'], event['Body'], picture_url)

    return
