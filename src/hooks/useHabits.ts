import { useState, useEffect } from 'react';
import { Habit, DailyProgress } from '@/types/habit';
import { useLocalStorage } from './useLocalStorage';

export function useHabits() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('zentrack-habits', []);
  const [dailyProgress, setDailyProgress] = useLocalStorage<DailyProgress[]>('zentrack-progress', []);
  const [lastResetDate, setLastResetDate] = useLocalStorage<string>('zentrack-last-reset', '');

  // Check if we need to reset daily progress
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastResetDate !== today) {
      resetDailyProgress();
      setLastResetDate(today);
    }
  }, [lastResetDate]);

  const resetDailyProgress = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    // Save yesterday's progress before reset
    const yesterdayProgress = calculateDailyProgress();
    if (yesterdayProgress.totalHabits > 0) {
      setDailyProgress(prev => {
        const filtered = prev.filter(p => p.date !== yesterdayStr);
        return [...filtered, { ...yesterdayProgress, date: yesterdayStr }];
      });
    }

    // Update streaks based on yesterday's completion
    setHabits(prevHabits => prevHabits.map(habit => {
      const wasCompleted = habit.completed;
      return {
        ...habit,
        currentCount: 0,
        completed: false,
        streak: wasCompleted ? habit.streak + 1 : 0,
        longestStreak: wasCompleted ? Math.max(habit.longestStreak, habit.streak + 1) : habit.longestStreak,
      };
    }));
  };

  const calculateDailyProgress = (): DailyProgress => {
    const totalHabits = habits.length;
    if (totalHabits === 0) {
      return {
        date: new Date().toDateString(),
        completionPercentage: 0,
        totalHabits: 0,
        completedHabits: 0,
        allCompleted: false,
      };
    }

    // Calculate total possible points and achieved points
    const totalPossiblePoints = habits.reduce((sum, habit) => sum + habit.targetCount, 0);
    const achievedPoints = habits.reduce((sum, habit) => sum + habit.currentCount, 0);
    const completionPercentage = Math.round((achievedPoints / totalPossiblePoints) * 100);
    const completedHabits = habits.filter(h => h.completed).length;
    
    return {
      date: new Date().toDateString(),
      completionPercentage,
      totalHabits,
      completedHabits,
      allCompleted: completedHabits === totalHabits && totalHabits > 0,
    };
  };

  const addHabit = (name: string, targetCount: number = 1) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      targetCount,
      currentCount: 0,
      completed: false,
      streak: 0,
      longestStreak: 0,
      createdAt: new Date().toISOString(),
      frequencyType: 'daily',
      weeklyTarget: 7,
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const updateHabitProgress = (id: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const newCount = Math.min(habit.currentCount + 1, habit.targetCount);
        const completed = newCount >= habit.targetCount;
        return {
          ...habit,
          currentCount: newCount,
          completed,
        };
      }
      return habit;
    }));
  };

  const toggleHabitComplete = (id: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const newCompleted = !habit.completed;
        return {
          ...habit,
          completed: newCompleted,
          currentCount: newCompleted ? habit.targetCount : 0,
        };
      }
      return habit;
    }));
  };

  const decrementHabitProgress = (id: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id && habit.currentCount > 0) {
        const newCount = habit.currentCount - 1;
        return {
          ...habit,
          currentCount: newCount,
          completed: newCount >= habit.targetCount,
        };
      }
      return habit;
    }));
  };

  const editHabit = (id: string, name: string, targetCount: number) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const newCurrentCount = Math.min(habit.currentCount, targetCount);
        return {
          ...habit,
          name,
          targetCount,
          currentCount: newCurrentCount,
          completed: newCurrentCount >= targetCount,
        };
      }
      return habit;
    }));
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(habit => habit.id !== id));
  };

  const getTodayProgress = (): DailyProgress => {
    return calculateDailyProgress();
  };

  const getRecentProgress = (): DailyProgress[] => {
    const today = getTodayProgress();
    const recent = dailyProgress.slice(-14); // Last 14 days
    return [...recent, today];
  };

  return {
    habits,
    addHabit,
    updateHabitProgress,
    decrementHabitProgress,
    toggleHabitComplete,
    editHabit,
    deleteHabit,
    getTodayProgress,
    getRecentProgress,
  };
}