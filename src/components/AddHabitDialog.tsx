import React, { useState, useEffect } from 'react';
import { Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Habit } from '@/types/habit';

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
  const [error, setError] = useState('');

  const isEditing = !!editingHabit;

  useEffect(() => {
    if (editingHabit) {
      setHabitName(editingHabit.name);
      setTargetCount(editingHabit.targetCount);
      setOpen(true);
      setError('');
    }
  }, [editingHabit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!habitName.trim()) {
      setError('Habit name is required');
      return;
    }

    if (targetCount < 1) {
      setError('Please add any number greater than or equal to 1');
      return;
    }

    if (isEditing && editingHabit && onEditHabit) {
      onEditHabit(editingHabit.id, habitName.trim(), targetCount);
      onEditComplete?.();
    } else {
      onAddHabit(habitName.trim(), targetCount);
    }
    
    setHabitName('');
    setTargetCount(1);
    setOpen(false);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setHabitName('');
    setTargetCount(1);
    setError('');
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
            Add Habit
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="gradient-card border-0 shadow-strong">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Edit Habit' : 'Create New Habit'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="habit-name">Habit Name</Label>
            <Input
              id="habit-name"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="e.g., Drink water, Exercise, Read..."
              className="transition-smooth"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-count">Daily Target</Label>
            <Input
              id="target-count"
              type="number"
              min="1"
              max="50"
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
              className="transition-smooth"
            />
            <p className="text-sm text-muted-foreground">
              How many times per day? (e.g., 8 for water glasses)
            </p>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button 
              type="submit" 
              className="gradient-primary flex-1 transition-bounce"
              disabled={!habitName.trim()}
            >
              {isEditing ? 'Save Changes' : 'Create Habit'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="transition-smooth"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}