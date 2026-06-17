export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: "700" as const },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  label: { fontSize: 14, lineHeight: 18, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
} as const;

export const colorTokens = {
  dark: {
    bg: "#0A0E1A",
    surface: "#151B2D",
    surfaceElevated: "#1C2438",
    border: "rgba(255,255,255,0.1)",
    textPrimary: "#F8FAFF",
    textSecondary: "#B8C4E0",
    textMuted: "#8896B8",
    accent: "#FF4444",
    accentPressed: "#E63B3B",
    accentText: "#FFFFFF",
    danger: "#FF4444",
    dangerPressed: "#E63B3B",
  },
  light: {
    bg: "#F4F7FF",
    surface: "#FFFFFF",
    surfaceElevated: "#EAF0FF",
    border: "#D6DDF2",
    textPrimary: "#0D1632",
    textSecondary: "#31406D",
    textMuted: "#61709E",
    accent: "#FF4D5A",
    accentPressed: "#E93E4B",
    accentText: "#FFFFFF",
    danger: "#D73A47",
    dangerPressed: "#BE2C39",
  },
} as const;
