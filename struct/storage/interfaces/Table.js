class Table {

    constructor(client, opts = {}) {
        if(!opts) return null;

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.storageManager = this.client.storageManager;

        this.r = opts.r;
        this.name = opts.name;
        this.index = opts.index;

    }

    initialize() {
        return this;
    }

    async keys() {
        try {
            return await this._index.getField('id').run() || [];
        } catch(error) {
            this._error(error);
        }
    }

    async get(key) {
        try {
            return await this._index.get(key).run() || null;
        } catch(error) {
            this._error(error);
        }
    }

    async getAll() {
        try {
            return await this._index.run() || null;
        } catch(error) {
            this._error(error);
        }
    }

    async has(key) {
        return Boolean(await this.get(key));
    }

    async set(key, data) {
        data.id = key;
        try {
            return await this._index.insert(data).run() || null;
        } catch(error) {
            this._error(error);
        }
    }

    async delete(key) {
        try {
            const available = await this.get(key);
            return available ? await this._index.get(key).delete().run() : null;
        } catch(error) {
            this._error(error);
        }
    }

    async update(key, data) {
        try {
            const available = await this.get(key);
            return available ? await this._index.get(key).update(data) : null;
        } catch(error) {
            this._error(error);
        }
    }

    async replace(key, data) {
        try {
            const available = await this.get(key);
            return available ? await this._index.get(key).replace({ id: key, ...data }) : null;
        } catch(error) {
            this._error(error);
        }
    }

    async clear() {
        try {
            const result = await this._index.delete().run();
            this._log(`Cleared ${result.deleted} items.`);
            return result;
        } catch(error) {
            this._error(error);
        }
    }

    async amount() {
        try {
            return await this._index.count().run();
        } catch(error) {
            this._error(error);
        }
    }

    async data() {
        try {
            return await this.r.db('rethinkdb')
                .table('stats')
                .filter({ db: this.name, table: this.index })
                .map(doc => doc('storage_engine')('disk')('space_usage')('data_bytes').default(0))
                .sum();
        } catch(error) {
            this._error(error);
        }
    }

    _log(message) {
        this.client.logger.debug(`Database (${this.name}:${this.index}) : ${message}`);
    }

    _error(error) {
        this.client.logger.error(`Database (${this.name}:${this.index}) Error :\n${error.stack || error}`);
    }

    get _index() {
        return this.r.db(this.name).table(this.index);
    }

}

module.exports = Table;