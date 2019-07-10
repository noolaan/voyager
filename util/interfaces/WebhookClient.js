const { WebhookClient } = require('discord.js');

class VoyagerWebhookClient extends WebhookClient {

    constructor(client, guild, { id, token, setting, concat = true }) {
        
        super(id, token);

        Object.defineProperty(this, '_client', {
            value: client
        });

        this.guild = guild;
        this.setting = setting || null;
        this.concat = Boolean(concat);
        
        this._queue = [];

        this.webhookManager = client.webhookManager;

    }

    queue(embed, files) {
        this._queue.push({ embed, files });
        this.webhookManager.queue(this);
    }

    async push() {

        const embeds = this._queue.splice(0, 10);

        let files = [];
        let embs = [];
        for(const embed of embeds) {
            if(embed.files) files = files.concat(embed.files);
            embs.push(embed.embed);
        }

        if(!files.length && !embs.length) return undefined;

        try {
            await this.send("", { 
                embeds: embs,
                files 
            });
        } catch(error) {
            if(error.code === 10015) { //Unknown Webhook
                this._destroy();
            } else if(error.code === 50006) {
                console.error('Tried sending an empty message', embs); //eslint-disable-line no-console
                //debuging
            } else {
                console.error(error); //eslint-disable-line no-console
            }
        }

    }

    async _send(embed, files) {
        let embeds = [];
        if(embed) embeds = [ embed ];
        try {
            return await this.send("", { embeds, files });
        } catch(error) {
            if(error.code === 10015) this._destroy();
            return null;
        }
    }

    async _destroy() {
        // Not sure if completely necessary... we'll see...
        let webhook;
        try {
            webhook = await this._client.fetchWebhook(this.id);
        } catch(e) {} //eslint-disable-line no-empty

        if(webhook) {
            this._client.logger.debug(`Found webhook: ${this.id}`);
            await webhook.delete();
        }
        
        if(this.setting) {
            this._client.logger.warn(`Destroyed webhook setting ${this.guild.name}.`);
            this.setting.reset(this.guild.id);
        }

    }

}

module.exports = VoyagerWebhookClient;