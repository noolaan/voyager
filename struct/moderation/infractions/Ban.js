const { GuildMember } = require('discord.js');
const Infraction = require('../interfaces/Infraction.js');

class Ban extends Infraction {

    constructor(client, options = {}) {

        super(client, {
            type: 'BAN',
            targetType: 'user',
            executor: options.executor.user,
            target: options.target.user || options.target,
            reason: options.reason || 'N/A',
            guild: options.guild,
            channel: options.channel,
            duration: options.duration,
            color: 0xd65959,
            dictionary: {
                past: 'banned',
                present: 'ban'
            }
        });

        Object.defineProperty(this, 'client', {
            value: client
        });

        this.member = options.target;

    }

    async parse() {

        if(this.member instanceof GuildMember) {
            if(!this.member.bannable) {
                return this._fail("they are unable to be banned");
            }
        }

        const before = new Date().getTime();
        const bannedUsers = await this.guild.fetchBans();
        const after = new Date().getTime();
        this.client.logger.warn(`Took ${after-before}ms to fetch bans.`);
        if(bannedUsers.has(this.member.id)) {
            return this._fail("they are already banned");
        }

        if(this.guild._getSetting("dmInfraction").value) {
            await this.resolve({ dm: true });
        }

        try {
            await this.guild.members.ban(this.member.id, { reason: this._reason });
        } catch(error) {
            this.client.logger.error(`Error occured while banning user:\n${error || error.stack}`);
            return this._fail('An error occured.', true);
        }

        return this._succeed();

    }

}

module.exports = Ban;