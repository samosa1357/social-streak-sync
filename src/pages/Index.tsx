import React, { useState, useEffect } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import Home from './Home';
import History from './History';
import Profile from './Profile';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode] = useLocalStorage('zentrack-dark-mode', false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'history':
        return <History />;
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
