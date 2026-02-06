-- Fix 1: Require authentication for viewing profiles (prevent unauthenticated scraping)
DROP POLICY IF EXISTS "Users can view profiles based on privacy" ON public.profiles;
CREATE POLICY "Users can view profiles based on privacy" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR 
    NOT is_private OR 
    is_following(auth.uid(), user_id)
  )
);

-- Fix 2: Sanitize search input to prevent SQL injection via ILIKE wildcards
CREATE OR REPLACE FUNCTION public.search_users_for_discovery(search_query text, current_user_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, is_private boolean, level integer, total_streak_days integer, followers_count bigint, following_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.is_private,
    COALESCE(up.level, 1) as level,
    COALESCE(up.total_streak_days, 0) as total_streak_days,
    (SELECT COUNT(*) FROM follows f WHERE f.following_id = p.user_id AND f.status = 'accepted') as followers_count,
    (SELECT COUNT(*) FROM follows f WHERE f.follower_id = p.user_id AND f.status = 'accepted') as following_count
  FROM profiles p
  LEFT JOIN user_progress up ON up.user_id = p.user_id
  WHERE p.display_name ILIKE '%' || 
    replace(replace(replace(search_query, '\', '\\'), '%', '\%'), '_', '\_') 
    || '%'
    AND p.user_id != current_user_id
  LIMIT 10;
$function$;