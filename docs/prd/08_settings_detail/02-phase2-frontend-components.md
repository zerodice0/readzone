# Phase 2: Frontend Components 구현

## 📋 개요

React + TypeScript 기반으로 설정 페이지의 사용자 인터페이스를 구현합니다. 탭 기반 네비게이션과 섹션별 컴포넌트로 구성됩니다.

## 📁 컴포넌트 구조

```
packages/frontend/src/
├── pages/
│   └── SettingsPage.tsx                  # 메인 설정 페이지
├── components/settings/
│   ├── SettingsNavigation.tsx            # 사이드바 네비게이션
│   ├── sections/
│   │   ├── ProfileSettings.tsx           # 프로필 설정 섹션
│   │   ├── PrivacySettings.tsx           # 개인정보 보호 섹션
│   │   ├── NotificationSettings.tsx      # 알림 설정 섹션
│   │   ├── PreferenceSettings.tsx        # 서비스 설정 섹션
│   │   └── AccountManagement.tsx         # 계정 관리 섹션
│   ├── forms/
│   │   ├── ProfileImageUpload.tsx        # 프로필 사진 업로드
│   │   ├── PasswordChangeForm.tsx        # 비밀번호 변경 폼
│   │   ├── EmailChangeForm.tsx           # 이메일 변경 폼
│   │   ├── ThemeSelector.tsx             # 테마 선택기
│   │   └── DataExportSection.tsx         # 데이터 내보내기
│   ├── modals/
│   │   ├── DeleteAccountModal.tsx        # 계정 삭제 모달
│   │   ├── ImageCropperModal.tsx         # 이미지 크롭 모달
│   │   └── ConfirmationModal.tsx         # 확인 모달
│   └── common/
│       ├── SettingsCard.tsx              # 설정 카드 래퍼
│       ├── SettingsToggle.tsx            # 토글 스위치
│       ├── SettingsSelect.tsx            # 드롭다운 선택
│       └── LoadingSpinner.tsx            # 로딩 스피너
├── hooks/
│   ├── useSettings.ts                    # 설정 관리 훅
│   ├── useImageUpload.ts                 # 이미지 업로드 훅
│   └── useConfirmation.ts                # 확인 다이얼로그 훅
└── types/
    └── settings.ts                       # 설정 관련 타입 정의
```

## 🖥️ 메인 페이지 컴포넌트

### SettingsPage.tsx
```typescript
import React, { useEffect, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { SettingsNavigation } from '@/components/settings/SettingsNavigation';
import { ProfileSettings } from '@/components/settings/sections/ProfileSettings';
import { PrivacySettings } from '@/components/settings/sections/PrivacySettings';
import { NotificationSettings } from '@/components/settings/sections/NotificationSettings';
import { PreferenceSettings } from '@/components/settings/sections/PreferenceSettings';
import { AccountManagement } from '@/components/settings/sections/AccountManagement';
import { LoadingSpinner } from '@/components/settings/common/LoadingSpinner';

type SettingsTab = 'profile' | 'privacy' | 'notifications' | 'preferences' | 'account';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { settings, isLoading, error, hasUnsavedChanges } = useSettings();

  // 페이지 이탈 시 미저장 변경사항 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'preferences':
        return <PreferenceSettings />;
      case 'account':
        return <AccountManagement />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            설정
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            계정 설정과 개인화 옵션을 관리하세요
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 네비게이션 */}
          <div className="w-full lg:w-64">
            <SettingsNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            {renderActiveSection()}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### SettingsNavigation.tsx
```typescript
import React from 'react';
import { clsx } from 'clsx';
import {
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  CogIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

interface SettingsNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasUnsavedChanges: boolean;
}

const navigationItems = [
  {
    id: 'profile',
    label: '프로필 설정',
    icon: UserIcon,
    description: '닉네임, 프로필 사진, 자기소개',
  },
  {
    id: 'privacy',
    label: '개인정보 보호',
    icon: ShieldCheckIcon,
    description: '공개 범위, 검색 노출',
  },
  {
    id: 'notifications',
    label: '알림 설정',
    icon: BellIcon,
    description: '알림 유형, 방해금지',
  },
  {
    id: 'preferences',
    label: '서비스 설정',
    icon: CogIcon,
    description: '테마, 언어, 피드',
  },
  {
    id: 'account',
    label: '계정 관리',
    icon: KeyIcon,
    description: '비밀번호, 연결, 삭제',
  },
];

export function SettingsNavigation({
  activeTab,
  onTabChange,
  hasUnsavedChanges,
}: SettingsNavigationProps) {
  const handleTabChange = (tabId: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        '저장되지 않은 변경사항이 있습니다. 정말 다른 탭으로 이동하시겠습니까?'
      );
      if (!confirmed) return;
    }
    onTabChange(tabId);
  };

  return (
    <nav className="space-y-1" role="tablist" aria-label="설정 메뉴">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${item.id}-panel`}
            id={`${item.id}-tab`}
            onClick={() => handleTabChange(item.id)}
            className={clsx(
              'w-full flex items-start p-3 text-left rounded-lg transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              isActive
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {item.description}
              </div>
            </div>
          </button>
        );
      })}

      {hasUnsavedChanges && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              저장되지 않은 변경사항
            </span>
          </div>
        </div>
      )}
    </nav>
  );
}
```

## 🔧 설정 섹션 컴포넌트

### ProfileSettings.tsx
```typescript
import React from 'react';
import { useSettings } from '@/hooks/useSettings';
import { SettingsCard } from '@/components/settings/common/SettingsCard';
import { ProfileImageUpload } from '@/components/settings/forms/ProfileImageUpload';
import { EmailChangeForm } from '@/components/settings/forms/EmailChangeForm';

export function ProfileSettings() {
  const { settings, updateProfile, isLoading } = useSettings();

  const handleUsernameChange = async (username: string) => {
    await updateProfile({ username });
  };

  const handleBioChange = async (bio: string) => {
    await updateProfile({ bio });
  };

  return (
    <div
      role="tabpanel"
      id="profile-panel"
      aria-labelledby="profile-tab"
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        프로필 설정
      </h2>

      {/* 프로필 사진 */}
      <SettingsCard
        title="프로필 사진"
        description="프로필에 표시될 사진을 업로드하세요"
      >
        <ProfileImageUpload
          currentImage={settings?.user.profileImage}
          onUpdate={(imageUrl) => updateProfile({ profileImage: imageUrl })}
        />
      </SettingsCard>

      {/* 닉네임 */}
      <SettingsCard
        title="닉네임"
        description="다른 사용자에게 표시될 이름입니다"
      >
        <input
          type="text"
          value={settings?.user.username || ''}
          onChange={(e) => handleUsernameChange(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="닉네임을 입력하세요"
          minLength={2}
          maxLength={50}
        />
      </SettingsCard>

      {/* 자기소개 */}
      <SettingsCard
        title="자기소개"
        description="프로필에 표시될 간단한 소개글입니다"
      >
        <textarea
          value={settings?.user.bio || ''}
          onChange={(e) => handleBioChange(e.target.value)}
          disabled={isLoading}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="자기소개를 입력하세요"
          maxLength={500}
        />
        <div className="text-right text-sm text-gray-500 mt-1">
          {settings?.user.bio?.length || 0}/500
        </div>
      </SettingsCard>

      {/* 이메일 변경 */}
      <SettingsCard
        title="이메일 주소"
        description="계정과 연결된 이메일 주소입니다"
      >
        <EmailChangeForm currentEmail={settings?.user.email || ''} />
      </SettingsCard>
    </div>
  );
}
```

### NotificationSettings.tsx
```typescript
import React from 'react';
import { useSettings } from '@/hooks/useSettings';
import { SettingsCard } from '@/components/settings/common/SettingsCard';
import { SettingsToggle } from '@/components/settings/common/SettingsToggle';

export function NotificationSettings() {
  const { settings, updateNotifications, isLoading } = useSettings();

  const notifications = settings?.notifications;

  const handleToggleChange = async (path: string, value: boolean) => {
    const pathParts = path.split('.');
    const update: any = {};

    if (pathParts.length === 2) {
      update[pathParts[0]] = {
        ...notifications?.[pathParts[0] as keyof typeof notifications],
        [pathParts[1]]: value,
      };
    }

    await updateNotifications(update);
  };

  return (
    <div
      role="tabpanel"
      id="notifications-panel"
      aria-labelledby="notifications-tab"
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        알림 설정
      </h2>

      {/* 좋아요 알림 */}
      <SettingsCard
        title="좋아요 알림"
        description="다른 사용자가 내 독후감을 좋아할 때 알림을 받습니다"
      >
        <div className="space-y-4">
          <SettingsToggle
            label="좋아요 알림 받기"
            checked={notifications?.likes.enabled ?? true}
            onChange={(checked) => handleToggleChange('likes.enabled', checked)}
            disabled={isLoading}
          />

          {notifications?.likes.enabled && (
            <div className="pl-6 space-y-3 border-l-2 border-gray-200">
              <SettingsToggle
                label="푸시 알림"
                checked={notifications.likes.push}
                onChange={(checked) => handleToggleChange('likes.push', checked)}
                disabled={isLoading}
              />
              <SettingsToggle
                label="이메일 알림"
                checked={notifications.likes.email}
                onChange={(checked) => handleToggleChange('likes.email', checked)}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </SettingsCard>

      {/* 댓글 알림 */}
      <SettingsCard
        title="댓글 알림"
        description="내 독후감이나 댓글에 새로운 댓글이 달릴 때 알림을 받습니다"
      >
        <div className="space-y-4">
          <SettingsToggle
            label="댓글 알림 받기"
            checked={notifications?.comments.enabled ?? true}
            onChange={(checked) => handleToggleChange('comments.enabled', checked)}
            disabled={isLoading}
          />

          {notifications?.comments.enabled && (
            <div className="pl-6 space-y-3 border-l-2 border-gray-200">
              <SettingsToggle
                label="푸시 알림"
                checked={notifications.comments.push}
                onChange={(checked) => handleToggleChange('comments.push', checked)}
                disabled={isLoading}
              />
              <SettingsToggle
                label="이메일 알림"
                checked={notifications.comments.email}
                onChange={(checked) => handleToggleChange('comments.email', checked)}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </SettingsCard>

      {/* 팔로우 알림 */}
      <SettingsCard
        title="팔로우 알림"
        description="다른 사용자가 나를 팔로우할 때 알림을 받습니다"
      >
        <div className="space-y-4">
          <SettingsToggle
            label="팔로우 알림 받기"
            checked={notifications?.follows.enabled ?? true}
            onChange={(checked) => handleToggleChange('follows.enabled', checked)}
            disabled={isLoading}
          />

          {notifications?.follows.enabled && (
            <div className="pl-6 space-y-3 border-l-2 border-gray-200">
              <SettingsToggle
                label="푸시 알림"
                checked={notifications.follows.push}
                onChange={(checked) => handleToggleChange('follows.push', checked)}
                disabled={isLoading}
              />
              <SettingsToggle
                label="이메일 알림"
                checked={notifications.follows.email}
                onChange={(checked) => handleToggleChange('follows.email', checked)}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </SettingsCard>

      {/* 방해금지 시간 */}
      <SettingsCard
        title="방해금지 시간"
        description="지정한 시간 동안 알림을 받지 않습니다"
      >
        <div className="space-y-4">
          <SettingsToggle
            label="방해금지 모드"
            checked={notifications?.quietHours.enabled ?? false}
            onChange={(checked) => handleToggleChange('quietHours.enabled', checked)}
            disabled={isLoading}
          />

          {notifications?.quietHours.enabled && (
            <div className="pl-6 flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작 시간
                </label>
                <input
                  type="time"
                  value={notifications.quietHours.startTime}
                  onChange={(e) => handleToggleChange('quietHours.startTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종료 시간
                </label>
                <input
                  type="time"
                  value={notifications.quietHours.endTime}
                  onChange={(e) => handleToggleChange('quietHours.endTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* 빠른 설정 */}
      <SettingsCard
        title="빠른 설정"
        description="모든 알림을 한 번에 설정합니다"
      >
        <div className="flex gap-4">
          <button
            onClick={() => updateNotifications({
              likes: { enabled: true, push: true, email: false },
              comments: { enabled: true, push: true, email: false },
              follows: { enabled: true, push: true, email: false },
            })}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            모든 알림 켜기
          </button>
          <button
            onClick={() => updateNotifications({
              likes: { enabled: false, push: false, email: false },
              comments: { enabled: false, push: false, email: false },
              follows: { enabled: false, push: false, email: false },
            })}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            모든 알림 끄기
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
```

### PreferenceSettings.tsx
```typescript
import React from 'react';
import { useSettings } from '@/hooks/useSettings';
import { SettingsCard } from '@/components/settings/common/SettingsCard';
import { SettingsSelect } from '@/components/settings/common/SettingsSelect';
import { SettingsToggle } from '@/components/settings/common/SettingsToggle';
import { ThemeSelector } from '@/components/settings/forms/ThemeSelector';

export function PreferenceSettings() {
  const { settings, updatePreferences, isLoading } = useSettings();

  const preferences = settings?.preferences;

  const handlePreferenceChange = async (key: string, value: any) => {
    await updatePreferences({ [key]: value });
  };

  const handleNestedPreferenceChange = async (parent: string, key: string, value: any) => {
    const update = {
      [parent]: {
        ...preferences?.[parent as keyof typeof preferences],
        [key]: value,
      },
    };
    await updatePreferences(update);
  };

  return (
    <div
      role="tabpanel"
      id="preferences-panel"
      aria-labelledby="preferences-tab"
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        서비스 설정
      </h2>

      {/* 테마 설정 */}
      <SettingsCard
        title="테마"
        description="화면의 밝기를 선택하세요"
      >
        <ThemeSelector
          value={preferences?.theme || 'AUTO'}
          onChange={(theme) => handlePreferenceChange('theme', theme)}
          disabled={isLoading}
        />
      </SettingsCard>

      {/* 언어 설정 */}
      <SettingsCard
        title="언어"
        description="서비스 언어를 선택하세요"
      >
        <SettingsSelect
          value={preferences?.language || 'KO'}
          onChange={(language) => handlePreferenceChange('language', language)}
          disabled={isLoading}
          options={[
            { value: 'KO', label: '한국어' },
            { value: 'EN', label: 'English' },
          ]}
        />
      </SettingsCard>

      {/* 기본 피드 탭 */}
      <SettingsCard
        title="기본 피드 탭"
        description="피드 페이지에서 처음 표시할 탭을 선택하세요"
      >
        <SettingsSelect
          value={preferences?.defaultFeedTab || 'RECOMMENDED'}
          onChange={(tab) => handlePreferenceChange('defaultFeedTab', tab)}
          disabled={isLoading}
          options={[
            { value: 'RECOMMENDED', label: '추천' },
            { value: 'LATEST', label: '최신' },
            { value: 'FOLLOWING', label: '팔로잉' },
          ]}
        />
      </SettingsCard>

      {/* 콘텐츠 필터링 */}
      <SettingsCard
        title="콘텐츠 필터링"
        description="표시하지 않을 콘텐츠 유형을 선택하세요"
      >
        <div className="space-y-3">
          <SettingsToggle
            label="성인 콘텐츠 숨기기"
            checked={preferences?.contentFilter?.hideNSFW ?? true}
            onChange={(checked) => handleNestedPreferenceChange('contentFilter', 'hideNSFW', checked)}
            disabled={isLoading}
          />
          <SettingsToggle
            label="스포일러 콘텐츠 숨기기"
            checked={preferences?.contentFilter?.hideSpoilers ?? false}
            onChange={(checked) => handleNestedPreferenceChange('contentFilter', 'hideSpoilers', checked)}
            disabled={isLoading}
          />
          <SettingsToggle
            label="부정적 리뷰 숨기기"
            checked={preferences?.contentFilter?.hideNegativeReviews ?? false}
            onChange={(checked) => handleNestedPreferenceChange('contentFilter', 'hideNegativeReviews', checked)}
            disabled={isLoading}
          />
        </div>
      </SettingsCard>

      {/* 데이터 사용량 */}
      <SettingsCard
        title="데이터 사용량"
        description="모바일 데이터 사용량을 줄이기 위한 설정입니다"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 품질
            </label>
            <SettingsSelect
              value={preferences?.dataUsage?.imageQuality || 'MEDIUM'}
              onChange={(quality) => handleNestedPreferenceChange('dataUsage', 'imageQuality', quality)}
              disabled={isLoading}
              options={[
                { value: 'LOW', label: '낮음 (빠른 로딩)' },
                { value: 'MEDIUM', label: '보통' },
                { value: 'HIGH', label: '높음 (고품질)' },
              ]}
            />
          </div>

          <SettingsToggle
            label="동영상 자동 재생"
            checked={preferences?.dataUsage?.autoplayVideos ?? false}
            onChange={(checked) => handleNestedPreferenceChange('dataUsage', 'autoplayVideos', checked)}
            disabled={isLoading}
          />

          <SettingsToggle
            label="이미지 미리 로드"
            checked={preferences?.dataUsage?.preloadImages ?? true}
            onChange={(checked) => handleNestedPreferenceChange('dataUsage', 'preloadImages', checked)}
            disabled={isLoading}
          />
        </div>
      </SettingsCard>
    </div>
  );
}
```

## 🔧 특수 기능 컴포넌트

### ProfileImageUpload.tsx
```typescript
import React, { useState, useRef } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageCropperModal } from '@/components/settings/modals/ImageCropperModal';
import { UserIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface ProfileImageUploadProps {
  currentImage?: string;
  onUpdate: (imageUrl: string) => Promise<void>;
}

export function ProfileImageUpload({
  currentImage,
  onUpdate,
}: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string>();
  const [showCropper, setShowCropper] = useState(false);
  const { uploadImage, isUploading, error } = useImageUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 유효성 검사
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하로 업로드해주세요');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    try {
      const imageUrl = await uploadImage(croppedImage);
      await onUpdate(imageUrl);
      setShowCropper(false);
      setPreviewImage(undefined);

      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  };

  return (
    <div className="flex items-center space-x-6">
      {/* 현재 프로필 이미지 */}
      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
        {currentImage ? (
          <img
            src={currentImage}
            alt="프로필"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <UserIcon className="w-12 h-12" />
          </div>
        )}
      </div>

      {/* 업로드 컨트롤 */}
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PhotoIcon className="w-5 h-5 mr-2" />
            {currentImage ? '사진 변경' : '사진 업로드'}
          </button>

          {currentImage && (
            <button
              onClick={() => onUpdate('')}
              disabled={isUploading}
              className="px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              사진 삭제
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500 mt-2">
          JPG, PNG, GIF 파일만 가능합니다. 최대 5MB
        </p>

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </div>

      {/* 이미지 크롭 모달 */}
      {showCropper && previewImage && (
        <ImageCropperModal
          image={previewImage}
          isOpen={showCropper}
          onClose={() => {
            setShowCropper(false);
            setPreviewImage(undefined);
          }}
          onCropComplete={handleCropComplete}
          isLoading={isUploading}
        />
      )}
    </div>
  );
}
```

### ThemeSelector.tsx
```typescript
import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface ThemeSelectorProps {
  value: 'LIGHT' | 'DARK' | 'AUTO';
  onChange: (theme: 'LIGHT' | 'DARK' | 'AUTO') => void;
  disabled?: boolean;
}

const themes = [
  {
    value: 'LIGHT' as const,
    label: '라이트',
    icon: SunIcon,
    description: '밝은 테마',
  },
  {
    value: 'DARK' as const,
    label: '다크',
    icon: MoonIcon,
    description: '어두운 테마',
  },
  {
    value: 'AUTO' as const,
    label: '자동',
    icon: ComputerDesktopIcon,
    description: '시스템 설정 따르기',
  },
];

export function ThemeSelector({ value, onChange, disabled }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {themes.map((theme) => {
        const Icon = theme.icon;
        const isSelected = value === theme.value;

        return (
          <button
            key={theme.value}
            onClick={() => onChange(theme.value)}
            disabled={disabled}
            className={clsx(
              'p-4 rounded-lg border-2 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50'
                : 'border-gray-300 hover:border-gray-400'
            )}
          >
            <Icon className="w-8 h-8 mx-auto mb-2" />
            <div className="text-sm font-medium">{theme.label}</div>
            <div className="text-xs text-gray-500 mt-1">{theme.description}</div>
          </button>
        );
      })}
    </div>
  );
}
```

## 🎯 접근성 고려사항

### ARIA 라벨링
```typescript
// 탭 네비게이션
<nav role="tablist" aria-label="설정 메뉴">
  <button
    role="tab"
    aria-selected={isActive}
    aria-controls="profile-panel"
    id="profile-tab"
  >
    프로필 설정
  </button>
</nav>

<div
  role="tabpanel"
  id="profile-panel"
  aria-labelledby="profile-tab"
>
  {/* 탭 콘텐츠 */}
</div>
```

### 키보드 네비게이션
```typescript
// 키보드 이벤트 처리
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      // 다음 탭
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      // 이전 탭
      break;
    case 'Home':
      // 첫 번째 탭
      break;
    case 'End':
      // 마지막 탭
      break;
  }
};
```

### 스크린 리더 지원
```typescript
// 상태 변경 안내
const announceChange = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
};
```

## 🚀 다음 단계
→ [Phase 3: State Management](./03-phase3-state-management.md)로 이동