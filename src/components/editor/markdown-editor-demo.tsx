'use client'

import { useState } from 'react'
import MarkdownEditorWrapper from './markdown-editor-wrapper'
import toast from 'react-hot-toast'

/**
 * 마크다운 에디터 사용 예제
 * 독후감 작성 페이지에서 이 컴포넌트를 참고하여 구현하세요.
 */
export function MarkdownEditorDemo() {
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // 이미지 업로드 핸들러
  const handleImageUpload = async (file: File): Promise<string> => {
    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('파일 크기는 5MB 이하여야 합니다.')
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드 가능합니다.')
    }

    // FormData 생성
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('이미지 업로드 실패')
      }

      const data = await response.json()
      return data.url // 업로드된 이미지 URL 반환
    } catch (error) {
      console.error('Image upload error:', error)
      throw error
    }
  }

  // 저장 핸들러
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // 실제 구현에서는 API 호출로 저장
      await new Promise(resolve => setTimeout(resolve, 1000)) // 데모용 딜레이
      
      toast.success('저장되었습니다.')
      console.log('저장된 콘텐츠:', content)
    } catch (error) {
      toast.error('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">마크다운 에디터 데모</h2>
      
      <MarkdownEditorWrapper
        value={content}
        onChange={setContent}
        placeholder="독후감을 작성해보세요. 마크다운 문법을 사용할 수 있습니다."
        height="600px"
        previewStyle="vertical"
        enableImages={true}
        enableTables={true}
        autofocus={false}
        onImageUpload={handleImageUpload}
        onSave={handleSave}
        isLoading={isSaving}
      />

      {/* 디버그용 출력 */}
      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h3 className="font-semibold mb-2">마크다운 내용 ({content.length}자)</h3>
        <pre className="text-sm overflow-auto max-h-40 whitespace-pre-wrap">
          {content || '(아직 작성된 내용이 없습니다)'}
        </pre>
      </div>
    </div>
  )
}

/**
 * 사용 방법:
 * 
 * 1. 독후감 작성 페이지에서 이 에디터를 사용:
 * ```tsx
 * import MarkdownEditorWrapper from '@/components/editor/markdown-editor-wrapper'
 * 
 * function WritePage() {
 *   const [content, setContent] = useState('')
 *   
 *   return (
 *     <MarkdownEditorWrapper
 *       value={content}
 *       onChange={setContent}
 *       onImageUpload={handleImageUpload}
 *       onSave={handleSave}
 *     />
 *   )
 * }
 * ```
 * 
 * 2. 자동저장 기능과 함께 사용:
 * ```tsx
 * import { useAutosave } from '@/hooks/use-autosave'
 * 
 * function WritePage() {
 *   const [content, setContent] = useState('')
 *   const { save, isSaving, lastSaved } = useAutosave({
 *     data: { content },
 *     onSave: async (data) => {
 *       // 임시저장 API 호출
 *       await saveDraft(data)
 *     }
 *   })
 *   
 *   return (
 *     <>
 *       <MarkdownEditorWrapper
 *         value={content}
 *         onChange={setContent}
 *         onSave={save}
 *         isLoading={isSaving}
 *       />
 *       {lastSaved && (
 *         <p className="text-sm text-gray-500">
 *           마지막 저장: {lastSaved.toLocaleTimeString()}
 *         </p>
 *       )}
 *     </>
 *   )
 * }
 * ```
 * 
 * 3. 이미지 업로드 API (/api/upload/image) 구현 필요:
 * - 파일 크기 제한 (5MB)
 * - 파일 타입 검증 (image/*)
 * - 저장 후 URL 반환
 * 
 * 4. 마크다운 렌더링:
 * - 상세 페이지에서는 별도의 마크다운 렌더러 컴포넌트 필요
 * - react-markdown 또는 @toast-ui/editor의 Viewer 사용
 */