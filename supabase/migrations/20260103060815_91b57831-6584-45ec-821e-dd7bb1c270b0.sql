-- Allow users to view daily progress of people they follow (accepted)
DROP POLICY IF EXISTS "Users can view their own daily progress " ON public.daily_progress;

CREATE POLICY "Users can view own and followed users daily progress"
ON public.daily_progress
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = auth.uid() 
    AND following_id = daily_progress.user_id 
    AND status = 'accepted'
  )
);

-- Similarly, allow viewing habits of followed users for percentage calculation
DROP POLICY IF EXISTS "Users can view their own habits " ON public.habits;

CREATE POLICY "Users can view own and followed users habits"
ON public.habits
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = auth.uid() 
    AND following_id = habits.user_id 
    AND status = 'accepted'
  )
);

-- Allow viewing user_progress of followed users
DROP POLICY IF EXISTS "Users can view their own progress " ON public.user_progress;

CREATE POLICY "Users can view own and followed users progress"
ON public.user_progress
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = auth.uid() 
    AND following_id = user_progress.user_id 
    AND status = 'accepted'
  )
);