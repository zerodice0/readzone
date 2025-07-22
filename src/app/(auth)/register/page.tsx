'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { TermsModal } from '@/components/legal/terms-modal';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다';
    if (!/[a-zA-Z]/.test(password)) return '영문자를 포함해야 합니다';
    if (!/[0-9]/.test(password)) return '숫자를 포함해야 합니다';
    return '';
  };

  const checkDuplicate = async (field: 'email' | 'nickname', value: string) => {
    if (!value) return;
    
    try {
      const response = await fetch('/api/auth/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });
      
      const data = await response.json();
      
      if (field === 'email') {
        setEmailAvailable(data.available);
      } else {
        setNicknameAvailable(data.available);
      }
    } catch (error) {
      console.error('중복 확인 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검증
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) newErrors.email = '이메일을 입력해주세요';
    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요';
    else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
    }
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
    }
    if (!formData.nickname) newErrors.nickname = '닉네임을 입력해주세요';
    if (!agreedToTerms || !agreedToPrivacy) {
      newErrors.terms = '필수 약관에 동의해주세요';
    }
    if (emailAvailable === false) newErrors.email = '이미 사용 중인 이메일입니다';
    if (nicknameAvailable === false) newErrors.nickname = '이미 사용 중인 닉네임입니다';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        router.push('/verify-email?email=' + encodeURIComponent(formData.email));
      } else {
        setErrors({ submit: data.message || '회원가입에 실패했습니다' });
      }
    } catch (error) {
      setErrors({ submit: '회원가입 중 오류가 발생했습니다' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>
            ReadZone 계정을 생성하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                이메일 *
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setEmailAvailable(null);
                  }}
                  onBlur={() => checkDuplicate('email', formData.email)}
                  required
                  disabled={isLoading}
                />
                {emailAvailable !== null && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {emailAvailable ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              {emailAvailable === true && (
                <p className="text-sm text-green-600">사용 가능한 이메일입니다</p>
              )}
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호 *
              </label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
                  • 8자 이상
                </li>
                <li className={/[a-zA-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                  • 영문 포함
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                  • 숫자 포함
                </li>
              </ul>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <label htmlFor="passwordConfirm" className="text-sm font-medium">
                비밀번호 확인 *
              </label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                required
                disabled={isLoading}
              />
              {errors.passwordConfirm && (
                <p className="text-sm text-red-600">{errors.passwordConfirm}</p>
              )}
            </div>

            {/* 닉네임 */}
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                닉네임 *
              </label>
              <div className="relative">
                <Input
                  id="nickname"
                  type="text"
                  placeholder="닉네임을 입력하세요"
                  value={formData.nickname}
                  onChange={(e) => {
                    setFormData({ ...formData, nickname: e.target.value });
                    setNicknameAvailable(null);
                  }}
                  onBlur={() => checkDuplicate('nickname', formData.nickname)}
                  required
                  disabled={isLoading}
                />
                {nicknameAvailable !== null && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {nicknameAvailable ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              {nicknameAvailable === true && (
                <p className="text-sm text-green-600">사용 가능한 닉네임입니다</p>
              )}
              {errors.nickname && (
                <p className="text-sm text-red-600">{errors.nickname}</p>
              )}
            </div>

            {/* 약관 동의 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    disabled={isLoading}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">이용약관 동의 (필수)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  보기
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    disabled={isLoading}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">개인정보처리방침 동의 (필수)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  보기
                </button>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-600">{errors.terms}</p>
              )}
            </div>

            {errors.submit && (
              <div className="text-sm text-red-600 text-center">
                {errors.submit}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !agreedToTerms || !agreedToPrivacy}
            >
              {isLoading ? '가입 중...' : '가입하기'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">이미 계정이 있으신가요? </span>
            <Link href="/login" className="text-red-600 hover:underline">
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 약관 모달 */}
      <TermsModal
        type="terms"
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAgree={() => setAgreedToTerms(true)}
      />
      
      <TermsModal
        type="privacy"
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onAgree={() => setAgreedToPrivacy(true)}
      />
    </div>
  );
}