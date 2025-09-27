# Phase 4: UI/UX Improvements 구현

## 📋 개요

설정 페이지의 사용자 경험을 향상시키기 위한 고급 UI/UX 기능들을 구현합니다. 애니메이션, 접근성, 반응형 디자인, 성능 최적화를 포함합니다.

## 🎨 Design System 확장

### 컬러 시스템
```css
/* globals.css - 설정 페이지 전용 색상 */
:root {
  --settings-primary: #3b82f6;
  --settings-primary-hover: #2563eb;
  --settings-success: #10b981;
  --settings-warning: #f59e0b;
  --settings-danger: #ef4444;

  --settings-bg-primary: #ffffff;
  --settings-bg-secondary: #f9fafb;
  --settings-bg-elevated: #ffffff;
  --settings-border: #e5e7eb;

  --settings-text-primary: #111827;
  --settings-text-secondary: #6b7280;
  --settings-text-muted: #9ca3af;
}

[data-theme="dark"] {
  --settings-bg-primary: #111827;
  --settings-bg-secondary: #1f2937;
  --settings-bg-elevated: #1f2937;
  --settings-border: #374151;

  --settings-text-primary: #f9fafb;
  --settings-text-secondary: #d1d5db;
  --settings-text-muted: #9ca3af;
}
```

### 애니메이션 시스템
```typescript
// lib/animations.ts
export const animations = {
  // 페이드 인/아웃
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  // 슬라이드 업
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: { duration: 0.3 },
  },

  // 스케일
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.2 },
  },

  // 저장 중 펄스
  pulse: {
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
};
```

## 🔄 인터랙션 개선

### 자동 저장 시스템
```typescript
// hooks/useAutoSave.ts
import { useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface AutoSaveOptions {
  delay?: number;
  enabled?: boolean;
  onSave: () => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useAutoSave({
  delay = 2000,
  enabled = true,
  onSave,
  onSuccess,
  onError,
}: AutoSaveOptions) {
  const lastSavedRef = useRef<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const debouncedSave = useDebouncedCallback(async () => {
    if (!enabled) return;

    setSaveStatus('saving');
    try {
      await onSave();
      setSaveStatus('saved');
      onSuccess?.();

      // 2초 후 상태 리셋
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      onError?.(error);
    }
  }, delay);

  const triggerSave = (data: any) => {
    const currentData = JSON.stringify(data);
    if (currentData !== lastSavedRef.current) {
      lastSavedRef.current = currentData;
      debouncedSave();
    }
  };

  return {
    triggerSave,
    saveStatus,
    isAutoSaving: saveStatus === 'saving',
  };
}
```

### 실시간 검증
```typescript
// hooks/useValidation.ts
import { useState, useEffect } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export function useValidation(initialValues: Record<string, any>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (fieldName: string, value: any, rules: ValidationRule) => {
    const errors: string[] = [];

    if (rules.required && (!value || value.toString().trim() === '')) {
      errors.push('필수 입력 항목입니다.');
    }

    if (rules.minLength && value && value.toString().length < rules.minLength) {
      errors.push(`최소 ${rules.minLength}자 이상 입력해주세요.`);
    }

    if (rules.maxLength && value && value.toString().length > rules.maxLength) {
      errors.push(`최대 ${rules.maxLength}자까지 입력 가능합니다.`);
    }

    if (rules.pattern && value && !rules.pattern.test(value.toString())) {
      errors.push('올바른 형식을 입력해주세요.');
    }

    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return errors[0] || null;
  };

  const setFieldValue = (fieldName: string, value: any, rules?: ValidationRule) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));

    if (touched[fieldName] && rules) {
      const error = validate(fieldName, value, rules);
      setErrors(prev => ({ ...prev, [fieldName]: error || '' }));
    }
  };

  const setFieldTouched = (fieldName: string, rules?: ValidationRule) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    if (rules) {
      const error = validate(fieldName, values[fieldName], rules);
      setErrors(prev => ({ ...prev, [fieldName]: error || '' }));
    }
  };

  const isValid = Object.values(errors).every(error => !error);

  return {
    values,
    errors,
    touched,
    isValid,
    setFieldValue,
    setFieldTouched,
  };
}
```

### 진행률 표시기
```typescript
// components/settings/common/ProgressIndicator.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface ProgressIndicatorProps {
  steps: Array<{
    id: string;
    label: string;
    completed: boolean;
  }>;
  currentStep: string;
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.completed;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${isCompleted
                    ? 'bg-green-100 text-green-800 border-2 border-green-500'
                    : isActive
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                      : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
                  }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? '✓' : index + 1}
              </motion.div>
              <span className={`text-xs mt-2 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div className={`flex-1 h-0.5 mx-4 ${
                isCompleted ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
```

## 📱 반응형 디자인

### 브레이크포인트 시스템
```typescript
// hooks/useBreakpoint.ts
import { useState, useEffect } from 'react';

const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
};

export function useBreakpoint(breakpoint: keyof typeof breakpoints) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(breakpoints[breakpoint]);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [breakpoint]);

  return matches;
}
```

### 모바일 최적화
```typescript
// components/settings/SettingsNavigation.tsx (모바일 버전)
export function MobileSettingsNavigation({
  activeTab,
  onTabChange,
  hasUnsavedChanges,
}: SettingsNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* 모바일 네비게이션 헤더 */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between p-4 bg-white border-b"
      >
        <span className="font-medium">
          {navigationItems.find(item => item.id === activeTab)?.label}
        </span>
        <ChevronDownIcon className="w-5 h-5" />
      </button>

      {/* 모바일 메뉴 오버레이 */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 p-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center p-3 text-left rounded-lg
                      ${activeTab === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
```

## ♿ 접근성 향상

### 키보드 네비게이션 강화
```typescript
// hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation(
  items: string[],
  activeItem: string,
  onChange: (item: string) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.target || !(e.target as HTMLElement).closest('[role="tablist"]')) {
        return;
      }

      const currentIndex = items.indexOf(activeItem);
      let nextIndex: number;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % items.length;
          onChange(items[nextIndex]);
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = (currentIndex - 1 + items.length) % items.length;
          onChange(items[nextIndex]);
          break;

        case 'Home':
          e.preventDefault();
          onChange(items[0]);
          break;

        case 'End':
          e.preventDefault();
          onChange(items[items.length - 1]);
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          // 현재 탭 활성화 (이미 활성화된 경우 아무것도 하지 않음)
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, activeItem, onChange]);
}
```

### 스크린 리더 지원
```typescript
// components/settings/common/ScreenReaderAnnouncements.tsx
import { useEffect } from 'react';

interface AnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export function ScreenReaderAnnouncement({
  message,
  priority = 'polite'
}: AnnouncementProps) {
  useEffect(() => {
    if (!message) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    const timer = setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    };
  }, [message, priority]);

  return null;
}

// 사용 예시
export function SettingsPage() {
  const [announcement, setAnnouncement] = useState('');

  const handleSettingsSaved = () => {
    setAnnouncement('설정이 저장되었습니다');
  };

  return (
    <div>
      {/* 페이지 콘텐츠 */}
      <ScreenReaderAnnouncement message={announcement} />
    </div>
  );
}
```

### 포커스 관리
```typescript
// hooks/useFocusManagement.ts
export function useFocusManagement() {
  const focusableElementsSelector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(focusableElementsSelector);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  };

  const restoreFocus = (element: HTMLElement | null) => {
    if (element && element.focus) {
      element.focus();
    }
  };

  return {
    trapFocus,
    restoreFocus,
  };
}
```

## ⚡ 성능 최적화

### 가상화된 긴 목록
```typescript
// components/settings/common/VirtualizedList.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  renderItem: ({ index, style }: { index: number; style: React.CSSProperties }) => React.ReactNode;
  height: number;
}

export function VirtualizedList({
  items,
  itemHeight,
  renderItem,
  height
}: VirtualizedListProps) {
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
    >
      {renderItem}
    </List>
  );
}
```

### 이미지 최적화
```typescript
// components/settings/common/OptimizedImage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Cloudinary 최적화 URL 생성
  const getOptimizedUrl = (url: string, w: number, h: number) => {
    if (url.includes('cloudinary.com')) {
      return url.replace('/upload/', `/upload/w_${w},h_${h},c_fill,f_auto,q_auto/`);
    }
    return url;
  };

  const optimizedSrc = getOptimizedUrl(src, width, height);

  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">이미지 로드 실패</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <motion.img
        src={optimizedSrc}
        alt={alt}
        className="w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}
```

### 코드 분할
```typescript
// 페이지별 lazy loading
import { lazy, Suspense } from 'react';

const ProfileSettings = lazy(() => import('@/components/settings/sections/ProfileSettings'));
const PrivacySettings = lazy(() => import('@/components/settings/sections/PrivacySettings'));
const NotificationSettings = lazy(() => import('@/components/settings/sections/NotificationSettings'));

export function SettingsPage() {
  const renderSection = () => {
    const LoadingFallback = (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );

    switch (activeTab) {
      case 'profile':
        return (
          <Suspense fallback={LoadingFallback}>
            <ProfileSettings />
          </Suspense>
        );
      case 'privacy':
        return (
          <Suspense fallback={LoadingFallback}>
            <PrivacySettings />
          </Suspense>
        );
      // ... 다른 섹션들
    }
  };
}
```

## 📊 사용자 행동 추적

### 분석 이벤트
```typescript
// lib/analytics.ts
interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const trackSettingsEvent = (event: AnalyticsEvent) => {
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }

  // 자체 분석 시스템
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...event,
      timestamp: Date.now(),
      url: window.location.pathname,
    }),
  });
};

// 사용 예시
export function ProfileSettings() {
  const handleProfileUpdate = async (data: any) => {
    trackSettingsEvent({
      action: 'profile_updated',
      category: 'settings',
      label: 'profile_info',
    });

    await updateProfile(data);
  };
}
```

## 🎯 사용성 테스트

### A/B 테스트 프레임워크
```typescript
// hooks/useABTest.ts
export function useABTest(testId: string, variants: string[]) {
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    // 사용자 ID 기반 일관된 variant 할당
    const userId = getUserId();
    const hash = hashCode(userId + testId);
    const variantIndex = Math.abs(hash) % variants.length;

    setVariant(variants[variantIndex]);

    // 테스트 참여 로깅
    trackSettingsEvent({
      action: 'ab_test_assigned',
      category: 'experiment',
      label: `${testId}_${variants[variantIndex]}`,
    });
  }, [testId, variants]);

  return variant;
}
```

## 🚀 다음 단계
→ [Implementation Checklist](./99-implementation-checklist.md)로 이동