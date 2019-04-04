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

    async sync(key, data) {
        if(!this.client.guilds.has(key)) await this.client.guilds.fetch(key);
        const guild = this.client.guilds.get(key);


        let settings = await guild.settings();
        settings = { 
            ...settings,
            ...data
        };
        guild._settings = settings;
        return await this.update(key, { settings });
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