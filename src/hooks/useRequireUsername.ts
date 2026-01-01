import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useRequireUsername() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUsername = async () => {
      if (authLoading) return;
      
      if (!user) {
        setChecking(false);
        setHasUsername(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking username:', error);
          setHasUsername(false);
        } else if (!data) {
          // No profile exists yet - needs setup
          setHasUsername(false);
        } else {
          // Check if display_name is set and is a valid username (not email-like)
          const displayName = data.display_name?.trim() || '';
          const emailPrefix = user.email?.split('@')[0] || '';
          
          // A valid username exists if:
          // 1. display_name is not empty
          // 2. It's not the same as email prefix (auto-generated placeholder)
          // 3. It doesn't contain '@' (not an email)
          const hasValidUsername = displayName !== '' && 
            displayName !== emailPrefix && 
            !displayName.includes('@');
          
          setHasUsername(hasValidUsername);
          
          // Redirect to setup if no username and not already on setup page
          if (!hasValidUsername && location.pathname !== '/setup-username') {
            navigate('/setup-username', { replace: true });
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setHasUsername(false);
      } finally {
        setChecking(false);
      }
    };

    checkUsername();
  }, [user, authLoading, navigate, location.pathname]);

  return { hasUsername, checking, isReady: !authLoading && !checking };
}
