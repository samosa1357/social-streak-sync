import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRequireUsername } from '@/hooks/useRequireUsername';

interface RequireUsernameProps {
  children: React.ReactNode;
}

export function RequireUsername({ children }: RequireUsernameProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasUsername, checking } = useRequireUsername();

  // Show loading while checking auth and username
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to setup username if no username
  if (!hasUsername) {
    return <Navigate to="/setup-username" replace />;
  }

  return <>{children}</>;
}
