// Neon PostgreSQL API Serverless Function
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { neonDb } from "../../src/lib/neonDb";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const path = event.path.replace("/.netlify/functions/neon-api", "");
  const segments = path.split("/").filter(Boolean);
  const resource = segments[0];
  const id = segments[1];

  try {
    // Initialize database schema
    await neonDb.init();

    switch (resource) {
      case "users":
        if (event.httpMethod === "GET") {
          if (id) {
            const user = await neonDb.getUserById(parseInt(id));
            return { statusCode: 200, headers, body: JSON.stringify({ data: user }) };
          }
          const users = await neonDb.getUsers();
          return { statusCode: 200, headers, body: JSON.stringify({ data: users }) };
        }
        if (event.httpMethod === "POST") {
          const body = JSON.parse(event.body || "{}");
          const user = await neonDb.createUser(body);
          return { statusCode: 201, headers, body: JSON.stringify({ data: user }) };
        }
        break;

      case "orders":
        if (event.httpMethod === "GET") {
          if (id) {
            // Get orders by user ID
            const orders = await neonDb.getOrdersByUserId(parseInt(id));
            return { statusCode: 200, headers, body: JSON.stringify({ data: orders }) };
          }
          const orders = await neonDb.getOrders();
          return { statusCode: 200, headers, body: JSON.stringify({ data: orders }) };
        }
        if (event.httpMethod === "POST") {
          const body = JSON.parse(event.body || "{}");
          const order = await neonDb.createOrder(body);
          return { statusCode: 201, headers, body: JSON.stringify({ data: order }) };
        }
        if (event.httpMethod === "PUT" && id) {
          const body = JSON.parse(event.body || "{}");
          const order = await neonDb.updateOrderStatus(parseInt(id), body.status);
          return { statusCode: 200, headers, body: JSON.stringify({ data: order }) };
        }
        break;

      case "stores":
        if (event.httpMethod === "GET") {
          if (id) {
            const store = await neonDb.getStoreById(parseInt(id));
            return { statusCode: 200, headers, body: JSON.stringify({ data: store }) };
          }
          const stores = await neonDb.getStores();
          return { statusCode: 200, headers, body: JSON.stringify({ data: stores }) };
        }
        if (event.httpMethod === "POST") {
          const body = JSON.parse(event.body || "{}");
          const store = await neonDb.createStore(body);
          return { statusCode: 201, headers, body: JSON.stringify({ data: store }) };
        }
        break;

      case "products":
        if (event.httpMethod === "GET" && id) {
          const products = await neonDb.getProductsByStoreId(parseInt(id));
          return { statusCode: 200, headers, body: JSON.stringify({ data: products }) };
        }
        if (event.httpMethod === "POST") {
          const body = JSON.parse(event.body || "{}");
          const product = await neonDb.createProduct(body);
          return { statusCode: 201, headers, body: JSON.stringify({ data: product }) };
        }
        break;

      case "reviews":
        if (event.httpMethod === "GET" && id) {
          const reviews = await neonDb.getReviewsByStoreId(parseInt(id));
          return { statusCode: 200, headers, body: JSON.stringify({ data: reviews }) };
        }
        if (event.httpMethod === "POST") {
          const body = JSON.parse(event.body || "{}");
          const review = await neonDb.createReview(body);
          return { statusCode: 201, headers, body: JSON.stringify({ data: review }) };
        }
        break;

      case "stats":
        const stats = await neonDb.getStats();
        return { statusCode: 200, headers, body: JSON.stringify({ data: stats }) };

      default:
        return { 
          statusCode: 404, 
          headers, 
          body: JSON.stringify({ error: "Resource not found" }) 
        };
    }

    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: "Method not allowed" }) 
    };

  } catch (error: any) {
    console.error("API Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Internal server error" }),
    };
  }
};

export { handler };
