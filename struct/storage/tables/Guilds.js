const { Table } = require('../interfaces/');

class Guilds extends Table {

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

        this.defaultGuild = null;

    }

    async initialize() {
        // for(const guild of this.client.guilds.values()) {
        //     if(!await this.has(guild.id)) {
        //         await this._createGuild(guild);
        //     }
        //     guild.settings = await this.get(guild.id);
        // }
        return this;
    }

    async sync(key, data, { replace = false, concat = true }) {
        if(!this.client.guilds.has(key)) await this.client.guilds.resolveID(key);
        const guild = this.client.guilds.get(key);

        let settings = data;
        if(concat) {
            const guildSettings = await guild.settings();
            settings = { 
                ...guildSettings,
                ...data
            };
        }
        guild._settings = settings;
        return await this[replace ? 'replace' : 'update'](key, { settings });
    }

    async grab(guild) {
        const data = await this.get(guild.id);
        if(!data) {
            return (await this._createGuild(guild)).settings;
        } else {
            return data.settings;
        }
    }

    async _createGuild(guild) {
        if(!this.defaultGuild) this.defaultGuild = this._createDefault();
        const info = { 
            id: guild.id,
            settings: this.defaultGuild
        };

        this._log(`Created guild: ${guild.name} (${guild.id})`);
        await this.set(guild.id, info);
        return info;
    }

    async _deleteGuild(guild) {
        this._log(`Deleted guild: ${guild.name} (${guild.id})`);
        await this.delete(guild.id);
        return guild.id;
    }

    async _removeAllKeys(key) {
        for(let [ id, guild ] of this.client.guilds.filter(g=>g.id === "187017643448991745").entries()) {
            guild = await this.grab(guild);
            if(guild[key] || guild[key] === null) {
                delete guild[key];
            }
            await this.sync(id, guild, { replace: true, concat: false });
            //]eval this.client.storageManager.tables.guilds._removeAllKeys("stickyRole")
        }
    }

    _createDefault() {
        const settings = this.client.registry.components.filter(c=>c.type === 'setting' && c.resolve === 'GUILD');
        const def = {};
        for(const setting of settings.values()) {
            if(setting.default !== null) {
                const value = typeof setting.default === 'object' 
                    ? setting.default 
                    : { value: setting.default };
                def[setting.index] = value;
            }
        }
        return def;
    }

}

module.exports = Guilds;