const DEFAULT_OPEN_FREE_MAP_STYLE =
  'https://tiles.openfreemap.org/styles/liberty';

export const MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL?.trim() ||
  DEFAULT_OPEN_FREE_MAP_STYLE;
