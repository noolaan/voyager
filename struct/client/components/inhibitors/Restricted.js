const { Inhibitor } = require('../../interfaces/');

class Restricted extends Inhibitor {

    constructor(client) {

        super(client, {
            name: 'restricted',
            priority: 10,
            guarded: true
        });

    }

    execute(message, command) {
        if(command.restricted && message.author.id !== this.client._options.bot.owner) {
            return super._fail(`The command **${command.moduleResolveable}** can only be run by developers.`);
        } else {
            return super._succeed();
        }
    }

}

module.exports = Restricted;