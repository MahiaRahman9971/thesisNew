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
        const prompt = `For ZIP code ${zipCode}, provide ONLY this exact JSON structure with realistic school data:
        {
            "schools": [
                {
                    "id": "1",
                    "name": "Sample Elementary School",
                    "type": "Public",
                    "grades": "K-5",
                    "rating": 8,
                    "address": "123 School St",
                    "distance": "0.5 miles",
                    "demographics": {
                        "totalStudents": 500,
                        "studentTeacherRatio": "15:1",
                        "diversity": {
                            "white": 40,
                            "black": 25,
                            "hispanic": 20,
                            "asian": 15
                        }
                    },
                    "academicPerformance": {
                        "mathProficiency": 85,
                        "readingProficiency": 88,
                        "graduationRate": 95
                    },
                    "programs": [
                        "Special Education",
                        "Gifted Program",
                        "ESL Support"
                    ],
                    "contact": {
                        "phone": "(555) 123-4567",
                        "email": "info@school.edu",
                        "website": "www.school.edu"
                    }
                }
            ]
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
        
        if (!data || !data.schools) {
            throw new Error('Invalid response format from AI');
        }

        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch schools',
            details: error.message 
        });
    }
};
