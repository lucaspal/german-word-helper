import SwiftUI
import WidgetKit

struct GermanArticleWidgetEntryView: View {
    var entry: WidgetEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            Color(.systemBackground)

            if let entry = entry.entry {
                content(for: entry)
            } else {
                placeholderContent
            }
        }
        .widgetURL(URL(string: "germanarticle://lookup?word=\(entry.entry?.word.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "Bad")"))
    }

    @ViewBuilder
    private func content(for entry: DictionaryEntry) -> some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }

    private var placeholderContent: some View {
        VStack(spacing: 8) {
            Image(systemName: "book.closed")
                .font(.system(size: 28))
                .foregroundStyle(.secondary)
            Text("Add widget to see a word")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
    }
}

struct SmallWidgetView: View {
    let entry: DictionaryEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(entry.displayArticle)
                .font(.system(size: 20, weight: .bold))
                .minimumScaleFactor(0.7)
                .lineLimit(1)
            Text(entry.displayGender)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(entry.displayMeanings)
                .font(.caption)
                .lineLimit(2)
                .foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding()
    }
}

struct MediumWidgetView: View {
    let entry: DictionaryEntry

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text(entry.displayArticle)
                    .font(.system(size: 24, weight: .bold))
                    .lineLimit(1)
                Text(entry.displayGender)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(entry.displayMeanings)
                    .font(.subheadline)
                    .lineLimit(3)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                ForEach(entry.declension.prefix(4)) { row in
                    HStack(spacing: 4) {
                        Text(row.caseName.prefix(3)).font(.caption2).foregroundStyle(.secondary)
                        Text(row.form).font(.caption).fontWeight(.medium)
                    }
                }
            }
        }
        .padding()
    }
}