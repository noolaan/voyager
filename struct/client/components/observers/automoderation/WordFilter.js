const { Observer } = require('../../../interfaces/');

class WordFilter extends Observer {

    constructor(client) {

        super(client, {
            name: 'wordFilter',
            priority: 10
        });

        this.hooks = [
            ['message', this.message.bind(this)],
            ['messageUpdate', this.messageUpdate.bind(this)]
        ];

        //this.cache
        this._messageCache = null;

        Object.defineProperty(this, 'client', { value: client });

    }

    async message(message) {
        
    }

    async messageUpdate(oldMessage, newMessage) {

    }

    async _check(string, settings) {


    }

    get cache() {
        if(!this._messageCache) {
            this._messageCache = this.client.registry.components.get("observer:messageCache").cache;
        }
        return this._messageCache;
    }

}

module.exports = WordFilter;