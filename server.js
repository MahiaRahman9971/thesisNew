require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Helper function to get data from OpenAI
async function getOpenAIResponse(prompt) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a JSON API that returns structured data about townships, schools, and community programs. Always respond with valid JSON data only, no conversation or explanations."
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
        // Ensure we have valid JSON
        try {
            return JSON.parse(content);
        } catch (error) {
            console.error('Invalid JSON from OpenAI:', content);
            // Return a default structure if the response is invalid
            return {
                error: "Invalid response format",
                message: "Please try again"
            };
        }
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw error;
    }
}

// Endpoint to get neighborhood data
app.post('/api/neighborhoods', async (req, res) => {
    const { zipCode } = req.body;
    try {
        const prompt = `Given the ZIP code ${zipCode}, provide a JSON array of the top 5 neighborhoods in or near this area. 
            Include for each neighborhood: name, description (2-3 sentences about key features), and walkScore (0-100).
            Format the response as valid JSON. Only return the JSON array, no other text.`;
        
        const response = await getOpenAIResponse(prompt);
        const neighborhoods = response;
        res.json(neighborhoods);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching neighborhood data' });
    }
});

// Endpoint to get school data
app.post('/api/schools', async (req, res) => {
    const { zipCode, childAge } = req.body;
    try {
        // Determine school type based on age
        let schoolLevel;
        if (childAge < 5) {
            schoolLevel = 'preschool';
        } else if (childAge >= 5 && childAge <= 10) {
            schoolLevel = 'elementary';
        } else if (childAge >= 11 && childAge <= 13) {
            schoolLevel = 'middle';
        } else {
            schoolLevel = 'high';
        }

        const prompt = `For zip code ${zipCode}, provide ONLY this exact JSON structure with real data for ${schoolLevel} schools:
{
    "schools": [
        {
            "id": 1,
            "name": "School Name",
            "type": "${schoolLevel}",
            "gradeLevel": "specific grades (e.g., K-5 for elementary)",
            "rating": 4,
            "description": "Brief description of strengths/weaknesses"
        }
    ]
}
Return at least 3 schools. The rating should be a number between 1 and 5.`;
        
        const response = await getOpenAIResponse(prompt);
        
        // Ensure we have the correct data structure
        if (!response.schools || !Array.isArray(response.schools)) {
            console.error('Invalid schools data structure:', response);
            response.schools = [];
        }
        
        res.json(response);
    } catch (error) {
        console.error('School API Error:', error);
        res.status(500).json({ 
            error: 'Error fetching school data',
            schools: [] 
        });
    }
});

// Endpoint to get community programs
app.post('/api/programs', async (req, res) => {
    const { zipCode } = req.body;
    try {
        const prompt = `Given ZIP code ${zipCode}, provide a JSON array of 6 community programs available in or near this area.
            Include various types: educational, sports, arts, academic support, etc.
            For each program include: name, type, ageRange (array with min and max age), description (2 sentences), and schedule (brief text).
            Format the response as valid JSON. Only return the JSON array, no other text.`;
        
        const response = await getOpenAIResponse(prompt);
        const programs = response;
        res.json(programs);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching program data' });
    }
});

// Endpoint to get township information
app.post('/api/township', async (req, res) => {
    const { zipCode } = req.body;
    try {
        const prompt = `For zip code ${zipCode}, provide ONLY this exact JSON structure with real data:
{
    "townshipName": "Name of the township/city",
    "description": "A detailed description of the area, focusing on community aspects",
    "websiteUrl": "Official township/city website URL"
}`;
        
        const response = await getOpenAIResponse(prompt);
        res.json(response);
    } catch (error) {
        console.error('Township API Error:', error);
        res.status(500).json({ error: 'Error fetching township data' });
    }
});

// Endpoint to get community programs
app.post('/api/community-programs', async (req, res) => {
    const { zipCode } = req.body;
    try {
        const prompt = `For zip code ${zipCode}, provide ONLY this exact JSON structure with real data:
{
    "programs": [
        {
            "id": 1,
            "name": "Program Name",
            "category": "education/enrichment/support",
            "description": "Program description",
            "contact": "Contact information"
        }
    ]
}`;
        
        const response = await getOpenAIResponse(prompt);
        res.json(response);
    } catch (error) {
        console.error('Programs API Error:', error);
        res.status(500).json({ error: 'Error fetching program data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
