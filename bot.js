const { Bot } = require("grammy");
const path = require("path");
const fs = require('fs');

// Create a bot object
const bot = new Bot("7725251083:AAEvgb5ND4-ToeRbfjWusByGD4xtrP1c5fQ");

// Handle text messages
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.toLowerCase();
    
    if (text.includes("koala") || text.includes("image")) {
        try {
            const imagePath = path.join(__dirname, "images", "koala.jpeg");
            
            // Check if file exists
            if (!fs.existsSync(imagePath)) {
                console.error("Image file not found at:", imagePath);
                return await ctx.reply("Sorry, I couldn't find the koala image.");
            }
            
            // Send the image
            await ctx.replyWithPhoto({ source: fs.readFileSync(imagePath) });
            await ctx.reply("Here's a cute koala for you!");
        } catch (error) {
            console.error("Error sending image:", error);
            await ctx.reply("Oops! Something went wrong while sending the image.");
        }
    } else {
        // Default echo response
        await ctx.reply("Echo: " + ctx.message.text);
    }
});

// Start the bot
bot.start();
