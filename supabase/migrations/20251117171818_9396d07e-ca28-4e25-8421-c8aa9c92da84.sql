-- Fix Critical Security Issues: Follows Table Access Control

-- Issue 1: Fix overly permissive SELECT policy
-- Current policy allows ANY authenticated user to see ALL follows
-- Replace with privacy-aware policy

DROP POLICY IF EXISTS "Users can view all follows" ON follows;

CREATE POLICY "Users can view relevant follows" ON follows 
FOR SELECT
USING (
  -- Users always see their own follow relationships
  auth.uid() = follower_id OR 
  auth.uid() = following_id OR
  -- Others can only see accepted follows for public profiles
  (status = 'accepted' AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = following_id 
    AND NOT is_private
  ))
);

-- Issue 2: Add missing UPDATE policy with proper authorization
-- Currently NO UPDATE policy exists, allowing potential unauthorized updates

CREATE POLICY "Users can update follow requests for them" ON follows
FOR UPDATE
USING (
  -- Only the person being followed can accept/reject
  auth.uid() = following_id AND
  -- Only allow updating pending requests
  status = 'pending'
)
WITH CHECK (
  -- Only allow valid status transitions
  status IN ('accepted', 'rejected') AND
  -- Ensure following_id doesn't change
  following_id = auth.uid()
);

-- Add constraint to prevent invalid status values
ALTER TABLE follows
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE follows
ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Add trigger to prevent invalid state transitions
CREATE OR REPLACE FUNCTION prevent_invalid_follow_transitions()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_follow_state_transition ON follows;

CREATE TRIGGER check_follow_state_transition
  BEFORE UPDATE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION prevent_invalid_follow_transitions();