# German Words PWA

A small, installable iPhone utility: paste an article, tap a word, and see its German article (`der`, `die`, or `das`) plus English translations.

## Run locally

```bash
python3 -m http.server 8080 --directory /home/hermes/german-word-helper
```

Open `http://<computer-ip>:8080` in Safari while on the same Wi-Fi. For iPhone Home Screen installation, serve it over HTTPS; plain HTTP is fine for local testing but not for a normal PWA install.

The dictionary lookup uses the public German Wiktionary API. Lookup results are cached in the browser.
