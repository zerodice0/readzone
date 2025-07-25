'use client'

import React from 'react'
import { useTheme } from '@/contexts/theme-context'

/**
 * React Quill 에디터용 다크테마 CSS 컴포넌트
 * ReadZone 디자인 시스템과 완벽하게 일치하는 Tailwind CSS 기반 스타일
 */
export const QuillDarkTheme: React.FC = () => {
  const { theme, isLoaded } = useTheme()

  if (!isLoaded || theme !== 'dark') return null

  return (
    <style jsx global>{`
      /* ========================
         QUILL EDITOR DARK THEME
         ReadZone 디자인 시스템 기반
         ======================== */

      /* 에디터 컨테이너 */
      .quill-wrapper.dark-theme .ql-container {
        background-color: rgb(31 41 55); /* bg-gray-800 */
        border-color: rgb(55 65 81);     /* border-gray-700 */
        color: rgb(243 244 246);         /* text-gray-100 */
      }
      
      /* 에디터 내용 영역 */
      .quill-wrapper.dark-theme .ql-editor {
        background-color: rgb(31 41 55); /* bg-gray-800 */
        color: rgb(243 244 246);         /* text-gray-100 */
        caret-color: rgb(239 68 68);     /* caret-primary-500 */
      }
      
      /* 플레이스홀더 */
      .quill-wrapper.dark-theme .ql-editor.ql-blank::before {
        color: rgb(156 163 175);         /* text-gray-400 */
        font-style: normal;
        opacity: 0.8;
      }
      
      /* 에디터 포커스 상태 */
      .quill-wrapper.dark-theme .ql-container.ql-focus {
        border-color: rgb(239 68 68);    /* border-primary-500 */
        box-shadow: 0 0 0 1px rgb(239 68 68 / 0.2); /* shadow-primary-500/20 */
      }

      /* ========================
         텍스트 스타일링
         ======================== */
      
      /* Bold 텍스트 */
      .quill-wrapper.dark-theme .ql-editor strong {
        color: rgb(255 255 255);         /* text-white */
        font-weight: 600;
      }
      
      /* Italic 텍스트 */
      .quill-wrapper.dark-theme .ql-editor em {
        color: rgb(229 231 235);         /* text-gray-200 */
      }
      
      /* 제목들 */
      .quill-wrapper.dark-theme .ql-editor h1,
      .quill-wrapper.dark-theme .ql-editor h2,
      .quill-wrapper.dark-theme .ql-editor h3 {
        color: rgb(255 255 255);         /* text-white */
        border-bottom: 1px solid rgb(75 85 99); /* border-gray-600 */
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
      }
      
      /* 인용구 */
      .quill-wrapper.dark-theme .ql-editor blockquote {
        background-color: rgb(17 24 39); /* bg-gray-900 */
        border-left: 4px solid rgb(239 68 68); /* border-l-primary-500 */
        border-radius: 0 0.375rem 0.375rem 0; /* rounded-r-md */
        padding: 1rem;
        margin: 1rem 0;
        color: rgb(156 163 175);         /* text-gray-400 */
        font-style: italic;
        position: relative;
      }
      
      .quill-wrapper.dark-theme .ql-editor blockquote::before {
        content: '"';
        font-size: 3rem;
        color: rgb(239 68 68 / 0.3);     /* text-primary-500/30 */
        position: absolute;
        top: -0.5rem;
        left: 0.5rem;
        font-family: Georgia, serif;
      }

      /* ========================
         리스트 스타일링
         ======================== */
      
      /* 순서 있는 리스트 */
      .quill-wrapper.dark-theme .ql-editor ol {
        padding-left: 1.5rem;
        margin: 1rem 0;
      }
      
      .quill-wrapper.dark-theme .ql-editor ol > li {
        color: rgb(209 213 219);         /* text-gray-300 */
        margin-bottom: 0.5rem;
        line-height: 1.6;
      }
      
      .quill-wrapper.dark-theme .ql-editor ol > li::marker {
        color: rgb(239 68 68);           /* text-primary-500 */
        font-weight: 600;
      }
      
      /* 순서 없는 리스트 */
      .quill-wrapper.dark-theme .ql-editor ul {
        padding-left: 1.5rem;
        margin: 1rem 0;
      }
      
      .quill-wrapper.dark-theme .ql-editor ul > li {
        color: rgb(209 213 219);         /* text-gray-300 */
        margin-bottom: 0.5rem;
        line-height: 1.6;
      }
      
      .quill-wrapper.dark-theme .ql-editor ul > li::marker {
        color: rgb(239 68 68);           /* text-primary-500 */
      }

      /* ========================
         링크 스타일링
         ======================== */
      
      .quill-wrapper.dark-theme .ql-editor a {
        color: rgb(96 165 250);          /* text-blue-400 */
        text-decoration: underline;
        text-underline-offset: 2px;
        transition: all 0.2s ease;
      }
      
      .quill-wrapper.dark-theme .ql-editor a:hover {
        color: rgb(147 197 253);         /* text-blue-300 */
        text-decoration-thickness: 2px;
      }
      
      .quill-wrapper.dark-theme .ql-editor a:visited {
        color: rgb(196 181 253);         /* text-violet-300 */
      }

      /* ========================
         기타 텍스트 요소들
         ======================== */
      
      /* 코드 (인라인) */
      .quill-wrapper.dark-theme .ql-editor code {
        background-color: rgb(17 24 39); /* bg-gray-900 */
        color: rgb(251 191 36);          /* text-amber-400 */
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        border: 1px solid rgb(75 85 99); /* border-gray-600 */
      }
      
      /* 구분선 */
      .quill-wrapper.dark-theme .ql-editor hr {
        border: none;
        border-top: 2px solid rgb(75 85 99); /* border-gray-600 */
        margin: 2rem 0;
        opacity: 0.6;
      }

      /* ========================
         스크롤바 스타일링
         ======================== */
      
      .quill-wrapper.dark-theme .ql-editor {
        scrollbar-width: thin;
        scrollbar-color: rgb(75 85 99) rgb(31 41 55); /* thumb: gray-600, track: gray-800 */
      }
      
      .quill-wrapper.dark-theme .ql-editor::-webkit-scrollbar {
        width: 8px;
      }
      
      .quill-wrapper.dark-theme .ql-editor::-webkit-scrollbar-track {
        background: rgb(31 41 55);       /* bg-gray-800 */
        border-radius: 4px;
      }
      
      .quill-wrapper.dark-theme .ql-editor::-webkit-scrollbar-thumb {
        background: rgb(75 85 99);       /* bg-gray-600 */
        border-radius: 4px;
        border: 2px solid rgb(31 41 55); /* border-gray-800 */
      }
      
      .quill-wrapper.dark-theme .ql-editor::-webkit-scrollbar-thumb:hover {
        background: rgb(107 114 128);    /* bg-gray-500 */
      }

      /* ========================
         선택 영역 스타일링
         ======================== */
      
      .quill-wrapper.dark-theme .ql-editor ::selection {
        background-color: rgb(239 68 68 / 0.3); /* bg-primary-500/30 */
        color: rgb(255 255 255);         /* text-white */
      }
      
      .quill-wrapper.dark-theme .ql-editor ::-moz-selection {
        background-color: rgb(239 68 68 / 0.3); /* bg-primary-500/30 */
        color: rgb(255 255 255);         /* text-white */
      }

      /* ========================
         애니메이션 및 전환 효과
         ======================== */
      
      .quill-wrapper.dark-theme .ql-editor * {
        transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
      }
      
      /* 타이핑 시 부드러운 효과 */
      .quill-wrapper.dark-theme .ql-editor {
        transition: all 0.2s ease;
      }
      
      .quill-wrapper.dark-theme .ql-editor:focus-within {
        background-color: rgb(17 24 39); /* bg-gray-900 */
      }

      /* ========================
         접근성 개선
         ======================== */
      
      /* 고대비 모드 지원 */
      @media (prefers-contrast: high) {
        .quill-wrapper.dark-theme .ql-editor {
          color: rgb(255 255 255);       /* text-white */
          background-color: rgb(0 0 0);  /* bg-black */
        }
        
        .quill-wrapper.dark-theme .ql-editor blockquote {
          border-left-color: rgb(255 255 255); /* border-white */
          background-color: rgb(17 17 17);     /* bg-gray-950 */
        }
      }
      
      /* 화면 리더 최적화 */
      .quill-wrapper.dark-theme .ql-editor [aria-hidden="true"] {
        opacity: 0.7;
      }
    `}</style>
  )
}

export default QuillDarkTheme