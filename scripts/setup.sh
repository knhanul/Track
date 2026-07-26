#!/usr/bin/env bash
set -euo pipefail
npm install
npx expo install expo-location expo-task-manager expo-sqlite expo-network expo-crypto
npx expo prebuild
npx expo-doctor
echo "Android: npm run android"
echo "iOS(macOS): npm run ios"
