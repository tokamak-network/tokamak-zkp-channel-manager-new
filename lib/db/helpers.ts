/**
 * Database Helper Functions
 *
 * Generic CRUD operations for lowdb
 */

import { getDb } from "./client";

/**
 * Get data from a path (dot notation supported)
 * Example: getData('channels.123') or getData('channels/123')
 */
export async function getData<T = any>(path: string): Promise<T | null> {
  const db = await getDb();
  const pathParts = path.split(/[./]/).filter(Boolean);

  let current: any = db.data;
  for (const part of pathParts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }

  return current as T;
}

/**
 * Set data at a path (creates nested structure if needed)
 * Example: setData('channels.123', { status: 'active' })
 */
export async function setData(path: string, data: any): Promise<void> {
  const db = await getDb();
  const pathParts = path.split(/[./]/).filter(Boolean);

  // Create nested structure
  let current: any = db.data;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }

  // Set the data with timestamp
  const lastPart = pathParts[pathParts.length - 1];
  current[lastPart] = {
    ...data,
    _updatedAt: Date.now(), // Unix timestamp (milliseconds) - avoids timezone issues
  };

  await db.write();
}

/**
 * Push new data with auto-generated key (for arrays or objects)
 * Returns the generated key
 */
export async function pushData(path: string, data: any): Promise<string> {
  const db = await getDb();
  const pathParts = path.split(/[./]/).filter(Boolean);

  // Navigate to parent
  let current: any = db.data;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }

  // Get or create the target collection
  const lastPart = pathParts[pathParts.length - 1];
  if (!current[lastPart] || typeof current[lastPart] !== "object") {
    current[lastPart] = {};
  }

  // Generate unique key (timestamp-based)
  const key =
    Date.now().toString() + Math.random().toString(36).substring(2, 9);

  // Add data with timestamp
  current[lastPart][key] = {
    ...data,
    _createdAt: Date.now(), // Unix timestamp (milliseconds) - avoids timezone issues
  };

  await db.write();
  return key;
}

/**
 * Update specific fields at a path (merges with existing data)
 */
export async function updateData(
  path: string,
  data: Partial<any>
): Promise<void> {
  const existing = await getData(path);

  if (!existing) {
    // If doesn't exist, create it
    await setData(path, data);
    return;
  }

  // Merge with existing data
  const updated = {
    ...existing,
    ...data,
    _updatedAt: Date.now(), // Unix timestamp (milliseconds) - avoids timezone issues
  };

  await setData(path, updated);
}

/**
 * Delete data at a path
 */
export async function deleteData(path: string): Promise<void> {
  const db = await getDb();
  const pathParts = path.split(/[./]/).filter(Boolean);

  if (pathParts.length === 0) {
    throw new Error("Cannot delete root data");
  }

  // Navigate to parent
  let current: any = db.data;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!current[part] || typeof current[part] !== "object") {
      return; // Path doesn't exist
    }
    current = current[part];
  }

  // Delete the target
  const lastPart = pathParts[pathParts.length - 1];
  if (current[lastPart]) {
    delete current[lastPart];
    await db.write();
  }
}

/**
 * Check if data exists at a path
 */
export async function exists(path: string): Promise<boolean> {
  const data = await getData(path);
  return data !== null && data !== undefined;
}
