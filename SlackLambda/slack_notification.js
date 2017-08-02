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

            var text_msg = JSON.stringify(rec.Sns.Message, null, '  ');
            try {
                var msg_data = [];
                var parsed = JSON.parse(rec.Sns.Message);
                for (var key in parsed) {
                    msg_data.push(key + ': ' + parsed[key]);
                }
                text_msg = msg_data.join("\n");
            } catch (e) {
                console.log(e);
            }

            var params = {
                attachments: [{
                    fallback: text_msg,
                    pretext: rec.Sns.Subject,
                    color: "#0c40d0",
                    fields: [{
                        "value": text_msg,
                        "short": false
                    }]
                }]
            };
            req.write(JSON.stringify(params));

            req.end();
        }
    });
};