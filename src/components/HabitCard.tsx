import React from 'react';
import { CheckCircle2, Circle, Trash2, Edit, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Habit } from '@/types/habit';

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onIncrement?: (id: string) => void;
  onDecrement?: (id: string) => void;
  onEdit?: (habit: Habit) => void;
}

export function HabitCard({ habit, onToggle, onDelete, onIncrement, onDecrement, onEdit }: HabitCardProps) {
  const isBinary = habit.targetCount === 0;
  const progressPercentage = isBinary ? 0 : (habit.currentCount / habit.targetCount) * 100;
  
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
              {!isBinary && habit.targetCount > 0 && (
                <div className="flex items-center space-x-1">
                  {onDecrement && !habit.completed && habit.currentCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDecrement(habit.id)}
                      className="h-6 w-6 p-0 text-xs"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {habit.currentCount}/{habit.targetCount}
                  </span>
                  {onIncrement && !habit.completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onIncrement(habit.id)}
                      className="h-6 w-6 p-0 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
              
              {isBinary && (
                <span className="text-xs text-muted-foreground">
                  {habit.completed ? 'Done' : 'Not done'}
                </span>
              )}
              
              {habit.streak > 0 && (
                <span className="text-xs gradient-primary text-primary-foreground px-2 py-1 rounded-full">
                  🔥 {habit.streak}
                </span>
              )}
            </div>
            
            {!isBinary && habit.targetCount > 0 && (
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="gradient-primary h-2 rounded-full transition-smooth"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}
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