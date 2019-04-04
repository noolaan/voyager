const options = require('./options.json');
const ClientManager = require('./middleware/ClientManager.js');

new ClientManager('./struct/client/DiscordClient.js', options)
    .initialize();

process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error); //eslint-disable-line no-console
});