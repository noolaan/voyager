const { stripIndents } = require('common-tags');

const { Command, Flag } = require('../../../interfaces/');

class Settings extends Command {

    constructor(client) {

        super(client, {
            name: 'settings',
            module: 'utility',
            description: "View or change your desired settings for the bot.",
            usage: "[list|view|set|reset] [setting] [value..]",
            split: 'PLAIN',
            settings: ['guild', 'user'],
            aliases: [
                'setting'
            ],
            examples: [
                "list",
                "view prefix",
                "set prefix !",
                "reset prefix"
            ],
            flags: [
                new Flag(client, {
                    name: 'guild',
                    description: "View guild settings.",
                    default: true
                }),
                new Flag(client, {
                    name: 'user',
                    description: "View user settings."
                }),
                new Flag(client, {
                    name: 'all',
                    description: "View all settings."
                })
            ]
        });

    }

    async execute(message, { flags, args, settings }) {
        
        const types = ['list', 'view', 'set', 'reset'];
        const type = args[0] ? args[0].toLowerCase() : 'list';

        if(!types.includes(type)) {
            return message.respond(`Invalid action, use the arguments: ${types.map(t=>`\`${t}\``).join(', ')}.`, {
                emoji: 'failure'
            });
        }

        const prefix = message.guild
            ? settings.guild.prefix.value 
            : this.client._options.bot.prefix;

        if(type === 'list') {
            const embed = this._settingsEmbed(message, flags.user ? 'USER' : 'GUILD', settings, flags.all);
            return message.respond(embed);
        } else {
            if(!args[1]) {
                return message.respond(`This action requires a setting to be provided. For a list of settings, use the command \`${prefix}setting list\`.`, { 
                    emoji: 'failure' 
                });
            }
            const setting = this.client._resolver.components(args[1], 'setting', false)[0];
            if(!setting) {
                return message.respond(`Unable to find a setting named: \`${args[1]}\`, try again.`, {
                    emoji: 'failure'
                });
            }

            if(!message.guild && setting.resolve === 'GUILD') {
                return message.respond(`You can only configure this setting in guilds.`, {
                    emoji: 'failure'
                });
            }
            
            if(type === 'view') {
                const embed = this._settingEmbed(message, setting, settings);
                return message.respond(embed);
            } else {
                if(!message.guild && setting.resolve === 'GUILD') {
                    return message.respond(`The setting **${setting.resolveable}** can only be configured in guilds.`, {
                        emoji: 'failure'
                    });
                }
                if(setting.restricted && this.client._options.bot.owner !== message.author.id) {
                    return message.respond(`The setting **${setting.resolveable}** can only be managed by developers.`, {
                        emoji: 'failure'
                    });
                }
                if(setting.resolve === 'GUILD' && !message.member.permissions.has('ADMINISTRATOR')) {
                    return message.respond(`You're required to have administrator privileges to edit guild settings.`, {
                        emoji: 'failure'
                    });
                }
                const params = args.slice(2).join(' ').toLowerCase() || '';
                if(type === 'set') {
                    const response = await setting.parse(message, params, settings);
                    if(response.ignore) return undefined;
                    if(response.error) {
                        return message.respond(`${response.message} **\`[${setting.resolveable}]\`**`, {
                            emoji: 'failure'
                        });
                    } else {
                        return message.respond(`Successfully set the setting **${setting.name}${response.child ? `:${response.child}` : ''}** to \`${response.result}\`.`, {
                            emoji: 'success'
                        });
                    }
                } else if(type === 'reset') {
                    return await setting.reset(message, settings);
                }
            }

        }

    }

    _settingsEmbed(message, type, settings, all) {

        if(!message.guild && type === 'GUILD') type = 'USER';

        const prefix = message.guild 
            ? settings.guild.prefix.value
            : this.client._options.bot.prefix;

        let fields = [];
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
                if(setting.type !== 'setting' 
                    || (setting.resolve !== type && !all)
                    || (setting.restricted && !all)) continue;
                field.value += `\`${setting.name}\`\n`;
            }
            if(field.value) fields.push(field);
        }

        return {
            embed: {
                author: {
                    name: `${type === 'GUILD' ? 'Guild' : 'User'} Settings`,
                    icon_url: type === 'GUILD' ? message.guild.iconURL() : message.author.avatarURL()
                },
                description: stripIndents`Use \`${prefix}setting view [setting-name]\` to view a description on the setting. Each setting is unique, so make sure to read carefully.
                
                    ${type === 'USER' ? '' : `Alternatively, you can view user settings by using the command \`${prefix}setting list -u\`.`}`,
                fields
            }
        };

    }

    _settingEmbed(message, setting, { guild, user }) {

        const index = setting.resolve === 'GUILD'
            ? guild[setting.name]
            : user[setting.name];

        if(!index) {
            //throw some error
        }

        const fields = setting.fields(index);

        return {
            embed: {
                author: {
                    name: `${setting.name} (${setting.module.resolveable})`,
                    icon_url: this.client.user.displayAvatarURL()
                },
                description: stripIndents`${setting.description}${setting.restricted ? ' (developer-only)' : ''}`,
                fields
            }
        };

    }

}

module.exports = Settings;