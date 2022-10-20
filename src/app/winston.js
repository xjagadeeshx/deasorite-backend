const appRoot = require('app-root-path');
const { createLogger, format, transports } = require('winston');
const { combine, splat, timestamp, printf } = format;
const { IncomingWebhook } = require('@slack/webhook');
const myFormat = printf(({ level, message, timestamp, metadata }) => {
    const webhook = new IncomingWebhook(process.env.SLACK_ERROR_URL);
    (async () => {
        await webhook.send({
            text: `*Error logs - rest-api*\n\n Date: \`${timestamp}\`\ntype: \`${level}\`\nmessage: \`${message}\``
        });
    })();
    return `${timestamp}: ${level} : ${message} `
});
module.exports = logger = createLogger({
    level: 'info',
    format: combine(
        format.prettyPrint(),
        splat(),
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console({ level: 'info' }),
        new transports.File({ filename: `${appRoot.path}/logs/app.log`, level: 'info' }),

    ]
});

