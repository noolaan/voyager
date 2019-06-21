const Command = require('../../../interfaces/Command.js');

class Test extends Command {

    constructor(client) {

        super(client, {
            name: 'test',
            module: 'utility',
            description: "fuck off",
            aliases: [
                't'
            ],
            guildOnly: true,
            split: 'PLAIN',
            restricted: true,
            disabled: true
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message) {

        const logs = await message.guild.fetchAuditLogs({ limit: 10 });
        // console.log(logs.entries.array()[1]);

    }

}

module.exports = Test;