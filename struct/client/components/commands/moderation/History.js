const { Command, Flag } = require('../../../interfaces/');
const Util = require('../../../../../util/Util.js');

const { stripIndents } = require('common-tags');
const moment = require('moment');

class HistoryCommand extends Command {

    constructor(client) {

        super(client, {
            name: 'history',
            module: 'moderation',
            description: "Views the moderation history of a provided member.",
            usage: "<member> [page]",
            split: 'PLAIN',
            settings: ['guild'],
            memberPermissions: ['MANAGE_MESSAGES'],
            examples: [
                "@nolan#6801"
            ],
            flags: [
                new Flag(client, {
                    name: 'verbose',
                    description: "Shows a list of each infraction on the user."
                })
            ],
            guildOnly: true
        });

        Object.defineProperty(this, 'client', { value: client });

    }

    async execute(message, { args, flags }) {

        let { members, parameters } = await this.client._resolver.members(args, message.guild);
        if(members.length === 0) members = [ message.member ];
        if(members.length > 1) {
            return message.respond(`You must only provide one member to view the history of.`, {
                emoji: 'failure'
            });
        }

        const page = parseInt(parameters) || 1;
        const member = members[0];

        const infractions = await this.client.storageManager.tables.infractions.grabInfractionsForUser(message.guild.id, member.id);
        const embed = flags.verbose ? await this._verboseEmbed(member, infractions, page) : this._simpleEmbed(member, infractions);

        message.channel.send('', { embed });

    }

    _simpleEmbed(member, infractions) {
     
        const size = (type) => {
            return infractions.filter(i=>i.type === type).length || 0;
        };

        const warnings = size('WARN');
        const mutes = size('MUTE');
        const kicks = size('KICK');
        const bans = size('BAN');

        return {
            author: {
                name: `${member.user.tag} (${member.user.id})`,
                icon_url: member.user.displayAvatarURL()
            },
            color: 0xe0e0e0,
            footer: {
                text: `User has ${warnings} warning${warnings === 1 ? '' : 's'}, ${mutes} mute${mutes === 1 ? '' : 's'}, ${kicks} kick${kicks === 1 ? '' : 's'}, and ${bans} ban${bans === 1 ? '' : 's'}.`
            }
        };

    }

    async _verboseEmbed(member, infractions, page) {

        const set = Util.paginate(infractions, page);
        let message = '';
        
        for(const item of set.items) {
            //const user = await this.client.users.fetch(item.executor, true);
            message += `**${item.type}** by <@${item.executor}> (${moment(item.timestamp).fromNow()})
        for \`${item.reason.length > 30 ? `${item.reason.substring(0, 27)}...` : item.reason}\`**\`[CASE ${item.case}]\`**`;
            message += '\n';
        }

        return {
            author: {
                name: `${member.user.tag} (${member.user.id})`,
                icon_url: member.user.displayAvatarURL()
            },
            description: message,
            color: 0xe0e0e0,
            footer: {
                text: `Page ${page > set.maxPage ? set.maxPage : page}/${set.maxPage} | ${infractions.length} results`
            }
        };

    }

}

module.exports = HistoryCommand;