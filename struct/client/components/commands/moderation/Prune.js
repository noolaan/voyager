const { Command, Flag } = require('../../../interfaces/');
const { Prune } = require('../../../../moderation/infractions/');

class PruneCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'prune',
            module: 'moderation',
            description: "Deletes specified messages, configurable using flags.",
            usage: "<amount> [channel..] [reason]",
            split: 'PLAIN',
            settings: ['guild'],
            clientPermissions: ['MANAGE_MESSAGES'],
            memberPermissions: ['MANAGE_MESSAGES'],
            aliases: [
                'purge'
            ],
            examples: [
                "50 spam -u nolan#6801 voyager#1512"
            ],
            flags: [
                new Flag(client, {
                    name: 'users',
                    description: "Deletes messages from specified users.",
                    arguments: true,
                    required: true,
                    continue: true,
                    func: async (msg, guild) => {
                        const resolve = await this.client._resolver.members(msg.split(' '), guild);
                        if(resolve.members) return { error: false, result: resolve.members };
                        else return { error: true };
                    },
                    prompt: {
                        start: "Please provide user resolveables.",
                        retry: "Unable to find a user specified using those arguments."
                    }
                }),
                new Flag(client, {
                    name: 'content',
                    description: "Deletes messages from provided context.",
                    arguments: true,
                    required: true,
                    continue: true,
                    type: 'STRING'
                }),
                new Flag(client, {
                    name: 'attachments',
                    description: "Deletes messages that contain attachments."
                }),
                new Flag(client, {
                    name: 'bots',
                    description: "Deletes messages from bots.",
                }),
                new Flag(client, {
                    name: 'method',
                    description: "Filter messages using 'and' or 'or' conditionals.",
                    default: 'OR',
                    func: (msg) => {
                        if(['and', 'or'].includes(msg.toLowerCase())) return { error: false, result: msg.toLowerCase() };
                        else return { error: true };
                    },
                    prompt: {
                        start: "Please provide either `AND` or `OR`.",
                        retry: "That's not a valid method, try using `AND` or `OR`."
                    },
                    arguments: true
                })
            ],
            guildOnly: true
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message, { args, flags }) {

        if(!args[0]) {
            return message.respond("Provide an integer for the amount of messages to delete.", {
                emoji: 'failure'
            });
        }
        const amount = parseInt(args[0]);
        if(Number.isNaN(amount)) {
            return message.respond("The amount must be a valid integer.", {
                emoji: 'failure'
            });
        }

        if(amount < 2) {
            return message.respond("The amount must be more than 1 message.", {
                emoji: 'failure'
            });
        }
    
        if(amount > 51) {
            return message.respond(`The amount must be less than 50 messages.`, {
                emoji: 'failure'
            });
        }

        let { channels, parameters } = await this.client._resolver.channels(args.slice(1, args.length), message.guild);
        if(channels.length === 0) channels = [ message.channel ];

        return await this.client.moderationManager
            .handleInfraction(Prune, message, { 
                targets: channels,
                parameters,
                flags,
                data: {
                    amount
                }
            });

    }

}

module.exports = PruneCommand;