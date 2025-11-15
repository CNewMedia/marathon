// Netlify Function: Generate personalized training plan using Claude AI

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userData } = JSON.parse(event.body);
    
    // Call Claude API
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicKey) {
      throw new Error('Anthropic API key not configured');
    }

    const prompt = `Je bent een expert marathon coach. Genereer een VOLLEDIG gepersonaliseerd 45-weken trainingsschema voor de Loch Ness Marathon (27 september 2026) op basis van deze gegevens:

PERSOONLIJKE GEGEVENS:
- Naam: ${userData.name}
- Leeftijd: ${userData.age} jaar
- Geslacht: ${userData.gender}
- Gewicht: ${userData.weight} kg
- Lengte: ${userData.height} cm

SPORTIEVE ACHTERGROND:
- Loop ervaring: ${userData.runningYears}
- Huidig niveau: ${userData.experience}
- Huidige km/week: ${userData.currentKmPerWeek} km
- Langste recente loop: ${userData.longestRun} minuten
- Eerdere marathons: ${userData.previousMarathons}
${userData.previousMarathonTime ? `- Beste marathon tijd: ${userData.previousMarathonTime}` : ''}

GEZONDHEID:
${userData.injuries ? `- Blessures: ${userData.injuries}` : '- Geen bekende blessures'}
${userData.medications ? `- Medicatie: ${userData.medications}` : '- Geen medicatie'}
- Hartslagzones bekend: ${userData.heartRateZonesKnown ? 'Ja' : 'Nee'}

BESCHIKBAARHEID:
- Trainingen per week: ${userData.sessionsPerWeek}
- Tijd per training: ~${userData.timePerSession} minuten
- Loopomgeving: ${userData.runningEnvironment}

DOELEN:
- Hoofddoel: ${userData.goal === 'finish' ? 'Gezond finishen' : `Finish tijd: ${userData.targetTime}`}

EXTRA:
- Krachttraining ervaring: ${userData.strengthTraining ? 'Ja' : 'Nee'}
- Cross-training: ${userData.crossTraining.join(', ') || 'Geen'}
- Slaap: ${userData.sleepHours} uur/nacht

Genereer een schema met 5 fases over 45 weken. Voor elke fase:
1. Naam en beschrijving
2. Welke weken
3. Totale trainingstijd per week
4. EXACTE trainingen per dag van de week

Houd rekening met:
- Leeftijd (meer herstel bij 40+)
- Blessure geschiedenis (preventie!)
- Beschikbaarheid (${userData.sessionsPerWeek} trainingen/week)
- Doel (${userData.goal})
- Cross-training mogelijkheden

KRITISCH: Return ALLEEN valid JSON in dit formaat, NIETS anders:

{
  "phases": [
    {
      "name": "Fase 1 - [naam]",
      "weeks": [1, 2, 3, 4],
      "description": "[beschrijving]",
      "weeklyMinutes": "[tijd]",
      "workouts": [
        {"type": "[type]", "description": "[detail]", "day": "Maandag"},
        {"type": "[type]", "description": "[detail]", "day": "Dinsdag"},
        ... (7 dagen)
      ]
    },
    ... (5 fases totaal)
  ],
  "personalizedAdvice": "[3-4 specifieke tips voor deze persoon]"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': anthropicKey
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse JSON from response
    let plan;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      plan = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content:', content);
      throw new Error('Failed to parse AI response');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        plan,
        generated: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate training plan'
      })
    };
  }
};
