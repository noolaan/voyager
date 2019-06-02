const emojis = require('../../../util/emojis.json');

class CommandMessage {

    constructor(client, info = {}) {

        Object.defineProperty(this, 'client' , { value: client });

        this.command = info.command;
        this.message = info.message;
        this.args = info.args;
        this.flags = info.flags;

        this.pending = null;

        this.UUID = new Date().getTime().toString(36);

    }

    /* Functions */

    async respond(str, opts = {}) {
        if(typeof str === 'string') {
            if(opts.emoji) str = `${emojis[opts.emoji]} ${str}`;
            if(opts.reply) str = `<@!${this.message.author.id}> ${str}`;
        }

        this.pending = new this.constructor(this.client, {
            message: await this.message.channel.send(str)
        });

        return this.pending;
    }

    async edit(str, opts) {
        if(!this.message.editable) return undefined;
        if(typeof str === 'string') {
            if(opts.emoji) str = `${emojis[opts.emoji]} ${str}`;
            if(opts.reply) str = `<@!${this.message.author.id}> ${str}`;
        }

        return this.message.edit(str);
    }

    /* Handling */

    async _resolve() {

        const settings = {};
        const types = {
            guild: async () => this.message.guild ? await this.message.guild.settings() : null,
            user: async () => await this.message.author.settings()
        };
        if(this.command.settings.length > 0) {
            for(const setting of this.command.settings) {
                settings[setting] = await types[setting]();
            }
        }

        for(let flag of Object.values(this.flags)) {
            if(flag.queries[this.UUID]) this.flags[flag.id].query = flag.queries[this.UUID];
        }

        try {
            const resolved = await this.command.execute(this, { 
                args: this.args, 
                flags: this.flags,
                settings
            });
            if(resolved instanceof Promise) await resolved;
            return { error: false, message: this };
        } catch(error) {
            this.client.logger.error(`Command Error | ${this.command.moduleResolveable} | UUID: ${this.UUID}\n${error.stack || error}`);
            return { error: true, commandMessage: this, code: 'COMMAND' };
        }

    }

    /* Getters */

    get member() {
        return this.message.member;
    }

    get author() {
        return this.message.author;
    }

    get guild() {
        return this.message.guild;
    }

    get id() {
        return this.message.id;
    }

    get channel() {
        return this.message.channel;
    }

    get raw() {
        return this.message;
    }

}

module.exports = CommandMessage;