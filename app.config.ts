import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    '@maplibre/maplibre-react-native',
  ],
});
