// ⚠️ DISABLED: This file is completely disabled for Vercel deployment
// All database operations should go through the backend API
// See: https://premium-reklam-backend.onrender.com/api

// This file is kept as placeholder and throws if accidentally used

export function getSql() {
  throw new Error("neon.ts is DISABLED - use backend API");
}

export async function initDB() {
  throw new Error("neon.ts is DISABLED - use backend API");
}

export const sql = ((...args: any[]) => {
  throw new Error("neon.ts is DISABLED - use backend API");
});
