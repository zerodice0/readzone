import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../lib/api-client';
import BackupCodesDisplay from '../components/BackupCodesDisplay';

/**
 * T124: MFASetupPage
 * Page for setting up Multi-Factor Authentication (MFA) with TOTP
 */

interface MFAEnableResponse {
  qrCode: string; // data URI for QR code
  secret: string; // TOTP secret (for manual entry)
}

interface MFAVerifyResponse {
  backupCodes: string[]; // Generated backup codes
}

function MFASetupPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<
    'loading' | 'qrcode' | 'verify' | 'backup' | 'complete'
  >('loading');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // T124, T125: Enable MFA and get QR code
    const enableMFA = async () => {
      try {
        const response = await apiClient.post<MFAEnableResponse>(
          '/api/v1/users/me/mfa/enable'
        );
        setQrCode(response.data.qrCode);
        setSecret(response.data.secret);
        setStep('qrcode');
      } catch (err) {
        // Error handling for MFA setup
        setError('MFA 설정을 시작할 수 없습니다. 다시 시도해주세요.');
        setStep('qrcode'); // Show error but allow retry
      }
    };

    void enableMFA();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (totpCode.length !== 6) {
      setError('6자리 인증 코드를 입력하세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // T124: Verify TOTP code and complete MFA setup
      const response = await apiClient.post<MFAVerifyResponse>(
        '/api/v1/users/me/mfa/verify',
        {
          token: totpCode,
        }
      );

      setBackupCodes(response.data.backupCodes);
      setStep('backup');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message || '인증 코드가 올바르지 않습니다.'
        );
      } else {
        setError('인증 코드 확인에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    setStep('complete');
    // Navigate to settings after a short delay
    setTimeout(() => {
      navigate('/settings');
    }, 2000);
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            MFA 설정을 준비하는 중...
          </p>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            MFA 설정 완료!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            다음 로그인부터 2단계 인증이 적용됩니다.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'backup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <BackupCodesDisplay codes={backupCodes} onComplete={handleComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            2단계 인증 설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Google Authenticator 등의 앱으로 QR 코드를 스캔하세요
          </p>
        </div>

        {/* T125: Display QR Code */}
        {step === 'qrcode' && (
          <div className="space-y-6">
            {qrCode && (
              <div className="flex justify-center">
                <img
                  src={qrCode}
                  alt="QR Code for MFA setup"
                  className="border-2 border-gray-300 rounded"
                />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                수동 입력 코드:
              </p>
              <code className="text-xs bg-white px-2 py-1 rounded border border-blue-300 break-all">
                {secret}
              </code>
              <p className="text-xs text-blue-700 mt-2">
                QR 코드를 스캔할 수 없는 경우 위 코드를 앱에 직접 입력하세요.
              </p>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              다음 단계로
            </button>
          </div>
        )}

        {/* T126: Verify TOTP Code */}
        {step === 'verify' && (
          <form onSubmit={(e) => void handleVerify(e)} className="space-y-6">
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded"
                role="alert"
              >
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="totpCode"
                className="block text-sm font-medium text-gray-700"
              >
                인증 앱에 표시된 6자리 코드
              </label>
              <input
                id="totpCode"
                name="totpCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={totpCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const numericValue = e.target.value.replace(/\D/g, '');
                  setTotpCode(numericValue);
                  setError('');
                }}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
                placeholder="000000"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                인증 앱에서 생성된 6자리 숫자를 입력하세요
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setStep('qrcode');
                  setTotpCode('');
                  setError('');
                }}
                className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                이전
              </button>
              <button
                type="submit"
                disabled={isSubmitting || totpCode.length !== 6}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '확인 중...' : '확인'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default MFASetupPage;
