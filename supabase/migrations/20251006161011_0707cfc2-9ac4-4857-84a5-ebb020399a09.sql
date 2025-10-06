-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create follows table for follower/following relationships
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Users can view all follows
CREATE POLICY "Users can view all follows" 
ON public.follows 
FOR SELECT 
USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others" 
ON public.follows 
FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow others
CREATE POLICY "Users can unfollow others" 
ON public.follows 
FOR DELETE 
USING (auth.uid() = follower_id);

-- Update the handle_new_user function to also create a profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user progress
  INSERT INTO public.user_progress (user_id, level, total_streak_days)
  VALUES (NEW.id, 1, 0);
  
  -- Create user profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  RETURN NEW;
END;
$$;

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for user stats (followers, following, level)
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  p.user_id,
  p.display_name,
  p.avatar_url,
  up.level,
  up.total_streak_days,
  COALESCE(followers.count, 0) as followers_count,
  COALESCE(following.count, 0) as following_count
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.user_id = up.user_id
LEFT JOIN (
  SELECT following_id, COUNT(*) as count 
  FROM public.follows 
  GROUP BY following_id
) followers ON p.user_id = followers.following_id
LEFT JOIN (
  SELECT follower_id, COUNT(*) as count 
  FROM public.follows 
  GROUP BY follower_id
) following ON p.user_id = following.follower_id;