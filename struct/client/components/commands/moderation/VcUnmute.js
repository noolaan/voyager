const { Command } = require('../../../interfaces/');
const { Vcunmute } = require('../../../../moderation/infractions/');

class VcUnmuteCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'vcunmute',
            module: 'moderation',
            description: "Unmutes provided members from voice-channels if they're connected to a voice-channel.",
            usage: "<member..> [reason]",
            split: 'PLAIN',
            settings: ['guild'],
            clientPermissions: ['MUTE_MEMBERS'],
            memberPermissions: ['MUTE_MEMBERS'],
            aliases: [
                'unvcmute'
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
            .handleInfraction(Vcunmute, message, { 
                targets: members, 
                parameters
            });

    }

}

module.exports = VcUnmuteCommand;