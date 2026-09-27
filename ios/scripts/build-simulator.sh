#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../GermanArticle"
xcodebuild build \
  -project GermanArticle.xcodeproj \
  -scheme GermanArticle \
  -sdk iphonesimulator \
  -configuration Debug