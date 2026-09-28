import Foundation

protocol DictionaryClient {
    func fetchWord(_ word: String) async throws -> DictionaryEntry
}

struct WiktionaryClient: DictionaryClient {
    private let session: URLSession
    private let baseURL = "https://de.wiktionary.org/w/api.php"

    init(session: URLSession = .shared) {
        self.session = session
    }

    func fetchWord(_ word: String) async throws -> DictionaryEntry {
        let cleaned = word.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty else {
            throw DictionaryError.wordNotFound
        }

        let candidates = Self.lookupCandidates(for: cleaned)
        var lastError: Error = DictionaryError.wordNotFound
        for candidate in candidates {
            do {
                let entry = try await fetchCandidate(candidate)
                if entry.article != nil || candidate == candidates.last {
                    return entry
                }
            } catch {
                lastError = error
            }
        }

        throw lastError
    }

    private func fetchCandidate(_ word: String) async throws -> DictionaryEntry {
        var components = URLComponents(string: baseURL)!
        components.queryItems = [
            URLQueryItem(name: "action", value: "parse"),
            URLQueryItem(name: "page", value: word),
            URLQueryItem(name: "prop", value: "wikitext"),
            URLQueryItem(name: "format", value: "json")
        ]

        guard let url = components.url else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("GermanArticle/0.1 (iOS dictionary companion)", forHTTPHeaderField: "User-Agent")

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        guard httpResponse.statusCode == 200 else {
            throw DictionaryError.requestFailed(statusCode: httpResponse.statusCode)
        }

        struct APIResponse: Decodable {
            let parse: Parse?
            struct Parse: Decodable {
                let wikitext: Wikitext?
                struct Wikitext: Decodable {
                    let value: String
                    enum CodingKeys: String, CodingKey { case value = "*" }
                }
            }
        }

        let apiResponse = try JSONDecoder().decode(APIResponse.self, from: data)

        guard let wikitext = apiResponse.parse?.wikitext?.value,
              !wikitext.isEmpty else {
            throw DictionaryError.wordNotFound
        }

        return try WiktionaryParser().parse(word: word, wikitextData: Data(wikitext.utf8))
    }

    static func lookupCandidates(for word: String) -> [String] {
        guard let first = word.first, first.isLowercase else { return [word] }
        let capitalized = String(first).uppercased() + word.dropFirst()
        return capitalized == word ? [word] : [word, capitalized]
    }
}

enum DictionaryError: Error, LocalizedError {
    case requestFailed(statusCode: Int)
    case wordNotFound
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .requestFailed(let code):
            return "Dictionary request failed (\(code))"
        case .wordNotFound:
            return "Word not found"
        case .invalidResponse:
            return "Invalid dictionary response"
        }
    }
}