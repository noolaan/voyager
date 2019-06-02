const rethinkdb = require('rethinkdbdash');

class StorageManager {

    constructor(client, opts = {}) {

        Object.defineProperty(this, 'client', { value: client });

        this.r = new rethinkdb({
            silent: true,
            log: m => this.client.logger.info(m)
        });

        this.name = opts.name;
        this.tables = {};

    }

    async createTables(tables) {

        for(const [ index, obj ] of tables) {
            const table = await new obj(this.client, {
                r: this.r,
                name: this.name,
                index
            }).initialize();
            this.tables[index] = table;
        }

    }

}

module.exports = StorageManager;
