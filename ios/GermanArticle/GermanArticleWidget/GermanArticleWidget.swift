import WidgetKit
import SwiftUI

struct GermanArticleWidget: Widget {
    let kind: String = "GermanArticleWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WidgetProvider()) { entry in
            GermanArticleWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("German Article")
        .description("Shows a German word with its article and English meaning.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct GermanArticleWidget_Previews: PreviewProvider {
    static var previews: some View {
        GermanArticleWidgetEntryView(entry: WidgetEntry(date: Date(), entry: DictionaryEntry.mockBad))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
        GermanArticleWidgetEntryView(entry: WidgetEntry(date: Date(), entry: DictionaryEntry.mockBad))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}