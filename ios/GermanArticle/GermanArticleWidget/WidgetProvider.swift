import Foundation
import WidgetKit

struct WidgetEntry: TimelineEntry {
    let date: Date
    let entry: DictionaryEntry?
}

struct WidgetProvider: TimelineProvider {
    typealias Entry = WidgetEntry

    func placeholder(in context: Context) -> WidgetEntry {
        WidgetEntry(date: Date(), entry: DictionaryEntry.mockBad)
    }

    func getSnapshot(in context: Context, completion: @escaping (WidgetEntry) -> Void) {
        let entry = loadRecentEntry() ?? DictionaryEntry.mockBad
        completion(WidgetEntry(date: Date(), entry: entry))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetEntry>) -> Void) {
        let entry = loadRecentEntry() ?? DictionaryEntry.mockBad
        let currentDate = Date()
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate) ?? currentDate
        let timeline = Timeline(entries: [WidgetEntry(date: currentDate, entry: entry)], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadRecentEntry() -> DictionaryEntry? {
        // For MVP, use the configured default (mockBad)
        // In future, this could read from App Group UserDefaults
        if let data = UserDefaults.standard.data(forKey: "recentWordEntry"),
           let entry = try? JSONDecoder().decode(DictionaryEntry.self, from: data) {
            return entry
        }
        return nil
    }
}