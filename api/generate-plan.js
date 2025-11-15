// Netlify Serverless Function - Generate Training Plan with Claude API
// File: api/generate-plan.js

const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse request body
    const userData = JSON.parse(event.body);

    // Validate required fields
    if (!userData.name || !userData.experience || !userData.sessionsPerWeek) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build the prompt for Claude
    const prompt = buildTrainingPlanPrompt(userData);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 1,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the generated plan
    const planText = message.content[0].text;

    // Parse the JSON response from Claude
    let trainingPlan;
    try {
      // Claude might wrap JSON in markdown code blocks
      const jsonMatch = planText.match(/```json\n([\s\S]*?)\n```/) || 
                       planText.match(/```\n([\s\S]*?)\n```/) ||
                       [null, planText];
      
      trainingPlan = JSON.parse(jsonMatch[1] || planText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to parse training plan',
          raw: planText.substring(0, 500) // First 500 chars for debugging
        }),
      };
    }

    // Return the generated plan
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        plan: trainingPlan,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'claude-sonnet-4-20250514',
          tokensUsed: message.usage.output_tokens,
        },
      }),
    };

  } catch (error) {
    console.error('Error generating plan:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate training plan',
        message: error.message,
      }),
    };
  }
};

// Helper function to build the Claude prompt
function buildTrainingPlanPrompt(userData) {
  const experienceDescriptions = {
    beginner: 'beginner (0-10 km/week, weinig ervaring)',
    intermediate: 'gemiddeld (10-25 km/week, regelmatig)',
    advanced: 'gevorderd (25+ km/week, ervaren loper)',
  };

  const goalDescriptions = {
    finish: 'gewoon finishen',
    time: `finishen in ${userData.targetTime}`,
    pr: `een persoonlijk record halen ${userData.targetTime ? `(${userData.targetTime})` : ''}`,
  };

  return `Je bent een expert marathontrainer. Genereer een volledig gepersonaliseerd 45-weken trainingsschema voor de Loch Ness Marathon op ${userData.raceDate || '27 september 2026'}.

GEBRUIKER PROFIEL:
- Naam: ${userData.name}
- Niveau: ${experienceDescriptions[userData.experience] || userData.experience}
- Huidige volume: ${userData.currentKm || 0} km per week
- Langste recente loop: ${userData.longestRun || 0} minuten
- Beschikbaarheid: ${userData.sessionsPerWeek} trainingen per week
- Tijd per sessie: ${userData.timePerSession || 60}+ minuten
- Doel: ${goalDescriptions[userData.goal] || userData.goal}
${userData.targetTime ? `- Doeltijd: ${userData.targetTime}` : ''}
${userData.crossTrain && userData.crossTrain.length > 0 ? `- Cross-training voorkeuren: ${userData.crossTrain.join(', ')}` : ''}
${userData.medications && userData.medications.length > 0 && !userData.medications.includes('none') ? `- Medicatie: ${userData.medications.join(', ')}` : ''}
${userData.injuries ? `- Blessure geschiedenis: ${userData.injuries}` : ''}
${userData.notes ? `- Overige aandachtspunten: ${userData.notes}` : ''}

KRITIEKE VEREISTEN:
1. Strikte 10%-regel: verhoog de langste loop NOOIT meer dan 10% ten opzichte van de langste loop van de afgelopen 30 dagen
2. Deload weken: elke 4e week in fase 1-2, elke 3-4 weken in fase 3-4
3. Talk-test intensiteit voor Z2 training
4. WHO/ACSM richtlijnen: minimaal 2x per week krachttraining
5. Graduele opbouw van 0 naar marathon afstand over 45 weken
${userData.medications && userData.medications.includes('statin') ? '6. Extra aandacht voor herstel vanwege statines - vermijd NSAID\'s' : ''}
${userData.medications && userData.medications.includes('bloodthinner') ? '6. Voorzichtigheid met valgevaar en bloedingsrisico' : ''}

LOCH NESS MARATHON SPECIFIEK:
- Datum: 27 september 2026
- Parcours: start op hoogvlakte, dan dalend/golvend langs zuidoever, laatste klim rond km 34
- Strategie: conservatief starten, energie bewaren voor na 30 km
- Heuvels: regelmatig heuvels inbouwen in training

FASERING (45 weken):
- Fase 1 (wk 1-4): Terug in beweging - run-walk, 150-180' per week
- Fase 2 (wk 5-12): Basis opbouwen - 25-35 km/week, lange duur 75-90'
- Fase 3 (wk 13-28): Uitbouwen - 35-45 km/week, lange duur 1u45-2u15, heuvels
- Fase 4 (wk 29-42): Marathonspecifiek - 45-60 km/week, 2-3 lange runs 26-32 km
- Fase 5 (wk 43-45): Taper - volume 70% → 50% → 35%

TRAININGSFREQUENTIE:
Pas het schema aan op ${userData.sessionsPerWeek} trainingen per week:
${userData.sessionsPerWeek === 3 ? '- Focus op 2x Z2 + 1x lange duur, kracht optioneel geïntegreerd' : ''}
${userData.sessionsPerWeek === 4 ? '- 2x Z2, 1x lange duur, 1x kracht of alternatief' : ''}
${userData.sessionsPerWeek === 5 ? '- 2x Z2, 1x tempo/heuvel, 1x lange duur, 1x kracht' : ''}
${userData.sessionsPerWeek === 6 ? '- 3x Z2, 1x tempo, 1x lange duur, 1x kracht + 1 rustdag' : ''}

VOEDING & HYDRATATIE:
- >90': 30-60g KH/uur
- >2.5u: 60-90g KH/uur (glucose+fructose mix)
- Hydratatie: <2% gewichtsverlies, geen overdrinken

BELANGRIJK: Genereer een VOLLEDIG schema met ALLE 45 weken en voor elke week ALLE ${userData.sessionsPerWeek} trainingen gespecificeerd.

Respond ALLEEN met een valid JSON object in dit exacte format (geen extra tekst, geen markdown):

{
  "planMetadata": {
    "userName": "${userData.name}",
    "experienceLevel": "${userData.experience}",
    "startDate": "2025-11-18",
    "raceDate": "${userData.raceDate || '2026-09-27'}",
    "totalWeeks": 45,
    "sessionsPerWeek": ${userData.sessionsPerWeek},
    "goal": "${userData.goal}",
    "targetTime": "${userData.targetTime || 'N/A'}"
  },
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Fase 1 - Terug in beweging",
      "phaseDescription": "Run-walk, trap lopen zonder buiten adem",
      "weeklyMinutes": 160,
      "weeklyKm": 12,
      "isDeloadWeek": false,
      "weekGoal": "Wennen aan regelmatige beweging, pezen laten aanpassen",
      "workouts": [
        {
          "day": "Maandag",
          "type": "Run-Walk",
          "duration": 25,
          "description": "10×(1' jog / 2' wandelen)",
          "intensity": "Z2",
          "distance": 3.0,
          "notes": "Talk test - je moet kunnen praten. Begin met 5-10 min opwarmen wandelen."
        },
        {
          "day": "Dinsdag", 
          "type": "Kracht",
          "duration": 30,
          "description": "Heup/bil, kuit, core - 2-3 sets × 8-12 reps",
          "intensity": "Licht-Gemiddeld",
          "notes": "Focus op quality over gewicht. Adem door, niet persen."
        }
        // ... meer workouts voor deze week
      ],
      "nutritionFocus": "Kennismaken met voeding tijdens langere sessies",
      "recoveryTips": "Minimaal 7-8 uur slaap, veel water drinken"
    }
    // ... weeks 2-45 met ALLE details
  ],
  "keyMilestones": [
    {
      "week": 4,
      "milestone": "Eerste deload week - herstel en aanpassing"
    },
    {
      "week": 12,
      "milestone": "Einde basisfase - 90 minuten non-stop kunnen lopen"
    },
    {
      "week": 24,
      "milestone": "Checkpoint: 2 uur+ lange duur zonder problemen"
    },
    {
      "week": 36,
      "milestone": "Eerste 30+ km lange duur"
    },
    {
      "week": 42,
      "milestone": "Laatste lange duur, begin taper"
    }
  ],
  "medicalConsiderations": [
    ${userData.medications && userData.medications.includes('statin') ? '"Extra herstel tussen harde sessies vanwege statines",' : ''}
    ${userData.medications && userData.medications.includes('bloodthinner') ? '"Voorzichtigheid met valgevaar, directe druk bij bloedingen",' : ''}
    ${userData.injuries ? `"Aandacht voor: ${userData.injuries}"` : '"Geen specifieke medische overwegingen"'}
  ],
  "progressionPrinciples": [
    "10%-regel strikt toegepast op lange duurlopen",
    "Deload weken: ${userData.sessionsPerWeek <= 4 ? 'elke 4 weken' : 'elke 3-4 weken'}",
    "Talk-test voor Z2 intensiteit - conversational pace",
    "Progressieve overload: tijd → afstand → intensiteit"
  ]
}

KRITIEK: De JSON MOET volledig zijn met ALLE 45 weken. Elke week moet ${userData.sessionsPerWeek} workouts bevatten met volledige details. Geen placeholders of "etc." - maak het VOLLEDIG.`;
}
