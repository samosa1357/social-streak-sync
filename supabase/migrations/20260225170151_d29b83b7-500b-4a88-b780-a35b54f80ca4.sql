
-- Add frequency_type and weekly_target to habits table
ALTER TABLE public.habits 
ADD COLUMN frequency_type text NOT NULL DEFAULT 'daily',
ADD COLUMN weekly_target integer NOT NULL DEFAULT 7;

-- Add a check via trigger to validate frequency_type values
CREATE OR REPLACE FUNCTION public.validate_habit_frequency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.frequency_type NOT IN ('daily', 'weekly') THEN
    RAISE EXCEPTION 'frequency_type must be daily or weekly';
  END IF;
  IF NEW.frequency_type = 'weekly' AND (NEW.weekly_target < 1 OR NEW.weekly_target > 7) THEN
    RAISE EXCEPTION 'weekly_target must be between 1 and 7';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_habit_frequency_trigger
BEFORE INSERT OR UPDATE ON public.habits
FOR EACH ROW
EXECUTE FUNCTION public.validate_habit_frequency();
