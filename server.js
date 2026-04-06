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
      prompt = `Provide COMPREHENSIVE and DETAILED information about the ${animalType} breed: ${breedName}

Please provide extensive details in the following categories:

1. BREED OVERVIEW
   - Official breed name and classification
   - Origin and history
   - Size category (toy, small, medium, large, giant)
   - Life expectancy

2. PHYSICAL CHARACTERISTICS
   - Height range (in inches/cm)
   - Weight range (in lbs/kg)
   - Coat type, length, and colors
   - Distinctive physical features
   - Body structure and build

3. TEMPERAMENT & PERSONALITY
   - General personality traits
   - Energy level (low, moderate, high)
   - Sociability with people
   - Compatibility with children
   - Compatibility with other pets
   - Common behavioral traits

4. GROOMING REQUIREMENTS
   - Coat maintenance frequency
   - Brushing needs (daily, weekly, etc.)
   - Bathing frequency
   - Nail trimming requirements
   - Ear cleaning needs
   - Dental care
   - Professional grooming needs
   - Shedding level

5. EXERCISE & ACTIVITY
   - Daily exercise requirements (minutes/hours)
   - Exercise intensity level
   - Recommended activities (walking, running, playing, swimming)
   - Mental stimulation needs
   - Space requirements (apartment-friendly, needs yard, etc.)

6. DIETARY REQUIREMENTS
   - Typical daily food amount by weight
   - Recommended feeding frequency (puppies/kittens vs adults)
   - Nutritional needs (protein, fat content)
   - Foods to avoid
   - Common dietary sensitivities
   - Water requirements

7. HEALTH CONSIDERATIONS
   - Common genetic health issues
   - Breed-specific health concerns
   - Recommended health screenings
   - Vaccination schedule considerations
   - Average vet visit frequency
   - Health monitoring tips

8. TRAINING & INTELLIGENCE
   - Intelligence level
   - Trainability rating
   - Recommended training methods
   - Common training challenges
   - Socialization needs
   - Best age to start training

9. LIVING ENVIRONMENT
   - Ideal home type (apartment, house with yard, farm)
   - Climate tolerance (heat/cold)
   - Indoor vs outdoor preferences
   - Noise level
   - Good for first-time owners? (yes/no and why)

10. FUN FACTS & TRIVIA
    - Interesting historical facts
    - Famous examples of this breed
    - Unique abilities or talents
    - Breed popularity rankings

Format the response as JSON with these exact keys:
{
  "breed": "Full breed name",
  "overview": {
    "classification": "",
    "origin": "",
    "size": "",
    "lifespan": ""
  },
  "physicalCharacteristics": {
    "height": "",
    "weight": "",
    "coat": "",
    "colors": "",
    "distinctiveFeatures": "",
    "build": ""
  },
  "temperament": {
    "personality": "",
    "energyLevel": "",
    "sociability": "",
    "childFriendly": "",
    "petFriendly": "",
    "commonTraits": ""
  },
  "grooming": {
    "coatMaintenance": "",
    "brushing": "",
    "bathing": "",
    "nailTrimming": "",
    "earCleaning": "",
    "dentalCare": "",
    "professionalGrooming": "",
    "sheddingLevel": ""
  },
  "exercise": {
    "dailyRequirements": "",
    "intensity": "",
    "recommendedActivities": "",
    "mentalStimulation": "",
    "spaceNeeds": ""
  },
  "diet": {
    "dailyAmount": "",
    "feedingFrequency": "",
    "nutritionalNeeds": "",
    "foodsToAvoid": "",
    "sensitivities": "",
    "waterNeeds": ""
  },
  "health": {
    "commonIssues": "",
    "breedSpecificConcerns": "",
    "healthScreenings": "",
    "vaccinationNotes": "",
    "vetVisitFrequency": "",
    "monitoringTips": ""
  },
  "training": {
    "intelligenceLevel": "",
    "trainability": "",
    "recommendedMethods": "",
    "challenges": "",
    "socializationNeeds": "",
    "startingAge": ""
  },
  "environment": {
    "idealHome": "",
    "climateTolerance": "",
    "indoorOutdoor": "",
    "noiseLevel": "",
    "firstTimeOwner": ""
  },
  "funFacts": {
    "history": "",
    "famousExamples": "",
    "uniqueAbilities": "",
    "popularity": ""
  }
}`;

      messages = [
        {
          role: 'user',
          content: prompt
        }
      ];
    } 
    // Image-based detection
    else if (image) {
      prompt = `Analyze this pet image and provide COMPREHENSIVE and DETAILED information.

Please provide extensive details in the following categories:

1. BREED IDENTIFICATION & OVERVIEW
   - Specific breed name (or likely breeds if mixed)
   - What you observe in the image
   - Size category estimation
   - Approximate age if visible

2. PHYSICAL CHARACTERISTICS
   - Height range (in inches/cm)
   - Weight range (in lbs/kg)
   - Coat type, length, and colors visible
   - Distinctive physical features you can see
   - Body structure and build

3. TEMPERAMENT & PERSONALITY
   - General personality traits for this breed
   - Energy level (low, moderate, high)
   - Sociability with people
   - Compatibility with children
   - Compatibility with other pets

4. GROOMING REQUIREMENTS
   - Coat maintenance frequency
   - Brushing needs (daily, weekly, etc.)
   - Bathing frequency
   - Nail trimming requirements
   - Ear cleaning needs
   - Dental care
   - Professional grooming needs
   - Shedding level

5. EXERCISE & ACTIVITY
   - Daily exercise requirements (minutes/hours)
   - Exercise intensity level
   - Recommended activities
   - Mental stimulation needs
   - Space requirements

6. DIETARY REQUIREMENTS
   - Typical daily food amount by weight
   - Recommended feeding frequency
   - Nutritional needs (protein, fat content)
   - Foods to avoid
   - Common dietary sensitivities

7. HEALTH CONSIDERATIONS
   - Common genetic health issues
   - Breed-specific health concerns
   - Recommended health screenings
   - Health monitoring tips

8. TRAINING & INTELLIGENCE
   - Intelligence level
   - Trainability rating
   - Recommended training methods
   - Common training challenges
   - Socialization needs

9. LIVING ENVIRONMENT
   - Ideal home type
   - Climate tolerance
   - Indoor vs outdoor preferences
   - Good for first-time owners?

10. FUN FACTS
    - Interesting facts about this breed
    - Famous examples
    - Unique abilities

Format the response as JSON with these exact keys:
{
  "breed": "Identified breed name",
  "overview": {
    "observation": "",
    "classification": "",
    "size": "",
    "estimatedAge": ""
  },
  "physicalCharacteristics": {
    "height": "",
    "weight": "",
    "coat": "",
    "colors": "",
    "distinctiveFeatures": "",
    "build": ""
  },
  "temperament": {
    "personality": "",
    "energyLevel": "",
    "sociability": "",
    "childFriendly": "",
    "petFriendly": ""
  },
  "grooming": {
    "coatMaintenance": "",
    "brushing": "",
    "bathing": "",
    "nailTrimming": "",
    "earCleaning": "",
    "dentalCare": "",
    "professionalGrooming": "",
    "sheddingLevel": ""
  },
  "exercise": {
    "dailyRequirements": "",
    "intensity": "",
    "recommendedActivities": "",
    "mentalStimulation": "",
    "spaceNeeds": ""
  },
  "diet": {
    "dailyAmount": "",
    "feedingFrequency": "",
    "nutritionalNeeds": "",
    "foodsToAvoid": "",
    "sensitivities": ""
  },
  "health": {
    "commonIssues": "",
    "breedSpecificConcerns": "",
    "healthScreenings": "",
    "monitoringTips": ""
  },
  "training": {
    "intelligenceLevel": "",
    "trainability": "",
    "recommendedMethods": "",
    "challenges": "",
    "socializationNeeds": ""
  },
  "environment": {
    "idealHome": "",
    "climateTolerance": "",
    "indoorOutdoor": "",
    "firstTimeOwner": ""
  },
  "funFacts": ""
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
      max_tokens: 2500, // Increased for more detailed response
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
    const radius = 5000;
    
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