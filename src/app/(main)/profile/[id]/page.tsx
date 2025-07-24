'use client'

import { use } from 'react'
import { useSession } from 'next-auth/react'
import { notFound } from 'next/navigation'
import { UserProfilePage } from './user-profile-page'

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { id: userId } = use(params)
  const { data: session } = useSession()

  // 사용자 ID 유효성 검사
  if (!userId || typeof userId !== 'string') {
    notFound()
  }

  return (
    <UserProfilePage 
      userId={userId}
      currentUserId={session?.user?.id}
    />
  )
}