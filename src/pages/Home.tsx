import React, { useState } from 'react';
import { DailyOverview } from '@/components/DailyOverview';
import { HabitCard } from '@/components/HabitCard';
import { WeeklyHabitCard } from '@/components/WeeklyHabitCard';
import { AddHabitDialog } from '@/components/AddHabitDialog';
import { useSupabaseHabits } from '@/hooks/useSupabaseHabits';
import { Habit } from '@/types/habit';
import { BottomNavigation } from '@/components/BottomNavigation';
import { CalendarDays } from 'lucide-react';

export default function Home() {
  const { habits, addHabit, updateHabitProgress, decrementHabitProgress, toggleHabitComplete, editHabit, deleteHabit, getTodayProgress, userLevel, totalStreakDays, loading } = useSupabaseHabits();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  if (loading) {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your habits...</p>
        </div>
      </div>
    );
  }

  const dailyHabits = habits.filter(h => h.frequencyType === 'daily');
  const weeklyHabits = habits.filter(h => h.frequencyType === 'weekly');
  
  const todayProgressData = getTodayProgress();
  const todayProgress = {
    date: new Date().toISOString().split('T')[0],
    completionPercentage: todayProgressData.percentage,
    totalHabits: todayProgressData.totalHabits,
    completedHabits: todayProgressData.completedHabits,
    allCompleted: todayProgressData.completedHabits === todayProgressData.totalHabits && todayProgressData.totalHabits > 0
  };
  
  // Sort habits: incomplete first, then completed
  const sortedDailyHabits = [...dailyHabits].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const sortedWeeklyHabits = [...weeklyHabits].sort((a, b) => {
    const aDone = (a.weeklyCompletions ?? 0) >= a.weeklyTarget;
    const bDone = (b.weeklyCompletions ?? 0) >= b.weeklyTarget;
    if (aDone === bDone) return 0;
    return aDone ? 1 : -1;
  });

  const incompleteHabits = dailyHabits.filter(h => !h.completed);
  const canAddMore = habits.length < 7;

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold mb-2">ZenTrack</h1>
          <p className="text-muted-foreground">Your daily habit companion</p>
        </div>

        {/* Daily Overview */}
        <DailyOverview 
          progress={todayProgress}
          currentLevel={userLevel}
          totalStreakDays={totalStreakDays}
        />

        {/* Quick Stats */}
        {incompleteHabits.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-center text-muted-foreground">
              {incompleteHabits.length} habit{incompleteHabits.length !== 1 ? 's' : ''} remaining today
            </p>
          </div>
        )}

        {/* Daily Habits List */}
        {sortedDailyHabits.length > 0 && (
          <div className="space-y-3">
            {sortedDailyHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={toggleHabitComplete}
                onDelete={deleteHabit}
                onIncrement={updateHabitProgress}
                onDecrement={decrementHabitProgress}
                onEdit={setEditingHabit}
              />
            ))}
          </div>
        )}

        {/* Weekly Habits Section */}
        {sortedWeeklyHabits.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pt-2">
              <CalendarDays className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-semibold">Weekly Habits</h2>
            </div>
            {sortedWeeklyHabits.map((habit) => (
              <WeeklyHabitCard
                key={habit.id}
                habit={habit}
                onToggle={toggleHabitComplete}
                onDelete={deleteHabit}
                onEdit={setEditingHabit}
              />
            ))}
          </div>
        )}

        {/* Add Habit Button */}
        {habits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Start building your habits!</p>
            <AddHabitDialog 
              onAddHabit={addHabit}
              onEditHabit={editHabit}
              editingHabit={editingHabit}
              onEditComplete={() => setEditingHabit(null)}
            />
          </div>
        ) : (
          <div className="flex justify-center pt-4">
            {canAddMore ? (
              <AddHabitDialog 
                onAddHabit={addHabit}
                onEditHabit={editHabit}
                editingHabit={editingHabit}
                onEditComplete={() => setEditingHabit(null)}
              />
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Free plan: 7 habits max
                </p>
                <button className="text-sm text-primary hover:underline">
                  Upgrade for unlimited habits
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}
