import { colorTokens } from "@ironlink/shared";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

const STORAGE_KEY = "ironlink_theme_preference";

export type ThemePreference = "system" | "light" | "dark";
export type ColorScheme = "light" | "dark";
export type ThemeColors = (typeof colorTokens)[ColorScheme];

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  colorScheme: ColorScheme;
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    void SecureStore.getItemAsync(STORAGE_KEY).then((value) => {
      if (value === "light" || value === "dark" || value === "system") {
        setPreferenceState(value);
      }
    });
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void SecureStore.setItemAsync(STORAGE_KEY, next);
  }, []);

  const colorScheme: ColorScheme =
    preference === "system" ? (systemScheme === "light" ? "light" : "dark") : preference;

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      colorScheme,
      colors: colorTokens[colorScheme],
      isDark: colorScheme === "dark",
    }),
    [colorScheme, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
