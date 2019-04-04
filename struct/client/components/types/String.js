const Type = require('../../interfaces/Type.js');

class String extends Type {

    constructor() {

        super({
            name: 'string',
            prompt: {
                start: "Please input a valid string.",
                retry: "That's not a valid string, try again."     
            }
        });

    }

    parse(input) {
        return super.succeed(`${input}`);
    }
    
}

module.exports = String;