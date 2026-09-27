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
