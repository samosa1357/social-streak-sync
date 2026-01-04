import React, { useState, useMemo } from 'react';
import { Users, Search, TrendingUp, Trophy, UserPlus, Check, X, Medal, UserMinus, Flame, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocial, UserStats, FriendProgress } from '@/hooks/useSocial';
import { Progress } from '@/components/ui/progress';
import { BottomNavigation } from '@/components/BottomNavigation';
import { RequireUsername } from '@/components/RequireUsername';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function FriendsContent() {
  const { 
    userStats, 
    following,
    followers, 
    friendsProgress,
    myProgress,
    pendingIncoming,
    loading, 
    unfollowUser,
    removeFollower,
    searchUsers, 
    followUser, 
    cancelFollowRequest,
    acceptFollowRequest,
    declineFollowRequest,
    isPendingFollow 
  } = useSocial();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    
    setSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const isFollowing = (userId: string) => {
    return following.some(f => f.user_id === userId);
  };

  const getFollowButtonState = (userId: string) => {
    if (isFollowing(userId)) return 'following';
    if (isPendingFollow(userId)) return 'requested';
    return 'not_following';
  };

  const handleFollowAction = (userId: string) => {
    const state = getFollowButtonState(userId);
    if (state === 'following') {
      unfollowUser(userId);
    } else if (state === 'requested') {
      cancelFollowRequest(userId);
    } else {
      followUser(userId);
    }
  };

  // Leaderboard - sorted by completion percentage descending, including current user
  const leaderboard = useMemo(() => {
    const allProgress: (FriendProgress & { isCurrentUser?: boolean })[] = [...friendsProgress];
    
    // Add current user's progress to leaderboard
    if (myProgress) {
      allProgress.push({ ...myProgress, isCurrentUser: true });
    }
    
    return allProgress
      .sort((a, b) => b.completion_percentage - a.completion_percentage)
      .slice(0, 5);
  }, [friendsProgress, myProgress]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold mb-2">Friends</h1>
          <p className="text-muted-foreground">Connect and compete with friends</p>
        </div>

        {/* Stats Card with Tabs */}
        <Card className="p-4 gradient-card border-0 shadow-soft">
          <div className="grid grid-cols-2 gap-4 text-center">
            <button 
              onClick={() => setActiveTab('followers')}
              className={`transition-colors ${activeTab === 'followers' ? 'opacity-100' : 'opacity-60'}`}
            >
              <div className="text-2xl font-bold">{userStats?.followers_count || 0}</div>
              <div className={`text-sm ${activeTab === 'followers' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Followers
              </div>
              {activeTab === 'followers' && <div className="h-0.5 bg-primary mt-2 rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('following')}
              className={`transition-colors ${activeTab === 'following' ? 'opacity-100' : 'opacity-60'}`}
            >
              <div className="text-2xl font-bold">{userStats?.following_count || 0}</div>
              <div className={`text-sm ${activeTab === 'following' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Following
              </div>
              {activeTab === 'following' && <div className="h-0.5 bg-primary mt-2 rounded-full" />}
            </button>
          </div>
        </Card>

        {/* Followers/Following List based on active tab */}
        <Card className="p-4 gradient-card border-0 shadow-soft">
          {activeTab === 'followers' ? (
            <>
              <h3 className="font-semibold mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Followers
              </h3>
              {followers.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No followers yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {followers.map((user) => (
                    <div 
                      key={user.user_id} 
                      className="flex items-center justify-between p-2 bg-card rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="gradient-primary text-white">
                            {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.display_name || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">
                            Level {user.level} • {user.total_streak_days} streak days
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFollower(user.user_id);
                        }}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="font-semibold mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Following
              </h3>
              {following.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Not following anyone yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {following.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-2 bg-card rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="gradient-primary text-white">
                            {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.display_name || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">
                            Level {user.level} • {user.total_streak_days} streak days
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unfollowUser(user.user_id)}
                      >
                        Unfollow
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>

        {/* Pending Follow Requests */}
        {pendingIncoming.length > 0 && (
          <Card className="p-4 gradient-card border-0 shadow-soft">
            <h3 className="font-semibold mb-3 flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Follow Requests ({pendingIncoming.length})
            </h3>
            <div className="space-y-2">
              {pendingIncoming.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-2 bg-card rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="p-2 gradient-primary rounded-full">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{user.display_name}</p>
                      <p className="text-xs text-muted-foreground">Level {user.level}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => acceptFollowRequest(user.user_id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => declineFollowRequest(user.user_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Search Section */}
        <Card className="p-4 gradient-card border-0 shadow-soft">
          <h3 className="font-semibold mb-3 flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Find Friends
          </h3>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-2 bg-card rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="p-2 gradient-primary rounded-full">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{user.display_name}</p>
                      <p className="text-xs text-muted-foreground">Level {user.level}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={getFollowButtonState(user.user_id) === 'not_following' ? 'default' : 'outline'}
                    onClick={() => handleFollowAction(user.user_id)}
                  >
                    {getFollowButtonState(user.user_id) === 'following' && 'Unfollow'}
                    {getFollowButtonState(user.user_id) === 'requested' && 'Requested'}
                    {getFollowButtonState(user.user_id) === 'not_following' && 'Follow'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <Card className="p-4 gradient-card border-0 shadow-soft">
            <h3 className="font-semibold mb-4 flex items-center">
              <Medal className="h-5 w-5 mr-2 text-amber-500" />
              Today's Leaderboard
            </h3>
            <div className="space-y-3">
              {leaderboard.map((friend, index) => {
                const isCurrentUser = 'isCurrentUser' in friend && friend.isCurrentUser;
                return (
                  <div 
                    key={friend.user_id} 
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-card'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-amber-500 text-white' : 
                      index === 1 ? 'bg-gray-400 text-white' : 
                      index === 2 ? 'bg-amber-700 text-white' : 
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback className="gradient-primary text-white">
                        {friend.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {friend.display_name}
                        {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Level {friend.level} • {friend.completed_count}/{friend.total_count}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary">{friend.completion_percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Friends Progress */}
        <Card className="p-4 gradient-card border-0 shadow-soft">
          <h3 className="font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Friends' Today Progress
          </h3>

          {friendsProgress.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Follow friends to see their progress
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {friendsProgress.map((friend) => (
                <div key={friend.user_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback className="gradient-primary text-white text-xs">
                          {friend.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{friend.display_name}</span>
                      <Badge variant="secondary" className="text-xs">
                        Lv.{friend.level}
                      </Badge>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {friend.completion_percentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={friend.completion_percentage} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {friend.completed_count}/{friend.total_count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="gradient-primary text-white text-xl">
                      {selectedUser.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedUser.display_name || 'Anonymous'}</h3>
                    <p className="text-sm text-muted-foreground">Follower</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-2xl font-bold">{selectedUser.level}</div>
                    <div className="text-xs text-muted-foreground">Level</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold">{selectedUser.total_streak_days}</div>
                    <div className="text-xs text-muted-foreground">Streak Days</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">{selectedUser.followers_count}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                </div>

                {/* Action */}
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    removeFollower(selectedUser.user_id);
                    setSelectedUser(null);
                  }}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Follower
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
      <BottomNavigation />
    </div>
  );
}

export default function Friends() {
  return (
    <RequireUsername>
      <FriendsContent />
    </RequireUsername>
  );
}
