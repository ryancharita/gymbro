import { colorTokens } from "@ironlink/shared";
import { useColorScheme } from "react-native";

export function useThemeColors() {
  const scheme = useColorScheme();
  return scheme === "light" ? colorTokens.light : colorTokens.dark;
}
