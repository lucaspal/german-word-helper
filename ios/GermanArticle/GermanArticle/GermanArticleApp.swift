import SwiftUI

@main
struct GermanArticleApp: App {
    @StateObject private var viewModel: LookupViewModel

    init() {
        let client = WiktionaryClient()
        _viewModel = StateObject(wrappedValue: LookupViewModel(client: client))
    }

    var body: some Scene {
        WindowGroup {
            ContentView(viewModel: viewModel)
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

        Task {
            await viewModel.lookup(word)
        }
    }
}