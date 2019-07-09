const { Command, Flag } = require('../../../interfaces/');
const emojis = require('../../../../../util/emojis.json');

const moment = require('moment-timezone'); //eslint-disable-line

const { inspect } = require('util');
const { username } = require('os').userInfo();

let storage = null; //eslint-disable-line no-unused-vars

class EvaluateCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'evaluate',
            module: 'developer',
            aliases: [
                'eval'
            ],
            description: "Evaluates javascript.",
            restricted: true,
            guarded: true,
            flags: [
                new Flag(client, {
                    name: 'hide',
                    description: "Hides output from displaying in the channel."
                }),
                new Flag(client, {
                    name: 'log',
                    description: "Logs the output in the console."
                })
            ]
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message, { flags, args }) {
        
        let embed = {};

        try {

            let evaled = eval(args);
            if(evaled instanceof Promise) evaled = await evaled;

            if(typeof evaled !== 'string') evaled = inspect(evaled);

            evaled = evaled
                .replace(new RegExp(this.client.token, 'g'), '<redacted>')
                .replace(new RegExp(username, 'g'), '<redacted>');

            if(flags['log']) {
                this.client.logger.log(`Evaluate Result: ${evaled}`);
            }
            if(evaled.length > 2000) evaled = `${evaled.substring(0, 1900)}...`;

            embed.title = `${emojis.success} SUCCESS`;
            embed.color = 0x43d490;
            embed.description = flags['hide'] ? '```js\n<hidden>```' : `\`\`\`js\n${evaled}\`\`\``;

        } catch (error) {

            embed.title = `${emojis.failure} ERROR`;
            embed.color = 0xff7575;
            embed.description = `\`\`\`js\n${error}\`\`\``;

        }

        message.respond({ embed });

    }

}

module.exports = EvaluateCommand;