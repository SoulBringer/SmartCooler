from __future__ import print_function

import json
import os
import boto3

"""
State table's logical name
"""
STATE_TABLE_NAME = "-".join([os.environ["STACK_NAME"],
                             "StateTable", os.environ["STAGE_NAME"]])


def respond(err, res=None):
    return {
        'statusCode': '400' if err else '200',
        'body': err.message if err else json.dumps(res),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        }
    }


def lambda_handler(event, context):
    #print("Received event: " + json.dumps(event, indent=2))
    # print(event, context)
    table = boto3.resource('dynamodb').Table(STATE_TABLE_NAME)
    response = table.get_item(Key={'id': 0})
    print(response)
    item = response['Item']['payload']

    # print(item)

    response = {
        'temp1': int(item['temp1']),
        'temp2': int(item['temp2']),
        'weight': ('%.2f' % ((float(item['weight']) - 260000) / 425000 * 100))
    }
    return respond(None, response)
