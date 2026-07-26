$ErrorActionPreference = "Stop"
npm install
npx expo install expo-location expo-task-manager expo-sqlite expo-network expo-crypto
npx expo prebuild
npx expo-doctor
Write-Host "Android: npm run android"
Write-Host "iOS(macOS): npm run ios"
