require('dotenv').config();
const { Bot, InputFile } = require("grammy");
const path = require("path");
const fs = require('fs');
const Replicate = require("replicate");
const { writeFile } = require("node:fs/promises");

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || 'r8_dQX6s0D0gqUHdBEwD4WAEzmvHuoknl74dYe4U'
});

// Create a bot object
const bot = new Bot("7725251083:AAEvgb5ND4-ToeRbfjWusByGD4xtrP1c5fQ");

// Generate unique filename with timestamp and user ID
function generateFilename(userId) {
    const timestamp = Date.now();
    return `generated_${userId}_${timestamp}.webp`;
}

// Handle text messages
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    
    if (text.startsWith("/generate")) {
        try {
            // Extract prompt from message
            const prompt = text.replace("/generate", "").trim();
            
            if (!prompt) {
                return await ctx.reply("Please provide a prompt after /generate");
            }

            // Generate image
            await ctx.reply("Generating your image...");
            const output = await replicate.run("black-forest-labs/flux-schnell", {
                input: {
                    prompt: prompt
                }
            });

            // Generate unique filename
            const filename = generateFilename(ctx.from.id);
            const outputPath = path.join(__dirname, "images", filename);
            
            // Save the image permanently
            await writeFile(outputPath, output[0]);
            
            // Send the image to user
            await ctx.replyWithPhoto(new InputFile(outputPath));
            await ctx.reply("Here's your generated image! It's been saved as: " + filename);
        } catch (error) {
            console.error("Error generating image:", error);
            await ctx.reply("Oops! Something went wrong while generating the image.");
        }
    } else {
        // Default echo response
        await ctx.reply("Echo: " + ctx.message.text);
    }
});

// Start the bot
bot.start();
