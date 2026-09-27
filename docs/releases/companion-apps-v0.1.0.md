# Companion apps v0.1.0 release handoff

Status: private companion MVP; no release tag was created by this QA task.

## Scope

The root PWA remains the default cross-device product and its files were not
changed by the Raycast or iOS implementation work. The repository now also
contains:

- `raycast/`: a local/private TypeScript Raycast extension;
- `ios/`: a native SwiftUI lookup app and WidgetKit companion;
- `docs/ios-signing-setup.md`: Mac/device signing checklist.

Neither companion is published. Tailscale Serve remains private; Tailscale
Funnel was not activated.

## Tested source commits

The QA workspace included these exact implementation commits:

- `29f2347` — root PWA documentation/source rules baseline;
- `39e7546` — Raycast MVP (cherry-picked implementation from `d06ccf5`);
- `4bb6543` — iOS app and widget MVP (cherry-picked implementation from `e2a9204`).

The final documentation commit is the commit containing this handoff and the
README/DEPLOYMENT updates. Use `git log --oneline --decorate -5` after
checkout to identify it; no tag should be created until review.

## Verification record

Passed in the Linux QA workspace:

```bash
node --check app.js
git diff --check
curl -fsS https://hermes-backend.tail9a0109.ts.net/
cd raycast
npm ci
npm test -- --runInBand
npm run build
```

The deployed HTTPS smoke test returned the PWA HTML and included the expected
`Der, die oder das?` heading. Raycast verification passed with 12 tests across
the dictionary and history suites; the extension build completed successfully.

The root PWA was not modified by the companion commits. The manual client
lookup was verified through deterministic `Bad` fixtures in the Raycast tests
and iOS test sources, but an interactive three-client lookup could not be
completed on this Linux worker.

## Mac-only checks

Not run here because `xcodebuild` is unavailable on Linux:

```bash
bash ios/scripts/test.sh
bash ios/scripts/build-simulator.sh
xcrun simctl boot 'iPhone 17' || true
bash ios/scripts/install-simulator.sh
xcrun devicectl list devices
```

Run those commands on the Mac with Xcode 26.6. Physical-device signing and
installation also require the user's Apple team, trusted iPhone, and Developer
Mode. No certificates, profiles, private keys, or other secrets are committed.

## Supported update workflow

1. Keep the PWA and companion changes in separate, reviewable commits.
2. Run the root checks and Raycast checks above on every change.
3. On macOS, run the iOS test/build/install checks and record actual output.
4. Manually search for `Bad` in the PWA, Raycast, and iOS app; confirm `das`,
   an English meaning such as `bath`, and the core declension forms agree.
5. Review the diff and only then create a semantic-version tag.

Runtime dictionary data comes from German Wiktionary and can change or drift as
template shapes change. The widget is glanceable/configured rather than a full
text-entry dictionary. The PWA and Raycast clients cache local history; iOS
signing depends on the Mac and Apple account used for development.

## Rollback

For a PWA regression, restore the last known-good tag or commit, then rerun:

```bash
git checkout v0.1.0
node --check app.js
git diff --check
curl -fsS https://hermes-backend.tail9a0109.ts.net/ | grep -q 'Der, die oder das'
```

For a companion regression, check out the previous reviewed companion commit or
remove the affected private track while leaving the PWA files intact. Do not
publish a companion or enable Tailscale Funnel as part of rollback.