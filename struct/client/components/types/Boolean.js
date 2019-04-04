const Type = require('../../interfaces/Type.js');

class Boolean extends Type {

    constructor() {

        super({
            name: 'boolean',
            prompt: {
                start: "Please input a boolean value. (__t__rue, __f__alse)",
                retry: "That's not a valid boolean value, try again. (__t__rue, __f__alse)"     
            }
        });

        this.truthy = ['yes', 'y', 'true', 't', 'on', 'enable'];
        this.falsey = ['no', 'n', 'false', 'f', 'off', 'disable'];

    }

    parse(input) {
        if(typeof input === 'boolean') return super.succeed(input);

        if(typeof input === 'string') input = input.toLowerCase();
        if(this.truthy.includes(input)) return super.succeed(true);
        if(this.falsey.includes(input)) return super.succeed(false);
        return super.fail();
    }
    
}

module.exports = Boolean;