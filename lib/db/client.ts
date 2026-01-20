/**
 * LowDB Client
 *
 * Initializes and manages the lowdb database instance
 * Note: This module is server-side only (Next.js API routes)
 */

import { JSONFilePreset } from "lowdb/node";
import path from "path";
import { existsSync, mkdirSync } from "fs";

// Database schema
interface DatabaseSchema {
  channels: Record<string, any>;
  [key: string]: any;
}

// Default data structure
const defaultData: DatabaseSchema = {
  channels: {},
};

// Database file path
const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "db.json");

// Ensure data directory exists
if (typeof window === "undefined" && !existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Database instance (lazy initialized)
// JSONFilePreset returns a Low instance
let dbInstance: Awaited<
  ReturnType<typeof JSONFilePreset<DatabaseSchema>>
> | null = null;

/**
 * Initialize database
 * Reads existing data or creates with default schema
 */
export async function initDb(): Promise<
  Awaited<ReturnType<typeof JSONFilePreset<DatabaseSchema>>>
> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Use JSONFilePreset for easier initialization
    // JSONFilePreset automatically initializes with defaultData if file doesn't exist
    dbInstance = await JSONFilePreset<DatabaseSchema>(dbPath, defaultData);

    // Ensure data structure is initialized
    if (!dbInstance.data || Object.keys(dbInstance.data).length === 0) {
      dbInstance.data = defaultData;
      await dbInstance.write();
    }

    return dbInstance;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    // Fallback: create new instance
    dbInstance = await JSONFilePreset<DatabaseSchema>(dbPath, defaultData);
    return dbInstance;
  }
}

/**
 * Get database instance (ensures it's initialized)
 */
export async function getDb(): Promise<
  Awaited<ReturnType<typeof JSONFilePreset<DatabaseSchema>>>
> {
  if (!dbInstance) {
    await initDb();
  }
  return dbInstance!;
}

/**
 * Get database instance (synchronous, may be null if not initialized)
 * Use this only if you're sure the database is already initialized
 */
export function getDbSync(): Awaited<
  ReturnType<typeof JSONFilePreset<DatabaseSchema>>
> | null {
  return dbInstance;
}
