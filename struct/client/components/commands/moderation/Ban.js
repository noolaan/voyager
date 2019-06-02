const { Command } = require('../../../interfaces/');
const { Ban } = require('../../../../moderation/infractions/');

class BanCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'ban',
            module: 'moderation',
            description: "Bans provided members for a specified amount of time.",
            usage: "<member..> [duration] [reason]",
            split: 'PLAIN',
            settings: ['guild'],
            clientPermissions: ['BAN_MEMBERS'],
            memberPermissions: ['BAN_MEMBERS'],
            examples: [
                "@nolan#6801 @voyager#1512 30m spamming"
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

        const duration = this.client._resolver.duration(parameters.split(' ')[0]);

        if(duration) {

            parameters = parameters.split(' ').slice(1).join(' ');

            if(duration < 36e5) {
                return message.respond(`The duration cannot be less than one hour long, try something longer.`, {
                    emoji: 'failure'
                });
            }
    
            if(duration > 2629e6) {
                return message.respond(`The duration cannot be longer than one month, try something shorter.`, {
                    emoji: 'failure'
                });
            }

        }

        return await this.client.moderationManager
            .handleInfraction(Ban, message, { 
                targets: members, 
                parameters,
                duration
            });

    }

}

module.exports = BanCommand;