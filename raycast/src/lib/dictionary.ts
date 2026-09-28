/** Type definitions for German dictionary entries. */
import { LocalStorage } from "@raycast/api";

export type DeclensionRow = {
  caseName: string;
  number: "singular" | "plural";
  form: string;
};

export type DictionaryEntry = {
  word: string;
  article: "der" | "die" | "das" | null;
  gender: "Maskulinum" | "Femininum" | "Neutrum" | null;
  translations: string[];
  declension: DeclensionRow[];
  wiktionaryUrl: string;
};

const WIKTIONARY_API = "https://de.wiktionary.org/w/api.php";
const API_USER_AGENT = "GermanArticleRaycast/0.1 (https://github.com/lucaspal/german-word-helper)";
const CACHE_KEY = "german-article-entry-cache-v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_RETRIES = 2;

export class DictionaryRateLimitError extends Error {
  readonly retryAfterMs?: number;

  constructor(retryAfterMs?: number) {
    super("Wiktionary is temporarily rate-limiting requests. Please try again shortly.");
    this.name = "DictionaryRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

export class NotGermanNounError extends Error {
  constructor(word: string) {
    super(`No German noun entry found for “${word}”`);
    this.name = "NotGermanNounError";
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, signal?: AbortSignal): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      signal,
      headers: {
        Accept: "application/json",
        "Api-User-Agent": API_USER_AGENT,
      },
    });

    if (response.ok) return response;

    const retryAfterMs = parseRetryAfter(response.headers.get("Retry-After"));
    const retryable = response.status === 429 || response.status === 503;
    if (!retryable || attempt === MAX_RETRIES) {
      if (response.status === 429) throw new DictionaryRateLimitError(retryAfterMs);
      throw new Error(`Dictionary request failed (${response.status})`);
    }

    await wait(Math.min(retryAfterMs ?? 1000 * 2 ** attempt, 8000));
  }

  throw new Error("Dictionary request failed");
}

/** Fetch raw wikitext for a German word from Wiktionary. */
export async function fetchWikitext(word: string, signal?: AbortSignal): Promise<string> {
  const url = `${WIKTIONARY_API}?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&origin=*`;
  const response = await fetchWithRetry(url, signal);
  const data = await response.json();
  const text = data?.parse?.wikitext?.["*"];

  if (!text) throw new Error("Word not found");
  return text;
}

/** Extract gender and article from a German noun section. */
export function parseGender(wikitext: string): [string, string] | null {
  const match1 = wikitext.match(/Genus\s*=\s*([mfn])/i);
  if (match1) {
    const g = match1[1].toLowerCase();
    return g === "m" ? ["der", "Maskulinum"] : g === "f" ? ["die", "Femininum"] : ["das", "Neutrum"];
  }

  const match2 = wikitext.match(/Wortart\|Substantiv\|Deutsch[^\n]*?\}\}\s*,\s*\{\{([mfn])\}\}/i);
  if (match2) {
    const g = match2[1].toLowerCase();
    return g === "m" ? ["der", "Maskulinum"] : g === "f" ? ["die", "Femininum"] : ["das", "Neutrum"];
  }

  return null;
}

/** Extract English translations from wikitext. */
export function parseTranslations(wikitext: string): string[] {
  const values: string[] = [];
  const regex = /\{\{(?:Ü|Üt|Üxx4|L)\|en\|([^}|\n]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(wikitext)) && values.length < 10) {
    const value = match[1].trim();
    if (value && !values.includes(value)) values.push(value);
  }

  return values;
}

function extractField(text: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^\\|${escapedName}=([^\\n]*)`, "mi");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

/** Extract declension rows from a German noun section. */
export function parseDeclension(wikitext: string, word: string): DeclensionRow[] {
  const labels: Array<[string, string, "singular" | "plural"]> = [
    ["Nominativ Singular", "Nominative", "singular"],
    ["Genitiv Singular", "Genitive", "singular"],
    ["Dativ Singular", "Dative", "singular"],
    ["Akkusativ Singular", "Accusative", "singular"],
    ["Nominativ Plural", "Nominative", "plural"],
    ["Genitiv Plural", "Genitive", "plural"],
    ["Dativ Plural", "Dative", "plural"],
    ["Akkusativ Plural", "Accusative", "plural"],
  ];

  const rows = labels
    .map(([key, caseName, number]) => ({ caseName, number, form: extractField(wikitext, key) }))
    .filter((row) => row.form);

  return rows.length > 0 ? rows : [{ caseName: "Nominative", number: "singular", form: word }];
}

function extractGermanNounSection(wikitext: string, word: string): string {
  const headerPattern = /^== [^\n]*\{\{Sprache\|Deutsch\}\}[^\n]*==\s*$/gm;
  const headers = [...wikitext.matchAll(headerPattern)];

  for (let index = 0; index < headers.length; index++) {
    const start = headers[index].index ?? 0;
    const nextHeader = wikitext.slice(start + headers[index][0].length).search(/^== [^\n]*==\s*$/m);
    const end = nextHeader >= 0 ? start + headers[index][0].length + nextHeader : wikitext.length;
    const section = wikitext.slice(start, end);
    if (/\{\{Wortart\|Substantiv\|Deutsch\}/.test(section)) return section;
  }

  throw new NotGermanNounError(word);
}

/** Parse and validate a complete German noun entry. */
export function parseDictionaryEntry(word: string, wikitext: string): DictionaryEntry {
  const nounSection = extractGermanNounSection(wikitext, word);
  const genderResult = parseGender(nounSection);

  if (!genderResult) throw new NotGermanNounError(word);

  return {
    word,
    article: genderResult[0] as "der" | "die" | "das",
    gender: genderResult[1] as "Maskulinum" | "Femininum" | "Neutrum",
    translations: parseTranslations(nounSection),
    declension: parseDeclension(nounSection, word),
    wiktionaryUrl: `https://de.wiktionary.org/wiki/${encodeURIComponent(word)}`,
  };
}

type CachedEntries = Record<string, { cachedAt: number; entry: DictionaryEntry }>;

async function readCache(): Promise<CachedEntries> {
  try {
    const stored = await LocalStorage.getItem<string>(CACHE_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? (parsed as CachedEntries) : {};
  } catch {
    return {};
  }
}

async function writeCache(cache: CachedEntries): Promise<void> {
  await LocalStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/** Full lookup with 24-hour Raycast-local caching and abort support. */
export async function lookupWord(word: string, signal?: AbortSignal): Promise<DictionaryEntry> {
  const cleaned = word.normalize("NFC").trim().replace(/[„“”‚‘’.,!?;:()[\]{}"«»]/g, "");
  if (!cleaned) throw new Error("Empty word");

  const cache = await readCache();
  const cached = cache[cleaned.toLowerCase()];
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.entry;

  const wikitext = await fetchWikitext(cleaned, signal);
  const entry = parseDictionaryEntry(cleaned, wikitext);
  cache[cleaned.toLowerCase()] = { cachedAt: Date.now(), entry };
  await writeCache(cache);
  return entry;
}
