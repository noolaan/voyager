const { WebhookClient } = require('discord.js');
const chalk = require('chalk');
const moment = require('moment');

class Logger {

    constructor(client, opts = {}) {
        if(!opts) return null;

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.webhookClient = new WebhookClient(opts.webhook.id, opts.webhook.token);
        this.webhookInfo = opts.webhook;

        this.client
            .on('shardCreate', (shard) => this.write(shard, "Shard created.", 'DEBUG'))
            .on('message', (shard, message) => this.handleMessage(shard, message));

    }

    async handleMessage(shard, message) {

        if(message._ready) return;
        if(!message.message) message.message = 'N/A';
        const type = message.type || 'LOG';

        this.write(shard, message.message, type);
        if(message.embed && this.webhookInfo.id) {
            await this.webhookClient.send('', {
                embeds: [
                    {
                        title: `[shard-${this._shardId(shard)}] ${Constants.Embed[type].Title}`,
                        description: Constants.Embed[type].Description,
                        timestamp: new Date(),
                        color: Constants.Colors[type],
                        footer: {
                            text: 'Voyager Status'
                        }
                    }
                ]
            });
        }

    }

    write(shard, string = '', type = 'NONE') {

        const color = Constants.Colors[type] || Constants.Colors.NONE;
        const header = `${chalk.hex(color)(`[${this.date}][shard-${this._shardId(shard)}]`)}`;

        console.log(`${header} : ${chalk.bold(`[${type}]`)} ${string}`); //eslint-disable-line

    }

    _shardId(shard) {
        const id = shard.id;
        return `${id}`.length === 1 ? `0${id}` : `${id}`;
    }

    get date() {
        return moment().format("MM/DD hh:mm:ss");
    }

}

module.exports = Logger;

const Constants = {
    Colors: {
        NONE: 0x6e6e6e,
        LOG: 0x5e97d1,
        INFO: 0x5e97d1,
        WARN: 0xe9d15f,
        DEBUG: 0xc573d1,
        ERROR: 0xe56060,
        SUCCESS: 0x6ccf69
    },
    Embed: {
        SUCCESS: {
            Title: 'CONNECT',
            Description: 'Shard is connected to the websocket.'
        },
        WARN: {
            Title: 'RECONNECT',
            Description: 'Shard is reconnecting to the websocket.'
        },
        ERROR: {
            Title: 'DISCONNECT',
            Description: 'Shard was disconnected from the websocket.'
        }
    }
};