const { Inhibitor } = require('../../interfaces/');
const { stripIndents } = require('common-tags');

class GuildOnly extends Inhibitor {

    constructor(client) {

        super(client, {
            name: 'throttle',
            priority: 20
        });

    }

    execute(message, command) {

        const throttle = this.throttleCommand(message, command);

        if(throttle) {
            throttle.usages++;
            if(throttle.usages > command.throttling.usages) {
                const remaining = (throttle.start + (command.throttling.duration*1000) - Date.now()) / 1000;
                return super._fail(stripIndents`The command **${command.moduleResolveable}** is currently throttled. 
                *You can use this command again in* *\`${remaining.toFixed(2)}\`* *seconds.*`);
            }
        }

        return super._succeed();

    }

    throttleCommand(message, command) {
        if(!command.throttling) return undefined;
        let throttle = command._throttles.get(message.author.id);
        if(!throttle) {
            throttle = {
                start: Date.now(),
                usages: 0,
                timeout: this.client.setTimeout(() => {
                    command._throttles.delete(message.author.id);
                }, command.throttling.duration*1000)
            };
            command._throttles.set(message.author.id, throttle);
        }
        return throttle;
    }

}

module.exports = GuildOnly;