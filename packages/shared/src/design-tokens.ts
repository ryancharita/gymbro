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
  md: 14,
  lg: 18,
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
    bg: "#1A1020",
    surface: "#22112E",
    surfaceElevated: "#2D1640",
    border: "#4A1D56",
    textPrimary: "#FFE4ED",
    textSecondary: "#FBC6D8",
    textMuted: "#D99AB2",
    accent: "#2563EB",
    accentPressed: "#1D4ED8",
    accentText: "#EFF6FF",
    danger: "#DC2626",
    dangerPressed: "#B91C1C",
  },
  light: {
    bg: "#FFF1F2",
    surface: "#FFFFFF",
    surfaceElevated: "#F0ECF2",
    border: "#FECDD3",
    textPrimary: "#881337",
    textSecondary: "#9F1239",
    textMuted: "#BE123C",
    accent: "#2563EB",
    accentPressed: "#1D4ED8",
    accentText: "#FFFFFF",
    danger: "#DC2626",
    dangerPressed: "#B91C1C",
  },
} as const;
