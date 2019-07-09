const { Command } = require('../../../interfaces/');

class Statistics extends Command {

    constructor(client) {

        super(client, {
            name: 'statistics',
            module: 'developer',
            description: "Shows statistics of the bot.",
            aliases: [
                'stats'
            ]
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message) {

        const attachmentData = await this.client.storageManager.tables.attachments.data();

        const embed = {
            author: {
                name: "Voyager Statistics",
                icon_url: this.client.user.displayAvatarURL()
            },
            fields: [
                {
                    name: 'Guilds',
                    value: this.client.guilds.size,
                    inline: true
                },
                {
                    name: 'Memory Usage',
                    value: `${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`,
                    inline: true
                },
                {
                    name: 'Attachment Data',
                    value: `${(attachmentData/1024/1024).toFixed(1)}MB`,
                    inline: true
                },
                {
                    name: 'Client Uptime',
                    value: duration(this.client.uptime),
                    inline: true
                },
                {
                    name: 'Server Uptime',
                    value: duration(require('os').uptime()*1000),
                    inline: true
                },
                {
                    name: 'Discord Library',
                    value: `discordjs-${require('discord.js').version}`,
                    inline: true
                }
            ]
        };

        message.respond({ embed });

    }

}

module.exports = Statistics;

const duration = (ms) => {
    let s, m, h, d;
    s = Math.floor(ms/1000);
    m = Math.floor(s/60);
    s = s % 60;
    h = Math.floor(m/60);
    m = m % 60;
    d = Math.floor(h/24);
    h = h % 24;
    return `${d ? `${d}d` : ''}${h ? `${h}h` : ''}${m ? `${m}m` : ''}${s ? `${s}s` : ''}`;
};