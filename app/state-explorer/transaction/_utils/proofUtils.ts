/**
 * Proof Utility Functions
 *
 * Pure utility functions for proof-related formatting
 * Note: Functions that return React components should be in _components/
 */

/**
 * Format date string to Korean locale format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\./g, ".")
      .replace(/\s/g, "");
  } catch {
    return dateString;
  }
}
