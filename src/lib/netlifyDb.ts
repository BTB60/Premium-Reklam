// ⚠️ DISABLED: This file is completely disabled for Vercel deployment
// All database operations should go through the backend API
// See: https://premium-reklam-backend.onrender.com/api

export const netlifyDb = {
  getAll: async () => { throw new Error("netlifyDb is DISABLED - use backend API"); },
  getById: async () => { throw new Error("netlifyDb is DISABLED - use backend API"); },
  create: async () => { throw new Error("netlifyDb is DISABLED - use backend API"); },
  update: async () => { throw new Error("netlifyDb is DISABLED - use backend API"); },
  delete: async () => { throw new Error("netlifyDb is DISABLED - use backend API"); },
  query: async () => { throw new Error("netlifyDb is DISABLED - use backend API"); },
};

export const hybridDb = {
  syncToLocal: async () => { throw new Error("hybridDb is DISABLED - use backend API"); },
  getAll: async () => { throw new Error("hybridDb is DISABLED - use backend API"); },
  create: async () => { throw new Error("hybridDb is DISABLED - use backend API"); },
};

export default netlifyDb;
