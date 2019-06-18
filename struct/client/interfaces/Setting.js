const Component = require('./Component.js');

class Setting extends Component {

    constructor(client, opts = {}) {

        if(!opts) return null;

        super(client, {
            id: opts.name,
            type: 'setting',
            guarded: opts.guarded,
            disabled: opts.disabled
        });

        this.name = opts.name;
        this.module = opts.module;
        this.restricted = Boolean(opts.restricted);

        this.description = opts.description || "A basic setting.";

        this.index = opts.index || opts.name;
        this.aliases = opts.aliases || [];
        this.resolve = (opts.resolve && Constants.Resolves.includes(opts.resolve)) ? opts.resolve : 'GUILD';
        this.default = opts.default;

        this.hidden = Boolean(opts.hidden);

        this.memberPermissions = opts.memberPermissions || [];
        this.clientPermissions = opts.clientPermissions || [];

        this._table = this.resolve === 'GUILD' ? 'guilds' : 'users';

    }

    async parse(message, args, reset) {
        if(reset) {
            const key = this.resolve === 'GUILD' ? message.guild.id : message.author.id;
            return await this.reset(key);
        }
        
        this.client.logger.error(`Setting ${this.resolveable} has no parsing function.`);
        return undefined;
    }

    async set(key, value, opts) {
        let response = null;
        if(typeof value === 'string' || typeof value === 'boolean') {
            response = {
                [this.index]: {
                    value
                }
            };
        } else {
            response = {
                [this.index]: value
            };
        }
        await this.client.storageManager.tables[this._table].sync(key, response, opts ? opts : { replace: true });
        return response;
    }

    async reset(key, ignore = false) {
        // const key = this.resolve === 'GUILD' ? message.guild.id : message.author.id;
        if(ignore) return undefined;
        const def = this.default;
        let response = null;
        if(typeof def === 'string' || typeof def === 'boolean' || def === null) {
            response = {
                [this.index]: {
                    value: def
                }
            };
        } else {
            response = {
                [this.index]: def
            };
        }
        await this.client.storageManager.tables[this._table].sync(key, response, { replace: true });
        const val = typeof this.default === 'object' ? (this.default ? this.default.value : null || 'N/A') : this.default;
        return { ignore: true, result: val };
    }

    reason(msg) {
        return `[${this.resolveable}] Executed by ${msg.author.tag}.`;
    }

    fields() {
        this.client.logger.warn(`Setting ${this.resolveable} has no field function.`);
        return [];
    }

    current(settings) {
        return settings.value;
    }

    parent(key) {
        return this.resolve === 'GUILD' 
            ? this.client.guilds.resolve(key)
            : this.client.users.resolve(key);
    }
    
}

module.exports = Setting;

const Constants = {
    Resolves: [
        'GUILD',
        'USER'
    ]
};