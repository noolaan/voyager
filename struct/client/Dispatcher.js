class Dispatcher {

    constructor(client) {

        Object.defineProperty(this, 'client', {
            value: client
        });

    }

    async dispatch() {

        const observers = this.client.registry.components
            .filter(c=>c.type === 'observer' && !c.disabled)
            .sort((a, b) => b.priority - a.priority);

        for(const observer of observers.values()) {
            for(let [hook, func] of observer.hooks) {
                this.client.hooker.hook(hook, func);
            }
        }

    }

}

module.exports = Dispatcher;