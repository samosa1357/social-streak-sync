import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { BottomNavigation } from '@/components/BottomNavigation';
import Home from './Home';
import History from './History';
import Friends from './Friends';
import Profile from './Profile';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode] = useLocalStorage('zentrack-dark-mode', false);
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'history':
        return <History />;
      case 'friends':
        return <Friends />;
      case 'profile':
        return <Profile />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderActiveTab()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
