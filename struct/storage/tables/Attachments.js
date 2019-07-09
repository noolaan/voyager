const { Table } = require('../interfaces/');

const delay = 3600; //seconds

class Attachments extends Table {

    constructor(client, opts = {}) {
        if(!opts) return null;

        super(client, {
            r: opts.r,
            name: opts.name,
            index: opts.index
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

    }

    async initialize() {
        return this;
    }

    async sweepCache() {
        try {
            const result = await this._index.filter((attachment) => {
                return attachment("timestamp").sub(new Date().getTime()).lt(-1200000); //20 minutes in ms
            }).delete().run();
            this._log(`Cleared ${result.deleted} items from the cache.`);    
        } catch(error) {
            this._error(error);
        }
    }

}

module.exports = Attachments;