const { Setting } = require('../../../interfaces/');
const emojis = require('../../../../../util/emojis.json');

class AttachmentCache extends Setting {

    constructor(client) {

        super(client, {
            name: 'attachmentCache',
            module: 'utility',
            description: "Toggle automatic attachment caching from your messages. This can only be utilized in premium servers, and would allow your deleted images to be logged.",
            resolve: 'USER',
            default: {
                value: true
            }
        });

    }

    async parse(message, args) {
        if(args === this.default) return await super.reset(message.author.id);
        const bool = this.client._resolver.boolean(args);
        if(bool === undefined) {
            return {
                error: true,
                message: `You must provide a boolean value. *(true|false)*`
            };
        }
        await super.set(message.author.id, bool);
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

module.exports = AttachmentCache;