import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddHabitDialogProps {
  onAddHabit: (name: string, targetCount: number) => void;
}

export function AddHabitDialog({ onAddHabit }: AddHabitDialogProps) {
  const [open, setOpen] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [targetCount, setTargetCount] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habitName.trim()) {
      onAddHabit(habitName.trim(), targetCount);
      setHabitName('');
      setTargetCount(1);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="gradient-primary shadow-medium transition-bounce hover:shadow-strong"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="gradient-card border-0 shadow-strong">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              max="20"
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
              Create Habit
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
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