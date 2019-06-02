const { Command } = require('../../../interfaces/');
const { Unmute } = require('../../../../moderation/infractions/');

class UnmuteCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'unmute',
            module: 'moderation',
            description: "Unmutes provided members if they're muted.",
            usage: "<member..> [reason]",
            split: 'PLAIN',
            settings: ['guild'],
            clientPermissions: ['MANAGE_ROLES'],
            memberPermissions: ['MANAGE_ROLES'],
            examples: [
                "@nolan#6801 @voyager#1512 they apologized"
            ],
            guildOnly: true
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message, { args }) {
        
        const { parameters, members } = await this.client._resolver.members(args, message.guild);
        if(members.length === 0) {
            return message.respond(`Unable to find users with the provided arguments.`, {
                emoji: 'failure'
            });
        }

        return await this.client.moderationManager
            .handleInfraction(Unmute, message, { 
                targets: members, 
                parameters
            });

    }

}

module.exports = UnmuteCommand;