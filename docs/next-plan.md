📋 관련 파일 분석

  1. 직접적 관련 파일

  - rich-text-editor.tsx: 메인 에디터 컴포넌트
  - custom-toolbar.tsx: 커스텀 툴바 (ref와 무관)
  - quill-dark-theme.tsx: 다크 테마 CSS (ref와 무관)

  2. 사용하는 파일들

  - write-review-form.tsx: RichTextEditor를 import하여 사용
  - 기타 댓글 폼들에서도 사용

  3. ref 사용 목적 분석

  현재 quillRef는 선언되었지만 실제로 사용되지 않음:
  - 54번 라인에서 선언
  - 145번 라인에서 전달
  - 그 외 어디서도 참조되지 않음

  ⚡ 최적 해결 방안

  방법 1: ref 완전 제거 (가장 권장)

  // quillRef 관련 코드 모두 제거
  // const quillRef = useRef<any>(null)  // 삭제

  <ReactQuill
    // ref={quillRef as any}  // 삭제
    theme="snow"
    value={value}
    onChange={handleChange}
    // ...
  />

  장점:
  - 타입 에러 완전 해결
  - 불필요한 코드 제거
  - 성능상 이점 (불필요한 ref 생성 방지)

  방법 2: 올바른 ref 타입 정의

  import { ReactQuill as ReactQuillType } from 'react-quill'

  const quillRef = useRef<ReactQuillType>(null)

  <ReactQuill
    ref={quillRef}
    // ...
  />

  방법 3: 콜백 ref 사용

  const [quillInstance, setQuillInstance] = useState<any>(null)

  const handleQuillRef = useCallback((reactQuillComponent: any) => {
    if (reactQuillComponent) {
      setQuillInstance(reactQuillComponent.getEditor())
    }
  }, [])

  <ReactQuill
    ref={handleQuillRef}
    // ...
  />

  🎯 SuperClaude 명령어 가이드

  즉시 실행 가능한 명령어

  /improve @src/components/editor/rich-text-editor.tsx --focus quality
  목적: ref 제거 및 코드 정리

  /cleanup @src/components/editor/rich-text-editor.tsx
  목적: 불필요한 코드 제거 및 최적화

  /refactor @src/components/editor/rich-text-editor.tsx --type remove-unused
  목적: 사용되지 않는 ref 코드 리팩토링

  심화 분석용 명령어

  /analyze @src/components/editor/ --focus architecture --depth deep
  목적: 에디터 전체 구조 분석

  /troubleshoot "react-quill ref type error" @src/components/editor/
  목적: React Quill ref 관련 이슈 종합 분석

  🏆 최종 권장사항

  1순위: ref 완전 제거

  /cleanup @src/components/editor/rich-text-editor.tsx --remove-unused-refs

  이유:
  - 현재 quillRef가 실제로 사용되지 않음
  - 타입 에러 완전 해결
  - 코드 간소화

  2순위: 향후 확장성 고려

  만약 미래에 Quill 인스턴스 접근이 필요하다면:

  /implement "quill instance access pattern"
  @src/components/editor/rich-text-editor.tsx

  📋 구체적 수정 계획

  Phase 1: 즉시 수정

  1. quillRef 관련 코드 제거
  2. 타입 에러 완전 해결
  3. 기능 테스트

  Phase 2: 최적화

  1. 에디터 성능 개선
  2. 타입 안전성 강화
  3. 코드 리팩토링

  Phase 3: 확장성

  1. 필요시 올바른 ref 패턴 구현
  2. 에디터 인스턴스 접근 API 추가

  🚀 즉시 실행 명령어

  /improve @src/components/editor/rich-text-editor.tsx --remove-unused
  --fix-**types**