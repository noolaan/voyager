class Type {

    constructor(opts = {}) {

        this.id = opts.name;

        this.name = opts.name;
        this.prompt = opts.prompt;

    }

    succeed(result) {
        return {
            error: false,
            result
        };
    }

    fail(reason = null) {
        return {
            error: true,
            reason
        };
    }

}

module.exports = Type;
