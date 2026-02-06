-- Fix 1: Update search function to respect privacy for private accounts
CREATE OR REPLACE FUNCTION public.search_users_for_discovery(search_query text, current_user_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, is_private boolean, level integer, total_streak_days integer, followers_count bigint, following_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.user_id,
    p.display_name,
    -- Hide detailed info for private accounts
    CASE WHEN p.is_private THEN NULL ELSE p.avatar_url END as avatar_url,
    p.is_private,
    CASE WHEN p.is_private THEN NULL ELSE COALESCE(up.level, 1) END as level,
    CASE WHEN p.is_private THEN NULL ELSE COALESCE(up.total_streak_days, 0) END as total_streak_days,
    CASE WHEN p.is_private THEN NULL ELSE (SELECT COUNT(*) FROM follows f WHERE f.following_id = p.user_id AND f.status = 'accepted') END as followers_count,
    CASE WHEN p.is_private THEN NULL ELSE (SELECT COUNT(*) FROM follows f WHERE f.follower_id = p.user_id AND f.status = 'accepted') END as following_count
  FROM profiles p
  LEFT JOIN user_progress up ON up.user_id = p.user_id
  WHERE p.display_name ILIKE '%' || 
    replace(replace(replace(search_query, '\', '\\'), '%', '\%'), '_', '\_') 
    || '%'
    AND p.user_id != current_user_id
  LIMIT 10;
$function$;

-- Fix 2: Create missing trigger for follow notifications
DROP TRIGGER IF EXISTS notify_on_follow_event ON public.follows;
CREATE TRIGGER notify_on_follow_event
  AFTER INSERT OR UPDATE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.create_follow_notification();