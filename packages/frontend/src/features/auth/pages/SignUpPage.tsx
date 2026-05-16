import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useSignUp } from '@clerk/clerk-react';
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

type SignUpStep = 'register' | 'verify';

const SSO_CALLBACK_URL = '/sso-callback';

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
      case 'form_identifier_exists':
        return '회원가입을 완료할 수 없습니다. 입력값을 확인해주세요.';
      case 'form_password_pwned':
      case 'form_password_length_too_short':
      case 'form_password_validation_failed':
        return '더 안전한 비밀번호를 입력해주세요.';
      case 'form_code_incorrect':
        return '인증 코드를 확인해주세요.';
      default:
        return '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.';
    }
  }

  return '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.';
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || undefined,
  };
}

function SignUpPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = getRedirectUrl(searchParams.get('redirect_url'));

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<SignUpStep>('register');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeSignUp = async (sessionId: string | null) => {
    if (!sessionId || !setActive) {
      setError('세션을 만들 수 없습니다. 다시 시도해주세요.');
      return;
    }

    await setActive({ session: sessionId });
    void navigate(redirectUrl, { replace: true });
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded || !signUp) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const { firstName, lastName } = splitDisplayName(displayName);

      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });
      await signUp.prepareVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded || !signUp) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await signUp.attemptVerification({
        strategy: 'email_code',
        code,
      });

      if (result.status === 'complete') {
        await completeSignUp(result.createdSessionId);
        return;
      }

      setError('이메일 인증을 완료할 수 없습니다. 코드를 다시 확인해주세요.');
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: SSO_CALLBACK_URL,
        redirectUrlComplete: redirectUrl,
      });
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
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
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>
            이메일 인증 후 글다락을 바로 사용할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-800">
                이메일로 보낸 인증 코드를 입력해주세요.
              </p>
              <div className="space-y-2">
                <label
                  htmlFor="verification-code"
                  className="text-sm font-medium text-stone-700"
                >
                  인증 코드
                </label>
                <input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
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
                이메일 인증
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="display-name"
                  className="text-sm font-medium text-stone-700"
                >
                  표시 이름
                </label>
                <input
                  id="display-name"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="paper-input w-full rounded-xl px-4 py-3 outline-none"
                  placeholder="선택 사항"
                />
              </div>
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="paper-input w-full rounded-xl px-4 py-3 outline-none"
                  required
                />
              </div>
              <div id="clerk-captcha" />
              {error && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                가입하고 인증하기
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
                onClick={handleGoogleSignUp}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Google로 계속하기
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-stone-600">
            이미 계정이 있나요?{' '}
            <Link
              to={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
              className="font-medium text-primary-700 hover:underline"
            >
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default SignUpPage;
