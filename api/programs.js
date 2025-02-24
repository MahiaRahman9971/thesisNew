const { OpenAI } = require('openai');
require('dotenv').config();
const express = require('express');

const app = express();

app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse request body
    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const { zipCode } = body;
    if (!zipCode) {
        return res.status(400).json({ error: 'ZIP code is required' });
    }

    try {
        const prompt = `For ZIP code ${zipCode}, provide ONLY this exact JSON structure with realistic community programs data:
        {
            "programs": [
                {
                    "id": "1",
                    "name": "Program Name",
                    "description": "Program description (2-3 sentences)",
                    "type": "education/sports/arts/community",
                    "ageRange": "age range",
                    "location": "Location name and brief address",
                    "contact": {
                        "phone": "phone number",
                        "email": "email",
                        "website": "website"
                    }
                }
            ]
        }
        
        Important rules:
        1. Return EXACTLY 3-4 relevant programs
        2. Make all programs specific to ${zipCode} area
        3. Use realistic program names and locations
        4. Include diverse program types (mix of education, sports, arts, etc.)
        5. Ensure contact information follows standard formats
        6. Make descriptions informative but concise`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a JSON API that returns information about community programs. Always respond with valid JSON data only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const content = completion.choices[0].message.content;
        const data = JSON.parse(content);

        if (!data || !data.programs) {
            throw new Error('Invalid response format from AI');
        }

        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch programs',
            details: error.message 
        });
    }
};
