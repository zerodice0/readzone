'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { SettingsPage } from './settings-page'

export default function Settings() {
  const { data: session, status } = useSession()

  // 로딩 중일 때는 로딩 화면 표시
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!session) {
    redirect('/login')
  }

  return <SettingsPage userId={session.user.id} />
}