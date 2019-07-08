const { Client } = require('discord.js');

const EventHooker = require('./EventHooker.js');
const Logger = require('./Logger.js');
const Registry = require('./Registry.js');
const Dispatcher = require('./Dispatcher.js');
const Resolver = require('./Resolver.js');
const WebhookManager = require('./WebhookManager.js');
const { Command, Observer, Setting, Inhibitor } = require('./interfaces/');

const StorageManager = require('../storage/StorageManager.js');
const { Guilds, Users, Attachments, Infractions, Expirations } = require('../storage/tables/');

const ModerationManager = require('../moderation/ModerationManager.js');

const options = require('../../options.json');

const { Guild, User } = require('./extensions/'); //eslint-disable-line no-unused-vars

class DiscordClient extends Client {

    constructor() {

        super(options.clientOptions);

        this.hooker = new EventHooker(this);
        this.logger = new Logger(this);
        this.registry = new Registry(this);
        this.dispatcher = new Dispatcher(this);

        this.webhookManager = new WebhookManager(this);
        this.storageManager = new StorageManager(this, {
            name: options.storage.database
        });

        this.moderationManager = new ModerationManager(this);

        this._resolver = new Resolver(this);

        this._options = options;
        this._built = false;

        process.on('exit', () => this.emit('reconnect'));

    }

    async build() {

        await super.login(this._options.bot.token);

        await this.registry.loadComponents('components/commands/', Command);
        await this.registry.loadComponents('components/observers/', Observer);
        await this.registry.loadComponents('components/settings/', Setting);
        await this.registry.loadComponents('components/inhibitors/', Inhibitor);

        await this.storageManager.createTables([
            ['guilds', Guilds],
            ['users', Users],
            ['attachments', Attachments],
            ['infractions', Infractions],
            ['expirations', Expirations]
        ]);

        await this.dispatcher.dispatch();
        if(this.shard.id === 0) await this._singleton();
        await this.user.setActivity(`@${this.user.username} help`);

        this._built = true;

    }
    
    async _singleton() {
        await this.storageManager.tables.attachments.clear();
    }

    async reload() {

        const failed = [];

        const components = this.registry.components.map(c=>c.resolveable);
        for(const component of components) {
            const result = this.registry.components.get(component).reload(true);
            if(result.error) failed.push(result); 
        }

        return failed;

    }

}

module.exports = DiscordClient;

const client = new DiscordClient();
client.build();