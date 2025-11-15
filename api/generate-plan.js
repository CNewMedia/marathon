const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  console.log('Generate plan function called');

  try {
    const { userData } = JSON.parse(event.body);
    console.log('User data received:', { name: userData.name, age: userData.age });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const prompt = `Je bent een expert marathon coach. Genereer een gepersonaliseerd 45-weken trainingsschema.

PERSOON: ${userData.name}, ${userData.age} jaar, ${userData.gender}
NIVEAU: ${userData.experience}, ${userData.currentKmPerWeek} km/week
DOEL: ${userData.goal === 'finish' ? 'Finishen' : 'Tijd: ' + userData.targetTime}
BESCHIKBAAR: ${userData.sessionsPerWeek} trainingen/week

Maak 5 fases met per fase exacte trainingen. Return ALLEEN JSON:

{"phases":[{"name":"Fase 1 - Opbouw","weeks":[1,2,3,4],"description":"Basis leggen","weeklyMinutes":"150-180","workouts":[{"type":"Easy Run","description":"30 min rustig","day":"Maandag"},{"type":"Rest","description":"Rust","day":"Dinsdag"},{"type":"Easy Run","description":"35 min rustig","day":"Woensdag"},{"type":"Strength","description":"30 min kracht","day":"Donderdag"},{"type":"Rest","description":"Rust","day":"Vrijdag"},{"type":"Easy Run","description":"40 min rustig","day":"Zaterdag"},{"type":"Long Run","description":"50 min Z2","day":"Zondag"}]},{"name":"Fase 2","weeks":[5,6,7,8,9,10,11,12],"description":"Volume opbouwen","weeklyMinutes":"200-240","workouts":[{"type":"Easy","description":"45 min","day":"Maandag"},{"type":"Rest","description":"","day":"Dinsdag"},{"type":"Tempo","description":"40 min","day":"Woensdag"},{"type":"Strength","description":"30 min","day":"Donderdag"},{"type":"Rest","description":"","day":"Vrijdag"},{"type":"Easy","description":"50 min","day":"Zaterdag"},{"type":"Long","description":"75 min","day":"Zondag"}]},{"name":"Fase 3","weeks":[13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],"description":"Uitbouwen","weeklyMinutes":"240-280","workouts":[{"type":"Easy","description":"60 min","day":"Maandag"},{"type":"Strength","description":"40 min","day":"Dinsdag"},{"type":"Tempo","description":"50 min","day":"Woensdag"},{"type":"Rest","description":"","day":"Donderdag"},{"type":"Easy","description":"45 min","day":"Vrijdag"},{"type":"Hills","description":"60 min","day":"Zaterdag"},{"type":"Long","description":"105 min","day":"Zondag"}]},{"name":"Fase 4","weeks":[29,30,31,32,33,34,35,36,37,38,39,40,41,42],"description":"Marathon specifiek","weeklyMinutes":"280-320","workouts":[{"type":"Easy","description":"60 min","day":"Maandag"},{"type":"Strength","description":"30 min","day":"Dinsdag"},{"type":"Tempo","description":"60 min MT","day":"Woensdag"},{"type":"Rest","description":"","day":"Donderdag"},{"type":"Easy","description":"45 min","day":"Vrijdag"},{"type":"Marathon Pace","description":"90 min MP","day":"Zaterdag"},{"type":"Long","description":"150-180 min","day":"Zondag"}]},{"name":"Fase 5 - Taper","weeks":[43,44,45],"description":"Afbouwen","weeklyMinutes":"Aflopend","workouts":[{"type":"Easy","description":"40 min","day":"Maandag"},{"type":"Rest","description":"","day":"Dinsdag"},{"type":"Tempo","description":"30 min","day":"Woensdag"},{"type":"Rest","description":"","day":"Donderdag"},{"type":"Easy","description":"20 min","day":"Vrijdag"},{"type":"Shakeout","description":"15 min","day":"Zaterdag"},{"type":"RACE","description":"Marathon!","day":"Zondag"}]}],"personalizedAdvice":"Focus op herstel en bouw geleidelijk op. Luister naar je lichaam."}`;

    console.log('Calling Anthropic API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Anthropic response received');
    
    const content = data.content[0].text;
    console.log('Content preview:', content.substring(0, 100));

    let plan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      plan = JSON.parse(jsonStr);
      console.log('Plan parsed successfully');
    } catch (e) {
      console.error('Parse error:', e.message);
      console.error('Content:', content);
      throw new Error('Failed to parse AI response');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ plan, generated: new Date().toISOString() })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack
      })
    };
  }
};
