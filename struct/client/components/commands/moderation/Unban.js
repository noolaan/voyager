const { Command } = require('../../../interfaces/');
const { Unban } = require('../../../../moderation/infractions/');

class UnbanCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'unban',
            module: 'moderation',
            description: "Unbans provided members.",
            usage: "<member..> [reason]",
            split: 'PLAIN',
            settings: ['guild'],
            clientPermissions: ['BAN_MEMBERS'],
            memberPermissions: ['BAN_MEMBERS'],
            examples: [
                "@nolan#6801 @voyager#1512 he apologized"
            ],
            guildOnly: true
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message, { args }) {
        
        let { parameters, members } = await this.client._resolver.members(args, message.guild);
        if(members.length === 0) {
            return message.respond(`Unable to find users with the provided arguments.`, {
                emoji: 'failure'
            });
        }

        return await this.client.moderationManager
            .handleInfraction(Unban, message, { 
                targets: members, 
                parameters
            });

    }

}

module.exports = UnbanCommand;