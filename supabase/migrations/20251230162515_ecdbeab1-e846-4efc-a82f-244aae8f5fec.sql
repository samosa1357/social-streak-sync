-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles based on privacy" ON public.profiles;

-- Create a simpler policy that doesn't cause recursion
-- Allow users to view their own profile, or any public profile, or profiles they follow (checked via a simpler subquery)
CREATE POLICY "Users can view profiles based on privacy" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR NOT is_private 
  OR EXISTS (
    SELECT 1 FROM follows 
    WHERE follows.follower_id = auth.uid() 
    AND follows.following_id = profiles.user_id 
    AND follows.status = 'accepted'
  )
);