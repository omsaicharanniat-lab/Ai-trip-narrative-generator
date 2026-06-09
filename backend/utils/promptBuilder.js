/**
 * Builds a rich, structured prompt for the Gemini AI model
 * to generate engaging travel blog narratives.
 */

const TONE_GUIDES = {
  Adventurous:
    'Use bold, exciting, action-packed language. Evoke a sense of thrill and exploration with vivid imagery and strong action verbs. Every sentence should pulse with energy.',
  Poetic:
    'Write in a lyrical, evocative style. Use metaphors, similes, and rich sensory descriptions. Paint pictures with words and let the landscape breathe through the prose.',
  Informative:
    'Write in a friendly, detailed, and practical tone. Share insider tips, historical context, and useful information about each place. Balance facts with personal warmth.',
  Humorous:
    'Use light-hearted humor, witty observations, playful comparisons, and fun anecdotes. Make readers smile while still painting a beautiful picture of the journey.',
};

const VEHICLE_DESCRIPTIONS = {
  Sedan: 'a comfortable sedan',
  SUV: 'a spacious SUV',
  'Tempo Traveller': 'a Tempo Traveller perfect for groups',
  'Luxury Sedan': 'a premium luxury sedan',
  'Innova Crysta': 'an Innova Crysta',
};

/**
 * @param {Object} data
 * @param {string} data.driverName
 * @param {string} data.route
 * @param {string} data.landmarks
 * @param {string} data.highlights
 * @param {string} data.tripDate
 * @param {string} data.vehicleType
 * @param {string} data.tone
 * @returns {string} The complete prompt string
 */
function buildTravelPrompt({ driverName, route, landmarks, highlights, tripDate, vehicleType, tone }) {
  const formattedDate = tripDate
    ? new Date(tripDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'a recent sun-soaked morning';

  const vehicleDesc = VEHICLE_DESCRIPTIONS[vehicleType] || vehicleType;
  const toneGuide = TONE_GUIDES[tone] || TONE_GUIDES['Adventurous'];

  return `You are a celebrated travel blogger writing for Manivtha Tours & Travels, a premium chauffeur-driven car rental company based in Hyderabad, India known for memorable road trips across South India.

TASK: Write a captivating, shareable travel blog post based on the trip details below.

═══════════════════════════════════════
TRIP DETAILS
═══════════════════════════════════════
Chauffeur / Staff : ${driverName}
Route             : ${route}
Date              : ${formattedDate}
Vehicle           : ${vehicleDesc}
Landmarks Visited : ${landmarks || 'various scenic spots along the way'}
Trip Highlights   : ${highlights || 'a smooth, memorable journey'}
═══════════════════════════════════════

WRITING STYLE: ${toneGuide}

STRICT REQUIREMENTS:
1. Output ONLY the blog post — no explanations, no meta-commentary.
2. First line MUST be: # [Your catchy, SEO-friendly title here]
3. Word count: 450–600 words
4. Structure:
   - Irresistible opening hook (a vivid scene, surprising fact, or bold question)
   - 2–3 body sections with ## subheadings
   - Weave in ALL landmarks and highlights naturally (never as a list)
   - Mention Manivtha Tours & Travels authentically 1–2 times (not as an advertisement — as part of the story)
   - End with an inspiring call-to-action inviting readers to book a similar journey
5. Use first-person plural ("We set off...", "Our journey...") to feel personal
6. Include at least 3 sensory details (sight, sound, smell, taste, or touch)
7. Every sentence must serve the narrative — no filler phrases

The blog post must feel like it was written by someone who genuinely lived this journey.`;
}

module.exports = { buildTravelPrompt };
