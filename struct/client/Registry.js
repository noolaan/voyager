const path = require('path');

const { Component, Module } = require('./interfaces/');
const Util = require('../../util/Util.js');
const Collection = require('../../util/interfaces/Collection.js');

class Registry {

    constructor(client) {

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.components = new Collection();

    }

    async loadComponents(dir, classToHandle) {
        const directory = path.join(process.cwd(), 'struct/client/', dir);
        const files = Util.readdirRecursive(directory);

        const loaded = [];

        for(const path of files) {
            const func = require(path);
            if(typeof func !== 'function') {
                this.client.logger.error("Attempted to index an invalid function as a component.");
                continue;
            }

            const component = new func(this.client);
            if(classToHandle && !(component instanceof classToHandle)) {
                this.client.logger.error("Attempted to load an invalid class.");
                continue;
            }

            loaded.push(await this.loadComponent(component, path));

        }

        return loaded;

    }

    async loadComponent(component, directory) {

        if(!(component instanceof Component)) {
            this.client.logger.error("Attempted to load an invalid component.");
            return null;
        }

        if(this.components.has(component.resolveable)) {
            this.client.logger.error("Attempted to reload an existing component.");
            return null;
        }

        if(directory) component.directory = directory;
        if(component.module && typeof component.module === 'string') {
            let module = this.components.get(`module:${component.module}`);
            if(!module) module = await this.loadComponent(new Module(this.client, { name: component.module }));
            this.components.set(module.resolveable, module);

            component.module = module;
            module.components.set(component.resolveable, component);
        }

        this.components.set(component.resolveable, component);
        this.client.emit('componentUpdate', { component, type: 'LOAD' });
        return component;

    }

    async unloadComponent(component) {
        return this.components.delete(component.resolveable);
    }

}

module.exports = Registry;