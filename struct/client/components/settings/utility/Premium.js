const { Setting } = require('../../../interfaces/');
const emojis = require('../../../../../util/emojis.json');

class Premium extends Setting {

    constructor(client) {

        super(client, {
            name: 'premium',
            module: 'utility',
            description: "Determines if your guild is premium.",
            restricted: true,
            resolve: 'GUILD',
            default: false
        });

    }

    async parse(message, args) {
        if(args === this.default) return await super.reset(message);
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

    fields(index) {
        return [
            {
                name: '》Status',
                value: `${this.current(index) ? `${emojis.enabled} Enabled` : `${emojis.disabled} Disabled`}`
            }
        ];
    }

    current(index) {
        return index.value;
    }

}

module.exports = Premium;