require('dotenv').config();
const { Bot, InputFile } = require("grammy");

// Helper function for formatted logging
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}
const path = require("path");
const fs = require('fs');
const Replicate = require("replicate");
const { writeFile } = require("node:fs/promises");

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

// Create a bot object
const bot = new Bot("7725251083:AAEvgb5ND4-ToeRbfjWusByGD4xtrP1c5fQ");
log("Bot initialized successfully");

// Generate unique filename with timestamp and user ID
function generateFilename(userId) {
    const timestamp = Date.now();
    return `generated_${userId}_${timestamp}.webp`;
}

// Handle text messages
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    
    log(`Received message from user ${ctx.from.id}: ${text}`);
    
    if (text.startsWith("/generate")) {
        log(`Generate command received from user ${ctx.from.id}`);
        try {
            // Extract prompt from message
            const prompt = text.replace("/generate", "").trim();
            
            if (!prompt) {
                log(`Empty prompt from user ${ctx.from.id}`);
                return await ctx.reply("Please provide a prompt after /generate");
            }
            
            log(`Starting image generation for user ${ctx.from.id} with prompt: ${prompt}`);

            // Generate image
            await ctx.reply("Generating your image...");
            log(`Request sent to Replicate API for user ${ctx.from.id}`);
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
            log(`Image saved successfully for user ${ctx.from.id} at ${outputPath}`);
            
            // Send the image to user
            await ctx.replyWithPhoto(new InputFile(outputPath));
            await ctx.reply("Here's your generated image! It's been saved as: " + filename);
            log(`Image sent successfully to user ${ctx.from.id}`);
        } catch (error) {
            log(`Error generating image for user ${ctx.from.id}: ${error.message}`);
            console.error(error.stack);
            await ctx.reply("Oops! Something went wrong while generating the image.");
        }
    } else {
        // Default echo response
        await ctx.reply("Echo: " + ctx.message.text);
    }
});

// Start the bot
bot.start();
log("Bot started and ready to receive messages");
