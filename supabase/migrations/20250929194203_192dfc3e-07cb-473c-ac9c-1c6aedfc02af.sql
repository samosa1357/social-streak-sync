-- Create habits table for storing user habits
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_progress table for tracking daily habit completion
CREATE TABLE public.daily_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create user_progress table for streaks and level tracking
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 1,
  total_streak_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for habits
CREATE POLICY "Users can view their own habits" 
ON public.habits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits" 
ON public.habits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" 
ON public.habits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" 
ON public.habits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for daily_progress
CREATE POLICY "Users can view their own daily progress" 
ON public.daily_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily progress" 
ON public.daily_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily progress" 
ON public.daily_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_progress
CREATE POLICY "Users can view their own progress" 
ON public.user_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" 
ON public.user_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_progress_updated_at
  BEFORE UPDATE ON public.daily_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize user progress when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_progress (user_id, level, total_streak_days)
  VALUES (NEW.id, 1, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to initialize user progress on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();