'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, MessageSquare, TrendingUp } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* 좌측 서비스 소개 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-50 to-red-100 p-12 items-center justify-center">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-12 h-12 text-red-600" />
            <h1 className="text-4xl font-bold text-gray-900">ReadZone</h1>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            독서 후 생각을 나누는 공간
          </h2>
          
          <p className="text-gray-700 mb-8">
            ReadZone은 독서를 사랑하는 사람들이 모여 책에 대한 생각과 감상을 
            자유롭게 나누는 커뮤니티입니다. 당신의 독서 경험을 공유하고, 
            다른 독자들의 관점을 통해 새로운 시각을 발견해보세요.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-800">독후감 작성</h3>
                <p className="text-sm text-gray-600">읽은 책에 대한 생각을 자유롭게 기록하세요</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-800">도서 의견 공유</h3>
                <p className="text-sm text-gray-600">280자로 간단하게 책에 대한 의견을 나눠보세요</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-800">독서 커뮤니티</h3>
                <p className="text-sm text-gray-600">같은 책을 읽은 사람들과 소통하세요</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 로그인 폼 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">로그인</CardTitle>
            <CardDescription>
              ReadZone 계정으로 로그인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  이메일
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  비밀번호
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">아직 계정이 없으신가요? </span>
              <Link href="/register" className="text-red-600 hover:underline">
                회원가입
              </Link>
            </div>
            
            <div className="mt-2 text-center">
              <Link href="/forgot-password" className="text-sm text-gray-600 hover:underline">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}