const Component = require('./Component.js');

class Command extends Component {

    constructor(client, opts = {}) {
        if(!opts) return null;

        super(client, {
            id: opts.name,
            type: 'command',
            disabled: opts.disabled || false,
            guarded: opts.guarded || false
        });

        Object.defineProperty(this, 'client', { value: client });

        this.name = opts.name;
        this.module = opts.module;
        this.aliases = opts.aliases || [];

        this.description = opts.description || "A basic command.";
        this.examples = opts.examples || [];
        this.usage = opts.usage || null;

        this.restricted = Boolean(opts.restricted);
        this.archivable = opts.archivable === undefined ? false : Boolean(opts.archivable);
        this.guildOnly = Boolean(opts.guildOnly);
        this.settings = opts.settings || [];
        this.premium = Boolean(opts.premium);

        this.clientPermissions = opts.clientPermissions || [];
        this.memberPermissions = opts.memberPermissions || [];

        this.throttling = opts.throttling || {
            usages: 5,
            duration: 10
        };

        this.split = opts.split || 'NONE';
        this.flags = opts.flags || [];

        this._throttles = new Map();

    }

    get moduleResolveable() {
        return `${this.module.id}:${this.id}`;
    }

}

module.exports = Command;