-- Fix Warning Level Security Issues (Remaining)

-- Issue 1: Add RLS-aware function for user_stats access
-- Since user_stats is a view, we can't add RLS directly
-- Instead, create a security definer function that respects privacy
CREATE OR REPLACE FUNCTION public.get_user_stats(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  level integer,
  total_streak_days integer,
  followers_count bigint,
  following_count bigint,
  display_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    up.level,
    up.total_streak_days,
    (SELECT COUNT(*) FROM follows WHERE following_id = p.user_id AND status = 'accepted') as followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = p.user_id AND status = 'accepted') as following_count,
    p.display_name,
    p.avatar_url
  FROM profiles p
  LEFT JOIN user_progress up ON up.user_id = p.user_id
  WHERE 
    -- Filter by target user if specified
    (target_user_id IS NULL OR p.user_id = target_user_id)
    AND (
      -- User can view their own stats
      auth.uid() = p.user_id OR
      -- User can view stats of non-private accounts
      NOT p.is_private OR
      -- User can view stats of followed accounts
      EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() 
        AND following_id = p.user_id 
        AND status = 'accepted'
      )
    );
$$;

-- Issue 2: Update handle_new_user with better documentation and validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- SECURITY DEFINER is required here because this trigger runs during user signup
-- when no session exists yet. It needs elevated privileges to create profile/progress.
-- This function is ONLY callable by the database trigger, not by users directly.
BEGIN
  -- Validate that we're operating on a new auth.users record
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'Invalid user ID';
  END IF;

  -- Create user progress
  INSERT INTO public.user_progress (user_id, level, total_streak_days)
  VALUES (NEW.id, 1, 0);
  
  -- Create user profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  RETURN NEW;
END;
$$;

-- Issue 3: Update create_follow_notification with better documentation and validation
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- SECURITY DEFINER is required because notifications need to be created
-- for other users (the person being followed), which would violate RLS.
-- This function is ONLY callable by the database trigger, not by users directly.
BEGIN
  -- Validate that follower and following IDs exist
  IF NEW.follower_id IS NULL OR NEW.following_id IS NULL THEN
    RAISE EXCEPTION 'Invalid follower or following ID';
  END IF;

  -- Create notification for pending follow request
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.following_id,
      'follow_request',
      'New Follow Request',
      (SELECT COALESCE(display_name, 'Someone') FROM public.profiles WHERE user_id = NEW.follower_id) || ' wants to follow you',
      jsonb_build_object('follower_id', NEW.follower_id, 'follow_id', NEW.id)
    );
  -- Create notification when follow request is accepted
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.follower_id,
      'follow_accepted',
      'Follow Request Accepted',
      (SELECT COALESCE(display_name, 'Someone') FROM public.profiles WHERE user_id = NEW.following_id) || ' accepted your follow request',
      jsonb_build_object('following_id', NEW.following_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;