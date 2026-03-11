// Netlify Database API
// This file provides serverless functions for database operations

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// In-memory storage for development (replace with actual Netlify DB in production)
const memoryDB: Record<string, any[]> = {
  users: [],
  orders: [],
  stores: [],
  products: [],
  reviews: [],
};

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const { httpMethod, path, body } = event;
  const pathParts = path.split("/").filter(Boolean);
  const collection = pathParts[pathParts.length - 1];

  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    switch (httpMethod) {
      case "GET":
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: memoryDB[collection] || [] }),
        };

      case "POST":
        const newItem = JSON.parse(body || "{}");
        newItem.id = Date.now().toString();
        newItem.createdAt = new Date().toISOString();
        
        if (!memoryDB[collection]) memoryDB[collection] = [];
        memoryDB[collection].push(newItem);
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ data: newItem }),
        };

      case "PUT":
        const updateData = JSON.parse(body || "{}");
        const items = memoryDB[collection] || [];
        const index = items.findIndex((item: any) => item.id === updateData.id);
        
        if (index !== -1) {
          items[index] = { ...items[index], ...updateData };
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ data: items[index] }),
          };
        }
        return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };

      case "DELETE":
        const deleteId = JSON.parse(body || "{}").id;
        memoryDB[collection] = (memoryDB[collection] || []).filter(
          (item: any) => item.id !== deleteId
        );
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
    }
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Unknown error" }),
    };
  }
};

export { handler };
