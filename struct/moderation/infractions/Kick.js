const Infraction = require('../interfaces/Infraction.js');

class Kick extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'KICK',
            targetType: 'user',
            executor: options.executor.user,
            target: options.target.user,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            color: 0xe8a96b,
            dictionary: {
                past: 'kicked',
                present: 'kick'
            }
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.member = options.target;

    }

    async parse() {

        if(!this.member.kickable) {
            return this._fail("they are unable to be kicked");
        }

        if(this.guild._getSetting("dmInfraction").value) {
            await this.resolve({ dm: true });
        }

        try {
            await this.member.kick(this._reason);
        } catch(error) {
            return this._fail("An error occured.", true);
        }

        return this._succeed();
    }

}

module.exports = Kick;