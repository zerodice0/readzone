import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '../../../lib/api-client';

/**
 * T105: ForgotPasswordPage
 * Password reset request form
 */

// Form validation with Zod
const forgotPasswordSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordPage() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ForgotPasswordFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error on change
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError('');
    setSuccessMessage('');

    // Validate form data
    const result = forgotPasswordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ForgotPasswordFormData, string>> =
        {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ForgotPasswordFormData] =
            err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.forgotPassword(result.data);
      setSuccessMessage(
        '비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.'
      );
      setFormData({ email: '' });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        setApiError(
          axiosError.response?.data?.message ||
            '비밀번호 재설정 요청에 실패했습니다'
        );
      } else {
        setApiError('비밀번호 재설정 요청에 실패했습니다');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            비밀번호 찾기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를
            보내드립니다.
          </p>
        </div>

        {/* Forgot Password Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Success Message */}
          {successMessage && (
            <div
              className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded"
              role="alert"
            >
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {/* API Error Display */}
          {apiError && (
            <div
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded"
              role="alert"
            >
              <p className="text-sm">{apiError}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="your@email.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '전송 중...' : '재설정 링크 보내기'}
            </button>
          </div>

          {/* Back to Login Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
