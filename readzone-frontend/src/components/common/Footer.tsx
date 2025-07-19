import { Link } from 'react-router-dom';
import { BookOpen, Github, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">ReadZone</span>
            </div>
            <p className="text-gray-600 max-w-md">
              독서 기록을 작성하고 커뮤니티와 공유하는 모던한 독서 플랫폼입니다. 
              일상적이고 캐주얼한 독서 문화를 만들어가요.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              서비스
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/search" className="text-gray-600 hover:text-blue-600 transition-colors">
                  도서 검색
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                  대시보드
                </Link>
              </li>
              <li>
                <Link to="/library" className="text-gray-600 hover:text-blue-600 transition-colors">
                  내 서재
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              지원
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  도움말
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  문의하기
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 text-sm">
              © 2024 ReadZone. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;