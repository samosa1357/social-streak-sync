export interface Habit {
  id: string;
  name: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  streak: number;
  longestStreak: number;
  reminderTime?: string;
  createdAt: string;
  category?: string;
  color?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  totalStreakDays: number;
  profilePhoto?: string;
  createdAt: string;
}

export interface DailyProgress {
  date: string;
  completionPercentage: number;
  totalHabits: number;
  completedHabits: number;
  allCompleted: boolean;
}