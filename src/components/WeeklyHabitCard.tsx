import React from 'react';
import { CheckCircle2, Circle, Trash2, Edit, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Habit } from '@/types/habit';

interface WeeklyHabitCardProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (habit: Habit) => void;
}

export function WeeklyHabitCard({ habit, onToggle, onDelete, onEdit }: WeeklyHabitCardProps) {
  const completions = habit.weeklyCompletions ?? 0;
  const target = habit.weeklyTarget;
  const isWeeklyDone = completions >= target;
  const todayDone = habit.completed;

  return (
    <Card className={cn(
      "p-4 transition-smooth gradient-card shadow-soft border-0",
      isWeeklyDone && "opacity-75"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(habit.id)}
            className={cn(
              "p-1 h-8 w-8 rounded-full transition-bounce",
              todayDone && "text-success"
            )}
          >
            {todayDone ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </Button>
          
          <div className="flex-1">
            <h3 className={cn(
              "font-medium transition-smooth",
              isWeeklyDone && "line-through text-muted-foreground"
            )}>
              {habit.name}
            </h3>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {completions}/{target} this week
              </span>
              
              {habit.streak > 0 && (
                <span className="text-xs inline-flex items-center gap-1 gradient-primary text-primary-foreground px-2 py-1 rounded-full">
                  <Flame className="h-3 w-3" />
                  {habit.streak}
                </span>
              )}
            </div>

            {/* Weekly progress dots */}
            <div className="flex gap-1 mt-2">
              {Array.from({ length: target }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-smooth",
                    i < completions ? "gradient-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(habit)}
              className="p-1 h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(habit.id)}
            className="p-1 h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
