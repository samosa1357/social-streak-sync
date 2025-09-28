import React from 'react';
import { Award, Calendar, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { DailyProgress } from '@/types/habit';
import { cn } from '@/lib/utils';

interface DailyOverviewProps {
  progress: DailyProgress;
  currentLevel: number;
  totalStreakDays: number;
}

export function DailyOverview({ progress, currentLevel, totalStreakDays }: DailyOverviewProps) {
  const getLevelProgress = () => {
    const levelThresholds = [0, 3, 7, 15, 30, 60, 100, 180, 270, 365];
    const currentThreshold = levelThresholds[currentLevel - 1] || 0;
    const nextThreshold = levelThresholds[currentLevel] || 365;
    const progressToNext = ((totalStreakDays - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(progressToNext, 100);
  };

  return (
    <div className="space-y-4">
      {/* Main Progress Ring */}
      <Card className="p-6 gradient-card border-0 shadow-medium">
        <div className="flex items-center justify-center">
          <ProgressRing progress={progress.completionPercentage} size={160} strokeWidth={12}>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                {progress.completionPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </ProgressRing>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-lg font-medium">
            {progress.completedHabits} of {progress.totalHabits} habits
          </p>
          <p className="text-muted-foreground">
            {progress.allCompleted ? "Perfect day! 🎉" : "Keep going! 💪"}
          </p>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 gradient-card border-0 shadow-soft">
          <div className="flex items-center space-x-3">
            <div className="p-2 gradient-secondary rounded-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">Level {currentLevel}</div>
              <div className="text-sm text-muted-foreground">
                {Math.round(getLevelProgress())}% to next
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 gradient-card border-0 shadow-soft">
          <div className="flex items-center space-x-3">
            <div className="p-2 gradient-primary rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">{totalStreakDays} days</div>
              <div className="text-sm text-muted-foreground">Total streak</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}