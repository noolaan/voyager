class Component {

    constructor(client, opts = {}) {
        if(!opts) return null;

        Object.defineProperty(this, 'client', { 
            value: client
        });

        this.id = opts.id;
        this.type = opts.type;

        this.directory = null;

        this.guarded = Boolean(opts.guarded);
        this.disabled = Boolean(opts.disabled);

    }

    enable() {
        if(this.guarded) return { error: true, code: 'GUARDED' };
        this.disabled = false;
        this.client.emit('componentUpdate', { component: this, type: 'ENABLE' });
        return { error: false };
    }

    disable() {
        if(this.guarded) return { error: true, code: 'GUARDED' };
        this.disabled = true;
        this.client.emit('componentUpdate', { component: this, type: 'DISABLE' });
        return { error: false };
    }

    unload() {
        if(this.guarded) return { error: true, code: 'GUARDED' };
        if(!this.directory) return { error: true, code: 'MISSING_DIRECTORY' };

        this.client.registry.unloadComponent(this);
        delete require.cache[this.filePath];

        this.client.emit('componentUpdate', { component: this, type: 'UNLOAD' });
        return { error: false };
    }

    reload(bypass = false) {
        if(this.type === 'module') return { error: false };
        if(this.guarded && !bypass) return { error: true, code: 'GUARDED' };
        if(!this.directory || !require.cache[this.directory]) return { error: true, code: 'MISSING_DIRECTORY' };

        let cached, newModule;

        try {
            cached = require.cache[this.directory];
            delete require.cache[this.directory];
            newModule = require(this.directory);

            if(typeof newModule === 'function') {
                newModule = new newModule(this.client);
            }

            this.client.registry.unloadComponent(this);
            this.client.emit('componentUpdate', { component: this, type: 'UNLOAD' });
            this.client.registry.loadComponent(newModule, this.directory);
        } catch(error) {
            if(cached) require.cache[this.directory] = cached;
            return { error: true, code: 'MISSING_MODULE' };
        }

        return { error: false };

    }

    get resolveable() {
        return `${this.type}:${this.id}`;
    }

}

module.exports = Component;