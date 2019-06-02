const Infraction = require('../interfaces/Infraction.js');

class Mute extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'MUTE',
            targetType: 'user',
            executor: options.executor.user ? options.executor.user : options.executor,
            target: options.target.user,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            duration: options.duration,
            color: 0x387fbe,
            dictionary: {
                past: 'muted',
                present: 'mute'
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

        if(this.member.roles.has(mutedId)) return this._fail('they are already muted');

        try {
            await this.member.roles.add(mutedId, this._reason);
        } catch(error) {
            this.client.logger.error(`Error occured while muting member:\n${error || error.stack}`);
            return this._fail('An error occured.', true);
        }

        return this._succeed();

    }

}

module.exports = Mute;