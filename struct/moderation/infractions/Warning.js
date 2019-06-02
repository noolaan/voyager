const Infraction = require('../interfaces/Infraction.js');

class Warning extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'WARN',
            targetType: 'user',
            executor: options.executor.user,
            target: options.target.user,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            color: 0xe8d54e,
            dictionary: {
                past: 'warned',
                present: 'warn'
            }
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.member = options.target;

    }

}

module.exports = Warning;