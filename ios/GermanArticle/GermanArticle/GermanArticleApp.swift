import SwiftUI

@MainActor
final class AppRoute: ObservableObject {
    @Published var lookupWord: String?

    func requestLookup(_ word: String) {
        lookupWord = word
    }
}

@main
struct GermanArticleApp: App {
    @StateObject private var viewModel: LookupViewModel
    @StateObject private var route = AppRoute()

    init() {
        let client = WiktionaryClient()
        _viewModel = StateObject(wrappedValue: LookupViewModel(client: client))
    }

    var body: some Scene {
        WindowGroup {
            ContentView(viewModel: viewModel, route: route)
                .onOpenURL { url in
                    handleDeepLink(url)
                }
        }
    }

    private func handleDeepLink(_ url: URL) {
        // Deep link format: germanarticle://lookup?word=Bad
        guard url.scheme == "germanarticle",
              url.host == "lookup",
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let word = components.queryItems?.first(where: { $0.name == "word" })?.value else {
            return
        }

        route.requestLookup(word)
    }
}