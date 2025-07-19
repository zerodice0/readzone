import { useState, useEffect, useRef } from 'react';

interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  fallbackSrc?: string;
}

export const useLazyImage = (
  src: string,
  options: UseLazyImageOptions = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    fallbackSrc = ''
  } = options;

  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Intersection Observer를 지원하지 않는 브라우저에서는 즉시 로드
    if (!('IntersectionObserver' in window)) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(img);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(img);

    return () => {
      observer.unobserve(img);
    };
  }, [src, threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  return {
    imgRef,
    imageSrc,
    isLoaded,
    hasError,
    handleLoad,
    handleError,
  };
};

export default useLazyImage;