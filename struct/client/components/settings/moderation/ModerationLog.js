const { Setting } = require('../../../interfaces');
const emojis = require('../../../../../util/emojis.json');
const path = require('path');
const { inspect } = require('util');

class ModerationLog extends Setting {

    constructor(client) {

        super(client, {
            name: 'moderationLog',
            module: 'moderation',
            description: "Logs moderation actions (bans, kicks, warns..) in a designated channel.",
            aliases: [
                'moderationLogs',
                'modLog',
                'modLogs'
            ],
            resolve: 'GUILD',
            default: {
                value: false,
                infractions: ['warn', 'mute', 'unmute', 'lockdown', 'unlockdown', 'kick', 'ban', 'unban', 'vcmute', 'vcunmute', 'vckick']
            }
        });
    }

    async parse(message, args) {
        if(args === this.default) return await this.reset(message.guild.id);

        const channel = this.client._resolver.channel(args, message.guild);
        if(!channel) {
            if(args.toLowerCase().startsWith('infraction')) {
                const list = this.client._resolver.list(message.guild._getSetting(this.index).infractions, Constants.Infractions, args.split(' ').splice(1));
                if(!list || list.method === 'list') return {
                    error: true,
                    message: `Unable to parse list method, please use either \`add\` or \`remove\`.`
                };
                let newSettings = message.guild._getSetting(this.index);
                newSettings.infractions = list.list;
                if(list.method === 'add') {
                    message.respond(`Successfully added \`[ ${list.changed.join(', ')} ]\` to **${this.name}:infractions**.`, {
                        emoji: 'success'
                    });
                } else if(list.method === 'remove') {
                    message.respond(`Successfully removed \`[ ${list.changed.join(', ')} ]\` from **${this.name}:infractions**.`, {
                        emoji: 'success'
                    });
                }
                await super.set(message.guild.id, newSettings);
                return {
                    error: false,
                    ignore: true
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

        await webhook.send(`${this.name} initialized by **${message.author.tag}**. **\`[${this.resolveable}]\`**`);
        await super.set(message.guild.id, {
            value: true,
            channel: channel.id,
            webhook: {
                id: webhook.id,
                token: webhook.token
            },
            infractions: message.guild._getSetting('moderationLog').infractions
        }, { replace: false });
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
            },
            {
                name: '》Loggable Infractions',
                value: `${this.current(guild).infractions.length > 0 ? `${this.current(guild).infractions.map(i=>`\`${i}\``).join(', ')}` : 'N/A'}`,
                inline: true
            }
        ];
    }
    
    current(guild) {
        const setting = guild._getSetting(this.index);
        return {
            value: setting.value,
            channel: setting.channel,
            infractions: setting.infractions
        };
    }
    
}

module.exports = ModerationLog;

//fucking hate my life
const Constants = {
    Infractions: ['note', 'warn', 'mute', 'unmute', 'lockdown', 'unlockdown', 'slowmode', 'kick', 'ban', 'unban', 'prune', 'vcmute', 'vcunmute', 'dehoist', 'addrole', 'removerole']
};