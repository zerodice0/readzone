import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { handleApiError, settingsApi } from '@/lib/api/settings'
import type { SettingsState } from '@/types/settings'
import { useAuthStore } from '@/store/authStore'

// API 에러 타입 정의
interface ApiError {
  field: string
  message: string
}

// 깊은 병합을 위한 헬퍼 함수
type DeepMergeable = Record<string, unknown>

const deepMerge = <T extends DeepMergeable>(target: T, source: Partial<T>): T => {
  const result = { ...target }

  Object.keys(source).forEach(key => {
    const sourceValue = source[key as keyof T]
    const targetValue = target[key as keyof T]

    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      result[key as keyof T] = deepMerge(targetValue as DeepMergeable || {}, sourceValue as Partial<DeepMergeable>) as T[keyof T]
    } else {
      result[key as keyof T] = sourceValue as T[keyof T]
    }
  })

  return result
}

// API 호출 중복 방지를 위한 참조
let loadingPromise: Promise<void> | null = null

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
        isAuthError: false,

        // 설정 로드
        loadSettings: async () => {
          const { isLoading, requireAuthentication } = get()
          const { isAuthenticated, isAuthReady } = useAuthStore.getState()

          if (!isAuthReady) {
            return Promise.resolve()
          }

          // 이미 로딩 중이거나 설정이 이미 있으면 기존 Promise 반환
          if (isLoading || loadingPromise) {
            return loadingPromise ?? Promise.resolve()
          }

          if (!isAuthenticated) {
            requireAuthentication()

            return Promise.resolve()
          }

          set((state) => {
            state.isLoading = true
            state.error = null
            state.isAuthError = false
          })

          loadingPromise = (async () => {
            try {
              const settings = await settingsApi.getSettings()

              set((state) => {
                state.settings = settings
                state.originalSettings = structuredClone(settings)
                state.isLoading = false
                state.hasUnsavedChanges = false
              })
            } catch (error: unknown) {
              const errorObj = error as { response?: { status?: number } }

              // 401 에러인 경우 인증 에러 플래그 설정
              if (errorObj.response?.status === 401) {
                requireAuthentication()
              } else {
                set((state) => {
                  state.isLoading = false
                  state.error = handleApiError(error)
                  state.isAuthError = false
                })
              }
            } finally {
              loadingPromise = null
            }
          })()

          return loadingPromise
        },

        // 프로필 업데이트
        updateProfile: async (data) => {
          const { settings } = get()

          if (!settings) {return}

          // 낙관적 업데이트
          const optimisticUpdate = { ...settings.user, ...data }

          set((state) => {
            if (state.settings) {
              state.settings.user = optimisticUpdate
              state.hasUnsavedChanges = true
              state.isSaving = true
              state.error = null
              state.fieldErrors = {}
            }
          })

          try {
            const result = await settingsApi.updateProfile(data)

            if (result.success) {
              set((state) => {
                if (state.settings) {
                  state.settings.user = { ...state.settings.user, ...result.user }
                  if (state.originalSettings) {
                    state.originalSettings.user = { ...state.originalSettings.user, ...result.user }
                  }
                  state.isSaving = false
                  state.hasUnsavedChanges = false
                }
              })
            } else {
              throw new Error('프로필 업데이트에 실패했습니다.')
            }
          } catch (error: unknown) {
            // 롤백
            set((state) => {
              if (state.originalSettings && state.settings) {
                state.settings.user = state.originalSettings.user
                state.isSaving = false
                state.error = handleApiError(error)

                // 필드별 에러 처리
                const errorObj = error as { response?: { data?: { errors?: ApiError[] } } }

                if (errorObj.response?.data?.errors && Array.isArray(errorObj.response.data.errors)) {
                  state.fieldErrors = errorObj.response.data.errors.reduce((acc: Record<string, string>, err: ApiError) => {
                    acc[err.field] = err.message

                    return acc
                  }, {})
                }
              }
            })
          }
        },

        // 이메일 업데이트
        updateEmail: async (data) => {
          set((state) => {
            state.isSaving = true
            state.error = null
            state.fieldErrors = {}
          })

          try {
            const result = await settingsApi.updateEmail(data)

            set((state) => {
              state.isSaving = false
            })

            if (result.success) {
              if (result.requiresVerification) {
                // 인증 필요 알림
                // 인증 링크 전송 - UI에서 알림 처리
                // TODO: toast 또는 알림 시스템으로 교체
              } else {
                // 즉시 업데이트
                set((state) => {
                  if (state.settings) {
                    state.settings.user.email = data.newEmail
                    if (state.originalSettings) {
                      state.originalSettings.user.email = data.newEmail
                    }
                  }
                })
              }
            } else {
              throw new Error(result.message)
            }
          } catch (error: unknown) {
            set((state) => {
              state.isSaving = false
              state.error = handleApiError(error)
            })
          }
        },

        // 비밀번호 업데이트
        updatePassword: async (data) => {
          set((state) => {
            state.isSaving = true
            state.error = null
            state.fieldErrors = {}
          })

          try {
            const result = await settingsApi.updatePassword(data)

            set((state) => {
              state.isSaving = false
            })

            if (result.success) {
              // 비밀번호 변경 성공 - UI에서 알림 처리
              // TODO: toast 또는 알림 시스템으로 교체
              // 폼 리셋은 컴포넌트에서 처리
            } else {
              throw new Error(result.message)
            }
          } catch (error: unknown) {
            set((state) => {
              state.isSaving = false
              state.error = handleApiError(error)

              const errorObj = error as { response?: { data?: { errors?: ApiError[] } } }

              if (errorObj.response?.data?.errors) {
                state.fieldErrors = errorObj.response.data.errors.reduce((acc: Record<string, string>, err: ApiError) => {
                  acc[err.field] = err.message

                  return acc
                }, {})
              }
            })
          }
        },

        // 개인정보 보호 설정 업데이트
        updatePrivacy: async (data) => {
          const { settings } = get()

          if (!settings) {return}

          // 낙관적 업데이트
          const optimisticUpdate = { ...settings.privacy, ...data }

          set((state) => {
            if (state.settings) {
              state.settings.privacy = optimisticUpdate
              state.hasUnsavedChanges = true
              state.isSaving = true
              state.error = null
            }
          })

          try {
            const result = await settingsApi.updatePrivacy(data)

            set((state) => {
              if (state.settings) {
                state.settings.privacy = result.privacy
                if (state.originalSettings) {
                  state.originalSettings.privacy = result.privacy
                }
                state.isSaving = false
                state.hasUnsavedChanges = false
              }
            })
          } catch (error: unknown) {
            // 롤백
            set((state) => {
              if (state.originalSettings) {
                if (state.originalSettings && state.settings) {
                  state.settings.privacy = state.originalSettings.privacy
                }
                state.isSaving = false
                state.error = handleApiError(error)
              }
            })
          }
        },

        // 알림 설정 업데이트
        updateNotifications: async (data) => {
          const { settings } = get()

          if (!settings) {return}

          // 낙관적 업데이트
          const optimisticUpdate = deepMerge(settings.notifications, data)

          set((state) => {
            if (state.settings) {
              state.settings.notifications = optimisticUpdate
              state.hasUnsavedChanges = true
              state.isSaving = true
              state.error = null
            }
          })

          try {
            const result = await settingsApi.updateNotifications(data)

            set((state) => {
              if (state.settings) {
                state.settings.notifications = result.notifications
                if (state.originalSettings) {
                  state.originalSettings.notifications = result.notifications
                }
                state.isSaving = false
                state.hasUnsavedChanges = false
              }
            })
          } catch (error: unknown) {
            // 롤백
            set((state) => {
              if (state.originalSettings) {
                if (state.originalSettings && state.settings) {
                  state.settings.notifications = state.originalSettings.notifications
                }
                state.isSaving = false
                state.error = handleApiError(error)
              }
            })
          }
        },

        // 서비스 설정 업데이트
        updatePreferences: async (data) => {
          const { settings } = get()

          if (!settings) {return}

          const optimisticUpdate = deepMerge(settings.preferences, data)

          set((state) => {
            if (state.settings) {
              state.settings.preferences = optimisticUpdate
              state.hasUnsavedChanges = true
              state.isSaving = true
              state.error = null
            }
          })

          try {
            const result = await settingsApi.updatePreferences(data)

            set((state) => {
              if (state.settings) {
                state.settings.preferences = result.preferences
                if (state.originalSettings) {
                  state.originalSettings.preferences = result.preferences
                }
                state.isSaving = false
                state.hasUnsavedChanges = false
              }
            })

          } catch (error: unknown) {
            // 롤백
            set((state) => {
              if (state.originalSettings) {
                if (state.originalSettings && state.settings) {
                  state.settings.preferences = state.originalSettings.preferences
                }
                state.isSaving = false
                state.error = handleApiError(error)
              }
            })
          }
        },

        // 계정 삭제 (즉시 삭제)
        deleteAccount: async (data) => {
          set((state) => {
            state.isSaving = true
            state.error = null
          })

          try {
            const result = await settingsApi.deleteAccount(data)

            if (result.success) {
              // 계정 삭제 완료 - 즉시 로그아웃
              window.location.href = '/login'
            }
          } catch (error: unknown) {
            set((state) => {
              state.isSaving = false
              state.error = handleApiError(error)
            })
          }
        },

        // 유틸리티 함수들
        setActiveTab: (tab) => set((state) => { state.activeTab = tab }),

        markAsChanged: () => set((state) => {
          state.hasUnsavedChanges = true
        }),

        clearError: () => set((state) => {
          state.error = null
          state.fieldErrors = {}
          state.isAuthError = false
        }),

        requireAuthentication: () => {
          loadingPromise = null

          set((state) => {
            state.settings = null
            state.originalSettings = null
            state.isLoading = false
            state.isSaving = false
            state.hasUnsavedChanges = false
            state.error = '인증이 만료되었습니다. 다시 로그인해주세요.'
            state.fieldErrors = {}
            state.isAuthError = true
          })
        },

        reset: () => {
          loadingPromise = null

          set(() => ({
            settings: null,
            originalSettings: null,
            activeTab: 'profile',
            isLoading: false,
            isSaving: false,
            hasUnsavedChanges: false,
            error: null,
            fieldErrors: {},
            isAuthError: false,
          }))
        },
      })),
      {
        name: 'settings-store',
        partialize: (state) => ({
          activeTab: state.activeTab,
        }),
        version: 2,
        migrate: (persistedState: unknown, version: number) => {
          // 스키마 마이그레이션 로직
          if (version < 2) {
            const state = persistedState as Record<string, unknown>

            return {
              ...state,
              settings: null,
            }
          }

          return persistedState
        },
      }
    ),
    { name: 'settings-store' }
  )
)
