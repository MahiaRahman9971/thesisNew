require('dotenv').config();
const OpenAI = require('openai');

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
        const prompt = `For ZIP code ${zipCode}, provide ONLY this exact JSON structure with realistic township/neighborhood data:
        {
            "township": {
                "name": "Sample Township",
                "population": 50000,
                "medianIncome": 75000,
                "demographics": {
                    "white": 45,
                    "black": 25,
                    "hispanic": 20,
                    "asian": 10
                },
                "education": {
                    "highSchoolOrHigher": 90,
                    "bachelorOrHigher": 45
                },
                "amenities": {
                    "parks": 5,
                    "libraries": 2,
                    "communityCenter": true,
                    "publicTransport": true
                }
            }
        }`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a JSON API. Always respond with valid JSON data only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3
        });

        const content = completion.choices[0].message.content;
        const data = JSON.parse(content);

        if (!data || !data.township) {
            throw new Error('Invalid response format from AI');
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching township data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch township data',
            details: error.message 
        });
    }
};
