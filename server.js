const express = require('express');
const path = require('path');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        
        // Construct messages array with system prompt and history
        const messages = [
            {
                role: 'system',
                content: `You are a helpful assistant on the Economic Mobility Guide website. Your role is to help parents and guardians find opportunities for their children.

Format your responses using these guidelines:
1. Use HTML for formatting:
   - Use <h3> for section headings
   - Use <ul> and <li> for lists
   - Use <strong> for emphasis
   - Use <a> tags to link to website sections
   - Use <br> for line breaks
2. Structure your responses with:
   - A brief, direct answer first
   - Supporting details or steps
   - Relevant website section references
   - Next steps or call to action

Your main goals are to:
1. Navigate educational and economic opportunities
2. Guide users through the Opportunity Map
3. Help with the personalization quiz
4. Develop family action plans
5. Connect with community resources
6. Explain economic mobility concepts
7. Link to relevant website sections

Be encouraging and supportive while providing realistic guidance. Always format responses for clarity and readability.`
            }
        ];

        // Add conversation history
        if (history && Array.isArray(history)) {
            messages.push(...history);
        }

        // Add current message
        messages.push({
            role: 'user',
            content: message
        });

        // Call OpenAI API with complete conversation history
        const completion = await openai.chat.completions.create({
            model: process.env.MODEL || 'gpt-4',
            messages: messages,
            temperature: 0.7,
            max_tokens: 500 // Increased token limit to prevent cut-off responses
        });

        const response = completion.choices[0].message.content;
        res.json({ response });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('\x1b[33m%s\x1b[0m', 'Warning: OPENAI_API_KEY is not set in .env file');
    }
    console.log(`Server running at http://localhost:${port}`);
});
