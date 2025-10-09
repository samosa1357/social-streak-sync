import { Home, Users, Calendar, User, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';

export function BottomNavigation() {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/history', icon: Calendar, label: 'History' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border shadow-strong">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label, badge }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all relative ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
