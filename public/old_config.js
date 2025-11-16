// Configuration
const CONFIG = {
  supabase: {
    url: 'https://uneazkpnasexwnyvsunr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZWF6a3BuYXNleHdueXZzdW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDc5NTAsImV4cCI6MjA3ODc4Mzk1MH0.EV-YFO5S3bAjuwsJmPqeEhbTnSR-1n1eG0kUAuU7TZo'
  },
  api: {
    generatePlan: '/.netlify/functions/generate-plan'
  },
  app: {
    name: 'Loch Ness Marathon Trainer Pro',
    version: '1.0.0',
    defaultRaceDate: '2026-09-27',
    totalWeeks: 45
  },
  features: {
    aiGeneration: true,
    socialSharing: false,
    exportPDF: false
  }
};
