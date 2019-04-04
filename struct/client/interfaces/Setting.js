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
        if(reset) return await this.reset(message);
        this.client.logger.error(`Setting ${this.resolveable} has no parsing function.`);
        return undefined;
    }

    async set(key, value) {
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
        await this.client.storageManager.tables[this._table].sync(key, response);
    }

    async reset(message) {
        const key = this.resolve === 'GUILD' ? message.guild.id : message.author.id;
        await this.client.storageManager.tables[this._table].sync(key, {
            [this.index]: {
                value: this.default
            }
        });
        await message.respond(`Successfully reset the setting **${this.name}** to \`${this.default}\`.`, {
            emoji: 'success'
        });
        return { ignore: true };
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

}

module.exports = Setting;

const Constants = {
    Resolves: [
        'GUILD',
        'USER'
    ]
};