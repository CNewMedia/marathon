exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      message: 'Function works!',
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      timestamp: new Date().toISOString()
    })
  };
};
