/**
 * Local history storage for recent word lookups.
 * Uses Raycast's localStorage API (available in the extension context).
 */

export const MAX_HISTORY = 20;
const STORAGE_KEY = "german-article-history";

/**
 * Normalize a word for storage: trim, NFC normalize, remove punctuation.
 */
export function normalizeWord(word: string): string {
  return word
    .normalize("NFC")
    .trim()
    .replace(/[„“”‚‘’.,!?;:()[\]{}"«»]/g, "");
}

/**
 * Get the history array from localStorage (newest first).
 */
export function getHistory(): string[] {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save the history array to localStorage.
 */
function saveHistory(history: string[]): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/**
 * Add a word to history (newest first, deduplicated, capped at MAX_HISTORY).
 */
export function addToHistory(word: string): void {
  const normalized = normalizeWord(word);
  if (!normalized) {
    return;
  }

  const history = getHistory();

  // Remove existing entry if present (deduplication)
  const filtered = history.filter((w) => w.toLowerCase() !== normalized.toLowerCase());

  // Add to front (newest first)
  const updated = [normalized, ...filtered].slice(0, MAX_HISTORY);

  saveHistory(updated);
}

/**
 * Clear all history.
 */
export function clearHistory(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}