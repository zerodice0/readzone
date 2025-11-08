import { useState } from 'react';
import { z } from 'zod';
import apiClient from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';

/**
 * T114: EditProfileForm Component
 * Form for editing user profile (name, profile image)
 */

// Validation schema
const profileSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
}

interface EditProfileFormProps {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

function EditProfileForm({ user, onCancel, onSuccess }: EditProfileFormProps) {
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user.name,
    email: user.email,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof ProfileFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setGeneralError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setGeneralError('이미지 파일 크기는 2MB 이하여야 합니다');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setGeneralError('JPEG, PNG, WEBP 형식의 이미지만 업로드 가능합니다');
      return;
    }

    setProfileImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setGeneralError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');

    // Validate form
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof ProfileFormData;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Update profile
      const response = await apiClient.patch('/users/me', {
        name: formData.name,
        email: formData.email,
      });

      // Update user in auth context
      updateUser(response.data.user);

      // Handle profile image upload if provided
      if (profileImage) {
        const formDataObj = new FormData();
        formDataObj.append('profile_image', profileImage);

        await apiClient.post('/users/me/profile-image', formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setSuccessMessage('프로필이 성공적으로 업데이트되었습니다');

      // Call onSuccess after short delay
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        setGeneralError(
          axiosError.response?.data?.message ||
            '프로필 업데이트에 실패했습니다. 다시 시도해주세요.'
        );
      } else {
        setGeneralError('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
        프로필 수정
      </h3>

      {/* Success Message */}
      {successMessage && (
        <div
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded"
          role="alert"
        >
          {successMessage}
        </div>
      )}

      {/* General Error */}
      {generalError && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
          role="alert"
        >
          {generalError}
        </div>
      )}

      {/* Profile Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          프로필 이미지
        </label>
        <div className="flex items-center space-x-4">
          {/* Current/Preview Image */}
          <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="프로필 미리보기"
                className="h-full w-full object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          {/* Upload Button */}
          <div>
            <label
              htmlFor="profile-image-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              이미지 선택
            </label>
            <input
              id="profile-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="sr-only"
            />
            <p className="mt-2 text-xs text-gray-500">
              JPEG, PNG, WEBP (최대 2MB)
            </p>
          </div>
        </div>
      </div>

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          이름
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={`mt-1 block w-full px-3 py-2 border ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600" id="name-error">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`mt-1 block w-full px-3 py-2 border ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600" id="email-error">
            {errors.email}
          </p>
        )}
        {formData.email !== user.email && (
          <p className="mt-1 text-sm text-yellow-600">
            ⚠️ 이메일 변경 시 재인증이 필요합니다
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          취소
        </button>
      </div>
    </form>
  );
}

export default EditProfileForm;
