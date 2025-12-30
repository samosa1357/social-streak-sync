-- 1) Helper functions to avoid RLS recursion between profiles <-> follows
CREATE OR REPLACE FUNCTION public.is_following(viewer uuid, target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.follows
    WHERE follower_id = viewer
      AND following_id = target
      AND status = 'accepted'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_profile_public(target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = target
      AND NOT p.is_private
  );
$$;

-- 2) Break the recursion by rewriting the SELECT policies
DROP POLICY IF EXISTS "Users can view profiles based on privacy" ON public.profiles;
CREATE POLICY "Users can view profiles based on privacy"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR NOT is_private
  OR public.is_following(auth.uid(), user_id)
);

DROP POLICY IF EXISTS "Users can view relevant follows" ON public.follows;
CREATE POLICY "Users can view relevant follows"
ON public.follows
FOR SELECT
USING (
  auth.uid() = follower_id
  OR auth.uid() = following_id
  OR (status = 'accepted' AND public.is_profile_public(following_id))
);

-- 3) Fix linter: views are "security definer" by default; make user_stats run as invoker
ALTER VIEW public.user_stats SET (security_invoker = true);

-- 4) Fix linter: ensure search_path is set for mutable function
CREATE OR REPLACE FUNCTION public.prevent_invalid_follow_transitions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Prevent changing rejected back to pending (would require new follow request)
  IF OLD.status = 'rejected' AND NEW.status = 'pending' THEN
    RAISE EXCEPTION 'Cannot re-request after rejection. Create a new follow request.';
  END IF;

  -- Prevent changing accepted back to pending
  IF OLD.status = 'accepted' AND NEW.status = 'pending' THEN
    RAISE EXCEPTION 'Cannot change accepted follow to pending.';
  END IF;

  RETURN NEW;
END;
$$;