const { Command, Flag } = require('../../../interfaces/');

class AutoModerationCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'automoderation',
            module: 'moderation',
            description: "View and change your auto-moderation settings at ease.",
            usage: "idk",
            split: 'PLAIN',
            settings: ['guild'],
            aliases: [
                'automod'
            ],
            examples: [
                ""
            ],
            flags: [
                
            ]
        });

    }

    async execute(message, { flags, args, settings }) {



    }

}

module.exports = AutoModerationCommand;