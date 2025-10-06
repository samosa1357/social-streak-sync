import React, { useState } from 'react';
import { Users, Search, TrendingUp, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocial } from '@/hooks/useSocial';
import { Progress } from '@/components/ui/progress';

export default function Friends() {
  const { userStats, following, friendsProgress, loading, unfollowUser, searchUsers, followUser } = useSocial();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

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

        {/* Stats Card */}
        <Card className="p-4 gradient-card border-0 shadow-soft">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{userStats?.followers_count || 0}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{userStats?.following_count || 0}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
          </div>
        </Card>

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
                    variant={isFollowing(user.user_id) ? "outline" : "default"}
                    onClick={() => isFollowing(user.user_id) ? unfollowUser(user.user_id) : followUser(user.user_id)}
                  >
                    {isFollowing(user.user_id) ? 'Unfollow' : 'Follow'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

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
              {friendsProgress.map((friend) => {
                const percentage = friend.total_habits > 0 
                  ? Math.round((friend.completed_today / (friend.total_habits * 5)) * 100) 
                  : 0;
                
                return (
                  <div key={friend.user_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="font-medium">{friend.display_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          Lv.{friend.level}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {friend.completed_today} tasks
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Following List */}
        {following.length > 0 && (
          <Card className="p-4 gradient-card border-0 shadow-soft">
            <h3 className="font-semibold mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Following ({following.length})
            </h3>
            <div className="space-y-2">
              {following.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-2 bg-card rounded-lg">
                  <div>
                    <p className="font-medium">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Level {user.level} • {user.total_streak_days} streak days
                    </p>
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
          </Card>
        )}
      </div>
    </div>
  );
}
