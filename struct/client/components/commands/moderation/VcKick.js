const { Command } = require('../../../interfaces/');
const { Vckick } = require('../../../../moderation/infractions/');

class VcKick extends Command {

    constructor(client) {

        super(client, {
            name: 'vckick',
            module: 'moderation',
            description: "Kicks provided members from the voice-channel.",
            usage: "<member..> [reason]",
            split: 'PLAIN',
            settings: ['guild'],
            memberPermissions: ['MOVE_MEMBERS'],
            clientPermissions: ['MOVE_MEMBERS'],
            examples: [
                "@nolan#6801 @voyager#1512 microphone spam"
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
            .handleInfraction(Vckick, message, { 
                targets: members, 
                parameters,
            });

    }

}

module.exports = VcKick;