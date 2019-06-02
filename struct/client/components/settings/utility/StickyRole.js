const { Setting } = require('../../../interfaces/');

class StickyRole extends Setting {

    constructor(client) {

        super(client, {
            name: 'stickyRole',
            module: 'utility',
            description: "Roles that will be granted back to the user if they leave and rejoin the guild. The muted role will be automatically assigned to this setting.",
            resolve: 'GUILD',
            usage: '',
            aliases: [
                'stickRole'
            ],
            default: {
                roles: []
            }
        });

    }

    async parse(message, args) {
        if(args === this.default) return await super.reset(message.guild.id);

        let roleIds = message.guild._getSetting(this.index).roles;
        let availableRoles = message.guild.roles.map(r=>r.name.toLowerCase());

        let currentRoles = [];
        for(let role of roleIds) {
            role = message.guild.roles.get(role);
            if(!role) continue;
            currentRoles.push(role.name.toLowerCase());
        }

        const list = this.client._resolver.list(currentRoles, availableRoles, args.split(' '));
        if(!list || list.method === 'list') return {
            error: true,
            message: `Unable to parse list method, please use either \`add\` or \`remove\`.`
        };

        let newSettings = message.guild._getSetting(this.index);
        let ids = [];
        for(let item of list.list) {
            const role = message.guild.roles.find(r=>r.name.toLowerCase() === item.toLowerCase());
            if(!role) continue;
            ids.push(role.id);
        }
        newSettings.roles = ids; 

        if(list.changed.length === 0) {
            message.respond(`Was not able to ${list.method} any items from the list.`, { 
                emoji: 'failure' 
            });
        } else if(list.method === 'add') {
            message.respond(`Successfully added \`[ ${list.changed.join(', ')} ]\` to **${this.name}**.`, {
                emoji: 'success'
            });
        } else if(list.method === 'remove') {
            message.respond(`Successfully removed \`[ ${list.changed.join(', ')} ]\` from **${this.name}**.`, {
                emoji: 'success'
            });
        }

        await super.set(message.guild.id, newSettings);
        return { error: false, ignore: true };
    }

    fields(guild) {
        let roleNames = [];
        for(const role of this.current(guild)) {
            if(guild.roles.has(role)) roleNames.push(guild.roles.get(role).name);
        }

        return [
            {
                name: '》Roles',
                value: `\`${this.current(guild).length > 0 ? `${roleNames.map(r=>`\`${r}\``).join(', ')}` : 'N/A'}\``
            }
        ];
    }

    current(guild) {
        return guild._getSetting(this.index).roles;
    }

}

module.exports = StickyRole;