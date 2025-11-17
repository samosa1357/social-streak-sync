import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get signed URLs for avatar images from private storage
 * @param avatarPath - The storage path to the avatar image
 * @returns The signed URL or null if not available
 */
export function useAvatarUrl(avatarPath: string | null | undefined): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarPath) {
      setSignedUrl(null);
      return;
    }

    // Check if it's already a full URL (legacy public URLs)
    if (avatarPath.startsWith('http')) {
      setSignedUrl(avatarPath);
      return;
    }

    // Get signed URL for private bucket
    const getSignedUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('avatars')
          .createSignedUrl(avatarPath, 3600); // 1 hour expiry

        if (error) {
          console.error('Error creating signed URL:', error);
          setSignedUrl(null);
          return;
        }

        setSignedUrl(data.signedUrl);
      } catch (error) {
        console.error('Error getting signed URL:', error);
        setSignedUrl(null);
      }
    };

    getSignedUrl();
  }, [avatarPath]);

  return signedUrl;
}
