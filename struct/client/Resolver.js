const DurationJs = require('duration-js');

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

    list(list, options, args) {
        let [ method, ...changes ] = args;

        method = method.toLowerCase();
        const methods = {
            list: ['view', 'list', '?'],
            add: ['add', '+'],
            remove: ['remove', 'delete', '-']
        };
        
        if(methods.list.includes(method)) {
            return { list, method: 'list' };
        } else if(methods.add.includes(method)) {
            let added = [];
            for(let change of changes) {
                change = change.toLowerCase();

                if(!options.includes(change)) continue;
                if(list.includes(change)) continue;
                
                list.push(change);
                added.push(change);
            }
            return { list, changed: added, method: 'add' };
        } else if(methods.remove.includes(method)) {
            let removed = [];

            for(let change of changes) {
                change = change.toLowerCase();
                if(!list.includes(change)) continue;
            
                list.splice(list.indexOf(change), 1);
                removed.push(change);
            }
            return { list, changed: removed, method: 'remove' }; 
        } else {
            return null;
        }
    }

    async channels(args = [], guild) {

        let channels = [];
        let parameters = "";

        const parse = async (string) => {
            const str = string.toLowerCase();
            const index = guild ? guild.channels : this.client.channels;

            let channel = null;
            if(/<#(\d{17,19})>/iy.test(str)) {
                const matches = /<#(\d{17,19})>/iy.exec(str);
                channel = index.get(matches[1]);
            } else if(/\d{17,21}/iy.test(str)) {
                const matches = /\d{17,21}/iy.exec(str);
                channel = index.get(matches[1]);
            }
            return channel;
        };

        for(let i = 0; i < args.length; i++) {
            let arg = args[i];
            const channel = await parse(arg);
            if(!channel) {
                parameters = args.splice(i).join(' ');
                break;
            } else {
                let ids = channels.map(c=>c.id);
                if(!ids.includes(channel.id)) channels.push(channel);
                continue;
            }
        }
        
        return { channels, parameters };


    }

    async members(args = [], guild) {

        let members = [];
        let parameters = "";
        
        const parse = async (string) => {
            const str = string.toLowerCase();
            const index = guild ? guild.members : this.client.users;

            let member = null;
            if(/<@!?(\d{17,21})>/iy.test(str)) {
                const matches = /<@!?(\d{17,21})>/iy.exec(str);
                member = index.get(matches[1]);
                if(!member) {
                    try {
                        member = await index.fetch(matches[1]);
                    } catch(e) {
                        try {
                            member = await this.client.users.fetch(matches[1]);
                        } catch(e) {} //eslint-disable-line no-empty
                    } //eslint-disable-line no-empty
                }
            } else if(/\d{17,21}/iy.test(str)) {
                const matches = /(\d{17,21})/iy.exec(str);
                member = index.get(matches[1]);
                if(!member) {
                    try {
                        member = await index.fetch(matches[1]);
                    } catch(e) {
                        try {
                            member = await this.client.users.fetch(matches[1]);
                        } catch(e) {} //eslint-disable-line no-empty
                    } //eslint-disable-line no-empty
                }
            } else if(/(.{2,32})#(\d{4})/iy.test(str)) {
                const matches = /(.{2,32})#(\d{4})/iy.exec(str);
                member = guild
                    ? guild.members.filter(m=>m.user.username === matches[1] && m.user.discriminator === matches[2]).first()
                    : this.client.users.filter(u=>u.username === matches[1] && u.discriminator === matches[2]).first();
            }
            return member || null;
        };

        for(let i = 0; i < args.length; i++) {
            let arg = args[i];
            const member = await parse(arg);
            if(!member) {
                parameters = args.splice(i).join(' ');
                break;
            } else {
                let ids = members.map(m=>m.id);
                if(!ids.includes(member.id)) members.push(member);
                continue;
            }
        }

        return { members, parameters };
        
    }

    duration(str = '') {

        let duration = null;
        try {
            const dur = new DurationJs(str);
            if(dur) duration = dur.milliseconds();
        } catch(e) {} //eslint-disable-line  no-empty

        return duration;

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