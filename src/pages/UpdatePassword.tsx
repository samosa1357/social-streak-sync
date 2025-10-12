import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your password has been updated successfully.',
      });
      
      navigate('/profile');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 gradient-primary rounded-full">
                <Lock className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Update Password</h1>
            <p className="text-muted-foreground">Create a new password for your account</p>
          </div>
        </div>

        {/* Password Update Form */}
        <Card className="p-6 gradient-card border-0 shadow-medium">
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least 6 characters long
              </p>
            </div>
            
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-2"
              />
            </div>
            
            <Button
              onClick={handlePasswordUpdate}
              disabled={updatingPassword}
              className="w-full transition-smooth"
              size="lg"
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </Card>

        {/* Security Tips */}
        <Card className="p-4 gradient-card border-0 shadow-soft">
          <h3 className="font-semibold mb-3 text-sm">Security Tips</h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>• Use a strong, unique password</li>
            <li>• Avoid using personal information</li>
            <li>• Mix letters, numbers, and symbols</li>
            <li>• Don't share your password with anyone</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
