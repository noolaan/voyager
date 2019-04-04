const { Structures } = require('discord.js');

const Guild = Structures.extend('Guild', (Guild) => {

    class VoyagerGuild extends Guild {

        constructor(...args) {

            super(...args);

            this.storageManager = this.client.storageManager;
            this._settings = null;

        }

        async settings() {
            if(!this._settings) this._settings = this.storageManager.tables.guilds.grab(this);
            if(this._settings instanceof Promise) this._settings = await this._settings;
            return this._settings;
        }

    }

    return VoyagerGuild;

});

module.exports = Guild;