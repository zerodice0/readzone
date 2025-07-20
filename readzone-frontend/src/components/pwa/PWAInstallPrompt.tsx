import React, { useState } from 'react';
import { Download, X, Smartphone, Monitor, Zap } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import Button from '../ui/Button';

const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isInstallable || !isVisible) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // 24시간 후 다시 표시하도록 로컬 스토리지에 저장
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Download className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">ReadZone 앱 설치</h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        더 빠르고 편리한 독서 기록을 위해 ReadZone 앱을 설치하세요.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
            <Zap className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-xs text-gray-600">빠른 실행</span>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-1">
            <Smartphone className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-xs text-gray-600">모바일 최적화</span>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-1">
            <Monitor className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-xs text-gray-600">오프라인 지원</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={handleInstall}
          loading={isInstalling}
          className="flex-1"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          설치하기
        </Button>
        <Button
          onClick={handleDismiss}
          variant="outline"
          size="sm"
          className="px-3"
        >
          나중에
        </Button>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt;