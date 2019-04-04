const ShardManager = require('./shard/ShardManager.js');
const Logger = require('./Logger.js');

class ClientManager extends ShardManager {

    constructor(file, options = {}) {

        if(!options) return null;
        super(file, options);

        this.logger = new Logger(this, options.shard);

    }

    async initialize() {

        const _exitHandler = async () => {
            process.stdin.resume();
            this.respawn = false;
            console.log(""); //eslint-disable-line no-console
            for(const shard of this.shards.values()) {
                await this.logger.handleMessage(shard, {
                    message: "Shard disconnected.",
                    embed: true,
                    type: 'ERROR'
                });
            }
            process.exit();
        };

        process.once('SIGINT', _exitHandler);

        super.spawn();

    }

}

module.exports = ClientManager;