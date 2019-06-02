const { Inhibitor } = require('../../interfaces/');

class GuildOnly extends Inhibitor {

    constructor(client) {

        super(client, {
            name: 'guildOnly',
            priority: 12,
            guarded: true
        });

    }

    execute(message, command) {
        if(command.guildOnly && !message.guild) {
            return super._fail(`The command **${command.moduleResolveable}** can only be run in servers.`);
        } else {
            return super._succeed();
        }
    }

}

module.exports = GuildOnly;