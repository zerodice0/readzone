import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import Button from '../ui/Button';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { BookOpen, User, LogOut, Search, BarChart3, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900">ReadZone</span>
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
                <Link 
                  to="/statistics" 
                  className="text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-1"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>통계</span>
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
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              aria-label="메뉴 토글"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <Link 
                to="/search" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                onClick={closeMobileMenu}
              >
                <Search className="h-4 w-4" />
                <span>도서 검색</span>
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="block px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    대시보드
                  </Link>
                  <Link 
                    to="/library" 
                    className="block px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    내 서재
                  </Link>
                  <Link 
                    to="/reading-goals" 
                    className="block px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    독서 목표
                  </Link>
                  <Link 
                    to="/statistics" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>통계</span>
                  </Link>
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <User className="h-4 w-4" />
                    <span>{user?.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>로그아웃</span>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login"
                    className="block px-3 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    로그인
                  </Link>
                  <Link 
                    to="/register"
                    className="block px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;