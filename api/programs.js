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
        const prompt = `For ZIP code ${zipCode}, provide ONLY this exact JSON structure with realistic community programs data:
        {
            "programs": [
                {
                    "id": "1",
                    "name": "After School Learning Center",
                    "description": "Academic support and enrichment activities for K-12 students",
                    "type": "education",
                    "ageRange": "5-18",
                    "location": "Local Community Center",
                    "contact": {
                        "phone": "(555) 123-4567",
                        "email": "info@aslc.org",
                        "website": "www.aslc.org"
                    }
                }
            ]
        }`;

        const completion = await openai.chat.completions.create({
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
            temperature: 0.3
        });

        const content = completion.choices[0].message.content;
        
        try {
            const data = JSON.parse(content);
            if (!data || !data.programs) {
                throw new Error('Invalid response format from AI');
            }
            res.json(data);
        } catch (parseError) {
            console.error('Failed to parse OpenAI response:', content);
            res.status(500).json({ 
                error: 'Failed to parse programs data',
                details: parseError.message 
            });
        }
    } catch (error) {
        console.error('Error fetching community programs:', error);
        res.status(500).json({ 
            error: 'Failed to fetch community programs',
            details: error.message 
        });
    }
};
