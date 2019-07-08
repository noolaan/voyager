const Infraction = require('../interfaces/Infraction.js');

class Vcban extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'VCBAN',
            targetType: 'user',
            executor: options.executor.user,
            target: options.target.user,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            color: 0xc573d1,
            duration: options.duration,
            dictionary: {
                past: 'voice-banned',
                present: 'voice-ban'
            }
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.member = options.target;

    }

    async parse() {

        let counter = 0;
        const voiceChannels = this.guild.channels.filter(c=>c.type === 'voice');
        for(const channel of voiceChannels.values()) {
            if(!channel.permissionsFor(this.member).has('CONNECT')) continue;
            try {
                channel.createOverwrite(this.member, {
                    CONNECT: false
                }, this._reason);
                counter++;
            } catch(e) {} //eslint-disable-line no-empty
        }

        if(!counter) {
            return this._fail("they were not able to connect to any voice-channels to begin with");
        }

        if(this.member.voice.channelID) {
            await this.member.voice.setChannel(null, this._reason);
        }

        return this._succeed();

    }

}

module.exports = Vcban;