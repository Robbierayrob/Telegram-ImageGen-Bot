# Telegram Image Generation Bot

This is a Telegram bot that uses Replicate's AI models to generate images from text prompts. It features user authentication, image history, and sharing capabilities.

## Features
- 🔐 User authentication with password
- 🖼️ AI-powered image generation from text prompts
- 🔄 Regenerate images with same prompt
- 📤 Share generated images via inline query
- 📅 Image history with timestamps
- ⏳ Rate limiting to prevent abuse

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- Telegram account
- Replicate account

### 2. Create Your Bot
1. Open Telegram and search for @BotFather
2. Start a chat and use `/newbot` command
3. Follow the instructions to create your bot
4. Save the API token you receive

### 3. Get Replicate API Token
1. Go to [Replicate](https://replicate.com/)
2. Create an account if you don't have one
3. Get your API token from account settings

### 4. Environment Setup
1. Create a `.env` file in the project root with these variables:
```env
BOT_TOKEN=your_telegram_bot_token
REPLICATE_API_TOKEN=your_replicate_api_token
BOT_PASSWORD=your_secure_password
```

### 5. Install Dependencies
```bash
npm install
```

### 6. Run the Bot
```bash
node bot.js
```

### 7. Create Folder called images in root

## TODO List for Improvements

### Core Features
1. [ ] Add automatic prompt improvement using LLM
   - Integrate with OpenAI or similar service
   - Create theme-based templates
   - Add style modifiers based on user preferences

2. [ ] Implement prompt templates
   - Predefined styles (anime, realistic, cyberpunk, etc.)
   - Aspect ratio options
   - Style transfer capabilities

3. [ ] Add image editing capabilities
   - Inpainting/outpainting
   - Style transfer
   - Resolution enhancement

### User Experience
1. [ ] Add command for viewing image history
2. [ ] Implement batch image generation
3. [ ] Add progress indicators for generation
4. [ ] Create user profiles with preferences

### Technical Improvements
1. [ ] Add database support for persistent storage
2. [ ] Implement proper error handling and retries
3. [ ] Add rate limiting per user
4. [ ] Create admin interface for management

### Security
1. [ ] Implement proper user authentication
2. [ ] Add logging and monitoring
3. [ ] Create backup system for images
4. [ ] Add abuse detection and prevention

## Contributing
Pull requests are welcome! Please follow these guidelines:
1. Create a new branch for your feature
2. Write clear commit messages
3. Update documentation as needed
4. Test your changes thoroughly

## License
[MIT](LICENSE)
