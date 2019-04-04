/* Adopted from Discord.js */

const path = require('path');
const EventEmitter = require('events');

const Util = require('../../util/Util.js');

let childProcess = null;
let Worker = null;

class Shard extends EventEmitter {

    constructor(manager, id) {

        super();

        if(manager.mode === 'process') childProcess = require('child_process');
        else if(manager.mode === 'worker') Worker = require('worker_threads').Worker;

        this.manager = manager;
        this.id = id;
        this.args = manager.shardArgs || [];
        this.execArgv = manager.execArgv;
        this.env = Object.assign({}, process.env, {
            SHARDING_MANAGER: true,
            SHARDS: this.id,
            TOTAL_SHARD_COUNT: this.manager.totalShards,
            DISCORD_TOKEN: this.manager.token
        });

        this.ready = false;
        this.process = null;
        this.worker = null;

        this._evals = new Map();
        this._fetches = new Map();

        this._exitListener = this._handleExit.bind(this, undefined);

    }

    async spawn(waitForReady = true) {
        if(this.process) throw new Error(`[shard${this.id}] Sharding process already exists.`);
        if(this.worker) throw new Error(`[shard${this.id}] Sharding worker already exists.`);

        if(this.manager.mode === 'process') {
            this.process = childProcess.fork(path.resolve(this.manager.file), this.args, {
                env: this.env, 
                execArgv: this.execArgv
            })
                .on('message', this._handleMessage.bind(this))
                .on('exit', this._exitListener);
        } else if(this.manager.mode === 'worker') {
            this.worker = new Worker(path.resolve(this.manager.file), { workerData: this.env })
                .on('message', this._handleMessage.bind(this))
                .on('exit', this._exitListener);
        }

        this.emit('spawn', this.process || this.worker);

        if(!waitForReady) return this.process || this.worker;
        await new Promise((resolve, reject) => {
            this.once('ready', resolve);
            this.once('disconnect', () => reject(new Error(`[shard${this.id}] Shard disconnected while readying.`)));
            this.once('death', () => reject(new Error(`[shard${this.id}] Shard died while readying.`)));
            setTimeout(() => reject(new Error(`[shard${this.id}] Shard timed out while readying.`)), 30000);
        });

        return this.process || this.worker;

    }

    kill() {
        if(this.process) {
            this.process.removeListener('exit', this._exitListener);
            this.process.kill();
        } else {
            this.worker.removeListener('exit', this._exitListener);
            this.worker.terminate();
        }

        this._handleExit(false);

    }

    async respawn(delay = 500, waitForReady = true) {
        this.kill();
        if(delay > 0) await Util.delayFor(delay);
        return this.spawn(waitForReady);
    }

    send(message) {
        return new Promise((resolve, reject) => {
            if(this.process) {
                this.process.send(message, error => {
                    if(error) reject(error); else resolve(this);
                });
            } else {
                this.worker.postMessage(message);
                resolve(this);
            }
        });
    }

    fetchClientValue(prop) {
        if(this._fetches.has(prop)) return this._fetches.get(prop);

        const promise = new Promise((resolve, reject) => {
            const child = this.process || this.worker;
        
            const listener = message => {
                if(!message || message._fetchProp !== prop) return;
                child.removeListener('message', listener);
                this._fetches.delete(prop);
                resolve(message._result);
            };
            child.on('message', listener);
        
            this.send({ _fetchProp: prop }).catch(err => {
                child.removeListener('message', listener);
                this._fetches.delete(prop);
                reject(err);
            });
        });
    
        this._fetches.set(prop, promise);
        return promise;

    }

    eval(script) {

        if(this._evals.has(script)) return this._evals.get(script);

        const promise = new Promise((resolve, reject) => {
            const child = this.process || this.worker;
        
            const listener = message => {
                if(!message || message._eval !== script) return;
                child.removeListener('message', listener);
                this._evals.delete(script);
                if(!message._error) resolve(message._result); else reject(new Error(message._error));
            };
            child.on('message', listener);
        
            const _eval = typeof script === 'function' ? `(${script})(this)` : script;
            this.send({ _eval }).catch(err => {
                child.removeListener('message', listener);
                this._evals.delete(script);
                reject(err);
            });
        });
    
        this._evals.set(script, promise);
        return promise;

    }

    _handleMessage(message) {
        if(message) {
            if(message._ready) { //Shard ready
                this.ready = true;
                this.emit('ready');
                return;
            }
            if(message._disconnect) { //Shard disconnected
                this.ready = false;
                this.emit('disconnect');
                return;
            }
            if(message._reconnecting) { //Shard attempting to reconnect
                this.ready = false;
                this.emit('reconnecting');
                return;
            }
            if(message._sFetchProp) { //Shard requesting property fetch
                this.manager.fetchClientValues(message._sFetchProp).then(
                    results => this.send({ _sFetchProp: message._sFetchProp, _result: results }),
                    err => this.send({ _sFetchProp: message._sFetchProp, _error: Util.makePlainError(err) })
                );
                return;
            }
            if(message._sEval) { //Shard requesting eval broadcast
                this.manager.broadcastEval(message._sEval).then(
                    results => this.send({ _sEval: message._sEval, _result: results }),
                    err => this.send({ _sEval: message._sEval, _error: Util.makePlainError(err) })
                );
                return;
            }
            if(message._sRespawnAll) { //Shard requesting to respawn all shards.
                const { shardDelay, respawnDelay, waitForReady } = message._sRespawnAll;
                this.manager.respawnAll(shardDelay, respawnDelay, waitForReady).catch(() => {
                });
                return;
            }
        }

        this.manager.emit('message', this, message);

    }

    _handleExit(respawn = this.manager.respawn) {
        this.emit('death', this.process || this.worker);
    
        this.ready = false;
        this.process = null;
        this.worker = null;
        this._evals.clear();
        this._fetches.clear();
    
        if(respawn) this.spawn().catch(err => this.emit('error', err));

    }

}

module.exports = Shard;