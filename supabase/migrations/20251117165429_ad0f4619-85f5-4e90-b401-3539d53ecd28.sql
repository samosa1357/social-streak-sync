-- Fix Security Issue 1: Remove Security Definer View
-- Drop and recreate user_stats view without SECURITY DEFINER
DROP VIEW IF EXISTS public.user_stats;

CREATE VIEW public.user_stats AS
SELECT 
  p.user_id,
  up.level,
  up.total_streak_days,
  (SELECT COUNT(*) FROM follows WHERE following_id = p.user_id AND status = 'accepted') as followers_count,
  (SELECT COUNT(*) FROM follows WHERE follower_id = p.user_id AND status = 'accepted') as following_count,
  p.display_name,
  p.avatar_url
FROM profiles p
LEFT JOIN user_progress up ON up.user_id = p.user_id;

-- Fix Security Issue 2: Restrict profile visibility to authenticated users with privacy respect
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Users can view profiles based on privacy" ON profiles FOR SELECT
USING (
  -- Own profile is always visible
  auth.uid() = user_id OR
  -- Public profiles are visible to authenticated users
  (NOT is_private AND auth.role() = 'authenticated') OR
  -- Private profiles are visible to accepted followers
  (is_private AND EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = auth.uid() 
    AND following_id = profiles.user_id 
    AND status = 'accepted'
  ))
);

-- Fix Security Issue 3: Remove unrestricted notification creation
DROP POLICY IF EXISTS "Users can create notifications for others" ON notifications;

-- Notifications should only be created by database triggers or server functions
-- No direct INSERT policy for users

-- Fix Security Issue 4: Add input validation constraints for profiles
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS display_name_length,
  DROP CONSTRAINT IF EXISTS bio_length,
  DROP CONSTRAINT IF EXISTS display_name_not_empty;

ALTER TABLE profiles 
  ADD CONSTRAINT display_name_length CHECK (length(display_name) <= 50),
  ADD CONSTRAINT bio_length CHECK (length(bio) <= 500),
  ADD CONSTRAINT display_name_not_empty CHECK (trim(COALESCE(display_name, '')) != '' OR display_name IS NULL);