import React from 'react';
import { cn } from '../../utils/cn';
import { useLazyImage } from '../../hooks/useLazyImage';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  placeholderClassName?: string;
  threshold?: number;
  rootMargin?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  fallbackSrc = '',
  placeholderClassName = 'bg-gray-200 animate-pulse',
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  ...props
}) => {
  const {
    imgRef,
    imageSrc,
    isLoaded,
    hasError,
    handleLoad,
    handleError,
  } = useLazyImage(src, {
    threshold,
    rootMargin,
    fallbackSrc,
  });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    handleLoad();
    onLoad?.(e);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    handleError();
    onError?.(e);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder */}
      {!isLoaded && (
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            placeholderClassName
          )}
        >
          <div className="w-8 h-8 text-gray-400">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Actual Image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          hasError && 'hidden'
        )}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />

      {/* Error fallback */}
      {hasError && !fallbackSrc && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}>
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-xs">이미지 로드 실패</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;