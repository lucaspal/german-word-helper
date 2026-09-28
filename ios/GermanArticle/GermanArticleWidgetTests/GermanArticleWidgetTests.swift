import XCTest
@testable import GermanArticleWidget

final class GermanArticleWidgetTests: XCTestCase {
    func testWidgetEntryViewSmallFamily() {
        let entry = WidgetEntry(date: Date(), entry: DictionaryEntry.mockBad)
        let view = GermanArticleWidgetEntryView(entry: entry)

        XCTAssertNotNil(view)
    }

    func testWidgetEntryViewMediumFamily() {
        let entry = WidgetEntry(date: Date(), entry: DictionaryEntry.mockHaus)
        let view = GermanArticleWidgetEntryView(entry: entry)

        XCTAssertNotNil(view)
    }

    func testDeepLinkDataIsRetained() {
        let entry = WidgetEntry(date: Date(), entry: DictionaryEntry.mockBad)

        XCTAssertEqual(entry.entry?.word, "Bad")
        XCTAssertEqual(entry.entry?.wiktionaryUrl, "https://de.wiktionary.org/wiki/Bad")
    }
}
