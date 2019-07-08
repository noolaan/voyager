const Infraction = require('../interfaces/Infraction.js');

class Vcunmute extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'VCUNMUTE',
            targetType: 'user',
            executor: options.executor.user,
            target: options.target.user,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            color: 0xc573d1,
            dictionary: {
                past: 'voice-unmuted',
                present: 'voice-unmute'
            }
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.member = options.target;

    }

    async parse() {

        const id = `${this.guild.id}-${this.member.id}`;
        const existing = this.moderationManager.expirations2.get(id);

        if(!this.member.voice.serverMute && (!existing || existing.type !== 'VCMUTE')) {
            return this._fail("they aren't muted");
        }

        if(existing && existing.type === 'VCUNMUTE') {
            return this._fail("they are in queue to be unmuted");
        }

        if(this.member.voice.channelID) {
            try {
                this.member.voice.setMute(false, this._reason);
            } catch(e) {
                return this._fail("they were unable to be unmuted");
            }
        } else {
            if(existing && existing.type === 'VCMUTE') {
                this.moderationManager.expirations2.delete(id);
                this.client.storageManager.tables.expirations.delete(id);
            } else {
                await this.client.storageManager.tables.expirations._addExpiration({
                    type: 'VCUNMUTE',
                    guild: this.guild.id,
                    member: this.member.id,
                    expiration: this.expiration,
                    id
                }, this.guild, true);
            }
        }

        return this._succeed();

    }

}

module.exports = Vcunmute;