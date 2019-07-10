const { Command } = require('../../../interfaces/');

class ReloadCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'reload',
            module: 'developer',
            description: "Reloads every component of the bot, potentially dangerous.",
            restricted: true,
            guarded: true
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message) {
        
        const response = await this.client.reload();
        if(response.length === 0) {
            return message.respond("Successfully reloaded all components.", { emoji: 'success' });
        } else {
            return message.respond(`Failed to reload \`${response.length}\` components.`, { emoji: 'failure' });
        }

    }

}

module.exports = ReloadCommand;
