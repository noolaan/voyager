const { stripIndents } = require('common-tags');

const { MessageAttachment, WebhookClient } = require('discord.js');
const Collection = require('../../util/interfaces/Collection.js');
const Infraction = require('./interfaces/Infraction.js');

class ModerationManager {

    constructor(client) {

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.webhooks = new Collection();
        this.expirations = new Collection();

        this.client.hooker.hook('messageDelete', this._messageLog.bind(this));

        this.client.hooker.hook('guildMemberAdd', this._muteCheck.bind(this));
        this.client.hooker.hook('guildMemberAdd', this._joinLog.bind(this));
        this.client.hooker.hook('guildMemberRemove', this._kickLog.bind(this));

        this.client.hooker.hook('guildBanAdd', this._banLog.bind(this));
        this.client.hooker.hook('guildBanRemove', this._unbanLog.bind(this));

    }

    async handleInfraction(Infraction, message, { targets, parameters, duration, flags, data, opts }) {

        if(targets.length > Constants.MaxTargets) {
            return message.respond(`You can only specify up to \`${Constants.MaxTargets}\` unique targets, try again.`, {
                emoji: 'failure'
            });
        }

        const promises = [];
        for(let target of targets) {
            promises.push(new Infraction(this.client, {
                executor: message.member,
                target: target,
                guild: message.guild,
                channel: message.channel,
                reason: parameters,
                duration,
                info: data,
                flags
            }).parse());
        }

        const responses = await Promise.all(promises);

        /* Message Handling */

        const success = responses.some(r=>!r.error) ? true : false;
        const succeeded = responses.filter(r=>!r.error);
        const failed = responses.filter(r=>r.error);

        const { past, present } = responses[0].infraction.dictionary;
        const array = success ? succeeded : failed;

        let string = `${success ? `Successfully ${past}` : `Failed to ${present}`} ${responses[0].infraction.targetType}${array.length > 1 ? 's' : ''} ${array.map(a=>`**${a.infraction.targetName}**`).join(', ')}.`;
        if(failed[0] && failed[0].message) {
            string += `\n*Reason: ${failed[0].message}*`;
        } else if(failed.length > 0 && success) {
            for(let fail of failed) {
                string += `\nFailed to ${present} **${fail.infraction.targetName}** because ${fail.reason}.`;
            }
        } else if(!success && failed.length === 1) {
            string = string.slice(0, -1);
            string += ` because ${failed[0].reason}.`;
        }

        const cmdMessage = await message.respond(string, {
            emoji: success ? 'success' : 'failure'
        });

        for(let { infraction, error } of responses) {
            if(!error) await infraction.resolve(opts, cmdMessage);
        }

        return undefined;

    }

    async handleExpiration(infraction) {
        const time = infraction.expiration - new Date().getTime();

        const resolve = async (i) => {
            const type = Constants.Infractions[Constants.Resolves[i.type]];
            if(!type) return undefined;

            const guild = this.client.guilds.get(i.guild);
            const modlog = guild._getSetting('moderationLog');

            let target = null;
            if(i.targetType === 'user') {
                target = await guild.members.get(i.target);
                if(!target) {
                    try {
                        target = await guild.members.fetch(i.target);
                    } catch(e) {
                        try {
                            target = await this.client.users.fetch(i.target);
                        } catch(e) {} //eslint-disable-line no-empty
                    } 
                }
            } else if(i.targetType === 'channel') {
                target = guild.channels.get(i.target);
            }

            const infrac = await new type(this.client, {
                executor: guild.members.get(i.executor),
                target,
                reason: `AUTO-${Constants.Resolves[i.type]} | Case ${i.case}`,
                channel: guild.channels.get(i.channel),
                guild
            }).parse();

            const hyperlink = modlog.channel ? `${i.guild}/${modlog.channel}/${i.logMessage}/` : `${i.guild}/${i.channel}/${i.cmdMessage}`;
            await infrac.infraction.resolve({}, `https://discordapp.com/channels/${hyperlink}`);

            i.expiration = null;
            this.client.storageManager.tables.infractions.update(i.id, i);

            console.log('resolved'); //eslint-disable-line

        };

        if(time < 0) return await resolve(infraction);
        const obj = {
            timeout: setTimeout(() => {
                resolve(infraction);
            }, time),
            infraction
        };

        this.expirations.set(infraction.id, obj);

    }

    async _removeExpiration(infraction) {
        const expiration = this.expirations.filter(e=>e.infraction.target === infraction.target.id
                && e.infraction.type === Constants.Unresolves[infraction.type]).first();
        if(!expiration) return undefined;
        
        clearInterval(expiration.timeout);
        expiration.infraction.expiration = null;
        this.client.storageManager.tables.infractions.update(expiration.infraction.id, expiration.infraction);

        this.expirations.delete(`${expiration.infraction.guild}:${expiration.infraction.case}`);
    }
    
    /* 
        Event Handling 
                        */

    async _messageLog(message) {

        if(!this.client._built
            || message.webhookID
            || message.author.bot
            || (message.guild && !message.guild.available)) return undefined;

        await message.guild.settings();


        let client;
        const messageLog = message.guild._getSetting('messageLog');
        if(messageLog.value) {
            let { id, token } = messageLog.webhook;
            const setting = this.client.registry.components.get('setting:messageLog');
            client = this.client.webhookManager.grabClient(message.guild, {
                id,
                token,
                setting
            });
        }

        if(!client) return undefined;

        const cache = this.client.registry.components.get("observer:messageCache").cache;
        const cachedMessage = cache.get(message.id);
        const attachments = cachedMessage ? cachedMessage.attachments : [];

        //join messages have no content ig
        if(!cachedMessage || !cachedMessage.content) return undefined;

        const embed = {
            author: {
                name: `${message.author.tag} (${message.author.id})`,
                icon_url: message.author.displayAvatarURL({ size: 32 })
            },
            color: 0xe56060,
            description: stripIndents`${message.cleanContent}`,
            timestamp: new Date(),
            footer: {
                text: `Message deleted in #${message.channel.name}`
            }
        };

        let uploadedFiles = [];
        if(attachments.length > 0 && message.guild._getSetting('messageLog').images) {
            const imageExts = ['.png', '.webp', '.jpg', '.jpeg', '.gif'];
            const startTime = new Date().getTime();
            const files = [];
            for(const attachment of attachments) {
                const buffer = (await this.client.storageManager.tables.attachments.get(attachment.id)).buffer;
                const messageAttachment = new MessageAttachment(buffer, attachment.name);
                if(imageExts.includes(attachment.extension) && uploadedFiles.length === 0) {
                    uploadedFiles = [ messageAttachment ];
                    embed.image = {
                        url: `attachment://${attachment.name}`
                    };
                } else {
                    files.push(messageAttachment);
                }
            }

            const webhookInfo = this.client._options.moderation.attachments.webhook;
    
            if(files.length > 0) {
                const attachmentWebhook = this._addWebhook(webhookInfo.id, webhookInfo.token);
                const attachmentMessage = await attachmentWebhook.send(files.map(f=>f.name).join(', '), { files });
    
                embed.description += `\n\n**${uploadedFiles ? 'Additional ' : ''}Attachment${files.length > 1 ? 's' : ''}:** ${attachmentMessage.attachments.map(a=>`[${a.filename}](${a.url})`).join(' ')}`;
            }
            const endTime = new Date().getTime();
            this.client.logger.debug(`Uploaded ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}; took ${endTime-startTime}ms.`);
        }

        client.queue(embed, uploadedFiles);
        //await webhookClient.send("", options);

    }

    async _muteCheck(member) {
        const guild = member.guild;
        const expiration = this.expirations.filter(e=>e.infraction.target === member.id && e.infraction.type === 'MUTE').first();
        if(!expiration) return undefined;

        const executor = await this.client.users.fetch(expiration.infraction.executor);

        const infrac = await new Constants.Infractions[expiration.infraction.type](this.client, {
            executor,
            target: member,
            guild
        }).parse();

        await infrac.infraction.resolve({ log: false });
    }

    async _joinLog(member) {
        const guild = member.guild;

        await guild.settings();
        const memberLog = guild._getSetting('memberLog');

        if(memberLog.value) {
            const webhookClient = this._addWebhook(memberLog.webhook.id, memberLog.webhook.token);
            const embed = {
                author: {
                    name: `${member.user.tag} (${member.id})`,
                    icon_url: member.user.displayAvatarURL()
                },
                thumbnail: {
                    url: member.user.displayAvatarURL({ size: 256 })
                },
                description: `<@${member.user.id}>`,
                timestamp: new Date(),
                color: 0x6ccf69,
                footer: {
                    text: "Member joined"
                }
            };

            await webhookClient.send("", { embeds: [ embed ] });

        }

    }

    async _banLog(guild, user) {
        await guild.settings();
        if(!guild._getSetting('moderationLog').value) return undefined;

        const entry = await this._fetchFirstEntry(guild, user, 'MEMBER_BAN_ADD');
        if(!entry) return undefined;

        new Infraction(this.client, {
            type: 'BAN',
            targetType: 'user',
            target: user,
            executor: entry.executor,
            reason: entry.reason || 'N/A',
            color: 0xd65959,
            guild
        }).resolve();
    }

    async _unbanLog(guild, user) {
        await guild.settings();
        if(!guild._getSetting('moderationLog').value) return undefined;

        const entry = await this._fetchFirstEntry(guild, user, 'MEMBER_BAN_REMOVE');
        if(!entry) return undefined;

        new Infraction(this.client, {
            type: 'UNBAN',
            targetType: 'user',
            target: user,
            executor: entry.executor,
            reason: entry.reason || 'N/A',
            color: 0xd97c7c,
            guild
        }).resolve();
    }

    async _kickLog(member) {
        const guild = member.guild;

        await guild.settings();
        if(!guild._getSetting('moderationLog').value) return undefined;

        const entry = await this._fetchFirstEntry(guild, member, 'MEMBER_KICK');
        if(!entry) return undefined;

        new Infraction(this.client, {
            type: 'KICK',
            targetType: 'user',
            target: member.user,
            executor: entry.executor,
            reason: entry.reason || 'N/A',
            color: 0xe8a96b,
            guild
        }).resolve();
    }

    /*
        Miscellaneous Functions
                                    */

    async _grabWebhook(message, setting) {
        const index = message.guild._getSetting(setting.index);
        if(index.value) {
            const channel = message.guild.channels.get(index.channel);
            if(!channel) {
                setting.reset(message);
                return null;
            }
            const webhooks = await channel.fetchWebhooks();
            const webhook = webhooks.get(index.webhook.id);
            if(!webhook) {
                setting.reset(message);
                return null;
            }
            return webhook;
        } else {
            return null;
        }
    }

    _addWebhook(id, token) {
        if(this.webhooks.has(id)) {
            return this.webhooks.get(id);
        } else {
            const client = new WebhookClient(id, token);
            this.webhooks.set(id, client);
            return client;
        }
    }

    _removeWebhook(id) {
        const client = this.webhooks.get(id);
        client.destroy();
        this.webhooks.delete(id);
    }

    async _fetchFirstEntry(guild, user, type) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const audit = await guild.fetchAuditLogs({ limit: 1 });

        if(!audit || audit.entries.size === 0) return null;
        // const entry = audit.entries.filter(e=>e.target.id === user.id).first();
        const entry = audit.entries.first();
        if(!entry || entry.executor.bot) return null;
        if(entry.target.id !== user.id) return null;
        if(entry.action !== type) return null;
        
        return entry;
    }

}

module.exports = ModerationManager;

const Constants = {
    Infractions: {
        MUTE: require('../moderation/infractions/Mute.js'),
        // VCMUTE: require('../moderation/infractions/Vcmute.js'),
        BAN: require('../moderation/infractions/Ban.js'),
        UNMUTE: require('../moderation/infractions/Unmute.js'),
        // VCUNMUTE: require('../moderation/infractions/Vcunmute.js'),
        UNBAN: require('../moderation/infractions/Unban.js'),
    },
    Resolves: {
        MUTE: 'UNMUTE',
        VCMUTE: 'VCUNMUTE',
        BAN: 'UNBAN'
    },
    Unresolves: {
        UNMUTE: 'MUTE',
        VCUNMUTE: 'VCMUTE',
        UNBAN: 'BAN'
    },
    MaxTargets: 5
};