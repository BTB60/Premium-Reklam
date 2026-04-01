// Password hashing utilities using Web Crypto API
// In production, use bcrypt or argon2 on the backend

const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const HASH_LENGTH = 32;

export async function hashPassword(password: string): Promise<string> {
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  // Encode password
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Import key
  const key = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  // Derive bits
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    key,
    HASH_LENGTH * 8
  );
  
  // Combine salt and hash
  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(SALT_LENGTH + HASH_LENGTH);
  combined.set(salt);
  combined.set(hashArray, SALT_LENGTH);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(password: string, hashString: string): Promise<boolean> {
  try {
    // Decode hash
    const combined = new Uint8Array(
      atob(hashString).split("").map((c) => c.charCodeAt(0))
    );
    
    // Extract salt and hash
    const salt = combined.slice(0, SALT_LENGTH);
    const originalHash = combined.slice(SALT_LENGTH);
    
    // Encode password
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // Import key
    const key = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    // Derive bits with same salt
    const newHash = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: ITERATIONS,
        hash: "SHA-256",
      },
      key,
      HASH_LENGTH * 8
    );
    
    // Compare hashes
    const newHashArray = new Uint8Array(newHash);
    if (originalHash.length !== newHashArray.length) return false;
    
    let match = true;
    for (let i = 0; i < originalHash.length; i++) {
      match = match && originalHash[i] === newHashArray[i];
    }
    
    return match;
  } catch {
    return false;
  }
}
