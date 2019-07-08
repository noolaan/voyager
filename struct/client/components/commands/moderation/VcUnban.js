const { Command } = require('../../../interfaces/');
const { Vcunban } = require('../../../../moderation/infractions/');

class VcUnbanCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'vcunban',
            module: 'moderation',
            description: "Unbans provided members from all voice-channels if their connection permission is denied.",
            usage: "<member..> [reason]",
            split: 'PLAIN',
            settings: ['guild'],
            clientPermissions: ['MANAGE_CHANNELS'],
            memberPermissions: ['MANAGE_CHANNELS'],
            aliases: [
                'unvcban'
            ],
            examples: [
                "@nolan#6801 @voyager#1512 they apologized"
            ],
            guildOnly: true,
            premium: true
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
            .handleInfraction(Vcunban, message, { 
                targets: members, 
                parameters
            });

    }

}

module.exports = VcUnbanCommand;