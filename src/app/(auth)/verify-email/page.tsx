'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verifyToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('이메일 인증이 완료되었습니다!');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || '인증에 실패했습니다.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('인증 처리 중 오류가 발생했습니다.');
    }
  };

  const resendEmail = async () => {
    if (!email) return;

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('인증 메일을 다시 발송했습니다.');
      } else {
        setMessage('메일 발송에 실패했습니다.');
      }
    } catch (error) {
      setMessage('메일 발송 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'pending' && <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />}
          {status === 'success' && <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />}
          {status === 'error' && <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />}
          
          <CardTitle>
            {status === 'pending' && '이메일 인증'}
            {status === 'success' && '인증 완료!'}
            {status === 'error' && '인증 실패'}
          </CardTitle>
          
          <CardDescription>
            {status === 'pending' && email && !token && (
              <>
                <span className="font-medium">{email}</span>로 인증 메일을 발송했습니다.
                <br />
                메일함을 확인해주세요.
              </>
            )}
            {status === 'pending' && token && '이메일을 인증하는 중입니다...'}
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <p className="text-center text-sm text-gray-600">
              잠시 후 로그인 페이지로 이동합니다...
            </p>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                로그인 페이지로 이동
              </Button>
              <Button
                onClick={() => router.push('/register')}
                variant="outline"
                className="w-full"
              >
                다시 회원가입
              </Button>
            </div>
          )}
          
          {status === 'pending' && !token && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">메일이 오지 않나요?</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 스팸 메일함을 확인해주세요</li>
                  <li>• 이메일 주소가 올바른지 확인해주세요</li>
                  <li>• 잠시 후 다시 시도해주세요</li>
                </ul>
              </div>
              
              <Button
                onClick={resendEmail}
                variant="outline"
                className="w-full"
                disabled={!email}
              >
                인증 메일 재발송
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}