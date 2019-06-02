const { Table } = require('../interfaces/');

class Infractions extends Table {

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

        const guilds = this.client.guilds.map(g=>g.id);
        try {
            const infractions = await this._index.hasFields('expiration').filter((infraction) => {
                return this.r.expr(guilds).contains(infraction('guild'));
            });

            for(const infraction of infractions) {
                const guild = this.client.guilds.get(infraction.guild);
                await guild.settings();
                this.client.moderationManager.handleExpiration(infraction);
            }
        } catch(e) {
            super._error(e);
        }

        return this;
    }

    async grabCase(id) {
        try {
            const results = await super._index.filter({
                guild: id
            });
            return results.length+1;
        } catch(error) {
            super._error(error.stack || error);
            return 1;
        }
    }


    async grabInfractionsForUser(guildId, userId) {
        try {
            const results = await this._index.filter({
                guild: guildId, target: userId, targetType: 'user'
            }).orderBy(this.r.desc('case'));
            return results;
        } catch(error) {
            super._error(error.stack || error);
            return [];
        }
    }

}

module.exports = Infractions;