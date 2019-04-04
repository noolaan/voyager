class Resolver {

    constructor(client) {

        Object.defineProperty(this, 'client', {
            value: client 
        });

    }

    components(str = '', type, exact = true) {

        const string = str.toLowerCase();

        const components = this.client.registry.components
            .filter(c => c.type === type)
            .filter(exact ? filterExact(string) : filterInexact(string))
            .array();

        return components || [];

    }

    boolean(str = '') {
        const t = ['yes', 'y', 'true', 'on', 'enable'];
        const f = ['no', 'n', 'false', 'off', 'disable'];

        const string = str.toLowerCase();

        if(t.includes(string)) return true;
        else if(f.includes(string)) return false;
        else return undefined;
    }

    channel(string = '', guild, type = 'text') {

        let channel;
        string = string.toLowerCase();

        if(/<#(\d{17,19})>/iy.test(string)) {
            const matches = /<#(\d{17,19})>/iy.exec(string);
            channel = guild ? guild.channels.filter(c=>c.type === type).get(matches[1]) : this.client.channels.get(matches[1]);
        } else if (/\d{17,19}/iy.test(string)) {
            const matches = /\d{17,19}/iy.exec(string);
            channel = guild ? guild.channels.filter(c=>c.type === type).get(matches[1]) : this.client.channels.get(matches[1]);
        } else {
            channel = guild
                ? guild.channels.filter(c=>c.name === string && c.type === type).first()
                : this.client.channels.filter(c=>c.name === string && c.type === type).first();
        }

        return channel || null;

    }

}

module.exports = Resolver;

const filterExact = (search) => {
    return comp => comp.id.toLowerCase() === search ||
        comp.resolveable.toLowerCase() === search ||
        (comp.aliases && (comp.aliases.some(ali => `${comp.type}:${ali}`.toLowerCase() === search) ||
        comp.aliases.some(ali => ali.toLowerCase() === search)));
};

const filterInexact = (search) => {
    return comp => comp.id.toLowerCase().includes(search) ||
        comp.resolveable.toLowerCase().includes(search) ||
        (comp.aliases && (comp.aliases.some(ali => `${comp.type}:${ali}`.toLowerCase().includes(search)) ||
        comp.aliases.some(ali => ali.toLowerCase().includes(search))));
};