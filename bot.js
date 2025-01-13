const { Bot } = require("grammy");

// Create a bot object
const bot = new Bot("7725251083:AAEvgb5ND4-ToeRbfjWusByGD4xtrP1c5fQ"); // <-- place your bot token in this string

// Register listeners to handle messages
bot.on("message:text", (ctx) => ctx.reply("Echo: " + ctx.message.text));

// Start the bot (using long polling)
bot.start();