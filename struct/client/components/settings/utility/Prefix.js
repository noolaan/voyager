const { Setting } = require('../../../interfaces/');
const MaxCharacters = 4;

class Prefix extends Setting {

    constructor(client) {

        super(client, {
            name: 'prefix',
            module: 'utility',
            description: "Changes the command prefix for your server.",
            resolve: 'GUILD',
            default: ']'
        });

    }

    async parse(message, args) {
        if(args === this.default) return await super.reset(message.guild.id);
        if(args.length > MaxCharacters) return { 
            error: true,
            message: `Your guild prefix must be less than ${MaxCharacters} characters.`
        };
        if(args.includes(" ")) return {
            error: true,
            message: `Your guild prefix cannot include spaces.`
        };

        await super.set(message.guild.id, args);
        return { error: false, result: args };
    }

    fields(guild) {
        return [
            {
                name: '》Prefix',
                value: `\`${this.current(guild)}\``
            }
        ];
    }

    current(guild) {
        return guild._getSetting(this.index).value;
    }

}

module.exports = Prefix;