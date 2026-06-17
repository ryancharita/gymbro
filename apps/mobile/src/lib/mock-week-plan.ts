export type DayStatus = "completed" | "today" | "upcoming" | "rest";

export type WeekDayPlan = {
  id: string;
  label: string;
  title: string;
  muscles: string[];
  status: DayStatus;
};

export const MOCK_WEEK_PLAN: WeekDayPlan[] = [
  { id: "mon", label: "Mon", title: "Push Day", muscles: ["Chest", "Shoulders", "Triceps"], status: "completed" },
  { id: "tue", label: "Tue", title: "Pull Day", muscles: ["Back", "Biceps"], status: "completed" },
  { id: "wed", label: "Wed", title: "Leg Day", muscles: ["Quads", "Hamstrings", "Glutes"], status: "today" },
  { id: "thu", label: "Thu", title: "Rest Day", muscles: [], status: "rest" },
  { id: "fri", label: "Fri", title: "Push Day", muscles: ["Chest", "Shoulders", "Triceps"], status: "upcoming" },
  { id: "sat", label: "Sat", title: "Pull Day", muscles: ["Back", "Biceps"], status: "upcoming" },
  { id: "sun", label: "Sun", title: "Leg Day", muscles: ["Quads", "Hamstrings", "Glutes"], status: "upcoming" },
];

export type WorkoutExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  done?: boolean;
};

export type WorkoutDayPlan = {
  id: string;
  label: string;
  title: string;
  status: DayStatus;
  exercises: WorkoutExercise[];
};

export const MOCK_WORKOUT_DAYS: WorkoutDayPlan[] = [
  {
    id: "mon",
    label: "Monday",
    title: "Push Day",
    status: "completed",
    exercises: [
      { id: "1", name: "Bench Press", sets: 4, reps: 8, weightKg: 80, done: true },
      { id: "2", name: "Incline DB Press", sets: 3, reps: 10, weightKg: 32, done: true },
      { id: "3", name: "Cable Flyes", sets: 3, reps: 12, weightKg: 15, done: true },
    ],
  },
  {
    id: "tue",
    label: "Tuesday",
    title: "Pull Day",
    status: "completed",
    exercises: [
      { id: "4", name: "Barbell Row", sets: 4, reps: 8, weightKg: 70, done: true },
      { id: "5", name: "Lat Pulldown", sets: 3, reps: 10, weightKg: 55, done: true },
    ],
  },
  {
    id: "wed",
    label: "Wednesday",
    title: "Leg Day",
    status: "today",
    exercises: [
      { id: "6", name: "Squat", sets: 4, reps: 6, weightKg: 100 },
      { id: "7", name: "Romanian Deadlift", sets: 3, reps: 10, weightKg: 80 },
      { id: "8", name: "Leg Press", sets: 3, reps: 12, weightKg: 140 },
    ],
  },
  {
    id: "fri",
    label: "Friday",
    title: "Push Day",
    status: "upcoming",
    exercises: [
      { id: "9", name: "Overhead Press", sets: 4, reps: 8, weightKg: 50 },
      { id: "10", name: "Dips", sets: 3, reps: 10, weightKg: 0 },
    ],
  },
];

export type DiscoverBuddy = {
  id: string;
  name: string;
  gym: string;
  distance: string;
  rating: number;
  tags: string[];
  status: string;
};

export const MOCK_BUDDIES: DiscoverBuddy[] = [
  {
    id: "1",
    name: "Sarah Chen",
    gym: "Iron Temple Gym",
    distance: "0.8 mi",
    rating: 4.9,
    tags: ["Push/Pull/Legs", "Morning"],
    status: "Working out now",
  },
  {
    id: "2",
    name: "Marcus Johnson",
    gym: "Downtown Fitness",
    distance: "1.2 mi",
    rating: 4.7,
    tags: ["Bro Split", "Evening"],
    status: "At gym",
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    gym: "CrossFit Central",
    distance: "2.1 mi",
    rating: 4.8,
    tags: ["Full Body", "Weekends"],
    status: "Available",
  },
];
