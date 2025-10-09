import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Habit } from '@/types/habit';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const habitSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Habit name is required')
    .max(100, 'Habit name must be less than 100 characters'),
  targetCount: z.number()
    .int('Target must be a whole number')
    .min(1, 'Target must be at least 1')
    .max(50, 'Target must be 50 or less')
});

interface AddHabitDialogProps {
  onAddHabit: (name: string, targetCount: number) => void;
  onEditHabit?: (id: string, name: string, targetCount: number) => void;
  editingHabit?: Habit | null;
  onEditComplete?: () => void;
}

export function AddHabitDialog({ onAddHabit, onEditHabit, editingHabit, onEditComplete }: AddHabitDialogProps) {
  const [open, setOpen] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [targetCount, setTargetCount] = useState(1);
  const [errors, setErrors] = useState<{ name?: string; targetCount?: string }>({});
  const { toast } = useToast();

  const isEditing = !!editingHabit;

  useEffect(() => {
    if (editingHabit) {
      setHabitName(editingHabit.name);
      setTargetCount(editingHabit.targetCount);
      setOpen(true);
      setErrors({});
    }
  }, [editingHabit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = habitSchema.parse({
        name: habitName,
        targetCount: targetCount
      });

      if (isEditing && editingHabit && onEditHabit) {
        onEditHabit(editingHabit.id, validated.name, validated.targetCount);
        toast({
          title: 'Habit updated',
          description: `"${validated.name}" has been updated successfully.`
        });
        onEditComplete?.();
      } else {
        onAddHabit(validated.name, validated.targetCount);
        toast({
          title: 'Habit created',
          description: `"${validated.name}" has been added to your daily habits.`
        });
      }
      
      setHabitName('');
      setTargetCount(1);
      setOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { name?: string; targetCount?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'name') {
            fieldErrors.name = err.message;
          } else if (err.path[0] === 'targetCount') {
            fieldErrors.targetCount = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setHabitName('');
    setTargetCount(1);
    setErrors({});
    onEditComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button 
            className="gradient-primary shadow-medium transition-bounce hover:shadow-strong"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Habit
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="gradient-card border-0 shadow-strong sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Edit Habit' : 'Create New Habit'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing 
              ? 'Update your habit details below.' 
              : 'Add a new habit to track daily. Set a target to stay motivated!'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="habit-name" className="text-sm font-medium">
              Habit Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="habit-name"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="e.g., Drink water, Exercise, Read..."
              className={`transition-smooth ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target-count" className="text-sm font-medium">
              Daily Target <span className="text-destructive">*</span>
            </Label>
            <Input
              id="target-count"
              type="number"
              min="1"
              max="50"
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
              className={`transition-smooth ${errors.targetCount ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {errors.targetCount && (
              <p className="text-sm text-destructive">{errors.targetCount}</p>
            )}
            <p className="text-xs text-muted-foreground">
              How many times per day? (e.g., 8 glasses of water)
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1 transition-smooth"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="gradient-primary flex-1 transition-bounce"
              disabled={!habitName.trim() || targetCount < 1}
            >
              {isEditing ? 'Save Changes' : 'Create Habit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
