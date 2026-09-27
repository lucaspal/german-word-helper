import Foundation

struct DeclensionRow: Codable, Equatable, Hashable {
    let caseName: String
    let number: String // "singular" | "plural"
    let form: String
}

struct DictionaryEntry: Codable, Equatable, Hashable {
    let word: String
    let article: String? // "der", "die", "das", or nil
    let gender: String? // "Maskulinum", "Femininum", "Neutrum", or nil
    let translations: [String]
    let declension: [DeclensionRow]
    let wiktionaryUrl: String

    var displayArticle: String {
        if let article = article {
            return "\(article) \(word)"
        }
        return word
    }

    var displayGender: String {
        gender ?? "Noun"
    }

    var displayMeanings: String {
        translations.isEmpty ? "No English translation found" : translations.joined(separator: ", ")
    }
}

extension DictionaryEntry {
    static let mockBad = DictionaryEntry(
        word: "Bad",
        article: "das",
        gender: "Neutrum",
        translations: ["bath", "bathroom"],
        declension: [
            DeclensionRow(caseName: "Nominative", number: "singular", form: "Bad"),
            DeclensionRow(caseName: "Genitive", number: "singular", form: "Bades"),
            DeclensionRow(caseName: "Dative", number: "singular", form: "Bad"),
            DeclensionRow(caseName: "Accusative", number: "singular", form: "Bad"),
            DeclensionRow(caseName: "Nominative", number: "plural", form: "Bäder"),
            DeclensionRow(caseName: "Genitive", number: "plural", form: "Bäder"),
            DeclensionRow(caseName: "Dative", number: "plural", form: "Bädern"),
            DeclensionRow(caseName: "Accusative", number: "plural", form: "Bäder")
        ],
        wiktionaryUrl: "https://de.wiktionary.org/wiki/Bad"
    )

    static let mockHaus = DictionaryEntry(
        word: "Haus",
        article: "das",
        gender: "Neutrum",
        translations: ["house", "building", "home"],
        declension: [
            DeclensionRow(caseName: "Nominative", number: "singular", form: "Haus"),
            DeclensionRow(caseName: "Genitive", number: "singular", form: "Hauses"),
            DeclensionRow(caseName: "Dative", number: "singular", form: "Haus"),
            DeclensionRow(caseName: "Accusative", number: "singular", form: "Haus"),
            DeclensionRow(caseName: "Nominative", number: "plural", form: "Häuser"),
            DeclensionRow(caseName: "Genitive", number: "plural", form: "Häuser"),
            DeclensionRow(caseName: "Dative", number: "plural", form: "Häusern"),
            DeclensionRow(caseName: "Accusative", number: "plural", form: "Häuser")
        ],
        wiktionaryUrl: "https://de.wiktionary.org/wiki/Haus"
    )
}