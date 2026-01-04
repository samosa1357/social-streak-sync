import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface UserStats {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  total_streak_days: number;
  followers_count: number;
  following_count: number;
}

export interface FriendProgress {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  completion_percentage: number;
  completed_count: number;
  total_count: number;
}

export interface MyProgress {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  completion_percentage: number;
  completed_count: number;
  total_count: number;
}

export function useSocial() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [following, setFollowing] = useState<UserStats[]>([]);
  const [followers, setFollowers] = useState<UserStats[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<string[]>([]); // IDs of users we've sent pending requests to
  const [pendingIncoming, setPendingIncoming] = useState<UserStats[]>([]); // Users who sent us pending requests
  const [friendsProgress, setFriendsProgress] = useState<FriendProgress[]>([]);
  const [myProgress, setMyProgress] = useState<MyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;

    try {
      // Get all follows we initiated
      const { data, error } = await supabase
        .from('follows')
        .select('following_id, status')
        .eq('follower_id', user.id);

      if (error) throw error;

      // Separate accepted and pending
      const acceptedIds = data.filter(f => f.status === 'accepted').map(f => f.following_id);
      const pendingIds = data.filter(f => f.status === 'pending').map(f => f.following_id);
      
      setPendingOutgoing(pendingIds);
      
      if (acceptedIds.length > 0) {
        // Fetch profiles directly
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', acceptedIds);

        if (profilesError) throw profilesError;

        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('user_id, level, total_streak_days')
          .in('user_id', acceptedIds);

        if (progressError) throw progressError;

        // Combine profile and progress data
        const followingData: UserStats[] = acceptedIds.map(id => {
          const profile = profilesData?.find(p => p.user_id === id);
          const progress = progressData?.find(p => p.user_id === id);
          return {
            user_id: id,
            display_name: profile?.display_name || null,
            avatar_url: profile?.avatar_url || null,
            level: progress?.level || 1,
            total_streak_days: progress?.total_streak_days || 0,
            followers_count: 0,
            following_count: 0
          };
        });

        setFollowing(followingData);
      } else {
        setFollowing([]);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const fetchFollowers = async () => {
    if (!user) return;

    try {
      // Only count accepted followers
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id)
        .eq('status', 'accepted');

      if (error) throw error;

      const followerIds = data.map(f => f.follower_id);
      
      if (followerIds.length > 0) {
        // Use profiles table directly since followers have an accepted relationship with us
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', followerIds);

        if (profilesError) throw profilesError;

        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('user_id, level, total_streak_days')
          .in('user_id', followerIds);

        if (progressError) throw progressError;

        // Combine profile and progress data
        const followersData: UserStats[] = followerIds.map(id => {
          const profile = profilesData?.find(p => p.user_id === id);
          const progress = progressData?.find(p => p.user_id === id);
          return {
            user_id: id,
            display_name: profile?.display_name || null,
            avatar_url: profile?.avatar_url || null,
            level: progress?.level || 1,
            total_streak_days: progress?.total_streak_days || 0,
            followers_count: 0,
            following_count: 0
          };
        });

        setFollowers(followersData);
      } else {
        setFollowers([]);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchPendingIncoming = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const pendingIds = data.map(f => f.follower_id);
      
      if (pendingIds.length > 0) {
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .in('user_id', pendingIds);

        if (statsError) throw statsError;
        setPendingIncoming(statsData || []);
      } else {
        setPendingIncoming([]);
      }
    } catch (error) {
      console.error('Error fetching pending incoming requests:', error);
    }
  };

  const fetchFriendsProgress = useCallback(async () => {
    if (!user) return;

    try {
      // Only show progress for accepted follows
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      if (followingError) throw followingError;

      const followingIds = followingData.map(f => f.following_id);
      
      if (followingIds.length === 0) {
        setFriendsProgress([]);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const { data: progressData, error: progressError } = await supabase
        .from('daily_progress')
        .select('user_id, data')
        .in('user_id', followingIds)
        .eq('date', today);

      if (progressError) throw progressError;

      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('user_id, id, target_count')
        .in('user_id', followingIds);

      if (habitsError) throw habitsError;

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', followingIds);

      if (profilesError) throw profilesError;

      const { data: levelsData, error: levelsError } = await supabase
        .from('user_progress')
        .select('user_id, level')
        .in('user_id', followingIds);

      if (levelsError) throw levelsError;

      const progress: FriendProgress[] = followingIds.map(userId => {
        const userProgress = progressData?.find(p => p.user_id === userId);
        const userHabits = habitsData?.filter(h => h.user_id === userId) || [];
        const profile = profilesData?.find(p => p.user_id === userId);
        const levelData = levelsData?.find(l => l.user_id === userId);

        const progressObj = (userProgress?.data as Record<string, number>) || {};
        
        // Calculate completion percentage based on actual target counts
        let completedCount = 0;
        let totalTargetCount = 0;
        
        userHabits.forEach(habit => {
          const habitProgress = progressObj[habit.id] || 0;
          completedCount += Math.min(habitProgress, habit.target_count);
          totalTargetCount += habit.target_count;
        });
        
        const completionPercentage = totalTargetCount > 0 
          ? Math.round((completedCount / totalTargetCount) * 100)
          : 0;

        return {
          user_id: userId,
          display_name: profile?.display_name || 'Anonymous',
          avatar_url: profile?.avatar_url || null,
          level: levelData?.level || 1,
          completion_percentage: completionPercentage,
          completed_count: completedCount,
          total_count: totalTargetCount
        };
      });

      setFriendsProgress(progress);
    } catch (error) {
      console.error('Error fetching friends progress:', error);
    }
  }, [user]);

  // Fetch current user's own progress for leaderboard
  const fetchMyProgress = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const [progressRes, habitsRes, profileRes, levelRes] = await Promise.all([
        supabase.from('daily_progress').select('data').eq('user_id', user.id).eq('date', today).maybeSingle(),
        supabase.from('habits').select('id, target_count').eq('user_id', user.id),
        supabase.from('profiles').select('display_name, avatar_url').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_progress').select('level').eq('user_id', user.id).maybeSingle()
      ]);

      const progressObj = (progressRes.data?.data as Record<string, number>) || {};
      const habits = habitsRes.data || [];
      
      let completedCount = 0;
      let totalTargetCount = 0;
      
      habits.forEach(habit => {
        const habitProgress = progressObj[habit.id] || 0;
        completedCount += Math.min(habitProgress, habit.target_count);
        totalTargetCount += habit.target_count;
      });
      
      const completionPercentage = totalTargetCount > 0 
        ? Math.round((completedCount / totalTargetCount) * 100)
        : 0;

      setMyProgress({
        user_id: user.id,
        display_name: profileRes.data?.display_name || 'You',
        avatar_url: profileRes.data?.avatar_url || null,
        level: levelRes.data?.level || 1,
        completion_percentage: completionPercentage,
        completed_count: completedCount,
        total_count: totalTargetCount
      });
    } catch (error) {
      console.error('Error fetching my progress:', error);
    }
  }, [user]);

  const followUser = async (followingId: string) => {
    if (!user) return;

    // Prevent self-follow
    if (user.id === followingId) {
      toast({
        title: 'Cannot follow yourself',
        description: 'You cannot send a follow request to yourself.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check if target user has a private account using the security definer function
      const { data: isPublic, error: privacyError } = await supabase
        .rpc('is_profile_public', { target: followingId });

      if (privacyError) throw privacyError;

      // If isPublic is true, status is 'accepted', otherwise 'pending'
      const status = isPublic ? 'accepted' : 'pending';

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: followingId,
          status
        });

      if (error) throw error;

      toast({
        title: status === 'pending' ? 'Follow request sent!' : 'Now following!',
        description: status === 'pending' 
          ? 'Waiting for the user to accept your request.'
          : 'You are now following this user.',
      });

      await Promise.all([fetchFollowing(), fetchUserStats()]);
    } catch (error: any) {
      console.error('Error following user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to follow user.',
        variant: 'destructive',
      });
    }
  };

  const unfollowUser = async (followingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'You have unfollowed this user.',
      });

      await Promise.all([fetchFollowing(), fetchUserStats()]);
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to unfollow user.',
        variant: 'destructive',
      });
    }
  };

  const searchUsers = async (query: string): Promise<UserStats[]> => {
    if (!user) return [];
    
    try {
      // Use the security definer function to search users regardless of privacy
      const { data, error } = await supabase
        .rpc('search_users_for_discovery', {
          search_query: query,
          current_user_id: user.id
        });

      if (error) throw error;
      return (data || []).map((u: any) => ({
        user_id: u.user_id,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        level: u.level,
        total_streak_days: u.total_streak_days,
        followers_count: u.followers_count,
        following_count: u.following_count
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        fetchUserStats(),
        fetchFollowing(),
        fetchFollowers(),
        fetchPendingIncoming(),
        fetchFriendsProgress(),
        fetchMyProgress()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  // Real-time subscription for daily_progress changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('friends-progress-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_progress'
        },
        () => {
          // Refresh friends progress and my progress when any daily_progress changes
          fetchFriendsProgress();
          fetchMyProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchFriendsProgress, fetchMyProgress]);

  const cancelFollowRequest = async (followingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: 'Request cancelled',
        description: 'Follow request has been cancelled.',
      });

      await fetchFollowing();
    } catch (error: any) {
      console.error('Error cancelling follow request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel request.',
        variant: 'destructive',
      });
    }
  };

  const isPendingFollow = (userId: string) => {
    return pendingOutgoing.includes(userId);
  };

  const acceptFollowRequest = async (followerId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('follower_id', followerId)
        .eq('following_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: 'Request accepted',
        description: 'You have accepted the follow request.',
      });

      await Promise.all([fetchPendingIncoming(), fetchFollowers(), fetchUserStats()]);
    } catch (error: any) {
      console.error('Error accepting follow request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept request.',
        variant: 'destructive',
      });
    }
  };

  const declineFollowRequest = async (followerId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .update({ status: 'rejected' })
        .eq('follower_id', followerId)
        .eq('following_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: 'Request declined',
        description: 'You have declined the follow request.',
      });

      await fetchPendingIncoming();
    } catch (error: any) {
      console.error('Error declining follow request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to decline request.',
        variant: 'destructive',
      });
    }
  };

  // Remove a follower (someone who follows you)
  const removeFollower = async (followerId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', user.id);

      if (error) throw error;

      toast({
        title: 'Follower removed',
        description: 'This user is no longer following you.',
      });

      await Promise.all([fetchFollowers(), fetchUserStats()]);
    } catch (error: any) {
      console.error('Error removing follower:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove follower.',
        variant: 'destructive',
      });
    }
  };

  return {
    userStats,
    following,
    followers,
    pendingOutgoing,
    pendingIncoming,
    friendsProgress,
    myProgress,
    loading,
    followUser,
    unfollowUser,
    removeFollower,
    cancelFollowRequest,
    acceptFollowRequest,
    declineFollowRequest,
    searchUsers,
    isPendingFollow,
    refresh: () => Promise.all([
      fetchUserStats(),
      fetchFollowing(),
      fetchFollowers(),
      fetchPendingIncoming(),
      fetchFriendsProgress(),
      fetchMyProgress()
    ])
  };
}
