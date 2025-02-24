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
        // Return mock data
        const mockData = {
            "township": {
                "name": "Cambridge Township",
                "population": 120000,
                "medianIncome": 95000,
                "demographics": {
                    "white": 45,
                    "black": 25,
                    "hispanic": 20,
                    "asian": 10
                },
                "education": {
                    "highSchoolOrHigher": 95,
                    "bachelorOrHigher": 75
                },
                "amenities": {
                    "parks": 8,
                    "libraries": 3,
                    "communityCenter": true,
                    "publicTransport": true
                },
                "description": [
                    "Vibrant university town with rich cultural diversity",
                    "Strong focus on education and innovation",
                    "Active community events and programs",
                    "Excellent public transportation system"
                ],
                "websiteUrl": "www.cambridgema.gov"
            }
        };

        res.json(mockData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch township info',
            details: error.message 
        });
    }
};
