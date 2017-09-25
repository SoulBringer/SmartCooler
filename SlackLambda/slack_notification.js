console.log('Loading function');

const https = require('https');
const url = require('url');

exports.handler = function handler(event, context) {
    console.log('Event', event);
    (event.Records || []).forEach(function (rec) {
        if (rec.Sns) {
            console.log('rec.Sns.Message:', rec.Sns.Message);
            const message = JSON.parse(rec.Sns.Message);
            const slack_req_opts = url.parse(message.slackUrl);
            slack_req_opts.method = 'POST';
            slack_req_opts.headers = {
                'Content-Type': 'application/json'
            };

            var req = https.request(slack_req_opts, function (res) {
                if (res.statusCode === 200) {
                    context.succeed('posted to slack');
                } else {
                    context.fail('status code: ' + res.statusCode);
                }
            });

            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
                context.fail(e.message);
            });

            var params = {
                text: message.message
            };
            req.write(JSON.stringify(params));

            req.end();
        }
    });
};