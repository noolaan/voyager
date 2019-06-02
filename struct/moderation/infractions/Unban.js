const Infraction = require('../interfaces/Infraction.js');

class Unban extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'UNBAN',
            targetType: 'user',
            executor: options.executor.user,
            target: options.target.user || options.target,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            duration: options.duration,
            color: 0xd97c7c,
            dictionary: {
                past: 'unbanned',
                present: 'unban'
            }
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.member = options.target;

    }

    async parse() {

        const before = new Date().getTime();
        const bannedUsers = await this.guild.fetchBans();
        const after = new Date().getTime();
        this.client.logger.warn(`Took ${after-before}ms to fetch bans.`);
        if(!bannedUsers.has(this.member.id)) {
            return this._fail("they are not banned");
        }

        if(this.guild._getSetting("dmInfraction").value) {
            await this.resolve({ dm: true });
        }

        try {
            await this.guild.members.unban(this.member.id, this._reason);
        } catch(error) {
            this.client.logger.error(`Error occured while unbanning user:\n${error || error.stack}`);
            return this._fail('An error occured.', true);
        }

        await this.client.moderationManager._removeExpiration(this);
        return this._succeed();

    }

}

module.exports = Unban;