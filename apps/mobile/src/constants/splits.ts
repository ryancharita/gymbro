export const SPLIT_DIFFICULTY_OPTIONS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
] as const;

export const SPLIT_VISIBILITY_OPTIONS = [
  "PUBLIC",
  "FRIENDS_ONLY",
  "PRIVATE",
] as const;

export const SPLIT_STATUS_OPTIONS = ["DRAFT", "PUBLISHED"] as const;

export const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  FRIENDS_ONLY: "Friends only",
  PRIVATE: "Private",
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
};
