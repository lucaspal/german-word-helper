import Foundation

enum WiktionaryParserError: Error, LocalizedError {
    case emptyWikitext
    case parseFailed(String)

    var errorDescription: String? {
        switch self {
        case .emptyWikitext:
            return "Wikitext is empty"
        case .parseFailed(let message):
            return "Failed to parse wikitext: \(message)"
        }
    }
}

struct WiktionaryParser {
    func parse(word: String, wikitextData: Data) throws -> DictionaryEntry {
        guard let wikitext = String(data: wikitextData, encoding: .utf8) else {
            throw WiktionaryParserError.parseFailed("Invalid UTF-8 encoding")
        }

        guard !wikitext.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw WiktionaryParserError.emptyWikitext
        }

        let (article, gender) = extractGender(from: wikitext)
        let translations = extractTranslations(from: wikitext)
        let declension = extractDeclension(from: wikitext, fallbackWord: word)
        let url = "https://de.wiktionary.org/wiki/\(word.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? word)"

        return DictionaryEntry(
            word: word,
            article: article,
            gender: gender,
            translations: translations,
            declension: declension,
            wiktionaryUrl: url
        )
    }

    private func extractGender(from wikitext: String) -> (String?, String?) {
        // Pattern 1: Genus = [mfn] in Substantiv Übersicht
        if let match = wikitext.range(of: #"Genus\s*=\s*([mfn])"#, options: .regularExpression) {
            let genus = String(wikitext[match]).lowercased()
            let letter = String(genus.last!)
            return mapGender(letter)
        }

        // Pattern 2: {{Substantiv|Deutsch|[mfn]|...
        if let match = wikitext.range(of: #"\{\{Substantiv\|Deutsch\|([mfn])\|"#, options: .regularExpression) {
            let letter = String(wikitext[match].last!)
            return mapGender(letter)
        }

        // Pattern 3: Wortart|Substantiv|Deutsch followed by Genus
        if let match = wikitext.range(of: #"Wortart\|Substantiv\|Deutsch[^\n]*?\}\}\s*,\s*\{\{([mfn])\}\}"#, options: .regularExpression) {
            let genus = String(wikitext[match]).lowercased()
            let letter = String(genus.last!)
            return mapGender(letter)
        }

        return (nil, nil)
    }

    private func mapGender(_ letter: String) -> (String?, String?) {
        switch letter {
        case "m": return ("der", "Maskulinum")
        case "f": return ("die", "Femininum")
        case "n": return ("das", "Neutrum")
        default: return (nil, nil)
        }
    }

    private func extractTranslations(from wikitext: String) -> [String] {
        var translations: [String] = []
        let pattern = #"\{\{(?:Ü|Üt)\|en\|([^}|\n]+)(?:\|[^}|\n]*)?"#
        let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive)
        let range = NSRange(location: 0, length: wikitext.utf16.count)

        regex?.enumerateMatches(in: wikitext, options: [], range: range) { match, _, _ in
            guard let match = match,
                  let range = Range(match.range(at: 1), in: wikitext) else { return }
            let value = String(wikitext[range]).trimmingCharacters(in: .whitespacesAndNewlines)
            if !value.isEmpty && !translations.contains(value) && translations.count < 10 {
                translations.append(value)
            }
        }

        return translations
    }

    private func extractDeclension(from wikitext: String, fallbackWord: String) -> [DeclensionRow] {
        let labels = [
            ("Nominative", "singular", "Nominativ Singular"),
            ("Genitive", "singular", "Genitiv Singular"),
            ("Dative", "singular", "Dativ Singular"),
            ("Accusative", "singular", "Akkusativ Singular"),
            ("Nominative", "plural", "Nominativ Plural"),
            ("Genitive", "plural", "Genitiv Plural"),
            ("Dative", "plural", "Dativ Plural"),
            ("Accusative", "plural", "Akkusativ Plural")
        ]

        var rows: [DeclensionRow] = []

        for (caseName, number, germanLabel) in labels {
            if let form = extractField(from: wikitext, name: germanLabel), !form.isEmpty {
                rows.append(DeclensionRow(caseName: caseName, number: number, form: form))
            }
        }

        if rows.isEmpty {
            rows = extractTableDeclension(from: wikitext)
        }

        // Fallback if no declension found
        if rows.isEmpty {
            rows.append(DeclensionRow(caseName: "Nominative", number: "singular", form: fallbackWord))
        }

        return rows
    }

    private func extractTableDeclension(from wikitext: String) -> [DeclensionRow] {
        let cases = [("Nominative", "Nominativ"), ("Genitive", "Genitiv"), ("Dative", "Dativ"), ("Accusative", "Akkusativ")]
        var rows: [DeclensionRow] = []
        for (englishCase, germanCase) in cases {
            guard let marker = wikitext.range(of: "!\\s*" + germanCase, options: .regularExpression) else { continue }
            let remainder = wikitext[marker.upperBound...]
            let cells = remainder.split(separator: "|", omittingEmptySubsequences: true)
                .map { $0.replacingOccurrences(of: "-", with: "").trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty && !$0.hasPrefix("{") }
                .prefix(2)
            guard cells.count >= 2 else { continue }
            rows.append(DeclensionRow(caseName: englishCase, number: "singular", form: cells[0]))
            rows.append(DeclensionRow(caseName: englishCase, number: "plural", form: cells[1]))
        }
        return rows
    }

    private func extractField(from wikitext: String, name: String) -> String? {
        let escapedName = NSRegularExpression.escapedPattern(for: name)
        let pattern = "^\\|" + escapedName + "=([^\n]*)"
        let regex = try? NSRegularExpression(pattern: pattern, options: [.anchorsMatchLines, .caseInsensitive])
        let range = NSRange(location: 0, length: wikitext.utf16.count)

        if let match = regex?.firstMatch(in: wikitext, options: [], range: range),
           let range = Range(match.range(at: 1), in: wikitext) {
            return String(wikitext[range]).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return nil
    }
}