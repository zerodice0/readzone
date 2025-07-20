import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bell, 
  BellOff,
  Smartphone,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import Button from '../ui/Button';

const PWAStatus: React.FC = () => {
  const {
    isOnline,
    isInstalled,
    swUpdateAvailable,
    updateServiceWorker,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  } = usePWA();

  const [notificationState, setNotificationState] = useState<'idle' | 'subscribing' | 'unsubscribing'>('idle');
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(swUpdateAvailable);

  const handleNotificationToggle = async () => {
    const hasPermission = Notification.permission === 'granted';
    
    if (hasPermission) {
      setNotificationState('unsubscribing');
      const success = await unsubscribeFromNotifications();
      if (success) {
        console.log('Successfully unsubscribed from notifications');
      }
      setNotificationState('idle');
    } else {
      setNotificationState('subscribing');
      const success = await subscribeToNotifications();
      if (success) {
        console.log('Successfully subscribed to notifications');
      }
      setNotificationState('idle');
    }
  };

  const handleUpdate = () => {
    updateServiceWorker();
    setShowUpdatePrompt(false);
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  return (
    <div className="space-y-3">
      {/* 네트워크 상태 */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
        isOnline 
          ? 'bg-green-50 text-green-700' 
          : 'bg-red-50 text-red-700'
      }`}>
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? '온라인' : '오프라인'}
        </span>
        {!isOnline && (
          <span className="text-xs text-red-600">
            캐시된 콘텐츠를 이용하세요
          </span>
        )}
      </div>

      {/* PWA 설치 상태 */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
        isInstalled 
          ? 'bg-blue-50 text-blue-700' 
          : 'bg-gray-50 text-gray-700'
      }`}>
        <Smartphone className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isInstalled ? 'PWA로 실행 중' : '브라우저에서 실행 중'}
        </span>
        {isInstalled && (
          <CheckCircle className="w-4 h-4 text-blue-600" />
        )}
      </div>

      {/* 알림 설정 */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          {Notification.permission === 'granted' ? (
            <Bell className="w-4 h-4 text-blue-600" />
          ) : (
            <BellOff className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-700">
            푸시 알림
          </span>
        </div>
        <Button
          onClick={handleNotificationToggle}
          variant={Notification.permission === 'granted' ? 'outline' : 'primary'}
          size="sm"
          loading={notificationState !== 'idle'}
          className="text-xs"
        >
          {Notification.permission === 'granted' ? '비활성화' : '활성화'}
        </Button>
      </div>

      {/* 업데이트 알림 */}
      {showUpdatePrompt && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  새 버전 사용 가능
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  최신 기능과 개선사항을 이용하려면 업데이트하세요.
                </p>
              </div>
            </div>
            <button
              onClick={dismissUpdate}
              className="text-orange-400 hover:text-orange-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex space-x-2 mt-3">
            <Button
              onClick={handleUpdate}
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              업데이트
            </Button>
            <Button
              onClick={dismissUpdate}
              variant="outline"
              size="sm"
            >
              나중에
            </Button>
          </div>
        </div>
      )}

      {/* PWA 기능 안내 */}
      {isInstalled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            PWA 기능 활성화됨
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 오프라인에서도 캐시된 콘텐츠 이용 가능</li>
            <li>• 홈 화면에서 앱처럼 실행</li>
            <li>• 빠른 로딩 속도</li>
            <li>• 백그라운드 동기화 지원</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PWAStatus;