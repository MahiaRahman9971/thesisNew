require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const port = 3000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Helper function to get data from OpenAI
async function getOpenAIResponse(prompt) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        });
        return completion.choices[0].message.content;
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
        const neighborhoods = JSON.parse(response);
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

        const prompt = `
        Given ZIP code ${zipCode} and a child age of ${childAge} (${schoolLevel} school level), provide a JSON array of 5 relevant ${schoolLevel} schools in or very close to this ZIP code.

        Follow these strict school type rules:
        - Preschool: Ages 3-4
        - Elementary School: Ages 5-10
        - Middle School: Ages 11-13
        - High School: Ages 14-18

        The child is ${childAge} years old, so ONLY return ${schoolLevel} schools.

        For each school, use the following JSON structure:
        {
        "name": "School Name",
        "type": "${schoolLevel}",
        "gradeRange": "specific grades (e.g., K-5 for elementary)",
        "rating": 1-10,
        "description": "2-3 sentences about the school's features",
        "distance": "distance in miles from ZIP code"
        }

        Distance Rules:
        - If the school is in the exact same ZIP code, the distance must be less than 1 mile.
        - If the school is nearby (e.g., a neighboring ZIP code or within a few miles), provide a realistic mileage (e.g., 1 to 5 miles).
        - Do not show large distances for schools allegedly in the same ZIP code.

        Return ONLY a valid JSON array with no extra text or explanation.
        `;
        
        const response = await getOpenAIResponse(prompt);
        const schools = JSON.parse(response);
        res.json(schools);
    } catch (error) {
        console.error('School API Error:', error);
        res.status(500).json({ error: 'Error fetching school data' });
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
        const programs = JSON.parse(response);
        res.json(programs);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching program data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
