const Infraction = require('../interfaces/Infraction.js');

class Vckick extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'VCKICK',
            targetType: 'user',
            executor: options.executor.user,
            target: options.target.user,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            color: 0xc573d1,
            dictionary: {
                past: 'voice-kicked',
                present: 'voice-kick'
            }
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.member = options.target;

    }

    async parse() {

        if(!this.member.voice.channel) {
            return this._fail("they are not in a voice-channel");
        }

        try {
            await this.member.voice.setChannel(null, this._reason);
        } catch(error) {
            return this._fail("An error occured.", true);
        }

        return this._succeed();

    }

}

module.exports = Vckick;