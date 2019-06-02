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
        this.continue = opts.continue || false;
        this.func = opts.func || null;

        this.queries = {};

    }

    async parse(commandMessage) {
        
        let query = this.queries[commandMessage.UUID];

        const type = Constants.Types[this.type];
        if(!type && !this.func) {
            return this._error('COMMAND', commandMessage);
        }

        if(this.func && !this.prompt) {
            this.client.logger.warn(`Flag ${this.id} has no prompt!`);
        }

        if(this.default && !query) query = this.default;
        if(this.required && !query) return this._error('FLAG', commandMessage, { message: this.prompt ? this.prompt.start : Constants.Types[this.type].prompt.start });

        let response = this.func ? this.func(query, commandMessage.guild) : type.parse(query);
        if(response instanceof Promise) response = await response;

        if(response.error) return this._error('FLAG', commandMessage, { message: this.prompt ? this.prompt.retry : Constants.Types[this.type].prompt.retry });
        if(response.result) {
            query = response.result;
        }

        this.queries[commandMessage.UUID] = query;

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