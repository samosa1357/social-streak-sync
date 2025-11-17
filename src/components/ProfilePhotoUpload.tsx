import React, { useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUpdate: (url: string) => void;
}

export function ProfilePhotoUpload({ currentPhotoUrl, onPhotoUpdate }: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const avatarUrl = useAvatarUrl(currentPhotoUrl);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to upload a photo.',
          variant: 'destructive',
        });
        return;
      }

      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please upload an image file.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Image must be less than 5MB.',
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);

      // Delete old photo if exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new photo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Store file path instead of public URL since bucket is now private
      const avatarPath = filePath;

      // Update profile with file path
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarPath })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onPhotoUpdate(avatarPath);

      toast({
        title: 'Success',
        description: 'Profile photo updated successfully!',
      });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl || undefined} alt="Profile" />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <label
          htmlFor="photo-upload"
          className="absolute bottom-0 right-0 p-2 gradient-primary rounded-full cursor-pointer shadow-medium hover:shadow-strong transition-smooth"
        >
          <Camera className="h-4 w-4 text-primary-foreground" />
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Click camera icon to upload<br />
        (Max 5MB, JPG/PNG)
      </p>
      
      {uploading && (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      )}
    </div>
  );
}
