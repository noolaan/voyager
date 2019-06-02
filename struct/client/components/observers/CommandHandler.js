const escapeRegex = require('escape-string-regexp');
const { stripIndents } = require('common-tags');

const { Observer, CommandMessage } = require('../../interfaces/');
const Collection = require('../../../../util/interfaces/Collection.js');

class CommandHandler extends Observer {

    constructor(client) {

        super(client, {
            name: 'commandHandler',
            priority: 5,
            guarded: true
        });

        Object.defineProperty(this, 'client', { value: client });

        this.hooks = [
            ['message', this.handleMessage.bind(this)]
        ];

        this.commandPatterns = new Map();
        this.quotePairs = {
            '"': '"',
            "'": "'",
            '‘': '’'
        };

        this.startQuotes = Object.keys(this.quotePairs);
        this.quoteMarks = this.startQuotes + Object.values(this.quotePairs)
            .join('');

        this.resolved = new Collection();

    }

    /* Message Handling */

    async handleMessage(message) {
        
        if(!this.client._built
            || message.webhookID
            || message.author.bot
            || (message.guild && !message.guild.available)) return undefined;

        if(message.guild && !message.member) {
            await message.guild.members.fetch(message.author.id);
        }

        const settings = message.guild ? await message.guild.settings() : null;

        const args = message.content.split(' ');
        const command = await this._getCommand(message, args, settings);
        if(!command) return undefined;

        return await this.handleCommand(message, command, this._getWords(args.join(' ')), settings);

    }

    async _getCommand(message, args = [], settings) {

        const pattern = await this._getCommandPattern(message.guild, settings);

        let command = await this._matchCommand(message, args, pattern, 2);
        if(!command && !message.guild) command = await this._matchCommand(message, args, /^([^\s]+)/i);

        return command || null;

    }

    async _getCommandPattern(guild) {

        const createCommandPattern = (guild = null) => {

            const prefix = guild
                ? guild._getSetting('prefix').value 
                : this.client._options.bot.prefix;

            const escapedPrefix = escapeRegex(prefix);
            const pattern = new RegExp(`^(${escapedPrefix}\\s*|<@!?${this.client.user.id}>\\s+(?:${escapedPrefix})?)([^\\s]+)`, 'i');

            const obj = { pattern, prefix };
            if(guild) {
                this.client.logger.debug(`Created command pattern ${guild.name}: ${pattern}`);
                this.commandPatterns.set(guild.id, obj);
            }

            return obj;
        };

        if(!guild) return createCommandPattern().pattern;
        let commandPattern = this.commandPatterns.get(guild.id);

        if(commandPattern) {
            //if this breaks, the "settings.prefix.value !== this.client._options.bot.prefix" was removed from the if statement.
            const prefix = guild._getSetting('prefix').value;
            if(guild
                && prefix
                && commandPattern.prefix !== prefix
            ) {
                commandPattern = createCommandPattern(guild);
            }
        } else {
            commandPattern = createCommandPattern(guild);
        }

        return commandPattern.pattern;

    }

    async _matchCommand(message, args, pattern, index = 1) {
        
        const matches = pattern.exec(message.content);
        if(!matches) return null;

        const command = this.client._resolver.components(matches[index], 'command', true)[0];
        if(!command) return null;

        const indice = message.content.startsWith('<@') ? 2 : 1;
        args.splice(0, indice);

        return command;

    }

    _getWords(string = '') {

        let quoted = false,
            wordStart = true,
            startQuote = '',
            endQuote = false,
            isQuote = false,
            word = '',
            words = [],
            chars = string.split('');

        chars.forEach((char) => {
            if(/\s/.test(char)) {
                if(endQuote) {
                    quoted = false;
                    endQuote = false;
                    isQuote = true;
                }
                if(quoted) {
                    word += char;
                } else if(word !== '') {
                    words.push([ word, isQuote ]);
                    isQuote = false;
                    startQuote = '';
                    word = '';
                    wordStart = true;
                }
            } else if(this.quoteMarks.includes(char)) {
                if (endQuote) {
                    word += endQuote;
                    endQuote = false;
                }
                if(quoted) {
                    if(char === this.quotePairs[startQuote]) {
                        endQuote = char;
                    } else {
                        word += char;
                    }
                } else if(wordStart && this.startQuotes.includes(char)){
                    quoted = true;
                    startQuote = char;
                } else {
                    word += char;
                }
            } else {
                if(endQuote) {
                    word += endQuote;
                    endQuote = false;
                }
                word += char;
                wordStart = false;
            }
        });

        if (endQuote) {
            words.push([ word, true ]);
        } else {
            word.split(/\s/).forEach((subWord, i) => {
                if (i === 0) {
                    words.push([ startQuote+subWord, false ]);
                } else {
                    words.push([ subWord, false ]);
                }
            });
        }

        return words;

    }

    /* Command Handling */

    async handleCommand(message, command, args, settings) {

        const commandMessage = new CommandMessage(this.client, {
            message,
            command,
            args,
            settings
        });

        const inhibitor = await this._handleInhibitors(commandMessage);
        if(inhibitor.error) {
            return this._resolveError({
                code: 'INHIBITOR',
                data: inhibitor,
                commandMessage
            });
        }

        const flags = await this.parseFlags(commandMessage);
        if(flags.error) return this._resolveError(flags);

        const resolved = await commandMessage._resolve();
        this.resolved.set(message.id, resolved);

        if(resolved.error) await this._resolveError(resolved);
        return resolved;

    }

    async _handleInhibitors({ command, message }) {

        const inhibitors = this.client.registry.components.filter(c=>c.type === 'inhibitor' && !c.disabled);
        if(inhibitors.size === 0) return { error: false };

        const promises = [];
        for(const inhibitor of inhibitors.values()) {
            if(inhibitor.guild && !message.guild) continue;
            promises.push((async () => {
                let inhibited = inhibitor.execute(message, command);
                if(inhibited instanceof Promise) inhibited = await inhibited;
                return inhibited;
            })());
        }

        const reasons = (await Promise.all(promises)).filter(p=>p.error);
        if(reasons.length === 0) return { error: false };

        reasons.sort((a, b) => b.inhibitor.priority - a.inhibitor.priority);
        return reasons[0];

    } 

    _resolveError({ code, commandMessage, data }) {

        const options = this.client._options;
        const messages = {
            COMMAND: (message) => stripIndents`The command **${message.command.moduleResolveable}** had issues running. **\`[${message.UUID}]\`**
                Contact **${this.client.users.has(options.owner) ? this.client.users.get(options.owner).tag : 'the bot owner'}** about this issue. You can also find support here: <${options.bot.invite}>`,
            INHIBITOR: (message, data) => `${data.message} **\`[${data.inhibitor.resolveable}]\`**`,
            FLAG: (message, data) => `${data.message} **\`[flag:${data.flag.id}]\`**`
        };

        code = messages[code] ? code : 'COMMAND';
        const message = messages[code](commandMessage, data);

        const emoji = code === 'COMMAND' ? 'warning' : 'failure';
        if(commandMessage.pending) commandMessage.pending.edit(message, { emoji });
        else commandMessage.respond(message, { emoji });

    }

    async parseFlags(commandMessage) {

        const { command, args } = commandMessage;
        const flagExpansions = this._flagExpansions(command.flags);
        const flags = {};
        const parameters = [];
        const id = commandMessage.UUID;

        let flag;

        for(const [ word, isQuote ] of args) {
            if(!word) continue;
            const flagData = this._grabFlag(command, word, flagExpansions);

            if(flagData && !isQuote && !flags[flagData.id]) {
                flag = flagData;
                flags[flag.id] = flag;
            } else if((flag && flag.arguments) || (flag && flag.arguments && flag.continue)) {
                if(flag.queries[id]) flag.queries[id] += ` ${word}`;
                else flag.queries[id] = word;
                if(!flag.continue) flag = null;
            } else {
                const newWord = isQuote
                    ? `"${word}"`
                    : word;
                parameters.push(newWord);
            }
        }

        return await this._handleFlags(commandMessage, flags, parameters);

    }

    async _handleFlags(commandMessage, flags, parameters) {

        for(let flag of Object.values(flags)) {
            let response = await flag.parse(commandMessage);
            if(response.error) return response;
        }

        commandMessage.args = this._parseArguments(parameters.join(' '), commandMessage.command);
        commandMessage.flags = flags;

        return { error: false };

    }

    _flagExpansions(flags) {
        let shortFlags = {};
        flags.map(f=>shortFlags[f.id.charAt(0)] = f.id);
        return shortFlags;
    }

    _grabFlag(command, word, flags) {
        if(word.charAt(0) !== '-') return null;
        let flagName = word.charAt(1) !== '-'
            ? flags[word.slice(1)]
            : word.slice(2);

        if(!flagName) return null;
        return command.flags.filter(f=>f.id === flagName)[0] || null;
    }

    _parseArguments(args, command) {
        const type = command.split;

        const splitFuncs = {
            PLAIN: c => c.split(' '),
            QUOTED: c => this.client.messageHandler.getWords(c), 
            NONE: c => c
        };

        if(typeof type === 'function') return args.split(type);
        const blah = splitFuncs[type]
            ? splitFuncs[type](args)
            : args.split(type);

        return blah;

    }

}

module.exports = CommandHandler;