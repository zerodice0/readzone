import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useBreakpointContext } from '@/hooks/useBreakpointContext';
import { animations } from '@/lib/animations';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  formats?: ('webp' | 'avif' | 'original')[];
  sizes?: string;
  blurDataURL?: string;
  placeholder?: 'blur' | 'empty' | ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | number;
}

/**
 * 이미지 최적화 컴포넌트
 * Phase 4 UI/UX 개선사항 포함:
 * - WebP/AVIF 포맷 지원
 * - 레이지 로딩
 * - 반응형 이미지
 * - 블러 플레이스홀더
 * - 에러 처리
 */
export function ImageOptimizer({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  formats = ['webp', 'original'],
  sizes = '100vw',
  blurDataURL,
  placeholder = 'blur',
  onLoad,
  onError,
  lazy = !priority,
  aspectRatio,
}: ImageOptimizerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const { isMobile, isTablet } = useBreakpointContext();

  // 이미지 포맷 지원 감지
  const [supportedFormats, setSupportedFormats] = useState<Set<string>>(
    new Set(['original'])
  );

  useEffect(() => {
    const checkFormatSupport = async () => {
      const supported = new Set(['original']);

      // WebP 지원 확인
      if (formats.includes('webp')) {
        const webpSupport = await checkWebPSupport();

        if (webpSupport) {
          supported.add('webp');
        }
      }

      // AVIF 지원 확인
      if (formats.includes('avif')) {
        const avifSupport = await checkAVIFSupport();

        if (avifSupport) {
          supported.add('avif');
        }
      }

      setSupportedFormats(supported);
    };

    checkFormatSupport();
  }, [formats]);
  const getOptimizedWidth = useCallback(() => {
    if (width) {
      return width;
    }

    // 디바이스별 최적 너비
    if (isMobile) {
      return 400;
    }
    if (isTablet) {
      return 800;
    }

    return 1200;
  }, [width, isMobile, isTablet]);

  const getBestSupportedFormat = useCallback(() => {
    if (supportedFormats.has('avif')) {
      return 'avif';
    }
    if (supportedFormats.has('webp')) {
      return 'webp';
    }

    return 'auto';
  }, [supportedFormats]);

  const getAspectRatioClass = () => {
    if (!aspectRatio) {
      return '';
    }

    const ratios = {
      square: 'aspect-square',
      video: 'aspect-video',
      portrait: 'aspect-[3/4]',
      landscape: 'aspect-[4/3]',
    };

    if (typeof aspectRatio === 'string') {
      return ratios[aspectRatio] || '';
    }

    // 커스텀 비율 (예: 1.5 -> 3/2)
    const ratio = aspectRatio;
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const numerator = Math.round(ratio * 100);
    const denominator = 100;
    const commonDivisor = gcd(numerator, denominator);

    return `aspect-[${numerator / commonDivisor}/${denominator / commonDivisor}]`;
  };

  // 최적화된 이미지 URL 생성
  useEffect(() => {
    if (!src) {
      return;
    }

    // Cloudinary URL인 경우 최적화 파라미터 적용
    if (src.includes('cloudinary.com') || src.includes('res.cloudinary.com')) {
      const optimizedUrl = optimizeCloudinaryImage(src, {
        width: getOptimizedWidth(),
        quality,
        format: getBestSupportedFormat(),
        lazy,
      });

      setOptimizedSrc(optimizedUrl);
    } else {
      setOptimizedSrc(src);
    }
  }, [
    src,
    width,
    quality,
    supportedFormats,
    lazy,
    getBestSupportedFormat,
    getOptimizedWidth,
  ]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    // 이미지 다시 로드
    if (imgRef.current) {
      imgRef.current.src = optimizedSrc;
    }
  };

  // 에러 상태
  if (hasError) {
    return (
      <motion.div
        className={clsx(
          'flex items-center justify-center bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg',
          getAspectRatioClass(),
          className
        )}
        {...animations.fadeIn}
      >
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            이미지를 불러올 수 없습니다
          </p>
          <button
            onClick={handleRetry}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={clsx(
        'relative overflow-hidden',
        getAspectRatioClass(),
        className
      )}
    >
      {/* 블러 플레이스홀더 */}
      {isLoading && placeholder === 'blur' && blurDataURL && (
        <motion.img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-105"
          {...animations.fadeIn}
        />
      )}

      {/* 로딩 플레이스홀더 */}
      {isLoading && placeholder !== 'blur' && (
        <motion.div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center"
          {...animations.fadeIn}
        >
          {placeholder === 'empty' ? null : typeof placeholder === 'string' ? (
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          ) : (
            placeholder
          )}
        </motion.div>
      )}

      {/* 최적화된 이미지 */}
      <motion.img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={lazy ? 'lazy' : 'eager'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={clsx(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        animate={{
          opacity: isLoading ? 0 : 1,
          scale: isLoading ? 1.05 : 1,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* 로딩 인디케이터 */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20"
          {...animations.fadeIn}
        >
          <motion.div
            className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}
    </div>
  );
}

/**
 * 아바타 이미지 컴포넌트
 */
interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
  onClick?: () => void;
}

export function OptimizedAvatar({
  src,
  alt,
  size,
  fallback,
  className,
  onClick,
}: OptimizedAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const sizePixels = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  if (!src) {
    return (
      <div
        className={clsx(
          'rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center',
          sizeClasses[size],
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">
          {fallback ?? alt.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className={clsx(
        'rounded-full overflow-hidden',
        sizeClasses[size],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
    >
      <ImageOptimizer
        src={src}
        alt={alt}
        width={sizePixels[size]}
        height={sizePixels[size]}
        aspectRatio="square"
        priority={size === 'xl'}
        className="w-full h-full"
      />
    </motion.div>
  );
}

// 유틸리티 함수들
async function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();

    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

async function checkAVIFSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image();

    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

function optimizeCloudinaryImage(
  src: string,
  options: {
    width?: number;
    quality?: number;
    format?: string;
    lazy?: boolean;
  }
): string {
  const { width, quality, format, lazy } = options;

  // 이미 최적화된 URL인 경우 반환
  if (src.includes('/image/upload/')) {
    return src;
  }

  // Cloudinary 최적화 파라미터 적용
  const optimizations: string[] = [];

  if (quality) {
    optimizations.push(`q_${quality}`);
  }
  if (width) {
    optimizations.push(`w_${width}`);
  }
  if (format && format !== 'auto') {
    optimizations.push(`f_${format}`);
  }
  if (lazy) {
    optimizations.push('fl_lazy');
  }

  // 자동 최적화 추가
  optimizations.push('f_auto', 'dpr_auto');

  const transformation = optimizations.join(',');

  // URL에 변환 파라미터 삽입
  return src.replace('/image/upload/', `/image/upload/${transformation}/`);
}

export default ImageOptimizer;
