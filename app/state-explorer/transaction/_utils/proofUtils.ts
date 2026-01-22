/**
 * Proof Utility Functions
 *
 * Pure utility functions for proof-related formatting
 * Note: Functions that return React components should be in _components/
 */

/**
 * Format date (Unix timestamp in milliseconds or ISO string) to Korean locale format
 * Supports both Unix timestamp (number) and ISO string for backward compatibility
 */
export function formatDate(dateInput: string | number): string {
  try {
    // Handle both Unix timestamp (number) and ISO string (string)
    const date = typeof dateInput === "number" 
      ? new Date(dateInput) 
      : new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return String(dateInput);
    }
    
    return date
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\./g, ".")
      .replace(/\s/g, "");
  } catch {
    return String(dateInput);
  }
}

/**
 * Format date with time (Unix timestamp in milliseconds or ISO string) to Korean locale format
 * Shows year, month, day, hour, minute (without seconds)
 */
export function formatDateTimeShort(dateInput: string | number): string {
  try {
    // Handle both Unix timestamp (number) and ISO string (string)
    const date = typeof dateInput === "number" 
      ? new Date(dateInput) 
      : new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return String(dateInput);
    }
    
    const datePart = date
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\./g, ".")
      .replace(/\s/g, "");
    
    const timePart = date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    
    return `${datePart} ${timePart}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Format date with full time (Unix timestamp in milliseconds or ISO string) to Korean locale format
 * Shows year, month, day, hour, minute, second
 */
export function formatDateTime(dateInput: string | number): string {
  try {
    // Handle both Unix timestamp (number) and ISO string (string)
    const date = typeof dateInput === "number" 
      ? new Date(dateInput) 
      : new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return String(dateInput);
    }
    
    const datePart = date
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\./g, ".")
      .replace(/\s/g, "");
    
    const timePart = date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    
    return `${datePart} ${timePart}`;
  } catch {
    return String(dateInput);
  }
}
