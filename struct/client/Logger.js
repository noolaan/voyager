const chalk = require('chalk');

class Logger {

    constructor(client) {

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.client.hooker.hook('ready', () => {
            this.transport(`Client connected to ${chalk.bold(this.client.user.tag)} with ${chalk.bold(`${this.client.guilds.size} guild${this.client.guilds.size === 1 ? '' : 's'}`)}.`, { embed: true, type: 'SUCCESS' });
        });

        this.client.hooker.hook('componentUpdate', ({ component, type }) => {
            this.info(`Component ${chalk.bold(component.resolveable)} was ${chalk.bold(Constants.ComponentTypes[type])}.`);
        });

        this.client.hooker.hook('reconnect', () => {
            this.warn(`Shard is reconnecting.`, { embed: true });
        });

    }

    async transport(message = 'N/A', opts = {}) {
        process.send({ message, ...opts });
    }

    /* Quick & Dirty Functions */

    log(message, opts = {}) {
        this.transport(message, { ...opts, type: 'LOG' });
    }

    info(message, opts = {}) {
        this.transport(message, { ...opts, type: 'INFO' });
    }

    warn(message, opts = {}) {
        this.transport(message, { ...opts, type: 'WARN' });
    }

    debug(message, opts = {}) {
        this.transport(message, { ...opts, type: 'DEBUG' });
    }

    error(message, opts = {}) {
        this.transport(message, { ...opts, type: 'ERROR' });
    }

}

module.exports = Logger;

const Constants = {
    ComponentTypes: {
        LOAD: 'loaded',
        UNLOAD: 'unloaded',
        RELOAD: 'reloaded',
        ENABLE: 'enabled',
        DISABLE: 'disabled'
    }
};