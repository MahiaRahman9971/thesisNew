require('dotenv').config();
const OpenAI = require('openai');

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

    const { zipCode } = req.body;
    if (!zipCode) {
        return res.status(400).json({ error: 'ZIP code is required' });
    }

    try {
        const prompt = `For ZIP code ${zipCode}, provide ONLY this exact JSON structure with real data about the township or area:
        {
            "name": "string",
            "description": "string",
            "demographics": {
                "population": "number",
                "medianIncome": "string with dollar amount",
                "education": "string describing education levels"
            },
            "opportunities": {
                "jobs": "string describing job market",
                "education": "string describing educational opportunities",
                "housing": "string describing housing market"
            }
        }`;

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
            const jsonData = JSON.parse(content);
            res.status(200).json(jsonData);
        } catch (parseError) {
            console.error('Failed to parse OpenAI response:', content);
            res.status(500).json({ 
                error: true, 
                message: 'Failed to parse response',
                details: content.substring(0, 200)
            });
        }
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};
