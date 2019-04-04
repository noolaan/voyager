const { stripIndents } = require('common-tags');

const { Command, Flag } = require('../../../interfaces/');

class Settings extends Command {

    constructor(client) {

        super(client, {
            name: 'blah',
            module: 'utility',
            description: "View or change your guild's settings.",
            usage: "[setting-name] [value..]",
            memberPermissions: ['ADMINISTRATOR'],
            split: 'PLAIN',
            examples: [
                "current",
                "prefix !"
            ],
            flags: [
                new Flag(client, {
                    name: 'guild',
                    description: "View or change guild settings.",
                    default: true
                }),
                new Flag(client, {
                    name: 'user',
                    description: "View or change user settings."
                })
            ],
            disabled: true
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message, { flags, args, settings }) {

        const type = flags.user ? 'USER' : 'GUILD';

        if(!args[0]) {
            const embed = this._settingsEmbed(message, type, settings);
            return message.respond(embed);
        }
    
        if(args[0].toLowerCase() === 'current') {
            const embed = this._currentEmbed(message, type, settings);
            return message.respond(embed);
        }
        
        const setting = this.client._resolver.components(args[0], 'setting', false)[0];
        if(!setting) {
            return message.respond(`Unable to find a setting named: \`${args[0]}\`, try again.`, { 
                emoji: 'failure' 
            });
        }

        const params = args.slice(1).join(' ').toLowerCase() || '';
        if(!params) {
            const embed = this._settingEmbed(message, setting, settings);
            return message.respond(embed);
        }

        const index = setting.resolve === 'GUILD' ? settings.guild : settings.user;
        if(!message.guild && setting.resolve === 'GUILD') {
            return message.respond(`The setting **${setting.resolveable}** can only be configured in guilds.`, { emoji: 'failure' });
        }

        if(setting.restricted && this.client._options.bot.owner !== message.author.id) {
            return message.respond(`The setting **${setting.resolveable}** can only be managed by developers.`);
        }

        let reset = false;
        if(params === "reset") reset = true;

        const response = await setting.parse(message, params, index, reset);

    }

    _settingEmbed(message, setting, { guild, user }) {

        const value = setting.resolve === 'GUILD'
            ? setting.current(guild[setting.name]) || 'N/A'
            : setting.current(user[setting.name]) || 'N/A';

        const fields = [];
        if(setting.resolve === 'GUILD' && message.guild) fields.push({
            name: `》Current Value`,
            value: `= \`${value}\``
        });

        return {
            embed: {
                author: {
                    name: `${setting.name} (${setting.module.resolveable})`,
                    icon_url: this.client.user.displayAvatarURL()
                },
                description: `${setting.description}`,
                fields
            }
        };

    }

    _currentEmbed(message, type, { guild, user })  {

        const settings = type === 'GUILD'
            ? guild
            : user;

        const fields = [];
        const modules = [ ...new Set(Object.keys(settings).map((s) => {
            return this.client.registry.components.get(`setting:${s}`).module.name;
        }))];

        for(const name of modules) {
            const module = this.client.registry.components.get(`module:${name}`);
            const field = {
                name,
                value: '',
                inline: true
            };
            for(const component of module.components.values()) {
                if(component.type !== 'setting' || !settings[component.name]) continue;
                field.value += `**》${component.name}** - \`${component.current(settings[component.name])}\`\n`;
            }
            fields.push(field);
        }

        return {
            embed: {
                author: {
                    name: `${type === 'GUILD' ? message.guild.name : message.author.username}'s Settings`,
                    icon_url: type === 'GUILD' ? message.guild.iconURL() : message.author.avatarURL()
                },
                fields
            }
        };
        
    }

    _settingsEmbed(message, type, settings) {

        const prefix = settings.guild.prefix.value
            || this.client._options.bot.prefix;

        const fields = [];
        const sorted = this.client.registry.components
            .filter(c=>c.type === 'module')
            .sort((a, b) => {
                const filter = c=>c.type === 'setting';
                return b.components.filter(filter) - a.components.filter(filter);
            });

        for(const module of sorted.values()) {
            let field = {
                name: module.id,
                value: '',
                inline: true
            };

            for(const setting of module.components.values()) {
                if(setting.type !== 'setting' || setting.resolve !== type) continue;
                field.value += `\`${setting.name}\`\n`;
            }
            fields.push(field);
        }

        return {
            embed: {
                author: {
                    name: `${type === 'GUILD' ? 'Guild' : 'User'} Settings`,
                    icon_url: type === 'GUILD' ? message.guild.iconURL() : message.author.avatarURL()
                },
                description: stripIndents`To view your ${type === 'GUILD' ? "guild's " : ''}settings, use \`${prefix}settings current ${type === 'USER' ? '-u' : ''}\`.
                
                Use \`${prefix}setting [setting-name]\` to view a description on the setting.
                Each setting is unique, so make sure to read carefully.`,
                fields
            }
        };

    }

}

module.exports = Settings;