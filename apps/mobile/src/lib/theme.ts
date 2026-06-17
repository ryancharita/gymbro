import { useTheme } from "./theme-preference";

export function useThemeColors() {
  return useTheme().colors;
}

export type { ColorScheme, ThemeColors, ThemePreference } from "./theme-preference";
