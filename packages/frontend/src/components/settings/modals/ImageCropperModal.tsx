import React, { useCallback, useRef, useState } from 'react'
import { clsx } from 'clsx'

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface ImageCropperModalProps {
  isOpen: boolean
  imageUrl: string
  onClose: () => void
  onSave: (croppedImageBlob: Blob) => void
  aspectRatio?: number // width/height, 1 for square
  title?: string
}

/**
 * 이미지 크롭 모달 컴포넌트
 * 프로필 이미지 편집에 사용
 */
export function ImageCropperModal({
  isOpen,
  imageUrl,
  onClose,
  onSave,
  aspectRatio = 1,
  title = '이미지 편집'
}: ImageCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)

  // 이미지 로드 완료 처리
  const handleImageLoad = useCallback(() => {
    const image = imageRef.current

    if (!image) {return}

    const containerWidth = 400
    const containerHeight = 300

    // 이미지를 컨테이너에 맞게 스케일링
    const scaleX = containerWidth / image.naturalWidth
    const scaleY = containerHeight / image.naturalHeight
    const initialScale = Math.min(scaleX, scaleY, 1)

    setScale(initialScale)

    // 초기 크롭 영역 설정 (중앙에 정사각형)
    const cropSize = Math.min(image.naturalWidth, image.naturalHeight) * 0.8
    const initialCrop = {
      x: (image.naturalWidth - cropSize) / 2,
      y: (image.naturalHeight - cropSize) / 2,
      width: cropSize,
      height: cropSize / aspectRatio
    }

    setCropArea(initialCrop)
    setImageLoaded(true)
  }, [aspectRatio])

  // 마우스 다운 이벤트 (드래그 시작)
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / scale
    const y = (event.clientY - rect.top) / scale

    // 크롭 영역 내부를 클릭한 경우 드래그 모드
    if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true)
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y })
    }
  }, [cropArea, scale])

  // 마우스 이동 이벤트
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) {return}

    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / scale
    const y = (event.clientY - rect.top) / scale

    const newX = Math.max(0, Math.min(x - dragStart.x, imageRef.current.naturalWidth - cropArea.width))
    const newY = Math.max(0, Math.min(y - dragStart.y, imageRef.current.naturalHeight - cropArea.height))

    setCropArea(prev => ({ ...prev, x: newX, y: newY }))
  }, [isDragging, dragStart, cropArea.width, cropArea.height, scale])

  // 마우스 업 이벤트
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 크롭 영역 크기 변경
  const handleCropSizeChange = useCallback((newSize: number) => {
    const image = imageRef.current

    if (!image) {return}

    const maxSize = Math.min(image.naturalWidth, image.naturalHeight)
    const size = Math.max(50, Math.min(newSize, maxSize))

    const newWidth = size
    const newHeight = size / aspectRatio

    // 크롭 영역이 이미지를 벗어나지 않도록 조정
    const newX = Math.max(0, Math.min(cropArea.x, image.naturalWidth - newWidth))
    const newY = Math.max(0, Math.min(cropArea.y, image.naturalHeight - newHeight))

    setCropArea({ x: newX, y: newY, width: newWidth, height: newHeight })
  }, [aspectRatio, cropArea.x, cropArea.y])

  // 이미지 크롭 및 저장
  const handleSave = useCallback(async () => {
    const image = imageRef.current
    const canvas = canvasRef.current

    if (!image || !canvas) {return}

    setIsLoading(true)

    try {
      const ctx = canvas.getContext('2d')

      if (!ctx) {throw new Error('Canvas context not available')}

      // 캔버스 크기 설정 (정사각형으로 출력)
      const outputSize = 400

      canvas.width = outputSize
      canvas.height = outputSize

      // 크롭된 이미지를 캔버스에 그리기
      ctx.drawImage(
        image,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, outputSize, outputSize
      )

      // 캔버스를 Blob으로 변환
      canvas.toBlob((blob) => {
        if (blob) {
          onSave(blob)
        }
        setIsLoading(false)
      }, 'image/jpeg', 0.9)
    } catch (error) {
      console.error('Image crop failed:', error)
      setIsLoading(false)
    }
  }, [cropArea, onSave])

  if (!isOpen) {return null}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 이미지 편집 영역 */}
        <div className="p-6">
          <div className="space-y-4">
            {/* 이미지 미리보기 */}
            <div className="flex justify-center">
              <div
                className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
                style={{ width: 400, height: 300 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="편집할 이미지"
                  onLoad={handleImageLoad}
                  className="w-full h-full object-contain"
                  style={{ transform: `scale(${scale})` }}
                />

                {/* 크롭 영역 오버레이 */}
                {imageLoaded && (
                  <>
                    {/* 어두운 오버레이 */}
                    <div className="absolute inset-0 bg-black bg-opacity-40" />

                    {/* 크롭 영역 (투명) */}
                    <div
                      className="absolute border-2 border-white bg-transparent"
                      style={{
                        left: cropArea.x * scale,
                        top: cropArea.y * scale,
                        width: cropArea.width * scale,
                        height: cropArea.height * scale,
                        cursor: isDragging ? 'grabbing' : 'grab'
                      }}
                    >
                      {/* 크롭 영역 모서리 핸들 */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 rounded-full" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400 rounded-full" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400 rounded-full" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 rounded-full" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 크롭 크기 조절 */}
            {imageLoaded && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  크롭 크기
                </label>
                <input
                  type="range"
                  min="50"
                  max={Math.min(imageRef.current?.naturalWidth ?? 400, imageRef.current?.naturalHeight ?? 400)}
                  value={cropArea.width}
                  onChange={(e) => handleCropSizeChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* 미리보기 */}
            {imageLoaded && (
              <div className="flex justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">미리보기</p>
                  <div className="w-20 h-20 border border-gray-300 dark:border-gray-600 rounded-full overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-cover"
                      style={{ display: 'none' }}
                    />
                    <div
                      className="w-full h-full bg-gray-100 dark:bg-gray-700"
                      style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: `${(imageRef.current?.naturalWidth ?? 1) * scale / cropArea.width * 100}% ${(imageRef.current?.naturalHeight ?? 1) * scale / cropArea.height * 100}%`,
                        backgroundPosition: `-${cropArea.x * scale / cropArea.width * 100}% -${cropArea.y * scale / cropArea.height * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !imageLoaded}
            className={clsx(
              'px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors',
              isLoading || !imageLoaded
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-700'
            )}
          >
            {isLoading ? '저장 중...' : '적용'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageCropperModal