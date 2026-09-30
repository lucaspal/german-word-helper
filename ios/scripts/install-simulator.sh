#!/usr/bin/env bash
set -euo pipefail

# Find the built .app in DerivedData
DERIVED_DATA_ROOT="$HOME/Library/Developer/Xcode/DerivedData"
APP_PATH=$(find "$DERIVED_DATA_ROOT" -name "GermanArticle.app" -path "*/Debug-iphonesimulator/*" 2>/dev/null | head -n 1)

if [[ -z "$APP_PATH" ]]; then
    echo "Error: Could not find GermanArticle.app in DerivedData"
    echo "Run 'bash scripts/build-simulator.sh' first"
    exit 1
fi

echo "Found app at: $APP_PATH"

# Boot the simulator if not already booted
SIMULATOR_NAME="iPhone 17"
SIMULATOR_ID=$(xcrun simctl list devices | grep "$SIMULATOR_NAME" | grep -v "unavailable" | head -n 1 | sed -E 's/.*\(([^)]+)\).*/\1/')

if [[ -z "$SIMULATOR_ID" ]]; then
    echo "Error: Simulator '$SIMULATOR_NAME' not found"
    exit 1
fi

echo "Booting simulator: $SIMULATOR_NAME ($SIMULATOR_ID)"
xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || true

# Wait for boot
sleep 2

# Install the app
echo "Installing app..."
xcrun simctl install "$SIMULATOR_ID" "$APP_PATH"

echo "App installed successfully!"
echo "Launch with: xcrun simctl launch $SIMULATOR_ID com.lucaspal.GermanArticle"