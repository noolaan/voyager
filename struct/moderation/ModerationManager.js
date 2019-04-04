const { stripIndents } = require('common-tags');

const { MessageAttachment, WebhookClient } = require('discord.js');
const Collection = require('../../util/interfaces/Collection.js');

class ModerationManager {

    constructor(client) {

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.webhooks = new Collection();

        this.client.hooker.hook('messageDelete', this._messageDelete.bind(this));

    }

    async _messageDelete(message) {

        const settings = await message.guild.settings();
        const webhook = await this._grabWebhook(message, settings, this.client.registry.components.get("setting:messageLog"));
        if(!webhook) return undefined;

        const webhookClient = this._addWebhook(webhook.id, webhook.token);

        const cache = this.client.registry.components.get("observer:messageCache").cache;
        const cachedMessage = cache.get(message.id);
        const attachments = cachedMessage ? cachedMessage.attachments : [];

        let options = {
            embeds: [
                {
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
                }
            ]
        };

        if(attachments.length > 0 && settings.messageLog.images) {
            const imageExts = ['.png', '.webp', '.jpg', '.jpeg', '.gif'];
            const startTime = new Date().getTime();
            const files = [];
            for(const attachment of attachments) {
                const buffer = (await this.client.storageManager.tables.attachments.get(attachment.id)).buffer;
                const messageAttachment = new MessageAttachment(buffer, attachment.name);
                if(imageExts.includes(attachment.extension) && !options.files) {
                    options.files = [ messageAttachment ];
                    options.embeds[0].image = {
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
    
                options.embeds[0].description += `\n\n**${options.files ? 'Additional ' : ''}Attachment${files.length > 1 ? 's' : ''}:** ${attachmentMessage.attachments.map(a=>`[${a.filename}](${a.url})`).join(' ')}`;
            }
            const endTime = new Date().getTime();
            this.client.logger.debug(`Uploaded ${attachments.length} attachments; took ${endTime-startTime}ms.`);
        }

        await webhookClient.send("", options);

    }

    async _grabWebhook(message, settings, setting) {
        const index = settings[setting.index];
        if(index.value) {
            const channel = message.guild.channels.get(index.channel);
            if(!channel) {
                setting.reset(message, settings);
                return null;
            }
            const webhooks = await channel.fetchWebhooks();
            const webhook = webhooks.get(index.webhook.id);
            if(!webhook) {
                setting.reset(message, settings);
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

}

module.exports = ModerationManager;

/*

        if(settings[index].value) {
            const channel = message.guild.channels.get(settings[index].channel);
            if(!channel) {
                //reset message log setting
            }
            const webhooks = await channel.fetchWebhooks();
            const webhook = webhooks.get(settings[index].webhook.id);
            if(!webhook) {
                //reset as well
            }
            return webhook;
        }

*/