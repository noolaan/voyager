const Infraction = require('../interfaces/Infraction.js');

class Unmute extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'UNMUTE',
            targetType: 'user',
            executor: options.executor.user,
            target: options.target.user,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            color: 0x71b7ca,
            dictionary: {
                past: 'unmuted',
                present: 'unmute'
            }
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.member = options.target;

    }

    async parse() {

        const mutedId = this.guild._getSetting('mutedRole').value;
        const role = this.guild.roles.get(mutedId);

        if(!role) {
            const setting = this.client.registry.components.get('setting:mutedRole');
            setting.reset(this.guild.id);
            return this._fail('No muted role created.', true);
        }

        if(!this.member.roles.has(mutedId)) return this._fail('they are not muted');

        try {
            await this.member.roles.remove(mutedId, this._reason);
        } catch(error) {
            this.client.logger.error(`Error occured while unmuting member:\n${error || error.stack}`);
            return this._fail('An error occured.', true);
        }

        await this.client.moderationManager._removeExpiration(this);
        return this._succeed();

    }

}

module.exports = Unmute;