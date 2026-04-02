import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Whisk Backend is running!' });
});

// Breed detection endpoint
app.post('/api/detect-breed', async (req, res) => {
  try {
    const { image, breedName, animalType } = req.body;
    let prompt;
    let messages;

    // Manual breed entry (no image)
    if (breedName) {
      prompt = `Provide comprehensive information about the ${animalType} breed: ${breedName}

Please provide:
1. Breed confirmation and overview
2. Physical characteristics
3. Temperament and personality
4. Care requirements (grooming, exercise, diet)
5. Health considerations
6. Living environment needs
7. Training tips
8. Fun facts

Format the response as JSON with these keys:
{
  "breed": "breed name",
  "description": "brief overview",
  "characteristics": "physical traits",
  "temperament": "personality description",
  "care": "care requirements",
  "health": "health information",
  "environment": "ideal living conditions",
  "training": "training advice",
  "funFacts": "interesting facts"
}`;

      messages = [
        {
          role: 'user',
          content: prompt
        }
      ];
    } 
    // Image-based detection (existing code)
    else if (image) {
      prompt = `Analyze this pet image and provide comprehensive information.

Please provide:
1. Breed identification (be specific, if mixed breed mention likely breeds)
2. Physical characteristics you observe
3. General temperament for this breed
4. Care requirements (grooming, exercise, diet)
5. Health considerations
6. Living environment needs
7. Training tips
8. Fun facts about the breed

Format the response as JSON with these keys:
{
  "breed": "identified breed",
  "description": "what you see in the image",
  "characteristics": "physical traits",
  "temperament": "personality description",
  "care": "care requirements",
  "health": "health information",
  "environment": "ideal living conditions",
  "training": "training advice",
  "funFacts": "interesting facts"
}`;

      messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${image}`
              }
            }
          ]
        }
      ];
    } else {
      return res.status(400).json({ error: 'Either image or breedName is required' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const breedInfo = JSON.parse(jsonMatch[0]);
      res.json(breedInfo);
    } else {
      res.json({ breed: 'Unknown', description: content });
    }

  } catch (error) {
    console.error('Error detecting breed:', error);
    res.status(500).json({ error: 'Failed to analyze breed' });
  }
});

// Nearby vets endpoint
app.get('/api/nearby-vets', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    const radius = 5000; // 5km radius
    
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=veterinary_care&key=${googleApiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      const vets = data.results.map(place => ({
        name: place.name,
        address: place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        place_id: place.place_id,
      }));

      res.json({ vets });
    } else {
      res.status(500).json({ error: 'Failed to fetch nearby vets' });
    }

  } catch (error) {
    console.error('Error finding vets:', error);
    res.status(500).json({ error: 'Failed to find nearby vets' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});