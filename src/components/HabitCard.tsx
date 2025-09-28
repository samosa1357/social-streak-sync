import React from 'react';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Habit } from '@/types/habit';

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onIncrement?: (id: string) => void;
}

export function HabitCard({ habit, onToggle, onDelete, onIncrement }: HabitCardProps) {
  const progressPercentage = (habit.currentCount / habit.targetCount) * 100;
  
  return (
    <Card className={cn(
      "p-4 transition-smooth gradient-card shadow-soft border-0",
      habit.completed && "opacity-75"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(habit.id)}
            className={cn(
              "p-1 h-8 w-8 rounded-full transition-bounce",
              habit.completed && "text-success"
            )}
          >
            {habit.completed ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </Button>
          
          <div className="flex-1">
            <h3 className={cn(
              "font-medium transition-smooth",
              habit.completed && "line-through text-muted-foreground"
            )}>
              {habit.name}
            </h3>
            
            <div className="flex items-center space-x-2 mt-1">
              {habit.targetCount > 1 && (
                <div className="flex items-center space-x-1">
                  {onIncrement && !habit.completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onIncrement(habit.id)}
                      className="h-6 px-2 text-xs"
                    >
                      +1
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {habit.currentCount}/{habit.targetCount}
                  </span>
                </div>
              )}
              
              {habit.streak > 0 && (
                <span className="text-xs bg-gradient-primary text-white px-2 py-1 rounded-full">
                  🔥 {habit.streak}
                </span>
              )}
            </div>
            
            {habit.targetCount > 1 && (
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="gradient-primary h-2 rounded-full transition-smooth"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(habit.id)}
          className="p-1 h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}