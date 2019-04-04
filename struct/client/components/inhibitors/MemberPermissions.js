const { Inhibitor } = require('../../interfaces/');
const { stripIndents } = require('common-tags');

class MemberPermissions extends Inhibitor {

    constructor(client) {

        super(client, {
            name: 'memberPermissions',
            priority: 10,
            guarded: true,
            guild: true
        });

    }

    execute(message, command) {
        const missing = message.channel.permissionsFor(message.member).missing(command.memberPermissions);
        if(missing.length > 0) {
            return super._fail(stripIndents`The command **${command.resolveable}** requires you to have permissions to use.
                *Missing: ${missing.join(', ')}*`);
        } else {
            return super._succeed();
        }
    }

}

module.exports = MemberPermissions;