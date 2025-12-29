import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { User, Check, X, Loader2 } from 'lucide-react';
import { z } from 'zod';

const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed');

export default function SetupUsername() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if user already has a username set
  useEffect(() => {
    const checkExistingUsername = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // If display_name exists and doesn't look like email prefix, redirect
      if (data?.display_name && !data.display_name.includes('@') && data.display_name !== user.email?.split('@')[0]) {
        navigate('/', { replace: true });
      }
    };
    
    if (!loading && user) {
      checkExistingUsername();
    }
  }, [user, loading, navigate]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Debounced username availability check
  const checkAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setIsAvailable(null);
      return;
    }

    try {
      usernameSchema.parse(value);
    } catch {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    setIsAvailable(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('display_name', value)
        .neq('user_id', user?.id || '')
        .maybeSingle();

      if (error) throw error;
      setIsAvailable(data === null);
    } catch (err) {
      console.error('Error checking username:', err);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability(username);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, checkAvailability]);

  const validateUsername = (value: string) => {
    try {
      usernameSchema.parse(value);
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUsername(username) || !isAvailable || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: username.trim() })
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Username taken',
            description: 'This username was just taken. Please try another one.',
            variant: 'destructive',
          });
          setIsAvailable(false);
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Username set!',
          description: `Welcome to ZenTrack, @${username}!`,
        });
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set username. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(value);
    setIsAvailable(null);
    if (value) validateUsername(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">ZenTrack</h1>
          <p className="text-muted-foreground mt-2">Almost there!</p>
        </div>

        <Card className="gradient-card border-0 shadow-strong">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Choose Your Username</CardTitle>
            <CardDescription>
              Pick a unique username for your profile. This cannot be changed later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={handleUsernameChange}
                    className={`pl-10 pr-10 transition-smooth ${
                      error ? 'border-destructive' : 
                      isAvailable === true ? 'border-green-500' : 
                      isAvailable === false ? 'border-destructive' : ''
                    }`}
                    disabled={isLoading}
                    maxLength={20}
                  />
                  <div className="absolute right-3 top-3">
                    {isChecking && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!isChecking && isAvailable === true && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {!isChecking && isAvailable === false && (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                {!error && isAvailable === true && (
                  <p className="text-sm text-green-500">Username is available!</p>
                )}
                {!error && isAvailable === false && (
                  <p className="text-sm text-destructive">Username is already taken</p>
                )}
                <p className="text-xs text-muted-foreground">
                  3-20 characters. Letters, numbers, and underscores only.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary transition-bounce"
                disabled={isLoading || !username || !isAvailable || !!error}
              >
                {isLoading ? 'Setting up...' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
