require('dotenv').config();
const OpenAI = require('openai');
const cors = require('cors');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Helper function to get data from OpenAI
async function getOpenAIResponse(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a JSON API. Always respond with valid JSON data only. Never include explanations or markdown formatting.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
        });

        const content = response.choices[0].message.content;
        
        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error('Failed to parse OpenAI response:', content);
            return { 
                error: true, 
                message: 'Failed to parse response',
                details: content.substring(0, 200)
            };
        }
    } catch (error) {
        console.error('OpenAI API error:', error);
        return {
            error: true,
            message: error.message
        };
    }
}

// API handler for Vercel
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { zipCode, endpoint } = req.body;

    if (!zipCode) {
        return res.status(400).json({ error: 'ZIP code is required' });
    }

    try {
        let prompt;
        if (endpoint === 'neighborhoods') {
            prompt = `For ZIP code ${zipCode}, provide ONLY this exact JSON structure with real data:
            {
                "neighborhoods": [
                    {
                        "name": "string",
                        "description": "string",
                        "safetyRating": "number 1-10",
                        "amenities": ["string array of nearby amenities"],
                        "averageRent": "string with dollar amount",
                        "transitScore": "number 1-10"
                    }
                ]
            }`;
        } else if (endpoint === 'programs') {
            prompt = `For ZIP code ${zipCode}, provide ONLY this exact JSON structure with real data:
            {
                "programs": [
                    {
                        "name": "string",
                        "organization": "string",
                        "description": "string",
                        "eligibility": "string",
                        "contact": {
                            "phone": "string",
                            "email": "string",
                            "website": "string"
                        },
                        "location": "string"
                    }
                ]
            }`;
        } else {
            return res.status(400).json({ error: 'Invalid endpoint' });
        }

        const data = await getOpenAIResponse(prompt);
        res.status(200).json(data);
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
