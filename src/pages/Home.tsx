import React from 'react';
import { DailyOverview } from '@/components/DailyOverview';
import { HabitCard } from '@/components/HabitCard';
import { AddHabitDialog } from '@/components/AddHabitDialog';
import { useHabits } from '@/hooks/useHabits';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Home() {
  const { habits, addHabit, updateHabitProgress, toggleHabitComplete, deleteHabit, getTodayProgress } = useHabits();
  const [userLevel] = useLocalStorage('zentrack-user-level', 1);
  const [totalStreakDays] = useLocalStorage('zentrack-total-streak', 0);
  
  const todayProgress = getTodayProgress();
  
  // Sort habits: incomplete first, then completed
  const sortedHabits = [...habits].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const incompleteHabits = habits.filter(h => !h.completed);
  const canAddMore = habits.length < 7; // Free tier limit

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

        {/* Habits List */}
        <div className="space-y-3">
          {sortedHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={toggleHabitComplete}
              onDelete={deleteHabit}
              onIncrement={updateHabitProgress}
            />
          ))}
        </div>

        {/* Add Habit Button */}
        {habits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Start building your habits!</p>
            <AddHabitDialog onAddHabit={addHabit} />
          </div>
        ) : (
          <div className="flex justify-center pt-4">
            {canAddMore ? (
              <AddHabitDialog onAddHabit={addHabit} />
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
    </div>
  );
}