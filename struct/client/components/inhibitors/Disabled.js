const { Inhibitor } = require('../../interfaces/');

class Disabled extends Inhibitor {

    constructor(client) {

        super(client, {
            name: 'disabled',
            priority: 9
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    execute(message, command) {

        if(command.disabled && message.author.id !== this.client._options.bot.owner) return super._fail(`The command **${command.resolveable}** is currently disabled.`);
        else return super._succeed();

    }

}

module.exports = Disabled;
