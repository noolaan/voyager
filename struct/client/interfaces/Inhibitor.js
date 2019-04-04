const Component = require('./Component.js');

class Inhibitor extends Component {

    constructor(client, opts = {}) {

        super(client, {
            id: opts.name,
            type: 'inhibitor',
            guarded: opts.guarded,
            disabled: opts.disabled
        });

        this.name = opts.name;
        this.guild = Boolean(opts.guild);
        this.priority = opts.priority || 1;

    }

    _succeed() {
        return { error: false, inhibitor: this };
    }

    _fail(message) {
        return { error: true, inhibitor: this, message };
    }

}

module.exports = Inhibitor;