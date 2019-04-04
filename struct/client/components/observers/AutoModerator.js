const { Observer } = require('../../interfaces/');

class AutoModerator extends Observer {

    constructor(client) {

        super(client, {
            name: 'autoModerator',
            priority: 4
        });

    }


}

module.exports = AutoModerator;