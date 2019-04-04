class Infraction {

    constructor(client, opts = {}) {

        Object.defineProperty(this, 'client', { value: client });

        this.target = opts.target;
        this.executor = opts.executor;
        this.guild = opts.guild;
        this.channel = opts.channel;

        this.case = null;
        this.type = opts.type;

        this.timestamp = new Date().getTime();
        this.duration = opts.duration || null;
        this.expiration = opts.duration ? opts.duration + new Date().getTime() : null;
        this.reason = opts.reason || 'N/A';
        
        this.dictionary = opts.dictionary;

    }

}

module.exports = Infraction;