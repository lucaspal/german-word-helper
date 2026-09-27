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

## Run locally

```bash
python3 -m http.server 8080 --directory /home/hermes/german-word-helper
```

Open `http://<computer-ip>:8080` in Safari while on the same Wi-Fi. For iPhone Home Screen installation, serve it over HTTPS; plain HTTP is fine for local testing but not for a normal PWA install.

## Versioning and deployment

See [`AGENTS.md`](AGENTS.md) for development rules and [`DEPLOYMENT.md`](DEPLOYMENT.md) for the Git and Tailscale Serve workflow.

The current deployed address is:

`https://hermes-backend.tail9a0109.ts.net`
