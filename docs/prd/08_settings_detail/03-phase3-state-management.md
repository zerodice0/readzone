# Phase 3: State Management 구현

## 📋 개요

Zustand를 사용하여 설정 페이지의 상태 관리를 구현합니다. API 호출, 캐싱, 낙관적 업데이트, 에러 처리를 포함한 완전한 상태 관리 솔루션을 제공합니다.

## 🏪 Store 구조

### SettingsStore 주 상태
```typescript
// types/settings.ts
export interface UserSettings {
  user: {
    id: string;
    username: string;
    email: string;
    bio?: string;
    profileImage?: string;
    createdAt: string;
  };

  privacy: {
    profileVisibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
    activityVisibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
    searchable: boolean;
    showEmail: boolean;
    showFollowers: boolean;
    showFollowing: boolean;
  };

  notifications: {
    likes: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
    comments: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
    follows: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
  };

  preferences: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    language: 'KO' | 'EN';
    defaultFeedTab: 'RECOMMENDED' | 'LATEST' | 'FOLLOWING';
    contentFilter: {
      hideNSFW: boolean;
      hideSpoilers: boolean;
      hideNegativeReviews: boolean;
    };
    dataUsage: {
      imageQuality: 'LOW' | 'MEDIUM' | 'HIGH';
      autoplayVideos: boolean;
      preloadImages: boolean;
    };
  };

  connectedAccounts: Array<{
    provider: 'GOOGLE' | 'KAKAO' | 'NAVER';
    email: string;
    connectedAt: string;
  }>;
}

export interface SettingsState {
  // 데이터 상태
  settings: UserSettings | null;
  originalSettings: UserSettings | null; // 변경사항 추적용

  // UI 상태
  activeTab: string;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;

  // 에러 상태
  error: string | null;
  fieldErrors: Record<string, string>;

  // 액션
  loadSettings: () => Promise<void>;
  updateProfile: (data: Partial<UserSettings['user']>) => Promise<void>;
  updateEmail: (data: { newEmail: string; password: string }) => Promise<void>;
  updatePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  updatePrivacy: (data: Partial<UserSettings['privacy']>) => Promise<void>;
  updateNotifications: (data: Partial<UserSettings['notifications']>) => Promise<void>;
  updatePreferences: (data: Partial<UserSettings['preferences']>) => Promise<void>;

  // 계정 관리
  connectAccount: (provider: string, authCode: string) => Promise<void>;
  disconnectAccount: (provider: string) => Promise<void>;
  exportData: () => Promise<string>;
  deleteAccount: (data: { password: string; reason?: string; feedback?: string }) => Promise<void>;
  cancelDeletion: (token: string) => Promise<void>;

  // 유틸리티
  setActiveTab: (tab: string) => void;
  clearError: () => void;
  reset: () => void;
}
```

## 🏗️ Zustand Store 구현

### 기본 Store 설정
```typescript
// store/settingsStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { settingsApi } from '@/lib/api/settings';
import type { SettingsState, UserSettings } from '@/types/settings';

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 초기 상태
        settings: null,
        originalSettings: null,
        activeTab: 'profile',
        isLoading: false,
        isSaving: false,
        hasUnsavedChanges: false,
        error: null,
        fieldErrors: {},

        // 설정 로드
        loadSettings: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const settings = await settingsApi.getSettings();
            set((state) => {
              state.settings = settings;
              state.originalSettings = structuredClone(settings);
              state.isLoading = false;
              state.hasUnsavedChanges = false;
            });
          } catch (error: any) {
            set((state) => {
              state.isLoading = false;
              state.error = error.message || '설정을 불러오는데 실패했습니다.';
            });
          }
        },

        // 프로필 업데이트
        updateProfile: async (data) => {
          const { settings } = get();
          if (!settings) return;

          // 낙관적 업데이트
          const optimisticUpdate = { ...settings.user, ...data };
          set((state) => {
            if (state.settings) {
              state.settings.user = optimisticUpdate;
              state.hasUnsavedChanges = true;
              state.isSaving = true;
              state.error = null;
              state.fieldErrors = {};
            }
          });

          try {
            const result = await settingsApi.updateProfile(data);
            if (result.success) {
              set((state) => {
                if (state.settings) {
                  state.settings.user = result.user;
                  state.originalSettings!.user = result.user;
                  state.isSaving = false;
                  state.hasUnsavedChanges = false;
                }
              });
            } else {
              throw new Error(result.errors?.[0]?.message || '프로필 업데이트에 실패했습니다.');
            }
          } catch (error: any) {
            // 롤백
            set((state) => {
              if (state.originalSettings) {
                state.settings!.user = state.originalSettings.user;
                state.isSaving = false;
                state.error = error.message;

                // 필드별 에러 처리
                if (error.errors) {
                  state.fieldErrors = error.errors.reduce((acc: any, err: any) => {
                    acc[err.field] = err.message;
                    return acc;
                  }, {});
                }
              }
            });
          }
        },

        // 이메일 업데이트
        updateEmail: async (data) => {
          set((state) => {
            state.isSaving = true;
            state.error = null;
            state.fieldErrors = {};
          });

          try {
            const result = await settingsApi.updateEmail(data);
            set((state) => {
              state.isSaving = false;
            });

            if (result.success) {
              if (result.requiresVerification) {
                // 인증 필요 알림
                alert('새 이메일 주소로 인증 링크를 보냈습니다. 확인 후 인증을 완료해주세요.');
              } else {
                // 즉시 업데이트
                set((state) => {
                  if (state.settings) {
                    state.settings.user.email = data.newEmail;
                    state.originalSettings!.user.email = data.newEmail;
                  }
                });
              }
            } else {
              throw new Error(result.message);
            }
          } catch (error: any) {
            set((state) => {
              state.isSaving = false;
              state.error = error.message;
            });
          }
        },

        // 비밀번호 업데이트
        updatePassword: async (data) => {
          set((state) => {
            state.isSaving = true;
            state.error = null;
            state.fieldErrors = {};
          });

          try {
            const result = await settingsApi.updatePassword(data);
            set((state) => {
              state.isSaving = false;
            });

            if (result.success) {
              alert('비밀번호가 성공적으로 변경되었습니다.');
              // 폼 리셋은 컴포넌트에서 처리
            } else {
              throw new Error(result.message);
            }
          } catch (error: any) {
            set((state) => {
              state.isSaving = false;
              state.error = error.message;

              if (error.errors) {
                state.fieldErrors = error.errors.reduce((acc: any, err: any) => {
                  acc[err.field] = err.message;
                  return acc;
                }, {});
              }
            });
          }
        },

        // 개인정보 보호 설정 업데이트
        updatePrivacy: async (data) => {
          const { settings } = get();
          if (!settings) return;

          // 낙관적 업데이트
          const optimisticUpdate = { ...settings.privacy, ...data };
          set((state) => {
            if (state.settings) {
              state.settings.privacy = optimisticUpdate;
              state.hasUnsavedChanges = true;
              state.isSaving = true;
              state.error = null;
            }
          });

          try {
            const result = await settingsApi.updatePrivacy(data);
            set((state) => {
              if (state.settings) {
                state.settings.privacy = result.privacy;
                state.originalSettings!.privacy = result.privacy;
                state.isSaving = false;
                state.hasUnsavedChanges = false;
              }
            });
          } catch (error: any) {
            // 롤백
            set((state) => {
              if (state.originalSettings) {
                state.settings!.privacy = state.originalSettings.privacy;
                state.isSaving = false;
                state.error = error.message;
              }
            });
          }
        },

        // 알림 설정 업데이트
        updateNotifications: async (data) => {
          const { settings } = get();
          if (!settings) return;

          // 깊은 병합을 위한 헬퍼 함수
          const deepMerge = (target: any, source: any) => {
            const result = { ...target };
            Object.keys(source).forEach(key => {
              if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key] || {}, source[key]);
              } else {
                result[key] = source[key];
              }
            });
            return result;
          };

          // 낙관적 업데이트
          const optimisticUpdate = deepMerge(settings.notifications, data);
          set((state) => {
            if (state.settings) {
              state.settings.notifications = optimisticUpdate;
              state.hasUnsavedChanges = true;
              state.isSaving = true;
              state.error = null;
            }
          });

          try {
            const result = await settingsApi.updateNotifications(data);
            set((state) => {
              if (state.settings) {
                state.settings.notifications = result.notifications;
                state.originalSettings!.notifications = result.notifications;
                state.isSaving = false;
                state.hasUnsavedChanges = false;
              }
            });
          } catch (error: any) {
            // 롤백
            set((state) => {
              if (state.originalSettings) {
                state.settings!.notifications = state.originalSettings.notifications;
                state.isSaving = false;
                state.error = error.message;
              }
            });
          }
        },

        // 서비스 설정 업데이트
        updatePreferences: async (data) => {
          const { settings } = get();
          if (!settings) return;

          // 깊은 병합
          const deepMerge = (target: any, source: any) => {
            const result = { ...target };
            Object.keys(source).forEach(key => {
              if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key] || {}, source[key]);
              } else {
                result[key] = source[key];
              }
            });
            return result;
          };

          const optimisticUpdate = deepMerge(settings.preferences, data);
          set((state) => {
            if (state.settings) {
              state.settings.preferences = optimisticUpdate;
              state.hasUnsavedChanges = true;
              state.isSaving = true;
              state.error = null;
            }
          });

          try {
            const result = await settingsApi.updatePreferences(data);
            set((state) => {
              if (state.settings) {
                state.settings.preferences = result.preferences;
                state.originalSettings!.preferences = result.preferences;
                state.isSaving = false;
                state.hasUnsavedChanges = false;
              }
            });

            // 테마 변경 시 즉시 적용
            if (data.theme) {
              document.documentElement.setAttribute('data-theme', data.theme);
            }
          } catch (error: any) {
            // 롤백
            set((state) => {
              if (state.originalSettings) {
                state.settings!.preferences = state.originalSettings.preferences;
                state.isSaving = false;
                state.error = error.message;
              }
            });
          }
        },

        // 소셜 계정 연결
        connectAccount: async (provider, authCode) => {
          set((state) => {
            state.isSaving = true;
            state.error = null;
          });

          try {
            const result = await settingsApi.connectAccount({ provider, authCode });
            set((state) => {
              if (state.settings && result.success) {
                state.settings.connectedAccounts.push(result.connectedAccount);
                state.originalSettings!.connectedAccounts.push(result.connectedAccount);
              }
              state.isSaving = false;
            });
          } catch (error: any) {
            set((state) => {
              state.isSaving = false;
              state.error = error.message;
            });
          }
        },

        // 소셜 계정 해제
        disconnectAccount: async (provider) => {
          const { settings } = get();
          if (!settings) return;

          set((state) => {
            state.isSaving = true;
            state.error = null;
          });

          try {
            const result = await settingsApi.disconnectAccount({ provider });
            if (result.success) {
              set((state) => {
                if (state.settings) {
                  state.settings.connectedAccounts = state.settings.connectedAccounts
                    .filter(account => account.provider !== provider);
                  state.originalSettings!.connectedAccounts = state.originalSettings!.connectedAccounts
                    .filter(account => account.provider !== provider);
                }
                state.isSaving = false;
              });

              if (result.warning) {
                alert(result.warning);
              }
            } else {
              throw new Error('계정 연결 해제에 실패했습니다.');
            }
          } catch (error: any) {
            set((state) => {
              state.isSaving = false;
              state.error = error.message;
            });
          }
        },

        // 데이터 내보내기
        exportData: async () => {
          set((state) => {
            state.isSaving = true;
            state.error = null;
          });

          try {
            const result = await settingsApi.exportData();
            set((state) => {
              state.isSaving = false;
            });

            // 자동 다운로드 시작
            const link = document.createElement('a');
            link.href = result.downloadUrl;
            link.download = `readzone-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return result.downloadUrl;
          } catch (error: any) {
            set((state) => {
              state.isSaving = false;
              state.error = error.message;
            });
            throw error;
          }
        },

        // 계정 삭제
        deleteAccount: async (data) => {
          set((state) => {
            state.isSaving = true;
            state.error = null;
          });

          try {
            const result = await settingsApi.deleteAccount(data);
            if (result.success) {
              alert(`계정 삭제가 예약되었습니다. ${result.deletionDate}에 영구 삭제됩니다.`);
              // 로그아웃 처리
              window.location.href = '/login';
            }
          } catch (error: any) {
            set((state) => {
              state.isSaving = false;
              state.error = error.message;
            });
          }
        },

        // 삭제 취소
        cancelDeletion: async (token) => {
          set((state) => {
            state.isSaving = true;
            state.error = null;
          });

          try {
            const result = await settingsApi.cancelDeletion({ cancellationToken: token });
            set((state) => {
              state.isSaving = false;
            });

            if (result.success) {
              alert(result.message);
            }
          } catch (error: any) {
            set((state) => {
              state.isSaving = false;
              state.error = error.message;
            });
          }
        },

        // 유틸리티 함수들
        setActiveTab: (tab) => set((state) => { state.activeTab = tab; }),

        clearError: () => set((state) => {
          state.error = null;
          state.fieldErrors = {};
        }),

        reset: () => set(() => ({
          settings: null,
          originalSettings: null,
          activeTab: 'profile',
          isLoading: false,
          isSaving: false,
          hasUnsavedChanges: false,
          error: null,
          fieldErrors: {},
        })),
      })),
      {
        name: 'settings-store',
        partialize: (state) => ({
          activeTab: state.activeTab,
          settings: state.settings,
        }),
      }
    ),
    { name: 'settings-store' }
  )
);
```

## 🎣 Custom Hooks

### useSettings Hook
```typescript
// hooks/useSettings.ts
import { useSettingsStore } from '@/store/settingsStore';
import { useEffect } from 'react';

export function useSettings() {
  const store = useSettingsStore();

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    if (!store.settings) {
      store.loadSettings();
    }
  }, [store.loadSettings, store.settings]);

  return {
    // 데이터
    settings: store.settings,
    activeTab: store.activeTab,

    // 상태
    isLoading: store.isLoading,
    isSaving: store.isSaving,
    hasUnsavedChanges: store.hasUnsavedChanges,
    error: store.error,
    fieldErrors: store.fieldErrors,

    // 액션
    loadSettings: store.loadSettings,
    updateProfile: store.updateProfile,
    updateEmail: store.updateEmail,
    updatePassword: store.updatePassword,
    updatePrivacy: store.updatePrivacy,
    updateNotifications: store.updateNotifications,
    updatePreferences: store.updatePreferences,

    // 계정 관리
    connectAccount: store.connectAccount,
    disconnectAccount: store.disconnectAccount,
    exportData: store.exportData,
    deleteAccount: store.deleteAccount,
    cancelDeletion: store.cancelDeletion,

    // 유틸리티
    setActiveTab: store.setActiveTab,
    clearError: store.clearError,
    reset: store.reset,
  };
}
```

### useImageUpload Hook
```typescript
// hooks/useImageUpload.ts
import { useState } from 'react';
import { uploadApi } from '@/lib/api/upload';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: Blob): Promise<string> => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'profile_images');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error('이미지 업로드에 실패했습니다.');
      }
    } catch (error: any) {
      setError(error.message || '이미지 업로드 중 오류가 발생했습니다.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading,
    error,
  };
}
```

### useConfirmation Hook
```typescript
// hooks/useConfirmation.ts
import { useState } from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = (options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(options);
      setResolver(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    if (resolver) {
      resolver(true);
      cleanup();
    }
  };

  const handleCancel = () => {
    if (resolver) {
      resolver(false);
      cleanup();
    }
  };

  const cleanup = () => {
    setIsOpen(false);
    setOptions(null);
    setResolver(null);
  };

  return {
    confirm,
    isOpen,
    options,
    handleConfirm,
    handleCancel,
    handleClose: cleanup,
  };
}
```

## 🔄 최적화 및 성능

### 메모이제이션
```typescript
// 자주 계산되는 값들을 메모이제이션
const hasChanges = useMemo(() => {
  if (!settings || !originalSettings) return false;
  return JSON.stringify(settings) !== JSON.stringify(originalSettings);
}, [settings, originalSettings]);

const isDirtyField = useCallback((fieldPath: string) => {
  // 특정 필드의 변경 여부 확인
  const getValue = (obj: any, path: string) => {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  };

  const currentValue = getValue(settings, fieldPath);
  const originalValue = getValue(originalSettings, fieldPath);

  return JSON.stringify(currentValue) !== JSON.stringify(originalValue);
}, [settings, originalSettings]);
```

### 디바운싱
```typescript
// 자주 변경되는 설정에 대한 디바운싱
import { useDebouncedCallback } from 'use-debounce';

const debouncedUpdateNotifications = useDebouncedCallback(
  (data: Partial<UserSettings['notifications']>) => {
    updateNotifications(data);
  },
  500 // 500ms 대기
);
```

### 캐싱 전략
```typescript
// Zustand persist 미들웨어 설정
{
  name: 'settings-store',
  partialize: (state) => ({
    // 필요한 부분만 persist
    activeTab: state.activeTab,
    settings: state.settings,
  }),
  version: 1,
  migrate: (persistedState: any, version: number) => {
    // 스키마 마이그레이션 로직
    if (version < 1) {
      return {
        ...persistedState,
        // 필요한 마이그레이션
      };
    }
    return persistedState;
  },
}
```

## 📊 에러 처리 전략

### 글로벌 에러 핸들러
```typescript
// lib/errorHandler.ts
export const handleApiError = (error: any) => {
  if (error.status === 401) {
    // 인증 만료
    window.location.href = '/login';
    return;
  }

  if (error.status === 429) {
    return '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.';
  }

  if (error.status >= 500) {
    return '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }

  return error.message || '알 수 없는 오류가 발생했습니다.';
};
```

### 재시도 로직
```typescript
// lib/retryWrapper.ts
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // 재시도하지 않을 에러들
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        throw error;
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
};
```

## 🧪 테스트 전략

### Store 테스트
```typescript
// __tests__/settingsStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useSettingsStore } from '@/store/settingsStore';

describe('SettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  it('should load settings', async () => {
    const { result } = renderHook(() => useSettingsStore());

    await act(async () => {
      await result.current.loadSettings();
    });

    expect(result.current.settings).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle optimistic updates', async () => {
    const { result } = renderHook(() => useSettingsStore());

    // 초기 설정 로드
    await act(async () => {
      await result.current.loadSettings();
    });

    const originalUsername = result.current.settings?.user.username;

    // 낙관적 업데이트
    act(() => {
      result.current.updateProfile({ username: 'newUsername' });
    });

    // 즉시 UI에 반영되어야 함
    expect(result.current.settings?.user.username).toBe('newUsername');
    expect(result.current.hasUnsavedChanges).toBe(true);
  });
});
```

## 🚀 다음 단계
→ [Phase 4: UI/UX Improvements](./04-phase4-ui-ux.md)로 이동