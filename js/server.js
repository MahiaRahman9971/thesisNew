require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1'
});

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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
        console.error('OpenAI API Error:', error);
        return { 
            error: true, 
            message: 'API error', 
            details: error.message 
        };
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

// Endpoint to get school data for staying
app.post('/api/schools-stay', async (req, res) => {
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

// Endpoint to get school data for moving
app.post('/api/schools-move', async (req, res) => {
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
        if (typeof response === "string") {
            schools = JSON.parse(response);
        } else {
            schools = response; // It's already an object, no need to parse
        }
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
        const prompt = `For ZIP code ${zipCode}, provide ONLY this exact JSON structure with real data:
    {
        "programs": [
            {
                "id": 1,
                "name": "Program Name",
                "category": "education/support/enrichment/etc",
                "description": "Brief description of the program",
                "contact": "Contact information"
            }
        ]
    }
    Return at least 3 programs with realistic data.`;
        
        const response = await getOpenAIResponse(prompt);
        
        // Ensure we have the correct data structure
        if (!response || !response.programs || !Array.isArray(response.programs)) {
            console.error('Invalid programs data structure:', response);
            res.status(500).json({ 
                error: 'Invalid data structure received',
                programs: [] 
            });
            return;
        }

        // Validate each program object
        const validatedPrograms = response.programs.map(program => ({
            id: program.id || Math.floor(Math.random() * 1000),
            name: program.name || 'Unnamed Program',
            category: program.category || 'general',
            description: program.description || 'No description available',
            contact: program.contact || 'Contact information not available'
        }));
        
        res.json({ programs: validatedPrograms });
    } catch (error) {
        console.error('Programs API Error:', error);
        res.status(500).json({ 
            error: 'Error fetching program data',
            programs: [] 
        });
    }
});

// Endpoint to get township information
app.post('/api/township', async (req, res) => {
    const { zipCode } = req.body;
    try {
        const prompt = `For zip code ${zipCode}, provide ONLY this exact JSON structure with real data:
{
    "townshipName": "Name of the township/city",
    "description": [
        "Key point about the community",
        "Important fact about local services",
        "Notable aspect of quality of life",
        "Information about recreation or culture",
        "Detail about economic or educational opportunities"
    ],
    "websiteUrl": "Official township/city website URL (must be a valid URL starting with http:// or https://)"
}
Ensure the description array contains 4-5 concise bullet points about the township.`;
        
        const response = await getOpenAIResponse(prompt);
        
        // Ensure description is an array
        if (!Array.isArray(response.description)) {
            response.description = [response.description];
        }
        
        // Validate and format website URL
        if (response.websiteUrl && !response.websiteUrl.startsWith('http')) {
            response.websiteUrl = 'https://' + response.websiteUrl;
        }
        
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

// Endpoint to save selected programs
app.post('/api/save-programs', async (req, res) => {
    const { zipCode, selectedPrograms } = req.body;
    
    if (!Array.isArray(selectedPrograms)) {
        return res.status(400).json({ 
            error: 'Invalid data format',
            message: 'Selected programs must be an array'
        });
    }

    try {
        // Here you would typically save to a database
        // For now, we'll just send a success response
        res.json({ 
            success: true,
            message: 'Programs saved successfully',
            savedPrograms: selectedPrograms
        });
    } catch (error) {
        console.error('Error saving programs:', error);
        res.status(500).json({ 
            error: 'Failed to save programs',
            message: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
