const { OpenAI } = require('openai');
require('dotenv').config();

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
        const prompt = `For ZIP code ${zipCode}, provide ONLY this exact JSON structure with realistic township/neighborhood data:
        {
            "township": {
                "name": "Township/Neighborhood Name",
                "population": "number",
                "medianIncome": "number",
                "demographics": {
                    "white": "percentage",
                    "black": "percentage",
                    "hispanic": "percentage",
                    "asian": "percentage"
                },
                "education": {
                    "highSchoolOrHigher": "percentage",
                    "bachelorOrHigher": "percentage"
                },
                "amenities": {
                    "parks": "number",
                    "libraries": "number",
                    "communityCenter": "boolean",
                    "publicTransport": "boolean"
                },
                "description": [
                    "key feature 1",
                    "key feature 2",
                    "key feature 3",
                    "key feature 4"
                ],
                "websiteUrl": "url"
            }
        }
        
        Important rules:
        1. Use realistic data for ${zipCode} area
        2. Make sure all percentages add up correctly
        3. Use realistic population and income numbers
        4. Include 4-5 key features that highlight the area's unique characteristics
        5. Ensure all amenity counts are realistic for the area size`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a JSON API that returns information about townships and neighborhoods. Always respond with valid JSON data only."
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

        if (!data || !data.township) {
            throw new Error('Invalid response format from AI');
        }

        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch township info',
            details: error.message 
        });
    }
};
