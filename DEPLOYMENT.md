# German Article Utility

## Versioning

This directory is a Git repository. Releases use semantic-version tags such as `v0.1.0`.

## Update workflow

```bash
cd /home/hermes/german-word-helper
git status
git add .
git commit -m "Describe the change"
git tag -a v0.1.1 -m "Release v0.1.1"
git log --oneline --decorate -5
```

Tailscale Serve currently serves this directory directly:

```text
https://hermes-backend.tail9a0109.ts.net
```

That means a committed file change becomes live immediately. To roll back:

```bash
git checkout v0.1.0
```

For safer releases later, use a `releases/` directory and switch a `current` symlink only after testing.

## Local test

```bash
python3 -m http.server 8765 --directory /home/hermes/german-word-helper
```

Open `http://127.0.0.1:8765`.

## Companion tracks

The Raycast extension and iOS app are private companion tracks; they are not
served by this Tailscale endpoint and are not published to a public store.

Raycast checks run from `raycast/` with `npm ci`, `npm test -- --runInBand`,
and `npm run build`. iOS checks run from a Mac with Xcode using
`bash ios/scripts/test.sh` and `bash ios/scripts/build-simulator.sh`; signing
and physical-device installation remain Mac-only. See
[`docs/releases/companion-apps-v0.1.0.md`](docs/releases/companion-apps-v0.1.0.md)
for the tested commit set and limitations.

## Rollback

For the PWA, stop before changing the working tree if a smoke test fails, then
restore the prior commit or tag and verify the private URL again:

```bash
git checkout v0.1.0
node --check app.js
git diff --check
curl -fsS https://hermes-backend.tail9a0109.ts.net/ | grep -q 'Der, die oder das'
```

For a companion-only regression, leave the PWA untouched and check out the
previous companion commit or remove the local `raycast/` or `ios/` track. Do not
activate Tailscale Funnel or publish either companion as a rollback measure.
