// server.js

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = 3000;

// Use CORS to allow requests from your frontend
app.use(cors());
// Use express.json() to parse JSON request bodies
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

// Create a single endpoint to handle quote requests
app.post('/get-rap-quote', async (req, res) => {
    try {
        const userQuestion = req.body.question || "something about life";

        const prompt = `
        You are The Rap Oracle. A user has asked you a question.
        Your task is to respond with a short, four-line rap quote that is insightful, funny, or philosophical, and loosely related to the user's question.
        Do NOT greet the user, just provide the quote.
        Attribute the quote to a cool, fictional rapper name you invent.
        
        User's Question: "${userQuestion}"

        Format your response as a JSON object with two keys: "quote" and "artist".
        For example: {"quote": "The hustle's real, the grind is steep, / But dreams ain't cheap, while the city sleeps.", "artist": "MC Flowstate"}
        `;

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.json();
        const aiResponseText = data.candidates[0].content.parts[0].text;

        // --- NEW CLEANING STEP STARTS HERE ---
        // The AI can wrap the JSON in ```json ... ```. We must extract the pure JSON string.
        // This regex finds the first curly brace and matches everything until the last curly brace.
        const match = aiResponseText.match(/{[\s\S]*}/);

        if (!match) {
            // This will happen if the AI responds with something that isn't JSON at all.
            console.error("AI Response was not valid JSON:", aiResponseText);
            throw new Error("No valid JSON object found in the AI's response.");
        }

        const jsonString = match[0];
        // --- NEW CLEANING STEP ENDS HERE ---

        // Now, we parse the CLEANED string, not the raw response.
        const aiJson = JSON.parse(jsonString);
        
        res.json(aiJson);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ quote: 'The Oracle is silent... something went wrong.', artist: 'System Error' });
    }
});

app.listen(PORT, () => {
  console.log(`Rap Bot server listening on http://localhost:${PORT}`);
});
