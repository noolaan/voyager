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

        _getSetting(i) {
            if(!this._settings) {
                this.client.logger.error(`Settings were not fetched while accessing <Guild>._getSetting method.`);
                return null;
            }

            const setting = this.client.registry.components.get(`setting:${i}`);
            if(!setting) {
                this.client.logger.error(`Invalid setting resolveable fetch using <Guild>._getSetting.`);
                return null;
            }

            if(!this._settings[i]) {
                const value = setting.default;
                let data = null;

                if(typeof def === 'string' || typeof value === 'boolean') {
                    data = {
                        [i]: {
                            value
                        }
                    };
                } else {
                    data = {
                        [i]: value
                    };
                }
                this._settings = { ...this._settings, ...data };
                this.client.storageManager.tables.guilds.update(this.id, { settings: this._settings });
            }
            return this._settings[i];
        }

        get prefix() {
            return this._getSetting('prefix').value 
                || this.client._options.bot.prefix;
        }

    }

    return VoyagerGuild;

});

module.exports = Guild;