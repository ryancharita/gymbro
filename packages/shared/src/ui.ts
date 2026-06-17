import { radii, spacing } from "./design-tokens.js";

export const uiPatterns = {
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  sectionGap: {
    gap: spacing.sm,
  },
} as const;
