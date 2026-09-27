# German Article iOS App & Widget

Native iOS companion for the German Article PWA. Built with SwiftUI and WidgetKit.

The repository includes a complete Xcode project with automatic signing left to
the Mac/Xcode environment. This Linux worker cannot run Xcode, `xcodebuild`, or
the iOS Simulator; run the commands below on Luca's Mac before device use.

## Project Structure

```
ios/
├── GermanArticle/
│   ├── GermanArticle.xcodeproj/     # Xcode project (created via Xcode GUI)
│   ├── GermanArticle/               # Main app target
│   │   ├── Models/                  # DictionaryEntry, DeclensionRow
│   │   ├── Services/                # WiktionaryParser, DictionaryClient
│   │   ├── ViewModels/              # LookupViewModel
│   │   ├── Views/                   # ContentView, EntryDetailView
│   │   ├── GermanArticleApp.swift   # App entry point + deep link handling
│   │   └── Assets.xcassets/         # App icons
│   ├── GermanArticleWidget/         # WidgetKit extension
│   │   ├── GermanArticleWidget.swift
│   │   ├── WidgetProvider.swift
│   │   └── WidgetEntryView.swift
│   ├── GermanArticleTests/          # XCTest unit tests
│   │   ├── WiktionaryParserTests.swift
│   │   └── LookupViewModelTests.swift
│   └── GermanArticleWidgetTests/    # Widget tests
│       └── GermanArticleWidgetTests.swift
├── scripts/
│   ├── test.sh              # Run XCTest suite
│   ├── build-simulator.sh   # Build for simulator
│   └── install-simulator.sh # Install to booted simulator
└── README.md
```

## One-Time GUI Setup (on macOS with Xcode 26.6)

1. Open Xcode 26.6
2. **Create the app project:**
   - File → New → Project → iOS → App
   - Product Name: `GermanArticle`
   - Interface: SwiftUI
   - Language: Swift
   - Bundle Identifier: `com.lucaspal.GermanArticle` (or your team ID)
   - Save to: `ios/GermanArticle/`
3. **Add Widget Extension:**
   - File → New → Target → Widget Extension
   - Product Name: `GermanArticleWidget`
   - Include Configuration Intent: No
   - Embed in: GermanArticle
4. **Configure Signing:**
   - Select both `GermanArticle` and `GermanArticleWidget` targets
   - Signing & Capabilities → Automatically manage signing
   - Select your Development Team
5. **Add URL Scheme for Deep Links:**
   - Select `GermanArticle` target → Info → URL Types → +
   - URL Scheme: `germanarticle`
6. The committed project is already under `ios/GermanArticle/`; review the generated signing settings and commit any Xcode-managed project updates.

## Repeatable CLI Workflow

```bash
# Run all tests
bash ios/scripts/test.sh

# Build for simulator
bash ios/scripts/build-simulator.sh

# Install and launch on simulator
xcrun simctl boot 'iPhone 17' || true
bash ios/scripts/install-simulator.sh
xcrun simctl launch <SIMULATOR_ID> com.lucaspal.GermanArticle
```

## Verification

Expected test output (from `test.sh`):
- WiktionaryParserTests: parse Bad/Haus fixtures ✓
- LookupViewModelTests: idle/loading/success/error states ✓
- GermanArticleWidgetTests: timeline/snapshot/placeholder ✓

Expected simulator behavior:
- App launches showing search field
- Enter "Bad" → shows "das Bad", "Neutrum", "bath, bathroom", declension table
- Widget gallery shows "German Article" widget (small/medium)
- Tapping widget opens app at the word

## Deep Links

The app handles `germanarticle://lookup?word=<WORD>` URLs.
The widget uses this to open the app at the displayed word.

## Data Source

German Wiktionary MediaWiki API: `https://de.wiktionary.org/w/api.php`
Same endpoint and parsing logic as the PWA (`app.js`).

## Notes

- No App Groups used in MVP (widget shows static/configured word)
- No credentials or certificates committed
- Development signing only; Ad Hoc not required for MVP
- Parser uses deterministic fixtures; degrades gracefully on missing fields