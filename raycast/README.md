# German Article (private Raycast extension)

A local Raycast command for looking up German nouns through the public German Wiktionary API. It shows article, grammatical gender, English translations, and declension forms. Results include a link to the full Wiktionary entry; Wiktionary data is not authoritative language advice.

## Local development

This extension is intentionally private and is not published to the Raycast Store.

```bash
npm ci
npm test -- --runInBand
npm run build
npm run dev
```

Search for `Bad` or `Haus` in the command. When the search field is empty, the command shows the newest recent lookups (up to 20). Use the `Use Clipboard` action to look up a copied word.

The parser tests use deterministic in-repository wikitext fixtures and do not need network access. Runtime lookups call:

`https://de.wiktionary.org/w/api.php`

The command only stores recent words in Raycast/local browser storage; it does not send credentials or use analytics.
