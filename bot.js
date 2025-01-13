require('dotenv').config();
const { Bot, InputFile } = require("grammy");
const { Session } = require("@grammyjs/session");

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

// Create a bot object with session middleware
const bot = new Bot("7725251083:AAEvgb5ND4-ToeRbfjWusByGD4xtrP1c5fQ");
bot.use(new Session({ initial: () => ({ authenticated: false }) }));
log("Bot initialized successfully");

// Handle /start command
bot.command("start", async (ctx) => {
    const userId = ctx.from.id;
    log(`/start command from user ${userId}`);
    await ctx.reply("Welcome! Please send the password to authenticate.");
});

// Generate unique filename with timestamp and user ID
function generateFilename(userId) {
    const timestamp = Date.now();
    return `generated_${userId}_${timestamp}.webp`;
}

// Handle text messages
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    
    log(`Received message from user ${userId}: ${text}`);
    
    // Check if user is authenticated
    if (!ctx.session.authenticated) {
        if (text === process.env.BOT_PASSWORD) {
            ctx.session.authenticated = true;
            log(`User ${userId} authenticated successfully`);
            return await ctx.reply("Authentication successful! You can now use /generate");
        }
        log(`Unauthenticated access attempt from user ${userId}`);
        return await ctx.reply("Please authenticate first by sending the correct password.");
    }
    
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

// Add /logout command
bot.command("logout", async (ctx) => {
    ctx.session.authenticated = false;
    log(`User ${ctx.from.id} logged out`);
    await ctx.reply("Logged out successfully. Send the password to authenticate again.");
});

// Start the bot
bot.start();
log("Bot started and ready to receive messages");
