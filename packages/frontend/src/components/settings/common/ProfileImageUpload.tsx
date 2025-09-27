import React, { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  useImageValidation,
  useProfileImageUpload,
} from '@/hooks/useImageUpload';
import { useConfirmation } from '@/hooks/useConfirmation';
import { settingsAnalytics } from '@/lib/analytics';
import { animations } from '@/lib/animations';
import { ImageCropperModal } from '../modals/ImageCropperModal';

interface ProfileImageUploadProps {
  currentImage?: string | null;
  onUpdate: (imageUrl: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showRemoveButton?: boolean;
  disabled?: boolean;
}

/**
 * 프로필 이미지 업로드 및 크롭 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - 애니메이션과 피드백
 * - 접근성 지원
 * - 진행률 표시
 * - 에러 처리
 */
export function ProfileImageUpload({
  currentImage,
  onUpdate,
  onRemove,
  className,
  size = 'md',
  showRemoveButton = true,
  disabled = false,
}: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    uploadProfileImage,
    isUploading,
    error: uploadError,
    progress,
    clearError,
  } = useProfileImageUpload();

  const { validateProfileImage } = useImageValidation();
  const { showConfirmation, ConfirmationModal } = useConfirmation();

  // 크기 변형
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(() => {
    if (disabled) {
      return;
    }
    clearError();
    fileInputRef.current?.click();

    // 접근성 추적
    settingsAnalytics.accessibilityUsed('keyboard_navigation');
  }, [disabled, clearError]);

  // 파일 변경 핸들러
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      // 파일 검증
      const validationErrors = validateProfileImage(file);

      if (validationErrors.length > 0 && validationErrors[0]) {
        // 첫 번째 에러 표시
        settingsAnalytics.error(
          'profile',
          'validation_failed',
          validationErrors[0]
        );

        return;
      }

      setSelectedFile(file);

      // 미리보기 이미지 생성
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;

        setPreviewImage(result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);

      // 파일 입력 초기화 (같은 파일 재선택 가능)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [validateProfileImage]
  );

  // 크롭 완료 핸들러
  const handleCropComplete = useCallback(
    async (croppedBlob: Blob) => {
      if (!selectedFile) {
        return;
      }

      const uploadStartTime = performance.now();

      try {
        setShowCropper(false);

        const imageUrl = await uploadProfileImage(croppedBlob);

        await onUpdate(imageUrl);

        const uploadDuration = performance.now() - uploadStartTime;

        settingsAnalytics.imageUploaded(
          'profile',
          croppedBlob.size,
          uploadDuration,
          true
        );

        // 상태 초기화
        setPreviewImage(null);
        setSelectedFile(null);
      } catch (error) {
        const uploadDuration = performance.now() - uploadStartTime;

        settingsAnalytics.imageUploaded(
          'profile',
          croppedBlob.size,
          uploadDuration,
          false
        );
        settingsAnalytics.error(
          'profile',
          'upload_failed',
          error instanceof Error ? error.message : '업로드 실패'
        );
      }
    },
    [uploadProfileImage, onUpdate, selectedFile]
  );

  // 크롭 취소 핸들러
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setPreviewImage(null);
    setSelectedFile(null);
  }, []);

  // 이미지 제거 핸들러
  const handleRemoveImage = useCallback(async () => {
    if (!onRemove || disabled) {
      return;
    }

    const confirmed = await showConfirmation({
      title: '프로필 사진 삭제',
      message: '프로필 사진을 삭제하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'danger',
    });

    if (confirmed) {
      await onRemove();
      settingsAnalytics.settingChanged(
        'profile',
        'profile_image',
        currentImage ?? '',
        ''
      );
    }
  }, [onRemove, disabled, showConfirmation, currentImage]);

  // 드래그 앤 드롭 핸들러
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) {
        return;
      }

      const file = e.dataTransfer.files[0];

      if (file) {
        // 파일 타입 검사
        if (file.type.startsWith('image/')) {
          // 파일 검증
          const validationErrors = validateProfileImage(file);

          if (validationErrors.length > 0 && validationErrors[0]) {
            settingsAnalytics.error(
              'profile',
              'validation_failed',
              validationErrors[0]
            );

            return;
          }

          setSelectedFile(file);

          // 미리보기 이미지 생성
          const reader = new FileReader();

          reader.onload = (e) => {
            const result = e.target?.result as string;

            if (result) {
              setPreviewImage(result);
              setShowCropper(true);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    },

    [disabled, validateProfileImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div className={clsx('relative', className)}>
      {/* 메인 업로드 영역 */}
      <motion.div
        className={clsx(
          'relative rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer group',
          sizeClasses[size],
          disabled && 'opacity-50 cursor-not-allowed',
          isUploading && 'pointer-events-none'
        )}
        onClick={handleFileSelect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        whileHover={disabled ? {} : { scale: 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={currentImage ? '프로필 사진 변경' : '프로필 사진 업로드'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFileSelect();
          }
        }}
      >
        {/* 현재 이미지 또는 플레이스홀더 */}
        <AnimatePresence mode="wait">
          {currentImage ? (
            <motion.img
              key="current-image"
              src={currentImage}
              alt="프로필 사진"
              className="w-full h-full object-cover"
              {...animations.fadeIn}
            />
          ) : (
            <motion.div
              key="placeholder"
              className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800"
              {...animations.fadeIn}
            >
              <div className="text-center">
                <div
                  className={clsx(
                    'mx-auto text-gray-400',
                    iconSizeClasses[size]
                  )}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                {size !== 'sm' && (
                  <p className="text-xs text-gray-500 mt-1">사진 추가</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 업로드 진행률 오버레이 */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              {...animations.fadeIn}
            >
              <div className="text-center text-white">
                <div className="w-6 h-6 mx-auto mb-2">
                  <motion.div
                    className="w-full h-full border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </div>
                {typeof progress === 'number' && (
                  <p className="text-xs">{progress}%</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className={clsx('text-white', iconSizeClasses[size])}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 제거 버튼 */}
      {showRemoveButton && currentImage && !disabled && (
        <motion.button
          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveImage();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="프로필 사진 삭제"
          {...animations.scale}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </motion.button>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />

      {/* 에러 표시 */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg"
            {...animations.slideDown}
          >
            <p className="text-xs text-red-600">{uploadError}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 text-xs underline mt-1"
            >
              닫기
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 이미지 크롭 모달 */}
      <ImageCropperModal
        imageUrl={previewImage ?? ''}
        isOpen={showCropper}
        onClose={handleCropCancel}
        onSave={handleCropComplete}
      />

      {/* 확인 모달 */}
      <ConfirmationModal />
    </div>
  );
}

export default ProfileImageUpload;
