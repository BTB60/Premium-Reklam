// Netlify Database Client
// Provides API interface to Netlify serverless functions

const API_BASE = process.env.NODE_ENV === "production" 
  ? "/.netlify/functions/db" 
  : "http://localhost:8888/.netlify/functions/db";

export const netlifyDb = {
  // Get all items from collection
  async getAll(collection: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/${collection}`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error(`Error fetching ${collection}:`, error);
      return [];
    }
  },

  // Get item by ID
  async getById(collection: string, id: string): Promise<any | null> {
    try {
      const items = await this.getAll(collection);
      return items.find((item: any) => item.id === id) || null;
    } catch (error) {
      console.error(`Error fetching ${collection} by id:`, error);
      return null;
    }
  },

  // Create new item
  async create(collection: string, data: any): Promise<any | null> {
    try {
      const response = await fetch(`${API_BASE}/${collection}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error(`Error creating ${collection}:`, error);
      return null;
    }
  },

  // Update item
  async update(collection: string, id: string, updates: any): Promise<any | null> {
    try {
      const response = await fetch(`${API_BASE}/${collection}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error(`Error updating ${collection}:`, error);
      return null;
    }
  },

  // Delete item
  async delete(collection: string, id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/${collection}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      return response.ok;
    } catch (error) {
      console.error(`Error deleting ${collection}:`, error);
      return false;
    }
  },

  // Query with filter
  async query(collection: string, filter: (item: any) => boolean): Promise<any[]> {
    try {
      const items = await this.getAll(collection);
      return items.filter(filter);
    } catch (error) {
      console.error(`Error querying ${collection}:`, error);
      return [];
    }
  },
};

// Hybrid database that uses both Netlify DB and localStorage as fallback
export const hybridDb = {
  async syncToLocal(collection: string): Promise<void> {
    const netlifyData = await netlifyDb.getAll(collection);
    localStorage.setItem(`decor_${collection}`, JSON.stringify(netlifyData));
  },

  async getAll(collection: string): Promise<any[]> {
    // Try Netlify first
    const netlifyData = await netlifyDb.getAll(collection);
    if (netlifyData.length > 0) {
      // Sync to localStorage
      localStorage.setItem(`decor_${collection}`, JSON.stringify(netlifyData));
      return netlifyData;
    }
    
    // Fallback to localStorage
    const localData = localStorage.getItem(`decor_${collection}`);
    return localData ? JSON.parse(localData) : [];
  },

  async create(collection: string, data: any): Promise<any | null> {
    // Create in Netlify
    const result = await netlifyDb.create(collection, data);
    
    // Also save to localStorage
    const localData = localStorage.getItem(`decor_${collection}`);
    const items = localData ? JSON.parse(localData) : [];
    items.push(result || data);
    localStorage.setItem(`decor_${collection}`, JSON.stringify(items));
    
    return result;
  },
};
