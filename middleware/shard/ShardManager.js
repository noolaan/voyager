/* Adopted from Discord.js */

const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

const Shard = require('./Shard.js');
const Collection = require('../../util/interfaces/Collection.js');
const Util = require('../../util/Util.js');

class ShardManager extends EventEmitter {

    constructor(file, options = {}) {

        super();

        options = Util.mergeDefault({
            totalShards: 'auto',
            mode: 'process',
            respawn: true,
            shardArgs: [],
            execArgv: [],
            token: options.bot.token
        }, options.shard);

        this.file = file;
        if(!file) throw new Error("[shardmanager] File must be specified.");
        if(!path.isAbsolute(file)) this.file = path.resolve(process.cwd(), file);

        const stats = fs.statSync(this.file);
        if(!stats.isFile()) throw new Error("[shardmanager] File path does not point to a valid file.");

        this.shardList = options.shardList || 'auto';
        if(this.shardList !== 'auto') {
            if(!Array.isArray(this.shardList)) {
                throw new TypeError("[shardmanager] ShardList must be an array.");
            }
            this.shardList = [...new Set(this.shardList)];
            if(this.shardList.length < 1) throw new RangeError("[shardmanager] ShardList must have one ID.");
            if(this.shardList.some(shardID => typeof shardID !== 'number' 
                || isNaN(shardID) 
                || !Number.isInteger(shardID) 
                || shardID < 0)
            ) {
                throw new TypeError("[shardmanager] ShardList must be an array of positive integers.");
            }
        }

        this.totalShards = options.totalShards || 'auto';
        if(this.totalShards !== 'auto') {
            if(typeof this.totalShards !== 'number' || isNaN(this.totalShards)) {
                throw new TypeError("[shardmanager] TotalShards must be an integer.");
            }
            if(this.totalShards < 1) throw new RangeError("[shardmanager] TotalShards must be at least one.");
            if(!Number.isInteger(this.totalShards)) {
                throw new RangeError("[shardmanager] TotalShards must be an integer.");
            }
        }

        this.mode = options.mode;
        if(this.mode !== 'process' && this.mode !== 'worker') {
            throw new RangeError("[shardmanager] Mode must be either 'worker' or 'process'.");
        }

        this.respawn = options.respawn;
        this.shardArgs = options.shardArgs;
        this.execArgv = options.execArgv;
        this.token = options.token;
        this.shards = new Collection();

        process.env.SHARDING_MANAGER = true;
        process.env.SHARDING_MANAGER_MODE = this.mode;
        process.env.DISCORD_TOKEN = this.token;

    }

    createShard(id = this.shards.size) {
        const shard = new Shard(this, id);
        this.shards.set(id, shard);

        this.emit('shardCreate', shard);
        return shard;
    }

    async spawn(amount = this.totalShards, delay = 5500, waitForReady = true) {

        if(amount === 'auto') {
            amount = await Util.fetchRecommendedShards(this.token);
        } else {
            if(typeof amount !== 'number' || isNaN(amount)) {
                throw new TypeError("[shardmanager] Amount of shards must be a number.");
            }
            if(amount < 1) throw new RangeError("[shardmanager] Amount of shards must be at least one.");
            if(!Number.isInteger(amount)) {
                throw new TypeError("[shardmanager] Amount of shards must be an integer.");
            }
        }

        if(this.shards.size >= amount) throw new Error("[shardmanager] Already spawned all necessary shards.");
        if(this.shardList === 'auto' || this.totalShards === 'auto' || this.totalShards !== amount) {
            this.shardList = [...Array(amount).keys()];
        }
        if(this.totalShards === 'auto' || this.totalShards !== amount) {
            this.totalShards = amount;
        }
        if(this.shardList.some(id => id >= amount)) {
            throw new RangeError("[shardmanager] Amount of shards cannot be larger than the highest shard ID.");
        }

        for(const shardID of this.shardList) {
            const promises = [];
            const shard = this.createShard(shardID);
            promises.push(shard.spawn(waitForReady));
            if(delay > 0 && this.shards.size !== this.shardList.length - 1) promises.push(Util.delayFor(delay));
            await Promise.all(promises);
        }

        return this.shards;

    }

    broadcast(message) {
        const promises = [];
        for(const shard of this.shards.values()) promises.push(shard.send(message));
        return Promise.all(promises);
    }

    broadcastEval(script) {
        const promises = [];
        for(const shard of this.shards.values()) promises.push(shard.eval(script));
        return Promise.all(promises);
    }

    fetchClientValues(prop) {
        if(this.shards.size === 0) return Promise.reject(new Error("[shardmanager] No shards available."));
        if(this.shards.size !== this.totalShards) return Promise.reject(new Error("[shardmanager] Sharding in progress."));
        const promises = [];
        for(const shard of this.shards.values()) promises.push(shard.fetchClientValue(prop));
        return Promise.all(promises);
    }

    async respawnAll(shardDelay = 5000, respawnDelay = 500, waitForReady = true) {
        let s = 0;
        for(const shard of this.shards.values()) {
            const promises = [shard.respawn(respawnDelay, waitForReady)];
            if(++s < this.shards.size && shardDelay > 0) promises.push(Util.delayFor(shardDelay));
            await Promise.all(promises);
        }
        return this.shards;
    }

}

module.exports = ShardManager;
