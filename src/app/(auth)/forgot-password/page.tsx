'use client'

import React from 'react'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { ServiceIntro } from '@/components/auth/service-intro'

export default function ForgotPasswordPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-12rem)]">
          {/* 왼쪽: 서비스 소개 */}
          <div className="order-2 lg:order-1">
            <ServiceIntro />
          </div>

          {/* 오른쪽: 비밀번호 찾기 폼 */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <ForgotPasswordForm 
              onSuccess={() => {
                // 성공 시 특별한 액션이 필요하면 여기에 추가
              }}
              className="w-full max-w-md"
            />
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; 2024 ReadZone. 모든 권리 보유.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}