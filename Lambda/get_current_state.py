from __future__ import print_function

import boto3
import json


def respond(err, res=None):
    return {
        'statusCode': '400' if err else '200',
        'body': err.message if err else json.dumps(res),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    }


def lambda_handler(event, context):
    #print("Received event: " + json.dumps(event, indent=2))

    table = boto3.resource('dynamodb').Table('smart_cooler_state')
    response = table.get_item(Key={'id': '0'})
    item = response['Item']['payload']

    #print(item)

    response = {
        'temp1': int(item['temp1']),
        'temp2': int(item['temp2']),
        'weight': ('%.2f' % ((float(item['weight']) - event['config']['emptyBottle']) / event['config']['fullBottle'] * 100))
    }
    return respond(None, response)
    