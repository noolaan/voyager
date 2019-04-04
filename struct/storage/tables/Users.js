const { Table } = require('../interfaces/');

class Users extends Table {

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

        this.defaultUser = null;

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
        if(!this.client.users.has(key)) await this.client.users.fetch(key);
        const user = this.client.users.get(key);

        let settings = user.settings();
        settings = {
            ...settings,
            ...data
        };
        user._settings = settings;
        return await this.update(key, { settings });
    }

    async grab(user) {
        const data = await this.get(user.id);
        if(!data) {
            return (await this._createUser(user)).settings;
        } else {
            return data.settings;
        }
    }

    async _createUser(user) {
        if(!this.defaultUser) this.defaultUser = this._createDefault();
        const info = { 
            id: user.id,
            settings: this.defaultUser
        };

        this._log(`Created user: ${user.tag} (${user.id})`);
        await this.set(user.id, info);
        return info;
    }

    // async _deleteGuild(guild) {
    //     this._log(`Deleted guild: ${guild.name} (${guild.id})`);
    //     await this.delete(guild.id);
    //     return guild.id;
    // }

    _createDefault() {
        const settings = this.client.registry.components.filter(c=>c.type === 'setting' && c.resolve === 'USER');
        const def = {};
        for(const setting of settings.values()) {
            if(setting.default !== null) {
                def[setting.index] = {
                    value: setting.default
                };
            }
        }
        return def;
    }

}

module.exports = Users;