/**
 * Simple Image Cropper Modal (Stub Implementation)
 *
 * Note: This is a simplified version without actual cropping functionality.
 * The full image cropping feature was removed as part of over-implementation cleanup.
 * This stub simply converts the image to a Blob and returns it.
 */

import type { FC } from 'react';

interface ImageCropperModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedBlob: Blob) => void;
}

export const ImageCropperModal: FC<ImageCropperModalProps> = ({
  imageUrl,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !imageUrl) {
    return null;
  }

  // Simple implementation: fetch the image and convert to Blob
  const handleSave = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      onSave(blob);
    } catch (error: unknown) {
      console.error('Failed to process image:', error);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          이미지 확인
        </h2>

        <div className="mb-4">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-auto max-h-96 object-contain rounded"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
