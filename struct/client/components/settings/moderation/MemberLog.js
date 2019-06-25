const { Setting } = require('../../../interfaces');
const emojis = require('../../../../../util/emojis.json');
const path = require('path');

class MemberLog extends Setting {

    constructor(client) {

        super(client, {
            name: 'memberLog',
            module: 'moderation',
            description: "Logs whenever a member joins or leaves the server, primarily for moderation usage.",
            aliases: [
                'memberLogs',
                'memLog',
                'memLogs'
            ],
            resolve: 'GUILD',
            default: {
                value: false
            }
        });

    }

    async parse(message, args) {
        if(args === this.default) return await this.reset(message.guild.id);

        const channel = this.client._resolver.channel(args, message.guild);
        if(!channel) {
            return {
                error: true,
                message: `Unable to find a channel using those arguments, try again.`
            };
        }

        let webhook;
        try {
            webhook = await channel.createWebhook(this.client.user.username, {
                avatar: path.join(process.cwd(), 'util', `${this.client._options.storage.database}.png`),
                reason: super.reason(message)
            });
        } catch(err) {
            return { 
                error: true,
                message: `Unable to edit the channel, make sure I have the \`MANAGE_CHANNELS\` permission.`
            };
        }

        await webhook.send(`${this.name} initialized by **${message.author.tag}**. **\`[${this.resolveable}]\`**`);
        await super.set(message.guild.id, {
            value: true,
            channel: channel.id,
            webhook: {
                id: webhook.id,
                token: webhook.token
            }
        });
        return { error: false, result: `#${channel.name}` };

    }

    async reset(key) {
        const index = super.parent(key);
        const setting = index._getSetting(this.index); 
        if(setting.channel) {
            const channel = index.channels.get(index.channel);
            if(channel) {
                try {
                    const webhooks = await channel.fetchWebhooks();
                    const webhook = webhooks.get(index.webhook.id);
                    if(webhook) await webhook.delete(super.reason());
                } catch(err) {
                    //eslint-disable-line no-empty
                }
            }
        }
        return super.reset(key);
    }

    fields(guild) {
        const channelId = this.current(guild).channel;
        const channel = this.client.channels.get(channelId);
        return [
            {
                name: '》Status',
                value: `${this.current(guild).value ? `${emojis.enabled} Enabled` : `${emojis.disabled} Disabled`}`,
                inline: true
            },
            {
                name: '》Channel',
                value: `${channel ? `#${channel.name} \`(${channel.id})\`` : 'N/A'}`,
                inline: true
            }
        ];
    }
    
    current(guild) {
        const setting = guild._getSetting(this.index);
        return {
            value: setting.value,
            channel: setting.channel
        };
    }
    
}

module.exports = MemberLog;