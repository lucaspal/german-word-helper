import Foundation
import SwiftUI
import WidgetKit

@MainActor
final class LookupViewModel: ObservableObject {
    enum State: Equatable {
        case idle
        case loading
        case success
        case error
    }

    @Published private(set) var state: State = .idle
    @Published private(set) var entry: DictionaryEntry?
    @Published private(set) var errorMessage: String?

    private let client: DictionaryClient
    private var latestLookupID = UUID()

    init(client: DictionaryClient) {
        self.client = client
    }

    func lookup(_ word: String) async {
        let cleaned = word.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty else { return }

        let lookupID = UUID()
        latestLookupID = lookupID

        state = .loading
        entry = nil
        errorMessage = nil

        do {
            let entry = try await client.fetchWord(cleaned)
            guard lookupID == latestLookupID else { return }
            self.entry = entry
            state = .success
            if let data = try? JSONEncoder().encode(entry) {
                UserDefaults.standard.set(data, forKey: "recentWordEntry")
                NotificationCenter.default.post(name: .dictionaryEntryDidChange, object: nil)
                WidgetCenter.shared.reloadAllTimelines()
            }
        } catch {
            guard lookupID == latestLookupID else { return }
            self.errorMessage = error.localizedDescription
            state = .error
        }
    }

    func clear() {
        latestLookupID = UUID()
        state = .idle
        entry = nil
        errorMessage = nil
    }
}

extension Notification.Name {
    static let dictionaryEntryDidChange = Notification.Name("dictionaryEntryDidChange")
}
