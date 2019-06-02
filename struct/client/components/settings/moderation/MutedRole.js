const { Setting } = require('../../../interfaces/');
const MaxCharacters = 98;

class MutedRole extends Setting {

    constructor(client) {

        super(client, {
            name: 'mutedRole',
            module: 'moderation',
            description: "Creates a muted role for your guild, used with the mute command.",
            resolve: 'GUILD',
            default: {
                value: null
            }
        });

    }

    async parse(message, args) {
        if(args === this.default) return await super.reset(message.guild.id);
        if(args.length > MaxCharacters) return { 
            error: true,
            message: `Your role name must be less than ${MaxCharacters} characters.`
        };

        let role;
        try {
            role = await message.guild.roles.create({
                data: {
                    name: args,
                    color: 'RED'
                },
                reason: this.reason(message)
            });
        } catch(error) {
            return {
                error: true,
                message: "An error occured while creating the muted role."
            };
        }

        const channels = message.guild.channels.filter(c=>c.type === 'text');
        for(const channel of channels.values()) {
            try {
                await channel.createOverwrite(role, {
                    SEND_MESSAGES: false,
                    ADD_REACTIONS: false
                }, this.reason(message));
            } catch(err) {} //eslint-disable-line no-empty
        }

        await super.set(message.guild.id, role.id);
        return { error: false, result: args };
    }

    async reset(key) {
        const index = super.parent(key);
        const setting = index._getSetting(this.index); 
        if(setting.value) {
            const role = index.roles.get(setting.value);
            if(role) {
                await role.delete();
            }
        }
        return super.reset(key);
    }

    fields(guild) {
        const role = guild.roles.get(this.current(guild));
        if(!role) this.reset(guild.id);
        return [
            {
                name: '》Role',
                value: `\`${role ? role.name : 'N/A'}\``
            }
        ];
    }

    current(guild) {
        return guild._getSetting(this.index).value;
    }

}

module.exports = MutedRole;