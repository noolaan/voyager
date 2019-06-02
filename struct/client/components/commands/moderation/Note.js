const { Command } = require('../../../interfaces/');
const { Note } = require('../../../../moderation/infractions/');

class NoteCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'note',
            module: 'moderation',
            description: "Notes provided members, used primarily for storing information about a user. Will be displayed when viewing moderation history.",
            usage: "<member..> [note]",
            split: 'PLAIN',
            settings: ['guild'],
            memberPermissions: ['MANAGE_MESSAGES'],
            examples: [
                "@nolan#6801 @voyager#1512 is an elite hacker"
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
            .handleInfraction(Note, message, { 
                targets: members, 
                parameters
            });

    }

}

module.exports = NoteCommand;