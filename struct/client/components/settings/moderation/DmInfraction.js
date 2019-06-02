const { Setting } = require('../../../interfaces/');
const emojis = require('../../../../../util/emojis.json');

class DmInfraction extends Setting {

    constructor(client) {

        super(client, {
            name: 'dmInfraction',
            module: 'moderation',
            description: "Determines whether or not infractions will be sent to the target's direct messages.",
            resolve: 'GUILD',
            default: false
        });

    }

    async parse(message, args) {
        if(args === this.default) return await super.reset(message.guild.id);
        const bool = this.client._resolver.boolean(args);
        if(bool === undefined) {
            return {
                error: true,
                message: `You must provide a boolean value. *(true|false)*`
            };
        }
        await super.set(message.guild.id, bool);
        return { error: false, result: bool };
    }

    fields(guild) {
        return [
            {
                name: '》Status',
                value: `${this.current(guild) ? `${emojis.enabled} Enabled` : `${emojis.disabled} Disabled`}`
            }
        ];
    }

    current(guild) {
        return guild._getSetting(this.index).value;
    }

}

module.exports = DmInfraction;