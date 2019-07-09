const { MessageAttachment } = require('discord.js');
const { stripIndents } = require('common-tags');
const moment = require('moment');
// const fetch = require('node-fetch');

const { Observer } = require('../../interfaces/');
const Util = require('../../../../util/Util.js');

class MessageLogs extends Observer {

    constructor(client) {

        super(client, {
            name: 'messageLogs',
            priority: 10
        });

        this.hooks = [
            ['messageDelete', this.messageDelete.bind(this)],
            ['messageDeleteBulk', this.messageDeleteBulk.bind(this)],
            ['messageUpdate', this.messageUpdate.bind(this)]
        ];

        //this.cache
        this._messageCache = null;

        Object.defineProperty(this, 'client', { 
            value: client 
        });

    }

    async messageDelete(message) {

        const webhook = await this._grabWebhook(message);
        if(!webhook) return undefined;

        const cachedMessage = this.cache.get(message.id);
        const attachments = cachedMessage ? cachedMessage.attachments : [];

        if((!cachedMessage || (!cachedMessage.content && attachments.length === 0))
            && !message.content) return undefined;

        const embed = {
            author: {
                name: `${message.author.tag} (${message.author.id})`,
                icon_url: message.author.displayAvatarURL({ size: 32 })
            },
            color: 0xe56060,
            description: Util.escapeMarkdown(message.cleanContent).replace(new RegExp('\\n', 'g'), ' '),
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
    
            if(files.length > 0) {
                const attachmentWebhook = this.client.webhookManager.grabClient(message.guild, this.client._options.moderation.attachments.webhook);
                const attachmentMessage = await attachmentWebhook._send(null, files);
    
                embed.description += `\n\n**${uploadedFiles ? 'Additional ' : ''}Attachment${files.length > 1 ? 's' : ''}:** ${attachmentMessage.attachments.map(a=>`[${a.filename}](${a.url})`).join(' ')}`;
            }
            const endTime = new Date().getTime();
            this.client.logger.debug(`Uploaded ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}; took ${endTime-startTime}ms.`);
        }

        webhook.queue(embed, uploadedFiles);

    }

    async messageDeleteBulk(messages) {

        messages = messages.sort((a, b) => a - b);
        
        const message = messages.first();

        await message.guild.settings();
        const webhook = await this._grabWebhook(message, true);
        if(!webhook) return undefined;

        let embed = {
            description: "",
            color: 0xff4848,
            timestamp: new Date(),
            footer: {
                text: `Bulk delete in #${message.channel.name}`
            }
        };

        let continued = "";
        const images = message.guild._getSetting('messageLog').images;

        for(const message of messages.values()) {
            const attachments = images ? await this._grabAttachments(this.cache.get(message.id)) : [];
            let text = stripIndents`**${Util.escapeMarkdown(message.author.tag)}** \`(${message.author.id})\` ***${moment(message.createdTimestamp).format("MM/DD hh:mm:ss")}***
                ${Util.escapeMarkdown(message.cleanContent).replace(new RegExp('\\n', 'g'), ' ')}`;
            
            if(attachments.length > 0) {
                text += `\n**Attachment${attachments.length === 1 ? '' : 's'}**: ${attachments.map(a=>`[${a.filename}](${a.url})`).join(' ')}`;
            }

            text += `\n**\`[MESSAGE-ID:${message.id}]\`**`;
            if((embed.description.length + text.length) > 1900) {
                continued += text;
                continued += "\n\n";
                continue;
            }

            embed.description += text;
            embed.description += "\n\n";

        }

        if(continued) {
            const full = embed.description + continued;
            const txt = await this._grabText(message, full);
            embed.description += `**Bulk delete log exceeded description length; view full log [here](${txt.url}).**`;
        }

        webhook.queue(embed);

    }

    async messageUpdate(oldMessage, newMessage) {

        await oldMessage.guild.settings();
        const webhook = await this._grabWebhook(oldMessage);
        if(!webhook) return undefined;

        if(oldMessage.cleanContent.toLowerCase() === newMessage.cleanContent.toLowerCase()) return undefined;

        const embed = {
            author: {
                name: `${oldMessage.author.tag} (${oldMessage.author.id})`,
                icon_url: oldMessage.author.displayAvatarURL({ size: 32 })
            },
            color: 0xe9d15f,
            timestamp: new Date(),
            fields: [
                {
                    name: "Old Content",
                    value: Util.escapeMarkdown(oldMessage.cleanContent).replace(new RegExp('\\n', 'g'), ' ')
                },
                {
                    name: "New Content",
                    value: Util.escapeMarkdown(newMessage.cleanContent).replace(new RegExp('\\n', 'g'), ' ')
                }
            ],
            footer: {
                text: `Message edited in #${oldMessage.channel.name}`
            }
        };

        webhook.queue(embed);

    }

    async _grabWebhook(message, shit = false) {

        if(!shit) {
            if(!this.client._built
                || message.webhookID
                || message.author.bot
                || (message.guild && !message.guild.available)) return null;
        }
        
        await message.guild.settings();

        let client = null;
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

        return client;

    }

    async _grabAttachments(message) {
        const attachments = message ? message.attachments : [];
        if(attachments.length === 0) return [];

        const files = [];
        for(const attachment of attachments) {
            const buffer = (await this.client.storageManager.tables.attachments.get(attachment.id)).buffer;
            const messageAttachment = new MessageAttachment(buffer, attachment.name);
            files.push(messageAttachment);
        }

        const webhook = this.client.webhookManager.grabClient(message.guild, this.client._options.moderation.attachments.webhook);
        const attachmentMessage = await webhook._send(null, files);
        return attachmentMessage.attachments;
    }

    async _grabText(message, text) {
        const webhook = this.client.webhookManager.grabClient(message.guild, this.client._options.moderation.attachments.webhook);
        const attachmentMessage = await webhook._send(null, [ new MessageAttachment(Buffer.from(text), `log.txt`) ]);
        return attachmentMessage.attachments[0];
    }
    
    get cache() {
        if(!this._messageCache) {
            this._messageCache = this.client.registry.components.get("observer:messageCache").cache;
        }
        return this._messageCache;
    }

}

module.exports = MessageLogs;