const { Setting } = require('../../../interfaces/');
const emojis = require('../../../../../util/emojis.json');

class AttachmentCache extends Setting {

    constructor(client) {

        super(client, {
            name: 'attachmentCache',
            module: 'utility',
            description: "Toggle automatic attachment caching from your messages. This can only be utilized in premium servers, and would allow your deleted images to be logged.",
            resolve: 'USER',
            default: true
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
        await super.set(message.author.id, bool);
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
    
    current(settings) {
        return settings.value;
    }
    
}

module.exports = AttachmentCache;