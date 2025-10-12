-- Add is_private field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- Update follows table to handle status better
-- The status field already exists and handles pending/accepted states