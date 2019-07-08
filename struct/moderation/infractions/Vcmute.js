const Infraction = require('../interfaces/Infraction.js');

class Vcmute extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'VCMUTE',
            targetType: 'user',
            executor: options.executor.user,
            target: options.target.user,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            color: 0xc573d1,
            duration: options.duration,
            dictionary: {
                past: 'voice-muted',
                present: 'voice-mute'
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

        if(this.member.voice.serverMute && (!existing || existing.type !== 'VCUNMUTE')) {
            return this._fail("they are already muted");
        }

        if(this.member.voice.channelID) {
            try {
                await this.member.voice.setMute(true, this._reason);
            } catch(e) {
                return this._fail("they were unable to be muted");
            }
        } else {
            if(existing && existing.type === 'VCUNMUTE') {
                this.moderationManager.expirations2.delete(id);
                this.client.storageManager.tables.expirations.delete(id);
            } else {
                await this.client.storageManager.tables.expirations._addExpiration({
                    type: 'VCMUTE',
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

module.exports = Vcmute;