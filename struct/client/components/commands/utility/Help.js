const { stripIndents } = require('common-tags');

const { Command, Flag } = require('../../../interfaces/');

class Help extends Command {

    constructor(client) {

        super(client, {
            name: 'help',
            module: 'utility',
            description: "Provides information about commands.",
            usage: "[command-name]",
            settings: ['guild'],
            flags: [
                new Flag(client, {
                    name: 'all',
                    description: "Shows all of the commands."
                })
            ]
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message, { flags, args, settings }) {

        let embed;

        if(args) embed = await this._displayComponent(message, args, settings);
        else embed = await this._displayAll(message, settings, Boolean(flags['all']));

        return message.respond(embed);

    }

    async _displayComponent(message, args) {
        
        const component = this.client._resolver.components(args, 'command', false)[0];
        if(!component) {
            return message.respond(`Unable to find a command matching those arguments.` , { emoji: 'failure' });
        }

        const fields = [];
        const prefix = message.guild
            ? message.guild._getSetting('prefix').value
            : this.client._options.bot.prefix;

        if(component.examples.length > 0) fields.push({
            name: "》Examples",
            value: `${component.examples.map(e=>`\`${prefix}${component.name} ${e}\``).join('\n')}`
        });

        if(component.aliases.length > 0) fields.push({
            name: "》Aliases",
            value: component.aliases.join(', ')
        });

        if(component.flags.length > 0) fields.push({
            name: "》Flags",
            value: `${component.flags.map(f=>`${f.id}: ${f.description || 'N/A'}`).join('\n')}`
        });

        return {
            embed: {
                author: {
                    name: `${component.id}${component.module ? ` (${component.module.resolveable})` : ''}`,
                    icon_url: this.client.user.displayAvatarURL()
                },
                description: stripIndents`${component.usage ? `\`${prefix}${component.name} ${component.usage}\`` : ''}
                    ${component.description} ${component.guildOnly ? '(guild-only)' : ''}`,
                fields,
                footer: {
                    text: component.flags.length > 0 ? `◉ Use "${prefix}tag flags" to learn more about flags. (TBD)` : ''
                }
            }
        };

    }

    async _displayAll(message, settings, all) {

        const prefix = message.guild
            ? message.guild._getSetting('prefix').value
            : this.client._options.bot.prefix;

        const fields = [];
        const sorted = this.client.registry.components
            .filter(c=>c.type === 'module')
            .sort((a, b) => b.components.size - a.components.size);

        for(const module of sorted.values()) {
            let field = {
                name: module.id,
                value: '',
                inline: true
            };
            for(const command of module.components.values()) {
                if((command.restricted && !all) || command.type !== 'command') continue;
                field.value += `\`${command.name}\`\n`;
            }
            if(field.value) fields.push(field);
        }

        return {
            embed: {
                author: {
                    name: `Voyager Commands`,
                    icon_url: this.client.user.displayAvatarURL()
                },
                description: stripIndents`To use a command, use \`${prefix}<command>\` or \`@${this.client.user.tag} <command>\`.
    
                    Use \`${prefix}help <command>\` to view a description on the command.
                    Use \`${prefix}help\` to view all of the commands.`,
                fields
            }
        };

    }

}

module.exports = Help;