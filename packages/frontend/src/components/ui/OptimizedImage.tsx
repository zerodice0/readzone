import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useIntersectionObserver } from '@/hooks/useVirtualization'

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string
  alt: string
  fallback?: string
  placeholder?: string
  quality?: number
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  onLoad?: () => void
  onError?: () => void
  className?: string
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallback,
  placeholder,
  priority = false,
  onLoad,
  onError,
  className = '',
  width,
  height,
  sizes,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)

  // Create optimized URL for different sizes
  const getOptimizedSrc = useCallback((originalSrc: string, w?: number) => {
    // If it's a Cloudinary URL, add transformations
    if (originalSrc.includes('cloudinary.com')) {
      const transformations = []

      if (w) {
        transformations.push(`w_${w}`)
      }

      transformations.push('f_auto', 'q_auto')

      if (transformations.length > 0) {
        return originalSrc.replace('/upload/', `/upload/${transformations.join(',')}/`)
      }
    }

    return originalSrc
  }, [])

  // Generate srcSet for responsive images
  const generateSrcSet = useCallback((originalSrc: string) => {
    const sizes = [320, 640, 768, 1024, 1280, 1536]

    return sizes
      .map(size => `${getOptimizedSrc(originalSrc, size)} ${size}w`)
      .join(', ')
  }, [getOptimizedSrc])

  // Intersection observer for lazy loading
  const setRef = useIntersectionObserver(
    useCallback((entries) => {
      const [entry] = entries

      if (entry?.isIntersecting && !priority) {
        setIsInView(true)
      }
    }, [priority])
  )

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setHasError(true)
    onError?.()
  }, [onError])

  useEffect(() => {
    // Preload critical images
    if (priority && src) {
      const img = new Image()

      img.src = getOptimizedSrc(src, width)
      img.onload = () => setIsLoaded(true)
      img.onerror = () => setHasError(true)
    }
  }, [priority, src, getOptimizedSrc, width])

  useEffect(() => {
    // Set ref for intersection observer
    if (imgRef.current && !priority) {
      setRef(imgRef.current)
    }
  }, [setRef, priority])

  // Show placeholder while loading
  if (!isInView && !priority) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
        style={{ width, height }}
        aria-label={`${alt} 로딩 중`}
      >
        {placeholder && (
          <div className="flex items-center justify-center h-full text-gray-400">
            {placeholder}
          </div>
        )}
      </div>
    )
  }

  // Show error fallback
  if (hasError && fallback) {
    return (
      <img
        src={fallback}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        {...props}
      />
    )
  }

  if (hasError && !fallback) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
        aria-label={`${alt} 로드 실패`}
      >
        <span className="text-gray-400 text-sm">이미지 로드 실패</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center"
          aria-hidden="true"
        >
          {placeholder && (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          )}
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={getOptimizedSrc(src, width)}
        srcSet={generateSrcSet(src)}
        sizes={sizes ?? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        width={width}
        height={height}
        {...props}
      />
    </div>
  )
}

// Higher-order component for profile images
export const ProfileImage: React.FC<{
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}> = ({ src, alt, size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 80, height: 80 },
    xl: { width: 120, height: 120 }
  }

  const { width, height } = sizeMap[size]

  if (!src) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center ${className}`}
        style={{ width, height }}
        aria-label={alt}
      >
        <span className="text-gray-500 font-bold">
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-full object-cover ${className}`}
      placeholder="👤"
      priority={size === 'xl'} // Prioritize large profile images
    />
  )
}