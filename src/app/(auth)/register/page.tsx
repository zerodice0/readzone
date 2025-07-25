import { type Metadata } from 'next'
import { RegisterForm } from '@/components/auth/register-form'
import Image from 'next/image'

export const metadata: Metadata = {
  title: '회원가입 | ReadZone',
  description: '독서 전용 커뮤니티 SNS ReadZone에 가입하여 독후감을 공유하세요.',
}

export default function RegisterPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
          {/* 서비스 소개 섹션 (왼쪽) */}
          <div className="lg:pr-8">
            <div className="max-w-md mx-auto sm:max-w-lg lg:mx-0">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 sm:text-5xl">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    ReadZone
                  </span>
                  에서
                </h1>
                <p className="mt-2 text-xl text-gray-700 dark:text-gray-300">
                  독서의 감동을 함께 나누세요
                </p>
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 dark:bg-blue-600 text-white">
                      📚
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">독후감 공유</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      읽은 책에 대한 생각과 감상을 자유롭게 공유하고 다른 독자들과 소통하세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-indigo-500 dark:bg-indigo-600 text-white">
                      💬
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">커뮤니티 토론</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      좋아하는 책에 대해 토론하고 새로운 책을 추천받으세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-purple-500 dark:bg-purple-600 text-white">
                      ⭐
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">도서 발견</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      다른 독자들의 추천을 통해 새로운 책을 발견하고 읽을 목록을 늘려나가세요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Image
                      className="h-8 w-8 rounded-full"
                      src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt=""
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">독서를 사랑하는 사람들의 커뮤니티</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">이미 1,000명이 넘는 독자들이 함께하고 있습니다</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 회원가입 폼 섹션 (오른쪽) */}
          <div className="mt-12 lg:mt-0">
            <div className="max-w-md mx-auto">
              <RegisterForm />
              
              {/* 추가 정보 */}
              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>
                  회원가입을 진행하시면 ReadZone의{' '}
                  <a href="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">
                    이용약관
                  </a>
                  {' '}및{' '}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">
                    개인정보처리방침
                  </a>
                  에 동의하는 것으로 간주됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}