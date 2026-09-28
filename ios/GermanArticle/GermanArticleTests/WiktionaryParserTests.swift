import XCTest
@testable import GermanArticle

final class WiktionaryParserTests: XCTestCase {
    private let badWikitext = """
{{Wortart|Substantiv|Deutsch}}
{{Substantiv Übersicht|Genus=n}}

{{Ü|en|bath}}
{{Ü|en|bathroom}}

{{Substantiv|Deutsch|n|Bäder|Bädern|Bäder|Bäder}}

== Formen ==
=== Substantiv ===
{| class="wikitable"
|-
! | Singular
! | Plural
|-
! Nominativ
| Bad
| Bäder
|-
! Genitiv
| Bades
| Bäder
|-
! Dativ
| Bad
| Bädern
|-
! Akkusativ
| Bad
| Bäder
|}
|}

== Referenzen ==
* {{Literatur|Duden}}
""".data(using: .utf8)!

    private let hausWikitext = """
{{Wortart|Substantiv|Deutsch}}
{{Substantiv Übersicht|Genus=n}}

{{Ü|en|house}}
{{Ü|en|building}}
{{Ü|en|home}}

{{Substantiv|Deutsch|n|Häuser|Häusern|Häuser|Häuser}}

== Formen ==
=== Substantiv ===
{| class="wikitable"
|-
! | Singular
! | Plural
|-
! Nominativ
| Haus
| Häuser
|-
! Genitiv
| Hauses
| Häuser
|-
! Dativ
| Haus
| Häusern
|-
! Akkusativ
| Haus
| Häuser
|}
|}
""".data(using: .utf8)!

    func testParseBadReturnsExpectedEntry() throws {
        let parser = WiktionaryParser()
        let entry = try parser.parse(word: "Bad", wikitextData: badWikitext)

        XCTAssertEqual(entry.word, "Bad")
        XCTAssertEqual(entry.article, "das")
        XCTAssertEqual(entry.gender, "Neutrum")
        XCTAssertEqual(entry.translations, ["bath", "bathroom"])
        XCTAssertEqual(entry.declension.count, 8)
        XCTAssertEqual(entry.declension[0].caseName, "Nominative")
        XCTAssertEqual(entry.declension[0].number, "singular")
        XCTAssertEqual(entry.declension[0].form, "Bad")
        XCTAssertEqual(entry.declension[4].caseName, "Nominative")
        XCTAssertEqual(entry.declension[4].number, "plural")
        XCTAssertEqual(entry.declension[4].form, "Bäder")
        XCTAssertEqual(entry.declension[7].form, "Bäder")
    }

    func testParseHausReturnsExpectedEntry() throws {
        let parser = WiktionaryParser()
        let entry = try parser.parse(word: "Haus", wikitextData: hausWikitext)

        XCTAssertEqual(entry.word, "Haus")
        XCTAssertEqual(entry.article, "das")
        XCTAssertEqual(entry.gender, "Neutrum")
        XCTAssertEqual(entry.translations, ["house", "building", "home"])
        XCTAssertEqual(entry.declension.count, 8)
    }

    func testParseMissingGenderReturnsNil() throws {
        let incompleteWikitext = """
{{Wortart|Substantiv|Deutsch}}
{{Substantiv Übersicht}}

{{Ü|en|test}}
""".data(using: .utf8)!

        let parser = WiktionaryParser()
        let entry = try parser.parse(word: "Test", wikitextData: incompleteWikitext)

        XCTAssertNil(entry.article)
        XCTAssertNil(entry.gender)
    }

    func testParseEmptyTranslationsReturnsEmptyArray() throws {
        let noTranslationWikitext = """
{{Wortart|Substantiv|Deutsch}}
{{Substantiv Übersicht|Genus=m}}
""".data(using: .utf8)!

        let parser = WiktionaryParser()
        let entry = try parser.parse(word: "Test", wikitextData: noTranslationWikitext)

        XCTAssertEqual(entry.translations, [])
    }

    func testLookupCandidatesRetryGermanNounCapitalization() {
        XCTAssertEqual(WiktionaryClient.lookupCandidates(for: "haus"), ["haus", "Haus"])
        XCTAssertEqual(WiktionaryClient.lookupCandidates(for: "Haus"), ["Haus"])
    }
}