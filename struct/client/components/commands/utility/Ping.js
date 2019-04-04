const { Command } = require('../../../interfaces/');

class Ping extends Command {

    constructor(client) {

        super(client, {
            name: 'ping',
            module: 'utility',
            description: "Determines the ping of the bot."
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message) {
        const ping = this.client.ws.ping.toFixed(0);
        return message.respond(`Pong! \`${ping}ms\``, { emoji: 'success' });
    }

}

module.exports = Ping;