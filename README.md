# German Words PWA

A small, installable iPhone utility for looking up German nouns. Enter a word such as `Bad` and see its article (`der`, `die`, or `das`), grammatical gender, English meanings, and declension forms.

## Dictionary source

The application uses the public German Wiktionary MediaWiki API:

`https://de.wiktionary.org/w/api.php`

It reads the German Wiktionary entry for the requested word and extracts:

- the noun gender and article;
- English translations;
- singular and plural declension forms.

Each result includes a link to the full German Wiktionary entry. Results are cached in the browser after lookup.

## Companion apps

The PWA remains the default cross-device tool. Two private companions share the
same Wiktionary source and fixture-driven parsing behavior:

- `raycast/` is a local Raycast extension. It is not published to the Raycast Store.
- `ios/` is a native SwiftUI app with a glanceable WidgetKit companion. Xcode/macOS
  is required for iOS tests, simulator builds, and signing.

Both companions are optional and do not change the root PWA. See the local
`raycast/README.md`, `ios/README.md`, and
[`docs/releases/companion-apps-v0.1.0.md`](docs/releases/companion-apps-v0.1.0.md)
for verification and rollback details.

## Run locally

```bash
python3 -m http.server 8080 --directory /home/hermes/german-word-helper
```

Open `http://<computer-ip>:8080` in Safari while on the same Wi-Fi. For iPhone Home Screen installation, serve it over HTTPS; plain HTTP is fine for local testing but not for a normal PWA install.

## Versioning and deployment

See [`AGENTS.md`](AGENTS.md) for development rules and [`DEPLOYMENT.md`](DEPLOYMENT.md) for the Git and Tailscale Serve workflow.

The current deployed address is:

`https://hermes-backend.tail9a0109.ts.net`
