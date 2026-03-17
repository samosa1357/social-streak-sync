
-- Fix: follows SELECT policy allows anonymous access via is_profile_public() without auth check
-- Drop the existing policy and recreate with auth.uid() IS NOT NULL guard
DROP POLICY IF EXISTS "Users can view relevant follows" ON public.follows;

CREATE POLICY "Users can view relevant follows"
ON public.follows
FOR SELECT
TO authenticated
USING (
  (auth.uid() = follower_id)
  OR (auth.uid() = following_id)
  OR ((status = 'accepted') AND is_profile_public(following_id))
);
