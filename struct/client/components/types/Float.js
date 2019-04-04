const Type = require('../../interfaces/Type.js');

class Float extends Type {

    constructor() {

        super({
            name: 'float',
            prompt: {
                start: "Please input a valid float value. (decimal-number)",
                retry: "That's not a valid float value, try again. (decimal-number)"     
            }
        });

    }

    parse(input) {
        const float = parseInt(input);
        if(Number.isNaN(float)) return super.fail();
        return super.succeed(float);
    }
    
}

module.exports = Float;