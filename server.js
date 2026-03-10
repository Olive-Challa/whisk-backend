// server.js
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
  apiKey: process.env.OPENAI_API_KEY
});

// Breed detection endpoint with comprehensive care info
app.post('/api/breed', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and identify the pet breed. Return ONLY a JSON object with this exact structure:
{
  "animal": "dog" or "cat",
  "breed": "specific breed name",
  "confidence": 0-100 number,
  "characteristics": ["trait1", "trait2", "trait3"],
  "size": "small/medium/large",
  "temperament": "brief description",
  "care_level": "low/moderate/high",
  "grooming": {
    "frequency": "daily/weekly/bi-weekly/monthly",
    "requirements": "Detailed grooming needs including brushing, bathing, nail trimming, ear cleaning, and dental care",
    "professional_grooming": "Recommendation for professional grooming frequency",
    "coat_type": "Description of coat type and special care needs"
  },
  "diet": {
    "type": "Recommended food type (dry kibble, wet food, raw, etc.)",
    "amount": "Daily feeding amount based on average adult weight",
    "frequency": "Number of meals per day",
    "special_notes": "Dietary considerations, allergies, or breed-specific needs"
  },
  "exercise": {
    "daily_minutes": "Recommended daily exercise duration",
    "intensity": "low/moderate/high",
    "activities": ["suitable activity 1", "suitable activity 2", "suitable activity 3"],
    "notes": "Exercise considerations and warnings"
  },
  "vaccines": {
    "core_vaccines": ["Rabies", "Distemper", "Parvovirus", etc.],
    "optional_vaccines": ["Bordetella", "Lyme", etc. based on breed],
    "puppy_kitten_schedule": "Initial vaccination timeline (6-8 weeks, 10-12 weeks, etc.)",
    "adult_schedule": "Annual or tri-annual booster recommendations",
    "notes": "Any breed-specific vaccine considerations"
  },
  "health_considerations": {
    "common_issues": ["Issue 1", "Issue 2"],
    "preventive_care": "Recommended preventive measures",
    "lifespan": "Average lifespan range"
  }
}

If no dog or cat is detected, return:
{
  "error": "No dog or cat detected in image"
}

Be specific and comprehensive. For mixed breeds, identify prominent breeds and provide care info for the mix.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    
    let breedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        breedData = JSON.parse(jsonMatch[0]);
      } else {
        breedData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return res.status(500).json({ 
        error: 'Failed to parse breed information',
        rawResponse: content 
      });
    }

    res.json(breedData);

  } catch (error) {
    console.error('Breed detection error:', error);
    res.status(500).json({ 
      error: 'Failed to detect breed',
      details: error.message 
    });
  }
});

// Manual breed info endpoint with personalization
app.post('/api/breed-manual', async (req, res) => {
  try {
    const { breed, animal, imageBase64, personalizedInfo } = req.body;

    if (!animal) {
      return res.status(400).json({ error: 'Animal type required' });
    }

    // Build personalized context
    let personalizedContext = "";
    if (personalizedInfo) {
      personalizedContext = `
      
PERSONALIZE THE RECOMMENDATIONS based on this specific pet:
- Age: ${personalizedInfo.age}
- Weight: ${personalizedInfo.weight}
- Activity Level: ${personalizedInfo.activityLevel}
- Health Concerns: ${personalizedInfo.healthIssues}

Adjust diet portions, exercise intensity, and health monitoring based on these factors.`;
    }

    const breedContext = breed && breed !== "Unknown breed - please identify" 
      ? `for a ${breed} ${animal}` 
      : `for the ${animal} in this image (identify the breed first)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            ...(imageBase64 ? [{
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }] : []),
            {
              type: "text",
              text: `Provide comprehensive, personalized care information ${breedContext}. ${personalizedContext}

Return ONLY a JSON object with this structure:
{
  "animal": "${animal}",
  "breed": "Identified or provided breed name",
  "confidence": 100,
  "characteristics": ["trait1", "trait2", "trait3"],
  "size": "small/medium/large",
  "temperament": "brief description",
  "care_level": "low/moderate/high",
  "grooming": {
    "frequency": "daily/weekly/bi-weekly/monthly",
    "requirements": "Detailed grooming needs tailored to THIS pet's age and condition",
    "professional_grooming": "Recommendation based on coat type and owner capability",
    "coat_type": "Description of coat type",
    "special_notes": "Age-specific or health-specific grooming considerations"
  },
  "diet": {
    "type": "Recommended food type for this age and activity level",
    "amount": "PERSONALIZED daily feeding amount based on actual weight: ${personalizedInfo?.weight || 'average'}",
    "frequency": "Meals per day adjusted for age",
    "special_notes": "Address any mentioned health concerns: ${personalizedInfo?.healthIssues || 'none'}",
    "supplements": "Recommended supplements for age/health issues if applicable"
  },
  "exercise": {
    "daily_minutes": "Adjusted for age and activity level: ${personalizedInfo?.activityLevel || 'moderate'}",
    "intensity": "Appropriate intensity for this pet's condition",
    "activities": ["age-appropriate activity 1", "activity 2", "activity 3"],
    "notes": "IMPORTANT considerations for ${personalizedInfo?.age || 'this age'} and ${personalizedInfo?.healthIssues || 'general health'}"
  },
  "vaccines": {
    "core_vaccines": ["Essential vaccines"],
    "optional_vaccines": ["Recommended based on lifestyle"],
    "current_schedule": "What vaccines are due based on age: ${personalizedInfo?.age || 'unknown age'}",
    "next_due": "When next vaccines are needed",
    "notes": "Age-specific vaccine considerations"
  },
  "health_considerations": {
    "common_issues": ["Breed-specific issues to monitor"],
    "age_related": "Concerns specific to ${personalizedInfo?.age || 'this life stage'}",
    "preventive_care": "Tailored preventive measures",
    "monitoring": "What to watch for given: ${personalizedInfo?.healthIssues || 'general health'}",
    "lifespan": "Average lifespan"
  }
}

Be specific, practical, and personalize ALL recommendations to this individual pet.`
            }
          ]
        }
      ],
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    
    let breedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        breedData = JSON.parse(jsonMatch[0]);
      } else {
        breedData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return res.status(500).json({ 
        error: 'Failed to get breed information',
        rawResponse: content 
      });
    }

    res.json(breedData);

  } catch (error) {
    console.error('Manual breed info error:', error);
    res.status(500).json({ 
      error: 'Failed to get breed information',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Nearby vets endpoint
app.get('/api/nearby-vets', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    // Google Places API endpoint
    const radius = 5000; // 5km radius
    const type = 'veterinary_care';
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not set');
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status);
      return res.status(500).json({ error: 'Failed to fetch nearby vets' });
    }

    const vets = data.results.map(place => ({
      name: place.name,
      address: place.vicinity,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      place_id: place.place_id,
      distance: calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng),
    }));

    res.json({ vets });
  } catch (error) {
    console.error('Nearby vets error:', error);
    res.status(500).json({ error: 'Failed to find nearby vets' });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  }
  return `${distance.toFixed(1)}km away`;
}
app.listen(PORT, () => {
  console.log(` Breed detection server running on port ${PORT}`);
  console.log(` Ready to detect breeds with comprehensive care info!`);
});