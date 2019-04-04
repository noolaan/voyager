const Type = require('../../interfaces/Type.js');

class Integer extends Type {

    constructor() {

        super({
            name: 'integer',
            prompt: {
                start: "Please input a valid integer. (whole-number)",
                retry: "That's not a valid integer, try again. (whole-number)"     
            }
        });

    }

    parse(input) {
        const int = parseInt(input);
        if(Number.isNaN(int)) return super.fail();
        return super.succeed(int);
    }
    
}

module.exports = Integer;