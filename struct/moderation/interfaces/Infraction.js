const { stripIndents } = require('common-tags');

class Infraction {

    constructor(client, opts = {}) {

        Object.defineProperty(this, 'client', { value: client });

        this.moderationManager = this.client.moderationManager;

        this.target = opts.target;
        this.targetType = opts.targetType;
        this.executor = opts.executor;
        this.guild = opts.guild;
        this.channel = opts.channel;

        this.case = null;
        this.type = opts.type;

        this.timestamp = new Date().getTime();
        this.duration = opts.duration || null;
        this.expiration = opts.duration ? opts.duration + new Date().getTime() : null;
        this.reason = opts.reason;
        this.color = opts.color;
        this.dictionary = opts.dictionary || {};

        this.data = null;
        this.commandMessage = null;
        this.logMessage = null;
        this.caseMessage = null;

        this._resolved = false;

    }

    async resolve(opts = { dm: false, log: true }, sentMessage) {

        if(this._resolved) {
            this.client.logger.error('Tried resolving infraction after being resolved... awkward.');
            return undefined;
        }

        this.case = await this.client.storageManager.tables.infractions
            .grabCase(this.guild.id);

        if(typeof this.reason === 'string' && this.reason.length > Constants.MaxCharacters) {
            this.reason = `${this.reason.substring(0, Constants.MaxCharacters-3)}...`;
        }

        if(opts.dm) {
            this._log({ dm: true });
            return undefined;
        }

        this.commandMessage = sentMessage;

        if(opts.log === undefined || opts.log) {
            if(this.guild._getSetting("moderationLog").infractions.includes(this.type.toLowerCase())) {
                await this._log({});
            }
        }

        const data = this._json();
        await this._databaseAdd(data);

        if(this.expiration) this.moderationManager.handleExpiration(data);
        
        this._resolved = true;
        return this;
        
    }

    async _log(opts = { dm: false }) {
        const embed = this._createEmbed(opts.dm);
        const dmInfraction = this.guild._getSetting('dmInfraction');

        if(dmInfraction.value && this.targetType === 'user') {
            const from = ['KICK', 'BAN'];
            try {
                await this.target.send(stripIndents`You were **${this.dictionary.past}** ${from.includes(this.type) ? 'from' : 'on' } the server \`${this.guild.name}\`.
                    Here is your infraction:`, { embed });
            } catch(e) {} //eslint-disable-line no-empty
        }

        if(opts.dm) return undefined;

        const moderationLog = this.guild._getSetting('moderationLog');
        if(moderationLog.value) {
            let { id, token } = moderationLog.webhook;
            const setting = this.client.registry.components.get('setting:moderationLog');
            const client = this.client.webhookManager.grabClient(this.guild, {
                id,
                token,
                setting
            });
            const response = await client._send(embed);
            this.caseMessage = response.id;
        }

    }

    async _databaseAdd(data) {
        await this.client.storageManager.tables.infractions.set(data.id, data);
        return data;
    }

    parse() {
        return this._succeed();
    }

    _json() {
        return {
            id: `${this.guild.id}:${this.case}`,
            guild: this.guild.id,
            channel: this.channel ? this.channel.id : null,
            message: this.message ? this.message.id : null,
            executor: this.executor.id,
            target: this.target.id,
            targetType: this.targetType,
            type: this.type,
            case: this.case,
            duration: this.duration,
            expiration: this.expiration,
            reason: this.reason,
            timestamp: this.timestamp,
            logMessage: this.logMessage ? this.logMessage.id : null,
            cmdMessage: this.commandMessage ? (this.commandMessage.id ? this.commandMessage.id : this.commandMessage) : null,
            caseMessage: this.caseMessage
        };
    }

    _createEmbed(dm = false) {

        let description = stripIndents`**Action:** ${this.type}
            **Moderator:** ${this.executor.tag} (${this.executor.id})
            **Reason:** ${this.reason}`;

        if(this.commandMessage && !dm) {
            description += `\n**Jump To:** [${typeof this.commandMessage === 'string' ? 'Case' : 'Message'}](${typeof this.commandMessage === 'string' ? this.commandMessage : `https://discordapp.com/channels/${this.guild.id}/${this.channel.id}/${this.commandMessage ? this.commandMessage.id : this.commandMessage}`})`;
        }

        if(this.duration) {
            description += `\n**Duration**: ${this._duration()}`;
        }

        return {
            author: {
                name: `${this.targetName} (${this.target.id})`,
                icon_url: this.targetIcon
            },
            description,
            timestamp: new Date(),
            color: this.color,
            footer: {
                text: `》Case ${this.case}`
            }
        };
    }

    get targetName() {
        return this.targetType === 'user'
            ? this.target.tag
            : `#${this.target.name}`;
    }

    get targetIcon() {
        return this.targetType === 'user'
            ? this.target.displayAvatarURL()
            : this.guild.iconURL();
    }

    get _reason() {
        let str = `Executed by ${this.executor.tag} (${this.executor.id}) because: ${this.reason} | targetId: ${this.target.id}`;
        if(str.length > 512) str = `${this.reason.substring(0, 509)}...`;
        return str;
    }

    _fail(message, fatal = false) {
        return {
            error: true,
            [fatal ? 'message' : 'reason']: message,
            user: this.target,
            infraction: this
        };
    }

    _succeed() {
        return {
            error: false,
            user: this.target,
            infraction: this
        };
    }

    _duration() { 
        let s, m, h, d;
        s = Math.floor(this.duration/1000);
        m = Math.floor(s/60);
        s = s % 60;
        h = Math.floor(m/60);
        m = m % 60;
        d = Math.floor(h/24);
        h = h % 24;
        return `${d ? `${d}d` : ''}${h ? `${h}h` : ''}${m ? `${m}m` : ''}${s ? `${s}s` : ''}`;
    }

}

module.exports = Infraction;

const Constants = {
    MaxCharacters: 150
};