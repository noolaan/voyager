const { StringType, BooleanType, IntegerType, FloatType } = require('../components/types/');

class Flag {

    constructor(client, opts = {}) {
        if(!opts) return null;

        Object.defineProperty(this, 'client', {
            value: client
        });

        //Basic
        this.id = opts.name;

        //Information
        this.description = opts.description || "A basic flag.";

        //Arguments
        this.arguments = Boolean(opts.arguments);
        this.required = Boolean(opts.required);
        this.type = opts.type || 'STRING';
        this.prompt = opts.prompt || null;
        this.default = opts.default || null;

        //Miscellaneous
        this.query = null;

    }

    async parse(commandMessage) {

        const type = Constants.Types[this.type];
        if(!type) {
            return this._error('COMMAND', commandMessage);
        }

        if(this.default && !this.query) this.query = this.default;
        if(this.required && !this.query) return this._error('FLAG', commandMessage, { message: this.prompt ? this.prompt.start : Constants.Types[this.type].PROMPT.START });

        const response = type.parse(this.query);
        if(response instanceof Promise) await response;

        if(response.error) return this._error('FLAG', commandMessage, { message: this.prompt ? this.promp.retry : Constants.Types[this.type].PROMPT.RETRY });
        this.query = response.output;

        return { error: false };

    }

    _error(code, commandMessage, data = null) {
        return {
            error: true,
            data: {
                flag: this,
                ...data
            },
            commandMessage,
            code
        };
    }

}

module.exports = Flag;

const Constants = {
    Types: {
        STRING: new StringType(),
        BOOLEAN: new BooleanType(),
        INTEGER: new IntegerType(),
        FLOAT: new FloatType()
    }
};