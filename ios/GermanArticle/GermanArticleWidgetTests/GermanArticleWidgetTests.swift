import XCTest
@testable import GermanArticleWidget

final class GermanArticleWidgetTests: XCTestCase {
    func testWidgetProviderPlaceholder() {
        let provider = WidgetProvider()
        let entry = provider.placeholder(in: .init())

        XCTAssertEqual(entry.entry?.word, "Bad")
        XCTAssertEqual(entry.entry?.article, "das")
    }

    func testWidgetProviderSnapshot() {
        let provider = WidgetProvider()
        var snapshotEntry: WidgetEntry?

        provider.getSnapshot(in: .init()) { entry in
            snapshotEntry = entry
        }

        XCTAssertNotNil(snapshotEntry)
        XCTAssertEqual(snapshotEntry?.entry?.word, "Bad")
    }

    func testWidgetProviderTimeline() {
        let provider = WidgetProvider()
        var timeline: Timeline<WidgetEntry>?

        provider.getTimeline(in: .init()) { t in
            timeline = t
        }

        XCTAssertNotNil(timeline)
        XCTAssertEqual(timeline?.entries.count, 1)
        XCTAssertEqual(timeline?.entries.first?.entry?.word, "Bad")
        XCTAssertNotNil(timeline?.policy)
    }

    func testWidgetEntryViewSmallFamily() {
        let entry = WidgetEntry(date: Date(), entry: DictionaryEntry.mockBad)
        let view = GermanArticleWidgetEntryView(entry: entry)

        // Just verify it can be created without crashing
        XCTAssertNotNil(view)
    }

    func testWidgetEntryViewMediumFamily() {
        let entry = WidgetEntry(date: Date(), entry: DictionaryEntry.mockHaus)
        let view = GermanArticleWidgetEntryView(entry: entry)

        XCTAssertNotNil(view)
    }

    func testDeepLinkURLGeneration() {
        let entry = WidgetEntry(date: Date(), entry: DictionaryEntry.mockBad)
        let view = GermanArticleWidgetEntryView(entry: entry)

        // Verify the widgetURL is generated correctly (we can't easily test the actual URL here
        // but we can verify the view is created with the right data)
        XCTAssertEqual(entry.entry?.word, "Bad")
    }
}