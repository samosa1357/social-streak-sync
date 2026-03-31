
-- 1. Fix follows INSERT policy: enforce correct status based on target privacy
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = follower_id
    AND status = CASE
      WHEN is_profile_public(following_id) THEN 'accepted'
      ELSE 'pending'
    END
  );

-- 2. Secure user_stats view with security_invoker so it respects caller's RLS
DROP VIEW IF EXISTS public.user_stats;
CREATE VIEW public.user_stats WITH (security_invoker = true) AS
SELECT
  p.user_id,
  COALESCE(up.level, 1) AS level,
  COALESCE(up.total_streak_days, 0) AS total_streak_days,
  (SELECT COUNT(*) FROM follows f WHERE f.following_id = p.user_id AND f.status = 'accepted') AS followers_count,
  (SELECT COUNT(*) FROM follows f WHERE f.follower_id = p.user_id AND f.status = 'accepted') AS following_count,
  p.display_name,
  p.avatar_url
FROM profiles p
LEFT JOIN user_progress up ON up.user_id = p.user_id;

-- 3. Restrict search_users_for_discovery to authenticated users only
REVOKE EXECUTE ON FUNCTION public.search_users_for_discovery(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_users_for_discovery(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_users_for_discovery(text, uuid) TO authenticated;

-- 4. Recreate search function with auth guard
CREATE OR REPLACE FUNCTION public.search_users_for_discovery(search_query text, current_user_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, is_private boolean, level integer, total_streak_days integer, followers_count bigint, following_count bigint)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Validate caller is authenticated and matches the provided user ID
  IF auth.uid() IS NULL OR auth.uid() != current_user_id THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    CASE WHEN p.is_private THEN NULL ELSE p.avatar_url END as avatar_url,
    p.is_private,
    CASE WHEN p.is_private THEN NULL::integer ELSE COALESCE(up.level, 1) END as level,
    CASE WHEN p.is_private THEN NULL::integer ELSE COALESCE(up.total_streak_days, 0) END as total_streak_days,
    CASE WHEN p.is_private THEN NULL::bigint ELSE (SELECT COUNT(*) FROM follows f WHERE f.following_id = p.user_id AND f.status = 'accepted') END as followers_count,
    CASE WHEN p.is_private THEN NULL::bigint ELSE (SELECT COUNT(*) FROM follows f WHERE f.follower_id = p.user_id AND f.status = 'accepted') END as following_count
  FROM profiles p
  LEFT JOIN user_progress up ON up.user_id = p.user_id
  WHERE p.display_name ILIKE '%' || 
    replace(replace(replace(search_query, '\', '\\'), '%', '\%'), '_', '\_') 
    || '%'
    AND p.user_id != current_user_id
  LIMIT 10;
END;
$$;

-- Re-apply permission restriction after function replacement
REVOKE EXECUTE ON FUNCTION public.search_users_for_discovery(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_users_for_discovery(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_users_for_discovery(text, uuid) TO authenticated;

-- 5. Also restrict other security definer functions to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_user_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_stats(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_following(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_following(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_following(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_profile_public(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_profile_public(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_profile_public(uuid) TO authenticated;
