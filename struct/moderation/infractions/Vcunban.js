const Infraction = require('../interfaces/Infraction.js');

class Vcunban extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'VCUNBAN',
            targetType: 'user',
            executor: options.executor.user,
            target: options.target.user,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            color: 0xc573d1,
            dictionary: {
                past: 'voice-unbanned',
                present: 'voice-unban'
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
            const permission = channel.permissionOverwrites.get(this.member.id);
            if(!permission || permission.deny.bitfield !== 1048576) continue;
            permission.delete(this._reason);
            counter++;
        }

        if(!counter) {
            return this._fail("they were able to connect to all channels.");
        }

        return this._succeed();

    }

}

module.exports = Vcunban;