const { Inhibitor } = require('../../interfaces/');
const { stripIndents } = require('common-tags');

class ClientPermissions extends Inhibitor {

    constructor(client) {

        super(client, {
            name: 'clientPermissions',
            priority: 11,
            guarded: true,
            guild: true
        });

    }

    execute(message, command) {
        const missing = message.channel.permissionsFor(message.guild.me).missing(command.memberPermissions);
        if(missing.length > 0) {
            return super._fail(stripIndents`The command **${command.resolveable}** requires the bot to have permissions to use.
                *Missing: ${missing.join(', ')}*`);
        } else {
            return super._succeed();
        }
    }

}

module.exports = ClientPermissions;