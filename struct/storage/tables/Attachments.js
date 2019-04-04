const { Table } = require('../interfaces/');

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

}

module.exports = Attachments;