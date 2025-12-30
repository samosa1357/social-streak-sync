import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserStats {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  total_streak_days: number;
  followers_count: number;
  following_count: number;
}

interface FriendProgress {
  user_id: string;
  display_name: string | null;
  level: number;
  completed_today: number;
  total_habits: number;
}

export function useSocial() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [following, setFollowing] = useState<UserStats[]>([]);
  const [followers, setFollowers] = useState<UserStats[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<string[]>([]); // IDs of users we've sent pending requests to
  const [pendingIncoming, setPendingIncoming] = useState<UserStats[]>([]); // Users who sent us pending requests
  const [friendsProgress, setFriendsProgress] = useState<FriendProgress[]>([]);
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
      // Only get accepted follows
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
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .in('user_id', acceptedIds);

        if (statsError) throw statsError;
        setFollowing(statsData || []);
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
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .in('user_id', followerIds);

        if (statsError) throw statsError;
        setFollowers(statsData || []);
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

  const fetchFriendsProgress = async () => {
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
        .select('user_id, display_name')
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
        const completedToday = Object.values(progressObj).reduce((sum, val) => sum + val, 0);

        return {
          user_id: userId,
          display_name: profile?.display_name || 'Anonymous',
          level: levelData?.level || 1,
          completed_today: completedToday,
          total_habits: userHabits.length
        };
      });

      setFriendsProgress(progress);
    } catch (error) {
      console.error('Error fetching friends progress:', error);
    }
  };

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
      // Check if target user has a private account
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_private')
        .eq('user_id', followingId)
        .single();

      if (profileError) throw profileError;

      const status = profileData?.is_private ? 'pending' : 'accepted';

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
        fetchFriendsProgress()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

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

  return {
    userStats,
    following,
    followers,
    pendingOutgoing,
    pendingIncoming,
    friendsProgress,
    loading,
    followUser,
    unfollowUser,
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
      fetchFriendsProgress()
    ])
  };
}
