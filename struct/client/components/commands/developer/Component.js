const { Command, Flag } = require('../../../interfaces/');

class ComponentCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'component',
            module: 'developer',
            aliases: [
                'comp'
            ],
            usage: "<load|unload|reload|disable|enable> <component>",
            description: "Changes the state of a component.",
            restricted: true,
            guarded: true,
            flags: [
                new Flag(client, {
                    name: 'force',
                    description: "Forces the component's state to be changed."
                })
            ]
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message, { flags, args }) {
        
        const states = ['load', 'unload', 'reload', 'disable', 'enable'];


    }

}

module.exports = ComponentCommand;
