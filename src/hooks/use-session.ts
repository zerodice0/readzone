'use client'

import { useEffect } from 'react'
import { useSession as useNextAuthSession } from 'next-auth/react'
import { useAuthStore } from '@/store/auth-store'
import type { User } from '@/store/auth-store'

// NextAuth 세션을 Zustand와 동기화하는 훅
export function useSession() {
  const { data: session, status } = useNextAuthSession()
  const { user, setUser, setLoading, isAuthenticated } = useAuthStore()

  // NextAuth 세션과 Zustand 동기화
  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }

    if (status === 'authenticated' && session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        nickname: session.user.nickname,
        name: session.user.name || session.user.nickname,
        image: session.user.image || undefined,
        bio: undefined, // API에서 별도로 가져와야 함
        emailVerified: new Date(), // NextAuth에서 인증된 경우
        createdAt: new Date(), // 실제로는 DB에서 가져와야 함
        updatedAt: new Date(), // 실제로는 DB에서 가져와야 함
      }
      setUser(user)
    } else if (status === 'unauthenticated') {
      setUser(null)
    }
  }, [session, status, setUser, setLoading])

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated' && isAuthenticated,
    status,
    session,
  }
}