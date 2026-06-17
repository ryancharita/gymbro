import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { createAuthenticatedClient } from "../lib/auth";
import {
  ACTIVE_WORKOUT_SESSION_QUERY,
  MY_ROUTINES_QUERY,
  MY_SPLITS_QUERY,
  MY_WORKOUT_SESSIONS_QUERY,
  type Routine,
  type Split,
  type WorkoutSession,
} from "../lib/graphql";
import {
  averageWeeklyVolume,
  buildWeekPlan,
  buildWorkoutDays,
  pickActiveSplit,
  todayRoutineId,
  weekTrainingProgress,
  type WeekDayPlan,
  type WorkoutDayPlan,
} from "../lib/week-plan";

type TrainingPlanState = {
  splits: Split[];
  routines: Routine[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  activeSplit: Split | null;
  weekPlan: WeekDayPlan[];
  workoutDays: WorkoutDayPlan[];
  weekProgress: { completed: number; total: number };
  todayRoutineId: string | null;
  avgWeeklyVolume: number;
};

const EMPTY: TrainingPlanState = {
  splits: [],
  routines: [],
  sessions: [],
  activeSession: null,
  activeSplit: null,
  weekPlan: [],
  workoutDays: [],
  weekProgress: { completed: 0, total: 0 },
  todayRoutineId: null,
  avgWeeklyVolume: 0,
};

export function useTrainingPlan() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<TrainingPlanState>(EMPTY);

  const refresh = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setState(EMPTY);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const [splitData, routineData, sessionData, activeData] = await Promise.all([
        client.request<{ mySplits: Split[] }>(MY_SPLITS_QUERY),
        client.request<{ myRoutines: Routine[] }>(MY_ROUTINES_QUERY),
        client.request<{ myWorkoutSessions: WorkoutSession[] }>(MY_WORKOUT_SESSIONS_QUERY, {
          limit: 50,
          offset: 0,
        }),
        client.request<{ activeWorkoutSession: WorkoutSession | null }>(ACTIVE_WORKOUT_SESSION_QUERY),
      ]);

      const splits = splitData.mySplits;
      const routines = routineData.myRoutines;
      const sessions = sessionData.myWorkoutSessions;
      const activeSession = activeData.activeWorkoutSession;
      const activeSplit = pickActiveSplit(splits);
      const weekPlan = buildWeekPlan(activeSplit, routines, sessions, activeSession);
      const workoutDays = buildWorkoutDays(activeSplit, routines, sessions, activeSession);

      setState({
        splits,
        routines,
        sessions,
        activeSession,
        activeSplit,
        weekPlan,
        workoutDays,
        weekProgress: weekTrainingProgress(activeSplit, sessions),
        todayRoutineId: todayRoutineId(activeSplit, routines, sessions, activeSession),
        avgWeeklyVolume: averageWeeklyVolume(sessions),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load training plan");
      setState(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { ...state, loading, error, refresh };
}
