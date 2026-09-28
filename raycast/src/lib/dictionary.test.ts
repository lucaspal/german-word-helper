const storage: Record<string, string> = {};

jest.mock("@raycast/api", () => ({
  LocalStorage: {
    getItem: async (key: string) => storage[key],
    setItem: async (key: string, value: string) => {
      storage[key] = value;
    },
  },
}), { virtual: true });

import { fetchWikitext, NotGermanNounError, parseGender, parseTranslations, parseDeclension, parseDictionaryEntry } from "./dictionary";

// Saved wikitext fixture for "Bad" from de.wiktionary.org (truncated for test speed)
const BAD_WIKITEXT = `{{Siehe auch|[[bad]], [[BAD]], [[bád]], [[bāad]]}}
== Bad ({{Sprache|Deutsch}}) ==
=== {{Wortart|Substantiv|Deutsch}}, {{n}} ===

{{Deutsch Substantiv Übersicht
|Genus=n
|Nominativ Singular=Bad
|Nominativ Plural=Bäder
|Genitiv Singular=Bads
|Genitiv Singular*=Bades
|Dativ Singular=Bad
|Dativ Singular*=Bade
|Dativ Plural=Bädern
|Akkusativ Singular=Bad
|Akkusativ Plural=Bäder
|Bild=Ban-Bathroom-Nus.JPG|mini|4|ein ''Bad''
}}

{{Bedeutungen}}
:[1] der Vorgang des [[baden|Badens]], der [[Aufenthalt]] in [[Wasser]], [[Licht]], Luft zum [[Vergnügen]], zur [[Heilung]] oder zur [[Reinigung]]
:[2] eine [[Flüssigkeit]], in die ein [[Gegenstand]] zu einer, meist [[chemisch]]en, [[Behandlung]] getaucht wird
:[3] ''verkürzt für:'' [[Badeanstalt]], [[Badestrand]]
:[4] ''verkürzt für:'' [[Badezimmer]], [[Badestube]], [[Badehaus]]
:[5] ''ein [[amtlich]]er [[Beiname]], [[Namenzusatz]] bei [[Toponymen]] für [[Ort]]e in denen [[Heileinrichtungen|Heil-]] und [[Erholungseinrichtung]]en ansässig sind, meist mit [[örtlich]] vorhandenen [[natürlich]]en [[Ressource]]n, die dazu genutzt werden

{{Übersetzungen}}
{{Ü-Tabelle|1|G=der Vorgang des Badens, der Aufenthalt in Wasser|Ü-Liste=
*{{en}}: {{Ü|en|bath}}
*{{fr}}: {{Ü|fr|bain}} {{m}}
*{{es}}: {{Ü|es|baño}} {{m}}
}}
{{Ü-Tabelle|2|G=eine Flüssigkeit, in die ein Gegenstand zu einer, meist chemischen, Behandlung getaucht wird|Ü-Liste=
*{{en}}: {{Ü|en|bath}}
*{{fi}}: {{Ü|fi|kylpy}}
}}
`;

const HAUS_WIKITEXT = `== Haus ({{Sprache|Deutsch}}) ==
=== {{Wortart|Substantiv|Deutsch}}, {{n}} ===
{{Deutsch Substantiv Übersicht
|Genus=n
|Nominativ Singular=Haus
|Nominativ Plural=Häuser
|Genitiv Singular=Hauses
|Dativ Plural=Häusern
|Akkusativ Plural=Häuser
}}
{{Übersetzungen}}
*{{en}}: {{Ü|en|house}}, {{Ü|en|home}}
`;

describe("German Wiktionary parser", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("parseGender", () => {
    it("extracts neuter gender from {{n}}", () => {
      const result = parseGender(BAD_WIKITEXT);
      expect(result).not.toBeNull();
      expect(result![0]).toBe("das");
      expect(result![1]).toBe("Neutrum");
    });
  });

  describe("parseTranslations", () => {
    it("extracts English translations from Ü templates", () => {
      const translations = parseTranslations(BAD_WIKITEXT);
      expect(translations).toContain("bath");
      // Should not have duplicates
      expect(new Set(translations).size).toBe(translations.length);
    });
  });

  describe("parseDeclension", () => {
    it("extracts all declension forms for Bad", () => {
      const declension = parseDeclension(BAD_WIKITEXT, "Bad");

      // Check specific expected forms
      const nominativeSingular = declension.find(
        (r) => r.caseName === "Nominative" && r.number === "singular"
      );
      expect(nominativeSingular?.form).toBe("Bad");

      const nominativePlural = declension.find(
        (r) => r.caseName === "Nominative" && r.number === "plural"
      );
      expect(nominativePlural?.form).toBe("Bäder");

      const genitiveSingular = declension.find(
        (r) => r.caseName === "Genitive" && r.number === "singular"
      );
      expect(genitiveSingular?.form).toBe("Bads");

      const dativePlural = declension.find(
        (r) => r.caseName === "Dative" && r.number === "plural"
      );
      expect(dativePlural?.form).toBe("Bädern");
    });

    it("returns at least the nominative singular as fallback", () => {
      const declension = parseDeclension("no table here", "Haus");
      expect(declension).toHaveLength(1);
      expect(declension[0]).toEqual({
        caseName: "Nominative",
        number: "singular",
        form: "Haus",
      });
    });
  });

  describe("parseDictionaryEntry", () => {
    it("rejects a page without a German noun section", () => {
      expect(() =>
        parseDictionaryEntry("gehen", "== gehen ({{Sprache|Deutsch}}) ==\n=== {{Wortart|Verb|Deutsch}} ===")
      ).toThrow(NotGermanNounError);
    });

    it("returns complete entry for Bad with article, English meanings, and declension", () => {
      const entry = parseDictionaryEntry("Bad", BAD_WIKITEXT);

      expect(entry.word).toBe("Bad");
      expect(entry.article).toBe("das");
      expect(entry.gender).toBe("Neutrum");
      expect(entry.translations).toContain("bath");
      expect(entry.declension.length).toBeGreaterThanOrEqual(4);

      // Verify specific declension rows
      const forms = entry.declension.map((r) => `${r.caseName} ${r.number}: ${r.form}`).join("; ");
      expect(forms).toContain("Nominative singular: Bad");
      expect(forms).toContain("Nominative plural: Bäder");
      expect(forms).toContain("Dative plural: Bädern");

      expect(entry.wiktionaryUrl).toBe(
        "https://de.wiktionary.org/wiki/Bad"
      );
    });

    it("parses Haus article, English meanings, and plural declension", () => {
      const entry = parseDictionaryEntry("Haus", HAUS_WIKITEXT);

      expect(entry.article).toBe("das");
      expect(entry.translations).toEqual(["house", "home"]);
      expect(entry.declension).toContainEqual({
        caseName: "Nominative",
        number: "plural",
        form: "Häuser",
      });
      expect(entry.declension).toContainEqual({
        caseName: "Dative",
        number: "plural",
        form: "Häusern",
      });
    });
  });

  describe("fetchWikitext", () => {
    it("retries a rate-limited response using Retry-After", async () => {
      const response = (ok: boolean, status: number, body: object) => ({
        ok,
        status,
        headers: { get: (name: string) => (name === "Retry-After" ? "0" : null) },
        json: async () => body,
      });
      jest.spyOn(global, "fetch")
        .mockResolvedValueOnce(response(false, 429, {} ) as Response)
        .mockResolvedValueOnce(response(true, 200, { parse: { wikitext: { "*": "fixture" } } }) as Response);

      await expect(fetchWikitext("Bad")).resolves.toBe("fixture");
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining("page=Bad"),
        expect.objectContaining({ headers: expect.objectContaining({ "Api-User-Agent": expect.stringContaining("GermanArticleRaycast") }) })
      );
    });
  });
});