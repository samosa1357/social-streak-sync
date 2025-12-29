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
          .single();

        if (error) {
          console.error('Error checking username:', error);
          setHasUsername(false);
        } else {
          const hasValidUsername = !!(data?.display_name && data.display_name.trim() !== '');
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
