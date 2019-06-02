const { Command } = require('../../../interfaces/');

class Prefix extends Command {

    constructor(client) {

        super(client, {
            name: 'prefix',
            module: 'utility',
            description: "Displays the prefix for the guild."
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message) {
        const prefix = message.guild.prefix;
        return message.respond(`The prefix for ${prefix === this.client._options.bot.prefix ? 'the bot' : 'the guild'} is \`${prefix}\`.`, {
            emoji: 'loading'
        });
    }

}

module.exports = Prefix;