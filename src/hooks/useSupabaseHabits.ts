import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { Habit } from '@/types/habit';
import { calculateHabitStreaks, calculatePerfectDayCount, type ProgressRow } from '@/lib/streaks';

export function useSupabaseHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyProgress, setDailyProgress] = useState<Record<string, number>>({});
  const [userLevel, setUserLevel] = useState(1);
  const [totalStreakDays, setTotalStreakDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchHabits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedHabits: Habit[] = (data || []).map(habit => ({
        id: habit.id,
        name: habit.name,
        targetCount: habit.target_count,
        currentCount: 0,
        completed: false,
        streak: 0,
        longestStreak: 0,
        createdAt: habit.created_at
      }));

      setHabits(formattedHabits);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        title: 'Error',
        description: 'Failed to load habits. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const fetchDailyProgress = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_progress')
        .select('data')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;

      const progressData = data?.data;
      if (progressData && typeof progressData === 'object' && !Array.isArray(progressData)) {
        setDailyProgress(progressData as Record<string, number>);
      } else {
        setDailyProgress({});
      }
    } catch (error) {
      console.error('Error fetching daily progress:', error);
      setDailyProgress({});
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('level, total_streak_days')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create user progress if it doesn't exist
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            level: 1,
            total_streak_days: 0
          });

        if (insertError) throw insertError;
        setUserLevel(1);
        setTotalStreakDays(0);
      } else {
        setUserLevel(data.level);
        setTotalStreakDays(data.total_streak_days);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
      setUserLevel(1);
      setTotalStreakDays(0);
    }
  };

  const addHabit = async (name: string, targetCount: number) => {
    if (!user || habits.length >= 7) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name,
          target_count: targetCount
        })
        .select()
        .single();

      if (error) throw error;

      const newHabit: Habit = {
        id: data.id,
        name: data.name,
        targetCount: data.target_count,
        currentCount: 0,
        completed: false,
        streak: 0,
        longestStreak: 0,
        createdAt: data.created_at
      };

      setHabits(prev => [...prev, newHabit]);
      
      toast({
        title: 'Habit added!',
        description: `"${name}" has been added to your habits.`,
      });
    } catch (error) {
      console.error('Error adding habit:', error);
      toast({
        title: 'Error',
        description: 'Failed to add habit. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const editHabit = async (id: string, name: string, targetCount: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update({ name, target_count: targetCount })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHabits(prev => prev.map(habit => 
        habit.id === id 
          ? { ...habit, name, targetCount }
          : habit
      ));

      toast({
        title: 'Habit updated!',
        description: 'Your habit has been updated successfully.',
      });
    } catch (error) {
      console.error('Error editing habit:', error);
      toast({
        title: 'Error',
        description: 'Failed to update habit. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deleteHabit = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHabits(prev => prev.filter(habit => habit.id !== id));
      setDailyProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[id];
        return newProgress;
      });

      toast({
        title: 'Habit deleted',
        description: 'The habit has been removed from your list.',
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete habit. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Check and update streaks when progress changes
  const checkAndUpdateStreaks = async (updatedProgress: Record<string, number>, habitId: string, wasCompleted: boolean, isNowCompleted: boolean) => {
    if (!user) return;
    
    // Calculate if 100% is now achieved
    let totalTasks = 0;
    let completedTasks = 0;
    
    habits.forEach(habit => {
      const progress = updatedProgress[habit.id] || 0;
      const habitTarget = habit.targetCount === 0 ? 1 : habit.targetCount;
      const habitProgress = habit.targetCount === 0 ? Math.min(progress, 1) : progress;
      
      totalTasks += habitTarget;
      completedTasks += habitProgress;
    });
    
    const is100Percent = totalTasks > 0 && completedTasks >= totalTasks;
    
    // Check if this was already 100% before (to avoid double-counting)
    let wasPreviously100 = false;
    {
      let prevTotal = 0;
      let prevCompleted = 0;
      
      habits.forEach(habit => {
        const progress = dailyProgress[habit.id] || 0;
        const habitTarget = habit.targetCount === 0 ? 1 : habit.targetCount;
        const habitProgress = habit.targetCount === 0 ? Math.min(progress, 1) : progress;
        
        prevTotal += habitTarget;
        prevCompleted += habitProgress;
      });
      
      wasPreviously100 = prevTotal > 0 && prevCompleted >= prevTotal;
    }
    
    // Update daily streak if just reached 100%
    if (is100Percent && !wasPreviously100) {
      try {
        const { error } = await supabase
          .from('user_progress')
          .update({ 
            total_streak_days: totalStreakDays + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        if (!error) {
          setTotalStreakDays(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error updating daily streak:', error);
      }
    }
    
    // Update individual habit streak when habit is completed
    if (!wasCompleted && isNowCompleted) {
      // Increment habit streak - stored in local habit state
      setHabits(prev => prev.map(h => 
        h.id === habitId 
          ? { 
              ...h, 
              streak: h.streak + 1,
              longestStreak: Math.max(h.longestStreak, h.streak + 1)
            }
          : h
      ));
    }
  };

  const updateHabitProgress = async (id: string) => {
    if (!user) return;

    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const currentProgress = dailyProgress[id] || 0;
    // For binary habits (targetCount = 0), don't increment
    if (habit.targetCount === 0 || currentProgress >= habit.targetCount) return;

    const newProgress = currentProgress + 1;
    const updatedDailyProgress = { ...dailyProgress, [id]: newProgress };
    const targetValue = habit.targetCount === 0 ? 1 : habit.targetCount;
    const wasCompleted = currentProgress >= targetValue;
    const isNowCompleted = newProgress >= targetValue;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('daily_progress')
        .upsert({
          user_id: user.id,
          date: today,
          data: updatedDailyProgress
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;

      setDailyProgress(updatedDailyProgress);
      
      // Update local habit state
      setHabits(prev => prev.map(h => 
        h.id === id 
          ? { 
              ...h, 
              currentCount: newProgress,
              completed: isNowCompleted
            }
          : h
      ));
      
      // Check and update streaks
      await checkAndUpdateStreaks(updatedDailyProgress, id, wasCompleted, isNowCompleted);
    } catch (error) {
      console.error('Error updating habit progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const decrementHabitProgress = async (id: string) => {
    if (!user) return;

    const currentProgress = dailyProgress[id] || 0;
    if (currentProgress <= 0) return;

    const newProgress = currentProgress - 1;
    const updatedDailyProgress = { ...dailyProgress, [id]: newProgress };

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('daily_progress')
        .upsert({
          user_id: user.id,
          date: today,
          data: updatedDailyProgress
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;

      setDailyProgress(updatedDailyProgress);
      
      // Update local habit state
      setHabits(prev => prev.map(h => 
        h.id === id 
          ? { 
              ...h, 
              currentCount: newProgress,
              completed: newProgress >= h.targetCount
            }
          : h
      ));
    } catch (error) {
      console.error('Error updating habit progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const toggleHabitComplete = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const currentProgress = dailyProgress[id] || 0;
    // For binary habits (targetCount = 0), toggle between 0 and 1
    // For counter habits, toggle between 0 and targetCount
    const targetValue = habit.targetCount === 0 ? 1 : habit.targetCount;
    const newProgress = currentProgress >= targetValue ? 0 : targetValue;
    const updatedDailyProgress = { ...dailyProgress, [id]: newProgress };
    const wasCompleted = currentProgress >= targetValue;
    const isNowCompleted = newProgress >= targetValue;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('daily_progress')
        .upsert({
          user_id: user.id,
          date: today,
          data: updatedDailyProgress
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;

      setDailyProgress(updatedDailyProgress);
      
      // Update local habit state
      setHabits(prev => prev.map(h => 
        h.id === id 
          ? { 
              ...h, 
              currentCount: newProgress,
              completed: isNowCompleted
            }
          : h
      ));
      
      // Check and update streaks
      await checkAndUpdateStreaks(updatedDailyProgress, id, wasCompleted, isNowCompleted);
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      toast({
        title: 'Error',
        description: 'Failed to update habit. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getTodayProgress = () => {
    if (habits.length === 0) return { percentage: 0, completedHabits: 0, totalHabits: 0, completedTasks: 0, totalTasks: 0 };

    let totalTasks = 0;
    let completedTasks = 0;
    let completedHabits = 0;

    habits.forEach(habit => {
      const progress = dailyProgress[habit.id] || 0;
      // For binary habits (targetCount = 0), treat as 1 task
      const habitTarget = habit.targetCount === 0 ? 1 : habit.targetCount;
      const habitProgress = habit.targetCount === 0 ? Math.min(progress, 1) : progress;
      
      totalTasks += habitTarget;
      completedTasks += habitProgress;
      
      if (habitProgress >= habitTarget) {
        completedHabits++;
      }
    });

    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      percentage,
      completedHabits,
      totalHabits: habits.length,
      completedTasks,
      totalTasks
    };
  };

  const getRecentProgress = async () => {
    if (!user || habits.length === 0) return [];

    try {
      // Get last 15 days of progress
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14); // 14 days ago + today = 15 days

      const { data, error } = await supabase
        .from('daily_progress')
        .select('date, data')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Create array of last 15 days
      const progressArray = [];
      for (let i = 14; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = data?.find(d => d.date === dateStr);
        const dayProgress = dayData?.data as Record<string, number> || {};
        
        let completedHabits = 0;
        let totalTasks = 0;
        let completedTasks = 0;

        habits.forEach(habit => {
          const progress = dayProgress[habit.id] || 0;
          const habitTarget = habit.targetCount === 0 ? 1 : habit.targetCount;
          const habitProgress = habit.targetCount === 0 ? Math.min(progress, 1) : progress;
          
          totalTasks += habitTarget;
          completedTasks += habitProgress;
          
          if (habitProgress >= habitTarget) {
            completedHabits++;
          }
        });

        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        progressArray.push({
          date: dateStr,
          completionPercentage,
          totalHabits: habits.length,
          completedHabits,
          allCompleted: habits.length > 0 && completedHabits === habits.length
        });
      }

      return progressArray;
    } catch (error) {
      console.error('Error fetching recent progress:', error);
      return [];
    }
  };

  // Update habits with current progress when dailyProgress changes
  useEffect(() => {
    if (Object.keys(dailyProgress).length === 0 && habits.length > 0) {
      // Even when dailyProgress is empty, we need to ensure habits are reset
      setHabits(prev => prev.map(habit => ({
        ...habit,
        currentCount: 0,
        completed: false
      })));
      return;
    }
    
    setHabits(prev => prev.map(habit => {
      const progress = dailyProgress[habit.id] || 0;
      const targetValue = habit.targetCount === 0 ? 1 : habit.targetCount;
      return {
        ...habit,
        currentCount: progress,
        completed: progress >= targetValue
      };
    }));
  }, [dailyProgress]);

  // Load data when user changes
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated && user) {
        setLoading(true);
        try {
          // Fetch habits first
          await fetchHabits();
          // Then fetch daily progress
          await fetchDailyProgress();
          // Finally fetch user progress
          await fetchUserProgress();
        } finally {
          setLoading(false);
        }
      } else {
        setHabits([]);
        setDailyProgress({});
        setUserLevel(1);
        setTotalStreakDays(0);
        setLoading(false);
      }
    };
    
    loadData();
  }, [isAuthenticated, user]);

  return {
    habits,
    addHabit,
    editHabit,
    deleteHabit,
    updateHabitProgress,
    decrementHabitProgress,
    toggleHabitComplete,
    getTodayProgress,
    getRecentProgress,
    userLevel,
    totalStreakDays,
    loading
  };
}