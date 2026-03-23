// ⚠️ DEPRECATED: This file is deprecated and should not be used in Vercel production
// MySQL connection pooling does not work with Vercel serverless functions
// Use the Spring Boot backend API instead: https://premium-reklam-backend.onrender.com/api

// This file is kept for local development reference only

export const mysqlDeprecated = true;
export const mysqlMessage = "MySQL is not supported in Vercel serverless. Use backend API.";

// If you need database access, use:
// 1. Spring Boot Backend: https://premium-reklam-backend.onrender.com/api
// 2. Vercel Postgres: https://vercel.com/postgres
// 3. Neon DB: https://neon.tech
