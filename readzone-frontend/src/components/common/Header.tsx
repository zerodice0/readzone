import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Button from '../ui/Button';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { BookOpen, User, LogOut, Search } from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">ReadZone</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/search" 
              className="text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-1"
            >
              <Search className="h-4 w-4" />
              <span>도서 검색</span>
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  대시보드
                </Link>
                <Link 
                  to="/library" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  내 서재
                </Link>
                <Link 
                  to="/reading-goals" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  독서 목표
                </Link>
                <NotificationDropdown />
                <Link 
                  to="/profile" 
                  className="text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-1"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.username}</span>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>로그아웃</span>
                </Button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  로그인
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    회원가입
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;