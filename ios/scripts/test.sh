#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../GermanArticle"
xcodebuild test \
  -project GermanArticle.xcodeproj \
  -scheme GermanArticle \
  -destination 'platform=iOS Simulator,name=iPhone 17'