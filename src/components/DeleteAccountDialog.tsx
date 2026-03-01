import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const [step, setStep] = useState<'confirm' | 'password'>('confirm');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const reset = () => {
    setStep('confirm');
    setPassword('');
    setIsDeleting(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleDelete = async () => {
    if (!password) return;
    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await supabase.functions.invoke('delete-account', {
        body: { password },
      });

      if (res.error || res.data?.error) {
        const msg = res.data?.error || res.error?.message || 'Failed to delete account';
        if (msg === 'Incorrect password') {
          toast({ title: 'Incorrect password', description: 'Please try again.', variant: 'destructive' });
          setIsDeleting(false);
          return;
        }
        throw new Error(msg);
      }

      await supabase.auth.signOut();
      toast({ title: 'Account deleted', description: 'Your account has been permanently removed.' });
      navigate('/auth');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Something went wrong.', variant: 'destructive' });
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'confirm' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Account</DialogTitle>
              <DialogDescription>
                This action is <strong>permanent and irreversible</strong>. All your habits, progress, streaks, followers, and following data will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => setStep('password')}>
                I understand, continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-destructive">Confirm with Password</DialogTitle>
              <DialogDescription>
                Enter your password to permanently delete your account.
              </DialogDescription>
            </DialogHeader>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isDeleting}
              onKeyDown={(e) => e.key === 'Enter' && password && handleDelete()}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep('confirm')} disabled={isDeleting}>
                Back
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || !password}>
                {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : 'Delete My Account'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
