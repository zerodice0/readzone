/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 전역 타입 확장
declare global {
  interface Window {
    __unsavedChanges?: boolean
  }
}

export {}