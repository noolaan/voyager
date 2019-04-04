const Component = require('./Component.js');
const Collection = require('../../../util/interfaces/Collection.js');

class Module extends Component {

    constructor(client, opts = {}) {
        if(!opts) return null;

        super(client, {
            id: opts.name,
            type: 'module'
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.name = opts.name;
        this.components = new Collection();

    }

}

module.exports = Module;