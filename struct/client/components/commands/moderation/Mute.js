const { Command } = require('../../../interfaces/');
const { Mute } = require('../../../../moderation/infractions/');

class MuteCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'mute',
            module: 'moderation',
            description: "Mutes provided members for a specified amount of time.",
            usage: "<member..> <duration> [reason]",
            split: 'PLAIN',
            settings: ['guild'],
            clientPermissions: ['MANAGE_ROLES'],
            memberPermissions: ['MANAGE_ROLES'],
            examples: [
                "@nolan#6801 @voyager#1512 30m spamming"
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

        if(!parameters) {
            return message.respond(`You must provide a duration for this command.`, {
                emoji: 'failure'
            });
        }
        const duration = this.client._resolver.duration(parameters.split(' ')[0]);
        if(!duration) {
            return message.respond(`Unable to find a valid duration, use \`${message.guild.prefix}help mute\` for examples.`, {
                emoji: 'failure'
            });
        }

        if(duration < 60000) {
            return message.respond(`The duration cannot be less than one minute long, try something longer.`, {
                emoji: 'failure'
            });
        }

        if(duration > 121e7) {
            return message.respond(`The duration cannot be longer than two weeks, try something shorter.`, {
                emoji: 'failure'
            });
        }

        return await this.client.moderationManager
            .handleInfraction(Mute, message, { 
                targets: members, 
                parameters: parameters.split(' ').slice(1, parameters.length).join(' '),
                duration
            });

    }

}

module.exports = MuteCommand;