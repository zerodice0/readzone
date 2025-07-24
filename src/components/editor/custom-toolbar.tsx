'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { 
  Bold, 
  Italic, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered,
  Quote,
  Link,
  RotateCcw,
  Separator
} from 'lucide-react'

interface CustomToolbarProps {
  className?: string
}

/**
 * ReadZone 독후감 작성에 최적화된 커스텀 툴바 컴포넌트
 * 
 * 특징:
 * - 깔끔하고 직관적인 아이콘 기반 UI
 * - 독후감 작성에 필요한 핵심 기능만 포함
 * - 다크테마 완벽 지원
 * - 반응형 디자인
 */
export const CustomToolbar: React.FC<CustomToolbarProps> = ({ 
  className = '' 
}) => {
  return (
    <div 
      id="readzone-toolbar" 
      className={cn(
        // 기본 레이아웃
        "flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700",
        "bg-white dark:bg-gray-900",
        "rounded-t-lg overflow-x-auto",
        // 반응형
        "sm:gap-2 sm:justify-start",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
        className
      )}
    >
      {/* 텍스트 강조 그룹 */}
      <div className="flex items-center">
        <ToolbarButton format="bold" icon={Bold} tooltip="굵게 (Ctrl+B)" />
        <ToolbarButton format="italic" icon={Italic} tooltip="기울임 (Ctrl+I)" />
      </div>

      <ToolbarSeparator />

      {/* 제목 그룹 */}
      <div className="flex items-center">
        <ToolbarButton 
          format="header" 
          value="2" 
          icon={Heading2} 
          tooltip="제목 2"
        />
        <ToolbarButton 
          format="header" 
          value="3" 
          icon={Heading3} 
          tooltip="제목 3"
        />
      </div>

      <ToolbarSeparator />

      {/* 리스트 그룹 */}
      <div className="flex items-center">
        <ToolbarButton 
          format="list" 
          value="bullet" 
          icon={List} 
          tooltip="글머리 기호"
        />
        <ToolbarButton 
          format="list" 
          value="ordered" 
          icon={ListOrdered} 
          tooltip="번호 목록"
        />
      </div>

      <ToolbarSeparator />

      {/* 특수 기능 그룹 */}
      <div className="flex items-center">
        <ToolbarButton format="blockquote" icon={Quote} tooltip="인용구" />
        <ToolbarButton format="link" icon={Link} tooltip="링크 삽입" />
      </div>

      <ToolbarSeparator />

      {/* 초기화 */}
      <div className="flex items-center sm:ml-auto">
        <ToolbarButton format="clean" icon={RotateCcw} tooltip="서식 지우기" />
      </div>
    </div>
  )
}

/**
 * 툴바 버튼 컴포넌트
 */
interface ToolbarButtonProps {
  format: string
  value?: string
  icon: React.ComponentType<{ className?: string }>
  tooltip: string
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  format, 
  value, 
  icon: Icon, 
  tooltip 
}) => {
  const buttonClass = value ? `ql-${format}` : `ql-${format}`

  return (
    <button
      className={cn(
        buttonClass,
        // 기본 스타일
        "flex items-center justify-center w-8 h-8 rounded-md shrink-0",
        "text-gray-600 dark:text-gray-400",
        "hover:bg-gray-100 dark:hover:bg-gray-700",
        "hover:text-gray-900 dark:hover:text-gray-100",
        "active:bg-gray-200 dark:active:bg-gray-600",
        "transition-all duration-150",
        // 포커스 스타일
        "focus:outline-none focus:ring-2 focus:ring-primary-500/20",
        "focus:bg-gray-100 dark:focus:bg-gray-700",
        // 활성화 스타일 (Quill에서 자동 적용)
        "[&.ql-active]:bg-primary-500 [&.ql-active]:text-white",
        "[&.ql-active]:hover:bg-primary-600",
        "dark:[&.ql-active]:bg-primary-600 dark:[&.ql-active]:hover:bg-primary-700",
        // 터치 친화적
        "touch-manipulation"
      )}
      title={tooltip}
      {...(value && { value })}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

/**
 * 툴바 구분선
 */
const ToolbarSeparator = () => (
  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
)

export default CustomToolbar