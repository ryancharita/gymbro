export const ROUTINE_SET_TYPES = [
  "STRAIGHT",
  "SUPERSET",
  "DROP_SET",
  "AMRAP",
  "TIME_BASED",
] as const;

export const SET_TYPE_LABELS: Record<string, string> = {
  STRAIGHT: "Straight",
  SUPERSET: "Superset",
  DROP_SET: "Drop set",
  AMRAP: "AMRAP",
  TIME_BASED: "Time-based",
};
