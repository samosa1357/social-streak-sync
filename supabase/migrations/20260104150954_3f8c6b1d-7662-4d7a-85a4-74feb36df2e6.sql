-- Allow users to remove their followers (delete follows where they are the following_id)
DROP POLICY IF EXISTS "Users can unfollow others " ON public.follows;

CREATE POLICY "Users can delete follow relationships"
ON public.follows
FOR DELETE
USING (auth.uid() = follower_id OR auth.uid() = following_id);