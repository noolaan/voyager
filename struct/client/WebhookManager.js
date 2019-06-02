const WebhookClient = require('../../util/interfaces/WebhookClient.js');
const Collection = require('../../util/interfaces/Collection.js');

class WebhookManager {

    constructor(client) {

        Object.defineProperty(this, 'client', { 
            value: client
        });

        this.clients = new Collection();
        this.pending = new Collection();
    
        this.timeout = null;

    }

    grabClient(guild, { id, token, setting }) {

        const createClient = () => {
            const client = new WebhookClient(this.client, guild, {
                id, token, setting
            });
            this.clients.set(id, client);
            return client;
        };

        let client = this.clients.get(id);
        if(client) {
            if(token !== client.token) {
                client._destroy();
                client = createClient();
            }
        } else {
            client = createClient();
        }

        // console.log(client);
        return client;

    }

    queue(manager) {

        if(!this.pending.has(manager.id)) {
            this.pending.set(manager.id, manager);
        }

        if(!this.timeout) {
            this.timeout = setTimeout(async () => {
                await this._resolve();
            }, Constants.Timeout*1000);
        }

    }

    async _resolve() {

        const redo = [];
        for(const client of this.pending.values()) {
            await client.push();
            if(client._queue.length > 0) {
                redo.push(client);
            }
        }

        clearTimeout(this.timeout);
        this.timeout = null;

        redo.map((client) => this.queue(client));

    }

}

module.exports = WebhookManager;

const Constants = {
    Timeout: 5
};