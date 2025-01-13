const { Bot } = require("grammy");
const path = require("path");

// Create a bot object
const bot = new Bot("7725251083:AAEvgb5ND4-ToeRbfjWusByGD4xtrP1c5fQ");

// Handle text messages
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.toLowerCase();
    
    if (text.includes("koala") || text.includes("image")) {
        // Send koala image
        const imagePath = path.join(__dirname, "images", "koala.jpeg");
        await ctx.replyWithPhoto({ source: imagePath });
        await ctx.reply("Here's a cute koala for you!");
    } else {
        // Default echo response
        await ctx.reply("Echo: " + ctx.message.text);
    }
});

// Start the bot
bot.start();
