import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSupabaseHabits } from '@/hooks/useSupabaseHabits';
import { BottomNavigation } from '@/components/BottomNavigation';
import { DailyProgress } from '@/types/habit';
import { RequireUsername } from '@/components/RequireUsername';

function HistoryContent() {
  const { habits, getRecentProgress } = useSupabaseHabits();
  const [recentProgress, setRecentProgress] = useState<DailyProgress[]>([]);

  useEffect(() => {
    const loadProgress = async () => {
      const progress = await getRecentProgress();
      setRecentProgress(progress);
    };
    
    if (habits.length > 0) {
      loadProgress();
    } else {
      setRecentProgress([]);
    }
  }, [habits]);
  
  const longestStreak = Math.max(...habits.map(h => h.longestStreak), 0);
  const averageCompletion = recentProgress.length > 0 
    ? Math.round(recentProgress.reduce((sum, day) => sum + day.completionPercentage, 0) / recentProgress.length)
    : 0;

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold mb-2">Your Progress</h1>
          <p className="text-muted-foreground">Track your journey</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 gradient-card border-0 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 gradient-primary rounded-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">{longestStreak}</div>
                <div className="text-sm text-muted-foreground">Best streak</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 gradient-card border-0 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 gradient-secondary rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">{averageCompletion}%</div>
                <div className="text-sm text-muted-foreground">Avg. daily</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress History */}
        <Card className="p-4 gradient-card border-0 shadow-medium">
          <h3 className="font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Last 15 Days
          </h3>
          
          <div className="space-y-3">
            {recentProgress.map((day, index) => {
              const date = new Date(day.date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div key={day.date} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      day.allCompleted 
                        ? 'bg-success' 
                        : day.completionPercentage > 50 
                        ? 'bg-warning' 
                        : 'bg-muted'
                    }`} />
                    <span className={`text-sm ${isToday ? 'font-semibold' : ''}`}>
                      {isToday ? 'Today' : date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {day.completedHabits}/{day.totalHabits}
                    </span>
                    <span className="text-sm font-medium">
                      {day.completionPercentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {recentProgress.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Start tracking habits to see your progress history!
            </p>
          )}
        </Card>

        {/* Individual Habit Streaks */}
        {habits.length > 0 && (
          <Card className="p-4 gradient-card border-0 shadow-medium">
            <h3 className="font-semibold mb-4">Habit Streaks</h3>
            <div className="space-y-3">
              {habits.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between">
                  <span className="text-sm">{habit.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      Current: {habit.streak}
                    </span>
                    <span className="text-sm font-medium">
                      Best: {habit.longestStreak}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}

export default function History() {
  return (
    <RequireUsername>
      <HistoryContent />
    </RequireUsername>
  );
}