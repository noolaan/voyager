const Component = require('./Component.js');

class Observer extends Component {

    constructor(client, opts = {}) {

        super(client, {
            id: opts.name,
            type: 'observer',
            guarded: opts.guarded,
            disabled: opts.disabled
        });

        this.name = opts.name;
        this.priority = opts.priority || 1;
        this.hooks = opts.hooks || [];
        
        Object.defineProperty(this, 'client', {
            value: client
        });

    }

    execute() {
        return this._continue();
    }

    _continue() {
        return { error: false, observer: this };
    }

    _stop() {
        return { error: true, observer: this };
    }

}

module.exports = Observer;