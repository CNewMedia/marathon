// Configuration
const CONFIG = {
  supabase: {
    url: 'https://uneazkpnasexwnyvsunr.supabase.co',
    anonKey: 'sb_publishable_bVCrOS4KED-TDNFbAVKiOA_KQcEvx4r'
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