const Infraction = require('../interfaces/Infraction.js');

class Note extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'NOTE',
            targetType: 'user',
            executor: options.executor.user,
            target: options.target.user,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            color: 0x387fbe,
            dictionary: {
                past: 'noted',
                present: 'note'
            }
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.member = options.target;

    }

}

module.exports = Note;