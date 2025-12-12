import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { User, FileText, Bookmark, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { logError } from '../../utils/error';

const navItems = [
  { to: '/profile', label: '프로필', icon: User },
  { to: '/my-reviews', label: '내 독후감', icon: FileText },
  { to: '/bookmarks', label: '북마크', icon: Bookmark },
];

interface UserSidebarProps {
  onNavigate?: () => void;
}

export function UserSidebar({ onNavigate }: UserSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const clerk = useClerk();

  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    '사용자';

  const handleLogout = async () => {
    try {
      await clerk.signOut();
      void navigate('/');
    } catch (error) {
      logError(error, 'Logout failed');
      void navigate('/');
    }
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 사용자 정보 */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full border-2 border-stone-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-stone-900 truncate">{displayName}</p>
            <p className="text-sm text-stone-500 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 p-4 space-y-1" aria-label="사용자 메뉴">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 로그아웃 */}
      <div className="p-4 border-t border-stone-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-stone-600 hover:text-stone-900 hover:bg-stone-50"
          onClick={() => {
            handleLogout().catch(() => {});
          }}
        >
          <LogOut className="w-5 h-5 mr-3" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}
