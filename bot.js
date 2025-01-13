const { Bot, InputFile } = require("grammy");
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

// Handle text messages
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.toLowerCase();
    
    if (text.includes("koala")) {
        try {
            const imagePath = path.join(__dirname, "images", "koala.jpeg");
            
            // Check if file exists
            if (!fs.existsSync(imagePath)) {
                console.error("Image file not found at:", imagePath);
                return await ctx.reply("Sorry, I couldn't find the koala image.");
            }
            
            // Send the image using InputFile
            await ctx.replyWithPhoto(new InputFile(imagePath));
            await ctx.reply("Here's a cute koala for you!");
        } catch (error) {
            console.error("Error sending image:", error);
            await ctx.reply("Oops! Something went wrong while sending the image.");
        }
    } else if (text.startsWith("/generate")) {
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

            // Save and send the first output image
            const outputPath = path.join(__dirname, "images", "generated.webp");
            await writeFile(outputPath, output[0]);
            
            await ctx.replyWithPhoto(new InputFile(outputPath));
            await ctx.reply("Here's your generated image!");
            
            // Clean up
            fs.unlinkSync(outputPath);
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
