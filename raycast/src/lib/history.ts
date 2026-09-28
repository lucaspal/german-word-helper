/**
 * Local history storage for recent word lookups.
 * Raycast extensions must use Raycast's asynchronous LocalStorage API.
 */
import { LocalStorage } from "@raycast/api";

export const MAX_HISTORY = 20;
const STORAGE_KEY = "german-article-history";

/** Normalize a word for storage: trim, NFC normalize, remove punctuation. */
export function normalizeWord(word: string): string {
  return word
    .normalize("NFC")
    .trim()
    .replace(/[„“”‚‘’.,!?;:()[\]{}"«»]/g, "");
}

/** Get the history array from Raycast local storage (newest first). */
export async function getHistory(): Promise<string[]> {
  try {
    const stored = await LocalStorage.getItem<string>(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.every((value) => typeof value === "string") ? parsed : [];
  } catch {
    return [];
  }
}

async function saveHistory(history: string[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/** Add a word to history (newest first, deduplicated, capped at MAX_HISTORY). */
export async function addToHistory(word: string): Promise<void> {
  const normalized = normalizeWord(word);
  if (!normalized) return;

  const history = await getHistory();
  const filtered = history.filter((value) => value.toLowerCase() !== normalized.toLowerCase());
  await saveHistory([normalized, ...filtered].slice(0, MAX_HISTORY));
}

/** Clear all history. */
export async function clearHistory(): Promise<void> {
  await LocalStorage.removeItem(STORAGE_KEY);
}
