const { Table } = require('../interfaces/');

class Expirations extends Table {

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

        this.moderationManager = this.client.moderationManager;

    }

    async initialize() {
        const expirations = await this.getAll();
        for(const expiration of expirations) {
            const guild = this.client.guilds.get(expiration.guild);
            if(!guild) {
                await this.delete(expiration.id);
                continue;
            }
            await guild.settings();
            this._addExpiration(expiration, guild);
        }
        
        return this;
    }

    async _addExpiration(data, guild, create = false) {
        if(create) await this.set(data.id, data);
        if(data.expiration) {
            const time = data.expiration - new Date().getTime();
            if(time < 0 && !create) return await this._removeExpiration(data, guild);
            data['timeout'] = setTimeout(() => {
                return this._removeExpiration(data, guild);
            }, time);
        }
        this.moderationManager.expirations2.set(data.id, data);
    }

    async _removeExpiration(expiration, guild) {
        const member = await guild.members.fetch(expiration.member);
        if(!member) {
            this.moderationManager.expirations2.delete(expiration.id);
            await this.delete(expiration.id);
        }

        if(member.voice.channelID) {
            if(expiration.type === 'VCMUTE') {
                await member.voice.setMute(true);
            } else {
                await member.voice.setMute(false);
            }
            this.moderationManager.expirations2.delete(expiration.id);
            await this.delete(expiration.id);
        } else {
            return undefined;
        }

    }

}

module.exports = Expirations;