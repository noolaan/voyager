const { Inhibitor } = require('../../interfaces/');

class Premium extends Inhibitor {

    constructor(client) {

        super(client, {
            name: 'premium',
            priority: 1,
            guarded: true
        });

    }

    execute(message, command) {
        if(command.premium && !message.guild.getSetting('premium').value) {
            return super._fail(`The command **${command.moduleResolveable}** can only be run in premium servers.`);
        } else {
            return super._succeed();
        }
    }

}

module.exports = Premium;