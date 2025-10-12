import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Moon, Sun, Star, Users, LogOut, Lock, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabaseHabits } from '@/hooks/useSupabaseHabits';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSocial } from '@/hooks/useSocial';
import { supabase } from '@/integrations/supabase/client';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ProfilePhotoUpload } from '@/components/ProfilePhotoUpload';

export default function Profile() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useLocalStorage('zentrack-dark-mode', false);
  const { habits, userLevel, totalStreakDays } = useSupabaseHabits();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const { userStats } = useSocial();
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, is_private')
        .eq('user_id', user.id)
        .single();
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
      if (data?.is_private !== undefined) {
        setIsPrivate(data.is_private);
      }
    };
    
    fetchProfile();
  }, [user]);

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark', !darkMode);
  };

  const togglePrivacy = async () => {
    if (!user) return;
    
    const newPrivacyValue = !isPrivate;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_private: newPrivacyValue })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsPrivate(newPrivacyValue);
      toast({
        title: 'Privacy updated',
        description: newPrivacyValue 
          ? 'Your account is now private. Users need to send follow requests.'
          : 'Your account is now public. Anyone can follow you.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update privacy settings.',
        variant: 'destructive',
      });
    }
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

        {/* Profile Photo */}
        <Card className="p-6 gradient-card border-0 shadow-medium">
          <ProfilePhotoUpload 
            currentPhotoUrl={avatarUrl}
            onPhotoUpdate={setAvatarUrl}
          />
        </Card>

        {/* User Level Card */}
        <Card className="p-6 gradient-card border-0 shadow-medium text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 gradient-primary rounded-full">
              <Star className="h-8 w-8 text-primary-foreground" />
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

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Private Account</span>
              </div>
              <Switch
                checked={isPrivate}
                onCheckedChange={togglePrivacy}
              />
            </div>

            <button
              onClick={() => navigate('/update-password')}
              className="flex items-center justify-between w-full pt-2 border-t hover:opacity-80 transition-smooth"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Update Password</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            
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
      <BottomNavigation />
    </div>
  );
}