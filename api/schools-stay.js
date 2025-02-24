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
        const prompt = `For ZIP code ${zipCode}, provide ONLY this exact JSON structure with realistic school data:
        {
            "schools": [
                {
                    "id": "1",
                    "name": "School Name",
                    "type": "Public/Private/Charter",
                    "grades": "grade range",
                    "rating": "1-10 rating",
                    "address": "full address",
                    "distance": "distance in miles",
                    "demographics": {
                        "totalStudents": "number",
                        "studentTeacherRatio": "ratio",
                        "diversity": {
                            "white": "percentage",
                            "black": "percentage",
                            "hispanic": "percentage",
                            "asian": "percentage"
                        }
                    },
                    "academicPerformance": {
                        "mathProficiency": "percentage",
                        "readingProficiency": "percentage",
                        "graduationRate": "percentage"
                    },
                    "programs": [
                        "program1",
                        "program2",
                        "program3"
                    ],
                    "contact": {
                        "phone": "phone number",
                        "email": "email",
                        "website": "website"
                    }
                }
            ]
        }
        
        Important rules:
        1. Return EXACTLY 3-4 schools
        2. Make all schools specific to ${zipCode} area
        3. Use realistic school names and addresses
        4. Include a mix of school types (public, private, charter)
        5. Make sure all percentages add up correctly
        6. Use realistic ratings and statistics`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a JSON API that returns information about schools. Always respond with valid JSON data only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1500
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
