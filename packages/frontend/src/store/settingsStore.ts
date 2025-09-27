import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { handleApiError, settingsApi } from '@/lib/api/settings'
import type { ConnectedAccount, SettingsState, SocialProvider } from '@/types/settings'

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
            state.isLoading = true
            state.error = null
          })

          try {
            const settings = await settingsApi.getSettings()

            set((state) => {
              state.settings = settings
              state.originalSettings = structuredClone(settings)
              state.isLoading = false
              state.hasUnsavedChanges = false
            })
          } catch (error: unknown) {
            set((state) => {
              state.isLoading = false
              state.error = handleApiError(error)
            })
          }
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

            // 테마 변경 시 즉시 적용
            if (data.theme) {
              document.documentElement.setAttribute('data-theme', data.theme.toLowerCase())
            }
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

        // 소셜 계정 연결
        connectAccount: async (provider: SocialProvider, authCode: string) => {
          set((state) => {
            state.isSaving = true
            state.error = null
          })

          try {
            const result = await settingsApi.connectAccount({ provider, authCode })

            set((state) => {
              if (state.settings && result.success) {
                state.settings.connectedAccounts.push(result.connectedAccount)
                if (state.originalSettings) {
                  state.originalSettings.connectedAccounts.push(result.connectedAccount)
                }
              }
              state.isSaving = false
            })
          } catch (error: unknown) {
            set((state) => {
              state.isSaving = false
              state.error = handleApiError(error)
            })
          }
        },

        // 소셜 계정 해제
        disconnectAccount: async (provider: SocialProvider) => {
          const { settings } = get()

          if (!settings) {return}

          set((state) => {
            state.isSaving = true
            state.error = null
          })

          try {
            const result = await settingsApi.disconnectAccount({ provider })

            if (result.success) {
              set((state) => {
                if (state.settings) {
                  state.settings.connectedAccounts = state.settings.connectedAccounts
                    .filter((account: ConnectedAccount) => account.provider !== provider)
                  if (state.originalSettings) {
                    state.originalSettings.connectedAccounts = state.originalSettings.connectedAccounts
                      .filter((account: ConnectedAccount) => account.provider !== provider)
                  }
                }
                state.isSaving = false
              })

              if (result.warning) {
                console.warn(result.warning)
              }
            } else {
              throw new Error('계정 연결 해제에 실패했습니다.')
            }
          } catch (error: unknown) {
            set((state) => {
              state.isSaving = false
              state.error = handleApiError(error)
            })
          }
        },

        // 데이터 내보내기
        exportData: async () => {
          set((state) => {
            state.isSaving = true
            state.error = null
          })

          try {
            const result = await settingsApi.exportData()

            set((state) => {
              state.isSaving = false
            })

            // 자동 다운로드 시작
            const link = document.createElement('a')

            link.href = result.downloadUrl
            link.download = `readzone-data-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            return result.downloadUrl
          } catch (error: unknown) {
            set((state) => {
              state.isSaving = false
              state.error = handleApiError(error)
            })
            throw error
          }
        },

        // 계정 삭제
        deleteAccount: async (data) => {
          set((state) => {
            state.isSaving = true
            state.error = null
          })

          try {
            const result = await settingsApi.deleteAccount(data)

            if (result.success) {
              // 계정 삭제 예약 알림 - UI에서 알림 처리
              // TODO: toast 또는 알림 시스템으로 교체 (`계정 삭제가 예약되었습니다. ${result.deletionDate}에 영구 삭제됩니다.`)
              // 로그아웃 처리
              window.location.href = '/login'
            }
          } catch (error: unknown) {
            set((state) => {
              state.isSaving = false
              state.error = handleApiError(error)
            })
          }
        },

        // 삭제 취소
        cancelDeletion: async (token) => {
          set((state) => {
            state.isSaving = true
            state.error = null
          })

          try {
            const result = await settingsApi.cancelDeletion({ cancellationToken: token })

            set((state) => {
              state.isSaving = false
            })

            if (result.success) {
              // 계정 삭제 취소 성공 - UI에서 알림 처리
              // TODO: toast 또는 알림 시스템으로 교체
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

        clearError: () => set((state) => {
          state.error = null
          state.fieldErrors = {}
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
        version: 1,
        migrate: (persistedState: unknown, version: number) => {
          // 스키마 마이그레이션 로직
          if (version < 1) {
            const state = persistedState as Record<string, unknown>

            return {
              ...state,
              // 필요한 마이그레이션 로직
            }
          }

          return persistedState
        },
      }
    ),
    { name: 'settings-store' }
  )
)