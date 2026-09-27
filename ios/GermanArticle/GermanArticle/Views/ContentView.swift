import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel: LookupViewModel
    @State private var inputText: String = ""

    init(viewModel: LookupViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                // Search field
                HStack {
                    TextField("Enter German word", text: $inputText)
                        .textFieldStyle(.roundedBorder)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .onSubmit { Task { await viewModel.lookup(inputText) } }

                    Button("Lookup") {
                        Task { await viewModel.lookup(inputText) }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.state == .loading)
                }
                .padding(.horizontal)

                // Result area
                Group {
                    switch viewModel.state {
                    case .idle:
                        VStack(spacing: 12) {
                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 48))
                                .foregroundStyle(.secondary)
                            Text("Enter a German word to look up its article, gender, and English meanings.")
                                .multilineTextAlignment(.center)
                                .foregroundStyle(.secondary)
                                .padding(.horizontal)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)

                    case .loading:
                        VStack(spacing: 12) {
                            ProgressView()
                                .scaleEffect(1.5)
                            Text("Looking up…")
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)

                    case .success:
                        if let entry = viewModel.entry {
                            EntryDetailView(entry: entry)
                        }

                    case .error:
                        VStack(spacing: 12) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 48))
                                .foregroundStyle(.orange)
                            Text(viewModel.errorMessage ?? "Unknown error")
                                .multilineTextAlignment(.center)
                                .foregroundStyle(.primary)
                                .padding(.horizontal)
                            Button("Try Again") {
                                Task { await viewModel.lookup(inputText) }
                            }
                            .buttonStyle(.borderedProminent)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }

                Spacer()
            }
            .navigationTitle("German Article")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if viewModel.state == .success {
                        Button("Clear") { viewModel.clear() }
                    }
                }
            }
        }
    }
}

struct EntryDetailView: View {
    let entry: DictionaryEntry

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Article and gender
                VStack(alignment: .leading, spacing: 4) {
                    Text(entry.displayArticle)
                        .font(.system(size: 36, weight: .bold))
                    Text("Substantiv · \(entry.displayGender)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Divider()

                // English meanings
                VStack(alignment: .leading, spacing: 8) {
                    Text("ENGLISH")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)
                    Text(entry.displayMeanings)
                        .font(.body)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Divider()

                // Declension table
                VStack(alignment: .leading, spacing: 8) {
                    Text("DECLENSION")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)

                    VStack(spacing: 0) {
                        // Header
                        HStack {
                            Text("CASE").font(.caption).fontWeight(.medium).foregroundStyle(.secondary)
                            Text("NUMBER").font(.caption).fontWeight(.medium).foregroundStyle(.secondary)
                            Spacer()
                            Text("FORM").font(.caption).fontWeight(.medium).foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 12)

                        Divider()

                        ForEach(entry.declension, id: \.self) { row in
                            HStack {
                                Text(row.caseName).font(.body)
                                Text(row.number.capitalized).font(.body).foregroundStyle(.secondary)
                                Spacer()
                                Text(row.form).font(.body).fontWeight(.medium)
                            }
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            Divider()
                        }
                    }
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // Wiktionary link
                Link("Open full dictionary entry ↗", destination: URL(string: entry.wiktionaryUrl)!)
                    .font(.footnote)
                    .foregroundStyle(.blue)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 8)
            }
            .padding()
        }
    }
}

#Preview {
    let mockClient = MockDictionaryClient()
    mockClient.result = .success(DictionaryEntry.mockBad)
    return ContentView(viewModel: LookupViewModel(client: mockClient))
}

private class MockDictionaryClient: DictionaryClient {
    var result: Result<DictionaryEntry, Error> = .failure(DictionaryError.wordNotFound)
    func fetchWord(_ word: String) async throws -> DictionaryEntry {
        switch result {
        case .success(let entry): return entry
        case .failure(let error): throw error
        }
    }
}