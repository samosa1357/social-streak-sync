import { useEffect } from 'react';
import Home from './Home';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { RequireUsername } from '@/components/RequireUsername';

const Index = () => {
  const [darkMode] = useLocalStorage('zentrack-dark-mode', false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <RequireUsername>
      <Home />
    </RequireUsername>
  );
};

export default Index;
