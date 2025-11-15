// Configuration
// Voor productie: gebruik environment variables via Netlify/Vercel
// Voor development: pas deze waarden aan

const CONFIG = {
  // Supabase Configuration
  supabase: {
    url: window.ENV?.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE',
    anonKey: window.ENV?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE',
  },
  
  // API Endpoints
  api: {
    // Voor Netlify Functions
    generatePlan: '/.netlify/functions/generate-plan',
    // Voor lokale development
    // generatePlan: 'http://localhost:8888/.netlify/functions/generate-plan',
  },
  
  // App Settings
  app: {
    name: 'Loch Ness Marathon Trainer Pro',
    version: '1.0.0',
    defaultRaceDate: '2026-09-27',
    totalWeeks: 45,
  },
  
  // Feature Flags
  features: {
    aiGeneration: true, // Set to false to use mock data
    socialSharing: false,
    exportPDF: false,
  },
};

// Environment variable injection (voor Netlify)
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  // In productie worden deze waarden injecteerd door de build
  // Dit wordt gedaan via netlify.toml en environment variables
  console.log('Running in production mode');
}
