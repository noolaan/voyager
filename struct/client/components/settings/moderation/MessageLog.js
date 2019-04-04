const { Setting } = require('../../../interfaces');
const emojis = require('../../../../../util/emojis.json');
const path = require('path');
const { inspect } = require('util');

class MessageLog extends Setting {

    constructor(client) {

        super(client, {
            name: 'messageLog',
            module: 'moderation',
            description: "Uploads deleted messages to a designated channel for logging. On a premium guild, it will also optionally log the images and videos with the message.",
            aliases: [
                'messageLogs',
                'msgLog',
                'msgLogs'
            ],
            resolve: 'GUILD',
            default: {
                value: false,
                images: false
            }
        });

    }

    async parse(message, args, settings) {
        if(args === this.default) return await this.reset(message);

        const channel = this.client._resolver.channel(args, message.guild);
        if(!channel) {
            if(args.toLowerCase().startsWith('images')) {
                if(!settings.guild.premium.value) {
                    return {
                        error: true,
                        message: `Unable to configure image logs, only premium guilds can use this feature.`
                    };
                }
                const [ ,value ] = args.toLowerCase().split(' ');
                const boolean = this.client._resolver.boolean(value);
                if(boolean === undefined) {
                    return {
                        error: true,
                        message: `Unable to configure image logs, please supply a boolean value.`
                    };
                }
                let newSettings = settings.guild[this.index];
                newSettings.images = boolean;
                await super.set(message.guild.id, newSettings);
                return {
                    error: false,
                    result: boolean,
                    child: 'images'
                };
            } else {
                return {
                    error: true,
                    message: `Unable to find a channel using those arguments, try again.`
                };
            }

        }

        let webhook;
        try {
            await channel.edit({
                nsfw: true
            }, super.reason(message));
            webhook = await channel.createWebhook(this.client.user.username, {
                avatar: path.join(process.cwd(), 'util', 'voyager.png'),
                reason: super.reason(message)
            });
        } catch(err) {
            this.client.logger.error(inspect(err));
            return { 
                error: true,
                message: `Unable to edit the channel, make sure I have the \`MANAGE_CHANNELS\` permission.`
            };
        }

        await webhook.send(`Message logs initialized by **${message.author.tag}**. **\`[${this.resolveable}]\`**`);
        await super.set(message.guild.id, {
            value: true,
            channel: channel.id,
            images: settings.guild.premium.value,
            webhook: {
                id: webhook.id,
                token: webhook.token
            }
        });
        return { error: false, result: `#${channel.name}` };

    }

    async reset(message, settings) {
        const index = settings.guild[this.index];
        if(index.channel) {
            const channel = message.guild.channels.get(index.channel);
            if(channel) {
                try {
                    const webhooks = await channel.fetchWebhooks();
                    const webhook = webhooks.get(index.webhook.id);
                    if(webhook) await webhook.delete(super.reason(message));
                } catch(err) {
                    //eslint-disable-line no-empty
                }
            }
        }
        return super.reset(message);
    }

    fields(index) {
        const channelId = this.current(index).channel;
        const channel = this.client.channels.get(channelId);
        return [
            {
                name: '》Status',
                value: `${this.current(index).value ? `${emojis.enabled} Enabled` : `${emojis.disabled} Disabled`}`,
                inline: true
            },
            {
                name: '》Channel',
                value: `${channel ? `#${channel.name} \`(${channel.id})\`` : 'N/A'}`,
                inline: true
            },
            {
                name: '》Images',
                value: `${this.current(index).images ? `${emojis.enabled} Enabled` : `${emojis.disabled} Disabled`}`,
                inline: true
            }
        ];
    }
    
    current(settings) {
        return {
            value: settings.value,
            channel: settings.channel,
            images: settings.images
        };
    }
    
}

module.exports = MessageLog;