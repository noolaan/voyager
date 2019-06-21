const Command = require('../../../interfaces/Command.js');

class ClearBans extends Command {

    constructor(client) {

        super(client, {
            name: 'clearbans',
            module: 'utility',
            description: "Removes all bans from the server.",
            aliases: [
                'clearbeans',
                'cb'
            ],
            guildOnly: true,
            split: 'PLAIN',
            restricted: true,
            clientPermissions: ['BAN_MEMBERS'],
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message) {

        const bans = await message.guild.fetchBans();
        
        for(const ban of bans.keys()) {
            message.guild.members.unban(ban);
        }

        message.respond('', { emoji: 'success' });

    }

}

module.exports = ClearBans;