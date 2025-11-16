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

  console.log('Generate plan called');

  try {
    const { userData } = JSON.parse(event.body);
    console.log('User:', userData.name, userData.age, userData.experience);
    
    const plan = {
      phases: [
        {
          name: `Fase 1 - Opbouw voor ${userData.name}`,
          weeks: [1, 2, 3, 4],
          description: `Basis leggen - ${userData.experience} niveau`,
          weeklyMinutes: "150-180'",
          workouts: [
            { type: "Easy Run", description: "30-40' rustig", day: "Maandag" },
            { type: "Kracht", description: "30' core", day: "Dinsdag" },
            { type: "Easy Run", description: "35-45' rustig", day: "Woensdag" },
            { type: "Rust", description: "Volledige rust", day: "Donderdag" },
            { type: "Easy Run", description: "30-40' rustig", day: "Vrijdag" },
            { type: "Kracht", description: "30' been & core", day: "Zaterdag" },
            { type: "Long Run", description: "50-60' Z2", day: "Zondag" }
          ]
        },
        {
          name: "Fase 2 - Volume Opbouwen",
          weeks: [5, 6, 7, 8, 9, 10, 11, 12],
          description: "Geleidelijk meer kilometers",
          weeklyMinutes: "200-240'",
          workouts: [
            { type: "Easy", description: "45-50'", day: "Maandag" },
            { type: "Kracht", description: "35-40'", day: "Dinsdag" },
            { type: "Tempo", description: "40' inc 3×8'", day: "Woensdag" },
            { type: "Rust", description: "Rust", day: "Donderdag" },
            { type: "Easy", description: "40-45'", day: "Vrijdag" },
            { type: "Strides", description: "45' + strides", day: "Zaterdag" },
            { type: "Long Run", description: "75-90' Z2", day: "Zondag" }
          ]
        },
        {
          name: "Fase 3 - Uitbouwen",
          weeks: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
          description: "Meer specifiek",
          weeklyMinutes: "240-280'",
          workouts: [
            { type: "Easy", description: "60'", day: "Maandag" },
            { type: "Kracht", description: "40'", day: "Dinsdag" },
            { type: "Hills", description: "50' heuvels", day: "Woensdag" },
            { type: "Rust", description: "Rust", day: "Donderdag" },
            { type: "Easy", description: "45-50'", day: "Vrijdag" },
            { type: "Progression", description: "60' progressie", day: "Zaterdag" },
            { type: "Long Run", description: "105-120' Z2", day: "Zondag" }
          ]
        },
        {
          name: "Fase 4 - Marathon Specifiek",
          weeks: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
          description: "Marathon pace",
          weeklyMinutes: "280-320'",
          workouts: [
            { type: "Easy", description: "60'", day: "Maandag" },
            { type: "Kracht", description: "30'", day: "Dinsdag" },
            { type: "Marathon Pace", description: "60' inc 3×15' MP", day: "Woensdag" },
            { type: "Rust", description: "Rust", day: "Donderdag" },
            { type: "Easy", description: "45'", day: "Vrijdag" },
            { type: "MP Run", description: "75-90' MP", day: "Zaterdag" },
            { type: "Long Run", description: "150-180'", day: "Zondag" }
          ]
        },
        {
          name: "Fase 5 - Taper",
          weeks: [43, 44, 45],
          description: "Afbouwen",
          weeklyMinutes: "Aflopend",
          workouts: [
            { type: "Easy", description: "40'", day: "Maandag" },
            { type: "Rust", description: "Rust", day: "Dinsdag" },
            { type: "Sharpener", description: "30' + 4×3' MP", day: "Woensdag" },
            { type: "Rust", description: "Rust", day: "Donderdag" },
            { type: "Easy", description: "20-30'", day: "Vrijdag" },
            { type: "Shakeout", description: "15' + strides", day: "Zaterdag" },
            { type: "RACE", description: "MARATHON! 🏃‍♂️", day: "Zondag" }
          ]
        }
      ],
      personalizedAdvice: `Voor ${userData.name} (${userData.age} jaar): Focus op herstel en bouw geleidelijk op!`
    };

    console.log('Plan generated successfully');

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
      body: JSON.stringify({ error: error.message })
    };
  }
};
