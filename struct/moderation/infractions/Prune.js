const Infraction = require('../interfaces/Infraction.js');

class Prune extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'PRUNE',
            targetType: 'channel',
            executor: options.executor.user ? options.executor.user : options.executor,
            target: options.target,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            color: 0x8fde88,
            dictionary: {
                past: 'pruned',
                present: 'prune'
            }
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.member = options.target;
        this.flags = options.flags;
        this.amount = options.info.amount;

    }

    async parse() {

        if(this.target.type !== 'text') {
            return this._fail('it is not a text channel');
        }

        const messages = await this.target.messages.fetch({ limit: this.amount });
        const filteredMessages = await this._filterMessages(messages);

        if(filteredMessages.size === 0) {
            return this._fail('it found no messages');
        }

        try {
            await this.target.bulkDelete(filteredMessages);
        } catch(error) {
            return this._fail('An error occured.', true);
        }

        return this._succeed();

    }

    async _filterMessages(messages) {

        const filter = (m) => {
            let func = null;
            const method = this.flags.method ? this.flags.method.query : 'and';
            if(method === 'and') {
                func = (this.flags.attachments ? m.attachments.size > 0 : true)
                    && (this.flags.bots ? m.author.bot : true)
                    && (this.flags.users ? this.flags.users.query.some(u=>u.id === m.author.id) : true)
                    && (this.flags.content ? m.content.toLowerCase().includes(this.flags.content.query) : true);
            } else if(method === 'or') {
                func = (this.flags.attachments ? m.attachments.size > 0 : false)
                    || (this.flags.bots ? m.author.bot : false)
                    || (this.flags.users ? this.flags.users.query.some(u=>u.id === m.author.id) : false)
                    || (this.flags.content ? m.content.toLowerCase().includes(this.flags.content.query) : false);
            }
            return func;
        };

        return messages.filter(m => filter(m));

    }

}

module.exports = Prune;