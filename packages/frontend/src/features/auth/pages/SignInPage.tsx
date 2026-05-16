import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useSignIn } from '@clerk/clerk-react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { GoogleIcon } from '../components/GoogleIcon';

const SSO_CALLBACK_URL = '/sso-callback';

type SignInStep =
  | 'credentials'
  | 'secondFactor'
  | 'resetRequest'
  | 'resetConfirm';
type SecondFactorStrategy = 'totp' | 'backup_code';

function getRedirectUrl(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/feed';
  }

  return value;
}

function getAuthErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'errors' in error) {
    const firstError = (error as { errors?: Array<{ code?: string }> })
      .errors?.[0];

    switch (firstError?.code) {
      case 'form_identifier_not_found':
      case 'form_password_incorrect':
      case 'form_param_format_invalid':
        return '이메일 또는 비밀번호를 확인해주세요.';
      case 'form_code_incorrect':
        return '인증 코드를 확인해주세요.';
      case 'form_password_pwned':
      case 'form_password_length_too_short':
      case 'form_password_validation_failed':
        return '더 안전한 비밀번호를 입력해주세요.';
      default:
        return '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
    }
  }

  return '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
}

function getSupportedSecondFactors(
  factors: readonly { strategy: string }[] | null | undefined
) {
  const strategies = factors
    ?.map((factor) => factor.strategy)
    .filter(
      (strategy): strategy is SecondFactorStrategy =>
        strategy === 'totp' || strategy === 'backup_code'
    );

  return strategies ?? [];
}

function SignInPage() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = getRedirectUrl(searchParams.get('redirect_url'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secondFactorCode, setSecondFactorCode] = useState('');
  const [secondFactorStrategies, setSecondFactorStrategies] = useState<
    SecondFactorStrategy[]
  >([]);
  const [selectedSecondFactor, setSelectedSecondFactor] =
    useState<SecondFactorStrategy>('totp');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [step, setStep] = useState<SignInStep>('credentials');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeSignIn = async (sessionId: string | null) => {
    if (!sessionId || !setActive) {
      setError('세션을 만들 수 없습니다. 다시 시도해주세요.');
      return;
    }

    await setActive({ session: sessionId });
    void navigate(redirectUrl, { replace: true });
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded || !signIn) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'needs_second_factor') {
        const supportedStrategies = getSupportedSecondFactors(
          result.supportedSecondFactors
        );
        setSecondFactorStrategies(supportedStrategies);
        if (supportedStrategies.length > 0) {
          setSelectedSecondFactor(supportedStrategies[0]);
        }
        setStep('secondFactor');
        return;
      }

      if (result.status === 'complete') {
        await completeSignIn(result.createdSessionId);
        return;
      }

      setError('추가 인증이 필요합니다. 입력 정보를 확인해주세요.');
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecondFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded || !signIn) {
      return;
    }

    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: selectedSecondFactor,
        code: secondFactorCode,
      });

      if (result.status === 'complete') {
        await completeSignIn(result.createdSessionId);
        return;
      }

      setError('인증을 완료할 수 없습니다. 코드를 다시 확인해주세요.');
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) {
      return;
    }

    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: SSO_CALLBACK_URL,
        redirectUrlComplete: redirectUrl,
      });
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
      setIsSubmitting(false);
    }
  };

  const handleResetRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded || !signIn) {
      return;
    }

    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: resetEmail,
      });
    } catch {
      // Keep the response indistinguishable to avoid account enumeration.
    } finally {
      setInfo('계정이 있으면 재설정 안내를 보냈습니다. 이메일을 확인해주세요.');
      setStep('resetConfirm');
      setIsSubmitting(false);
    }
  };

  const handleResetConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded || !signIn) {
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError('새 비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      const verification = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
      });

      if (verification.status !== 'needs_new_password') {
        setError('비밀번호 재설정을 완료할 수 없습니다. 코드를 확인해주세요.');
        return;
      }

      const result = await signIn.resetPassword({
        password: newPassword,
      });

      if (result.status === 'needs_second_factor') {
        const supportedStrategies = getSupportedSecondFactors(
          result.supportedSecondFactors
        );
        setSecondFactorStrategies(supportedStrategies);
        if (supportedStrategies.length > 0) {
          setSelectedSecondFactor(supportedStrategies[0]);
        }
        setStep('secondFactor');
        return;
      }

      if (result.status === 'complete') {
        await completeSignIn(result.createdSessionId);
        return;
      }

      setInfo('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.');
      setStep('credentials');
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || !isAuthLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-50 px-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="sr-only">로딩 중</span>
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to={redirectUrl} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-50 px-4 py-10">
      <Card className="w-full max-w-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>
            글다락 계정으로 독서 기록과 독후감을 이어가세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'secondFactor' ? (
            <form onSubmit={handleSecondFactor} className="space-y-4">
              {secondFactorStrategies.length > 0 ? (
                <>
                  {secondFactorStrategies.length > 1 && (
                    <div className="space-y-2">
                      <label
                        htmlFor="second-factor-strategy"
                        className="text-sm font-medium text-stone-700"
                      >
                        인증 방법
                      </label>
                      <select
                        id="second-factor-strategy"
                        value={selectedSecondFactor}
                        onChange={(event) =>
                          setSelectedSecondFactor(
                            event.target.value as SecondFactorStrategy
                          )
                        }
                        className="paper-input w-full rounded-xl px-4 py-3 outline-none"
                      >
                        {secondFactorStrategies.includes('totp') && (
                          <option value="totp">인증 앱 코드</option>
                        )}
                        {secondFactorStrategies.includes('backup_code') && (
                          <option value="backup_code">백업 코드</option>
                        )}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label
                      htmlFor="second-factor-code"
                      className="text-sm font-medium text-stone-700"
                    >
                      {selectedSecondFactor === 'backup_code'
                        ? '백업 코드'
                        : '인증 앱 코드'}
                    </label>
                    <input
                      id="second-factor-code"
                      type="text"
                      inputMode={
                        selectedSecondFactor === 'totp' ? 'numeric' : 'text'
                      }
                      autoComplete="one-time-code"
                      value={secondFactorCode}
                      onChange={(event) =>
                        setSecondFactorCode(event.target.value)
                      }
                      className="paper-input w-full rounded-xl px-4 py-3 outline-none"
                      required
                    />
                  </div>
                </>
              ) : (
                <p className="rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                  이 계정의 추가 인증 방식은 현재 화면에서 지원하지 않습니다.
                  다른 로그인 방법을 사용하거나 관리자에게 문의해주세요.
                </p>
              )}
              {error && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || secondFactorStrategies.length === 0}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                인증 완료
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep('credentials');
                  setSecondFactorCode('');
                  setError('');
                }}
              >
                로그인으로 돌아가기
              </Button>
            </form>
          ) : step === 'resetRequest' ? (
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="reset-email"
                  className="text-sm font-medium text-stone-700"
                >
                  이메일
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  className="paper-input w-full rounded-xl px-4 py-3 outline-none"
                  required
                />
              </div>
              {error && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                재설정 코드 받기
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep('credentials');
                  setError('');
                }}
              >
                로그인으로 돌아가기
              </Button>
            </form>
          ) : step === 'resetConfirm' ? (
            <form onSubmit={handleResetConfirm} className="space-y-4">
              {info && (
                <p className="rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-800">
                  {info}
                </p>
              )}
              <div className="space-y-2">
                <label
                  htmlFor="reset-code"
                  className="text-sm font-medium text-stone-700"
                >
                  재설정 코드
                </label>
                <input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={resetCode}
                  onChange={(event) => setResetCode(event.target.value)}
                  className="paper-input w-full rounded-xl px-4 py-3 outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className="text-sm font-medium text-stone-700"
                >
                  새 비밀번호
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="paper-input w-full rounded-xl px-4 py-3 outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="new-password-confirm"
                  className="text-sm font-medium text-stone-700"
                >
                  새 비밀번호 확인
                </label>
                <input
                  id="new-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={newPasswordConfirm}
                  onChange={(event) =>
                    setNewPasswordConfirm(event.target.value)
                  }
                  className="paper-input w-full rounded-xl px-4 py-3 outline-none"
                  required
                />
              </div>
              {error && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                비밀번호 변경
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-stone-700"
                >
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="paper-input w-full rounded-xl px-4 py-3 outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-stone-700"
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="paper-input w-full rounded-xl px-4 py-3 outline-none"
                  required
                />
              </div>
              {error && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                로그인
              </Button>
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-stone-500">또는</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Google로 계속하기
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setResetEmail(email);
                  setStep('resetRequest');
                  setError('');
                }}
              >
                비밀번호를 잊으셨나요?
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-stone-600">
            아직 계정이 없나요?{' '}
            <Link
              to={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
              className="font-medium text-primary-700 hover:underline"
            >
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default SignInPage;
