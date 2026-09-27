/**
 * Type definitions for German dictionary entries
 */
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

/**
 * Fetch raw wikitext for a German word from Wiktionary
 */
export async function fetchWikitext(word: string): Promise<string> {
  const url = `${WIKTIONARY_API}?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&origin=*`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`Dictionary request failed (${response.status})`);
  }

  const data = await response.json();
  const text = data?.parse?.wikitext?.["*"];

  if (!text) {
    throw new Error("Word not found");
  }

  return text;
}

/**
 * Extract gender and article from wikitext
 * Returns [article, gender] or null
 */
export function parseGender(wikitext: string): [string, string] | null {
  // Pattern 1: Genus = m/f/n
  const match1 = wikitext.match(/Genus\s*=\s*([mfn])/i);
  if (match1) {
    const g = match1[1].toLowerCase();
    return g === "m"
      ? ["der", "Maskulinum"]
      : g === "f"
      ? ["die", "Femininum"]
      : ["das", "Neutrum"];
  }

  // Pattern 2: Wortart|Substantiv|Deutsch... {{m}}|{{f}}|{{n}}
  const match2 = wikitext.match(/Wortart\|Substantiv\|Deutsch[^\n]*?\}\}\s*,\s*\{\{([mfn])\}\}/i);
  if (match2) {
    const g = match2[1].toLowerCase();
    return g === "m"
      ? ["der", "Maskulinum"]
      : g === "f"
      ? ["die", "Femininum"]
      : ["das", "Neutrum"];
  }

  return null;
}

/**
 * Extract English translations from wikitext
 * Looks for {{Ü|en|...}}, {{Üt|en|...}}, {{Üxx4|en|...}}, {{L|en|...}} templates
 */
export function parseTranslations(wikitext: string): string[] {
  const values: string[] = [];
  // Match {{Ü|en|value}}, {{Üt|en|value}}, {{Üxx4|en|value}}, {{L|en|value}}
  const regex = /\{\{(?:Ü|Üt|Üxx4|L)\|en\|([^}|\n]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(wikitext)) && values.length < 10) {
    const value = match[1].trim();
    if (value && !values.includes(value)) {
      values.push(value);
    }
  }

  return values;
}

/**
 * Extract a single field value from the declension table in wikitext
 */
function extractField(text: string, name: string): string {
  // Match |FieldName=value at start of line
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^\\|${escapedName}=([^\n]*)`, "mi");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * Extract declension table from wikitext
 * Returns array of [caseName, number, form]
 */
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
    .map(([key, casus, number]) => ({
      caseName: casus,
      number,
      form: extractField(wikitext, key),
    }))
    .filter((row) => row.form);

  if (rows.length === 0) {
    return [{ caseName: "Nominative", number: "singular", form: word }];
  }

  return rows;
}

/**
 * Parse full dictionary entry from wikitext
 */
export function parseDictionaryEntry(word: string, wikitext: string): DictionaryEntry {
  const genderResult = parseGender(wikitext);
  const translations = parseTranslations(wikitext);
  const declension = parseDeclension(wikitext, word);

  return {
    word,
    article: genderResult ? (genderResult[0] as "der" | "die" | "das") : null,
    gender: genderResult ? (genderResult[1] as "Maskulinum" | "Femininum" | "Neutrum") : null,
    translations,
    declension,
    wiktionaryUrl: `https://de.wiktionary.org/wiki/${encodeURIComponent(word)}`,
  };
}

/**
 * Full lookup: fetch and parse
 */
export async function lookupWord(word: string): Promise<DictionaryEntry> {
  const cleaned = word.normalize("NFC").trim().replace(/[„“”‚‘’.,!?;:()[\]{}"«»]/g, "");
  if (!cleaned) {
    throw new Error("Empty word");
  }

  const wikitext = await fetchWikitext(cleaned);
  return parseDictionaryEntry(cleaned, wikitext);
}