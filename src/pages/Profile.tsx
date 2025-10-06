import React, { useState } from 'react';
import { User, Settings, Moon, Sun, Star, Users, LogOut, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabaseHabits } from '@/hooks/useSupabaseHabits';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSocial } from '@/hooks/useSocial';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const [darkMode, setDarkMode] = useLocalStorage('zentrack-dark-mode', false);
  const { habits, userLevel, totalStreakDays } = useSupabaseHabits();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const { userStats } = useSocial();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your password has been updated successfully.',
      });
      
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark', !darkMode);
  };

  const getLevelTitle = (level: number) => {
    const titles = [
      'Beginner', 'Starter', 'Committed', 'Focused', 
      'Dedicated', 'Consistent', 'Expert', 'Master', 
      'Champion', 'Legend'
    ];
    return titles[level - 1] || 'Legend';
  };

  const getPremiumFeatures = () => [
    'Unlimited habits (currently limited to 7)',
    'Streak freeze mechanics',
    'Extended history (30+ days)',
    'Habit history editing',
    'Advanced analytics',
    'Custom themes',
  ];

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account</p>
        </div>

        {/* User Level Card */}
        <Card className="p-6 gradient-card border-0 shadow-medium text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 gradient-primary rounded-full">
              <Star className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Level {userLevel}</h2>
          <Badge variant="secondary" className="mt-2">
            {getLevelTitle(userLevel)}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">
            {totalStreakDays} total streak days
          </p>
        </Card>

        {/* Settings */}
        <Card className="p-4 gradient-card border-0 shadow-soft">
          <h3 className="font-semibold mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Settings
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark Mode</span>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
                className="transition-smooth"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
            
            {user && (
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground mb-2">
                  Signed in as: {user.email}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="transition-smooth text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Social Features (Preview) */}
        <Card className="p-4 gradient-card border-0 shadow-soft">
          <h3 className="font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Social Features
          </h3>
          
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Connect with friends and share your progress!
            </p>
            <Button variant="outline" className="transition-smooth" disabled>
              Connect with Supabase to enable
            </Button>
          </div>
        </Card>

        {/* Premium Upgrade */}
        <Card className="p-4 gradient-secondary border-0 shadow-medium">
          <div className="text-center">
            <h3 className="font-semibold text-white mb-2">Upgrade to Premium</h3>
            <p className="text-sm text-white/90 mb-4">
              Unlock unlimited habits and advanced features
            </p>
            
            <div className="space-y-2 mb-4">
              {getPremiumFeatures().map((feature, index) => (
                <div key={index} className="text-left text-sm text-white/90 flex items-center">
                  <Star className="h-3 w-3 mr-2 text-warning" />
                  {feature}
                </div>
              ))}
            </div>
            
            <Button 
              variant="secondary" 
              className="w-full transition-bounce"
              disabled
            >
              Coming Soon
            </Button>
          </div>
        </Card>

        {/* Social Stats */}
        <Card className="p-4 gradient-card border-0 shadow-soft">
          <h3 className="font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Social
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{userStats?.followers_count || 0}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{userStats?.following_count || 0}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{userLevel}</div>
              <div className="text-sm text-muted-foreground">Level</div>
            </div>
          </div>
        </Card>

        {/* Password Update */}
        <Card className="p-4 gradient-card border-0 shadow-soft">
          <h3 className="font-semibold mb-4 flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Update Password
          </h3>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button
              onClick={handlePasswordUpdate}
              disabled={updatingPassword}
              className="w-full transition-smooth"
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </Card>

        {/* Stats Summary */}
        <Card className="p-4 gradient-card border-0 shadow-soft">
          <h3 className="font-semibold mb-4">Your Stats</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{habits.length}</div>
              <div className="text-sm text-muted-foreground">Active Habits</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.max(...habits.map(h => h.longestStreak), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}