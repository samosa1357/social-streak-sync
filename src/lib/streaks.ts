// Utilities for calculating streaks from daily progress history.
// Streak rules:
// - A habit is "completed" on a day if progress >= target (binary habits: targetCount=0 treated as 1).
// - Current streak: consecutive completed days ending on today (if completed today) otherwise ending on yesterday (if completed yesterday).
// - Best streak: max consecutive completed days in the provided range.

export type StreakHabit = {
  id: string;
  targetCount: number;
};

export type ProgressRow = {
  date: string; // YYYY-MM-DD
  data: Record<string, number>;
};

function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isCompletedForHabit(habit: StreakHabit, dayData: Record<string, number>) {
  const progress = dayData[habit.id] ?? 0;
  const target = habit.targetCount === 0 ? 1 : habit.targetCount;
  const normalized = habit.targetCount === 0 ? Math.min(progress, 1) : progress;
  return normalized >= target;
}

export function calculateHabitStreaks(params: {
  habits: StreakHabit[];
  progressRows: ProgressRow[];
  todayISO: string;
}): Record<string, { current: number; best: number }> {
  const { habits, progressRows, todayISO } = params;

  const byDate = new Map<string, Record<string, number>>(
    progressRows.map((r) => [r.date, r.data ?? {}])
  );

  const today = new Date(todayISO);
  const startISO = progressRows.length ? progressRows[0].date : todayISO;
  const start = new Date(startISO);

  const result: Record<string, { current: number; best: number }> = {};

  for (const habit of habits) {
    // Best streak across the whole range
    let best = 0;
    let run = 0;

    for (let d = new Date(start); toISODate(d) <= todayISO; d = addDays(d, 1)) {
      const key = toISODate(d);
      const dayData = byDate.get(key) ?? {};
      if (isCompletedForHabit(habit, dayData)) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }

    // Current streak (ending today if completed today, else ending yesterday if completed yesterday)
    const todayData = byDate.get(todayISO) ?? {};
    const yesterdayISO = toISODate(addDays(today, -1));
    const yesterdayData = byDate.get(yesterdayISO) ?? {};

    let anchorISO: string | null = null;
    if (isCompletedForHabit(habit, todayData)) anchorISO = todayISO;
    else if (isCompletedForHabit(habit, yesterdayData)) anchorISO = yesterdayISO;

    let current = 0;
    if (anchorISO) {
      for (let d = new Date(anchorISO); ; d = addDays(d, -1)) {
        const key = toISODate(d);
        const dayData = byDate.get(key) ?? {};
        if (!isCompletedForHabit(habit, dayData)) break;
        current += 1;
      }
    }

    result[habit.id] = { current, best };
  }

  return result;
}

export function calculatePerfectDayCount(params: {
  habits: StreakHabit[];
  progressRows: ProgressRow[];
}) {
  const { habits, progressRows } = params;

  let count = 0;
  for (const row of progressRows) {
    const dayData = row.data ?? {};
    const allCompleted = habits.length > 0 && habits.every((h) => isCompletedForHabit(h, dayData));
    if (allCompleted) count += 1;
  }

  return count;
}
