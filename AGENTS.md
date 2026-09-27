# AGENTS.md

## Purpose

This repository contains a small, installable PWA for looking up German nouns. Given a word, it displays the German article (`der`, `die`, or `das`), grammatical gender, English meanings, and declension forms.

## Working rules

- Keep the application small, dependency-free, and fast on iPhone.
- Prefer plain HTML, CSS, and browser JavaScript. Do not add a framework unless the existing approach cannot satisfy a requirement.
- Preserve Home Screen/PWA support: keep `manifest.webmanifest`, `sw.js`, the Apple mobile-web-app metadata, and the touch icon working.
- Keep the first screen focused on looking up one German word. Do not reintroduce the article-paste workflow unless the requirement explicitly changes.
- Do not add analytics, advertising, trackers, or unnecessary third-party scripts.
- Do not put credentials, API tokens, private URLs, or machine-specific secrets in the repository.
- Treat dictionary data as external input. Escape API-provided values before inserting them into HTML.
- Keep dictionary failures understandable: network failure, missing word, and missing translation should not break the page.
- Preserve local caching, but invalidate or migrate the cache deliberately when the response shape changes.

## Dictionary source

The application uses the public German Wiktionary MediaWiki API at:

`https://de.wiktionary.org/w/api.php`

The client requests the German Wiktionary entry wikitext and extracts:

- grammatical gender/article from the German noun entry;
- English translations from English translation templates;
- declension forms from the German noun overview template.

Do not present Wiktionary-derived results as authoritative language advice. Keep the link to the full Wiktionary entry in the result view.

## Testing before committing

Run the JavaScript syntax check:

```bash
node --check app.js
```

Run a local server:

```bash
python3 -m http.server 8765 --directory .
```

Verify at least one real lookup, such as `Bad` or `Haus`, including article, English meaning, and declension rows. Test the page at a mobile-sized viewport when changing layout or install behavior.

## Versioning and release workflow

Use semantic-version tags:

```bash
git status
git diff
node --check app.js
git add .
git commit -m "Describe the change"
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin main --follow-tags
```

Do not rewrite published history or move an existing release tag without explicit approval.

## Deployment

The production URL is served by Tailscale Serve from the working tree:

`https://hermes-backend.tail9a0109.ts.net`

A file change becomes live when the working tree changes. Keep this behavior in mind when making edits: test locally first, then commit. Do not start an extra long-running Python server for production; Tailscale Serve serves the directory directly.

Use Tailscale Serve, not Funnel, for this private application. Do not make the application publicly reachable without explicit approval.

## Change discipline

- Make the smallest change that satisfies the requirement.
- Update `README.md` when behavior, source attribution, local setup, or deployment changes.
- Update `DEPLOYMENT.md` when the release or serving workflow changes.
- Keep user-facing text in English unless the requirement says otherwise.
- After changes, verify `git status`, the local lookup, and the deployed HTTPS page when practical.

## Companion tracks and branch workflow

- Keep the root PWA as the default cross-device product. Raycast and iOS are optional private companion tracks and must not change the PWA behavior without an explicit requirement.
- Work on companion changes in dedicated branches or Kanban worktrees. Push reviewable branches to GitHub and use pull requests before merging into `main`; do not push unreviewed companion changes directly to `main`.
- Keep Raycast changes under `raycast/` and iOS changes under `ios/`. Do not commit Apple certificates, provisioning profiles, private keys, API tokens, or machine-specific signing settings.
- Run the available Linux checks locally, then run Xcode, Simulator, signing, and physical-device checks on macOS. Report Mac-only checks as unrun until their commands have actually succeeded.
- For each client, verify `Bad` and `Haus` against deterministic fixtures and manually compare `das Bad`, English meanings, and core declension forms across the PWA, Raycast extension, and iOS app when the platform is available.
- Do not publish the Raycast extension, submit the iOS app to a store, or enable Tailscale Funnel without explicit approval.
