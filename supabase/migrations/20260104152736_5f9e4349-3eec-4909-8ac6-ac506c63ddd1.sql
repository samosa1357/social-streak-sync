-- Enable realtime for daily_progress table for live leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_progress;