const path = require('path');
const request = require('request-promise');
const { inspect } = require('util'); 

const { Observer } = require('../../interfaces/');
const Collection = require('../../../../util/interfaces/Collection.js');

const interval = 3600;

class MessageCache extends Observer {

    constructor(client) {

        super(client, {
            name: 'messageCache',
            priority: 1
        });

        this.hooks = [
            ['message', this.handleMessage.bind(this)]
        ];

        this.cache = new Collection();
        this._extensions = ['.png', '.webp', '.jpg', '.jpeg', '.gif', '.mp3', '.mp4', '.mov', '.webm', '.wav', '.ogg', '.flac'];
    
        Object.defineProperty(this, 'client', { value: client });

        setInterval(() => {
            this.client.storageManager.tables.attachments.sweepCache();
            this._sweepCache();
        }, interval*1000);

    }

    async handleMessage(message) {
        
        if(!this.client._built
            || message.webhookID
            || message.author.bot
            || !message.guild) return undefined;

        const guildSettings = message.guild ? await message.guild.settings() : {};

        let userAllow = true;
        const exists = await this.client.storageManager.tables.users.has(message.author.id);
        if(exists) {
            const userSettings = await message.author.settings();
            if(userSettings.attachmentCache && !userSettings.attachmentCache.value) userAllow = false;
        }

        const attachments = guildSettings && message.guild._getSetting('premium').value  && userAllow
            ? await this._grabAttachments(message)
            : [];

        const data = {
            guildId: message.guild.id,
            channelId: message.channel.id,
            messageId: message.id,
            author: message.author.id,
            content: message.cleanContent,
            timestamp: new Date(),
            attachments
        };

        this.cache.set(message.id, data);

    }

    async _grabAttachments(message) {
        const beforeTime = new Date().getTime(); //debug
        const attachments = [];

        for(const attachment of message.attachments.values()) {
            const data = {
                name: attachment.name,
                size: attachment.size,
                extension: path.extname(attachment.name),
                dimensions: { x: attachment.width, y: attachment.height },
                url: attachment.proxyURL
            };

            let buffer = null;
            if(this._extensions.includes(data.extension.toLowerCase())) {
                await request.get({
                    url: attachment.proxyURL,
                    encoding: null
                }).then((res) => {
                    buffer = res;
                }).catch((error) => {
                    this.client.logger.warn(`Error requesting attachment from ${message.author.tag} in #${message.channel.name} (${data.name}):\n${inspect(error.stack)}`);
                    this.client.logger.error(error.stack || error);
                    return undefined;
                });
            }

            const attachmentId = new Date().getTime().toString(36);
            data.id = attachmentId;
            if(!buffer) this.client.logger.warn(`Unsaved attachment from ${message.author.tag} in #${message.channel.name} (${data.name}):\n${data}`);
            await this.client.storageManager.tables.attachments.set(attachmentId, { buffer, timestamp: beforeTime });
            attachments.push(data);
        }

        const afterTime = new Date().getTime();
        if(attachments.length > 0) this.client.logger.debug(`Saved ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}; took ${afterTime-beforeTime}ms.`);
        return attachments;

    }

    _sweepCache() {
        const ms = 1200000;
        const filtered = this.cache.filter((message) => {
            const time = new Date().getTime() - message.timestamp.getTime();
            return time < ms;
        });
        this.client.logger.debug(`Trashed ${this.cache.size-filtered.size} items from messages cache.`);
        this.cache = filtered;
        return filtered;
    }

}

module.exports = MessageCache;