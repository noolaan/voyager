const { Structures } = require('discord.js');

const User = Structures.extend('User', (User) => {

    class VoyagerUser extends User {

        constructor(...args) {

            super(...args);

            this.storageManager = this.client.storageManager;
            this._settings = null;

        }

        async settings() {
            if(!this._settings) this._settings = this.storageManager.tables.users.grab(this);
            if(this._settings instanceof Promise) this._settings = await this._settings;
            return this._settings;
        }

    }

    return VoyagerUser;

});

module.exports = User;