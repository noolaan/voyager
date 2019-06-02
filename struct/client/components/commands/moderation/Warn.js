const { Command } = require('../../../interfaces/');
const { Warning } = require('../../../../moderation/infractions/');

class Warn extends Command {

    constructor(client) {

        super(client, {
            name: 'warn',
            module: 'moderation',
            description: "Warns provided members.",
            usage: "<member..> [reason]",
            split: 'PLAIN',
            settings: ['guild'],
            memberPermissions: ['MANAGE_MESSAGES'],
            examples: [
                "@nolan#6801 @voyager#1512 breaking the rules"
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
            .handleInfraction(Warning, message, { 
                targets: members, 
                parameters 
            });

    }

}

module.exports = Warn;