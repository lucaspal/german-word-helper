import XCTest
@testable import GermanArticle

@MainActor
final class LookupViewModelTests: XCTestCase {
    private var viewModel: LookupViewModel!
    private var mockClient: MockDictionaryClient!

    override func setUp() {
        super.setUp()
        mockClient = MockDictionaryClient()
        viewModel = LookupViewModel(client: mockClient)
    }

    func testInitialStateIsIdle() {
        XCTAssertEqual(viewModel.state, .idle)
        XCTAssertNil(viewModel.entry)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testLookupShowsLoadingThenSuccess() async {
        mockClient.result = .success(DictionaryEntry.mockBad)

        await viewModel.lookup("Bad")

        XCTAssertEqual(viewModel.state, .success)
        XCTAssertNotNil(viewModel.entry)
        XCTAssertEqual(viewModel.entry?.word, "Bad")
        XCTAssertEqual(viewModel.entry?.article, "das")
    }

    func testLookupShowsLoadingThenWordNotFound() async {
        mockClient.result = .failure(DictionaryError.wordNotFound)

        await viewModel.lookup("Nonexistent")

        XCTAssertEqual(viewModel.state, .error)
        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertNil(viewModel.entry)
    }

    func testLookupShowsLoadingThenNetworkError() async {
        mockClient.result = .failure(URLError(.notConnectedToInternet))

        await viewModel.lookup("Bad")

        XCTAssertEqual(viewModel.state, .error)
        XCTAssertNotNil(viewModel.errorMessage)
    }

    func testLookupClearsPreviousEntry() async {
        mockClient.result = .success(DictionaryEntry.mockBad)
        await viewModel.lookup("Bad")
        XCTAssertNotNil(viewModel.entry)

        mockClient.result = .failure(DictionaryError.wordNotFound)
        await viewModel.lookup("Missing")

        XCTAssertEqual(viewModel.state, .error)
    }

    func testClearResetsToIdle() async {
        mockClient.result = .success(DictionaryEntry.mockBad)
        await viewModel.lookup("Bad")
        XCTAssertEqual(viewModel.state, .success)

        viewModel.clear()

        XCTAssertEqual(viewModel.state, .idle)
        XCTAssertNil(viewModel.entry)
        XCTAssertNil(viewModel.errorMessage)
    }
}

private class MockDictionaryClient: DictionaryClient {
    var result: Result<DictionaryEntry, Error> = .failure(DictionaryError.wordNotFound)

    func fetchWord(_ word: String) async throws -> DictionaryEntry {
        switch result {
        case .success(let entry):
            return entry
        case .failure(let error):
            throw error
        }
    }
}