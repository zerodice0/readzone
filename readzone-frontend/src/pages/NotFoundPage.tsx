import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-blue-600">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>홈으로 돌아가기</span>
              </Button>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>이전 페이지로</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;