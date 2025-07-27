# ReadZone 개발 가이드

## TypeScript 설정 규칙

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## 코드 작성 원칙

### 1. 타입 안정성
- **any 타입 사용 금지**
- 모든 함수의 매개변수와 반환값에 명시적 타입 정의
- interface/type을 활용한 명확한 타입 정의

### 2. 순수 함수와 불변성
- 최대한 순수 함수로 작성 (같은 입력 → 같은 출력)
- 사이드이펙트 최소화
- `const` 기본 사용, `let`은 필요한 경우만
- 객체/배열 변경 시 spread operator 또는 immer 사용

### 3. 함수형 프로그래밍
```typescript
// 좋은 예
const addTax = (price: number, taxRate: number): number => 
  price * (1 + taxRate);

// 피해야 할 예
let total = 0;
function addToTotal(price: number): void {
  total += price; // 사이드이펙트
}
```

## ESLint 규칙 준수 (필수)

### 🚨 React Hooks 규칙 (react-hooks/exhaustive-deps, react-hooks/rules-of-hooks)

**1. 조건부 Hook 사용 금지**
```typescript
// ❌ 잘못된 예 - 조건부 Hook 호출
const MyComponent = ({ id }: { id?: string }) => {
  const generatedId = id ? null : useId() // 위반!
  return <div id={id || generatedId} />
}

// ✅ 올바른 예 - Hook을 항상 호출
const MyComponent = ({ id }: { id?: string }) => {
  const generatedId = useId()
  return <div id={id || `generated-${generatedId}`} />
}
```

**2. useEffect 의존성 배열 완성**
```typescript
// ❌ 잘못된 예 - 의존성 누락
useEffect(() => {
  if (enabled && lastData && !isEqual(currentData, lastData)) {
    saveToStorage(currentData)
  }
}, []) // enabled, lastData, isEqual, currentData, saveToStorage 누락!

// ✅ 올바른 예 - 모든 의존성 포함
useEffect(() => {
  if (enabled && lastData && !isEqual(currentData, lastData)) {
    saveToStorage(currentData)
  }
}, [enabled, lastData, isEqual, currentData, saveToStorage])
```

**3. 복잡한 cleanup 함수 패턴**
```typescript
// ❌ 잘못된 예 - cleanup에서 외부 변수 직접 사용
useEffect(() => {
  return () => {
    cancel() // 클로저로 인한 stale reference 위험
    if (enabled && hasChanges) {
      saveData(data) // 의존성 누락으로 인한 문제
    }
  }
}, []) // 빈 의존성 배열이지만 외부 변수 사용

// ✅ 올바른 예 - ref 패턴으로 최신 값 접근
const latestValuesRef = useRef({ enabled, data, hasChanges, saveData, cancel })
useEffect(() => {
  latestValuesRef.current = { enabled, data, hasChanges, saveData, cancel }
}, [enabled, data, hasChanges, saveData, cancel])

useEffect(() => {
  return () => {
    const { cancel, enabled, hasChanges, saveData, data } = latestValuesRef.current
    cancel()
    if (enabled && hasChanges) {
      saveData(data)
    }
  }
}, [])
```

**4. 메모이제이션 의존성 관리**
```typescript
// ❌ 잘못된 예 - 매번 새로운 객체 생성
const config = { ...DEFAULT_CONFIG, ...userConfig }
const result = useMemo(() => processData(config), [config]) // config가 매번 변경됨

// ✅ 올바른 예 - 객체를 메모이제이션
const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig])
const result = useMemo(() => processData(config), [config])
```

**5. 디바운스/Throttle 함수 의존성**
```typescript
// ❌ 잘못된 예 - 외부 라이브러리 함수는 의존성으로 인식되지 않음
const debouncedFn = useCallback(
  debounce(async () => { await onAction() }, 300),
  [onAction] // debounce는 의존성으로 인식되지 않아 문제 발생
)

// ✅ 올바른 예 - 인라인 구현으로 해결
const timeoutRef = useRef<NodeJS.Timeout>()
const debouncedFn = useCallback(async () => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current)
  timeoutRef.current = setTimeout(async () => {
    await onAction()
  }, 300)
}, [onAction])
```

### 🖼️ Next.js 이미지 최적화 (next/next/no-img-element)

**모든 이미지는 Next.js Image 컴포넌트 사용 필수**
```typescript
// ❌ 금지 - 일반 img 태그
<img src={book.thumbnail} alt={book.title} className="w-20 h-28" />

// ✅ 필수 - Next.js Image 컴포넌트
import Image from 'next/image'
<Image 
  src={book.thumbnail} 
  alt={book.title}
  width={80}
  height={112}
  className="w-20 h-28 object-cover"
/>
```

**Image 컴포넌트 필수 속성**:
- `width`, `height`: 명시적 크기 지정 (성능 최적화)
- `alt`: 접근성을 위한 대체 텍스트
- 적절한 `className`으로 스타일링

### 🔤 JSX 문자 이스케이프 (react/no-unescaped-entities)

```typescript
// ❌ 금지 - 특수문자 직접 사용
<p>Don't use quotes like this & that</p>

// ✅ 필수 - HTML 엔티티 또는 문자열 사용
<p>Don&apos;t use quotes like this &amp; that</p>
// 또는
<p>{"Don't use quotes like this & that"}</p>
```

### ♿ 접근성 규칙 (jsx-a11y/alt-text)

```typescript
// ❌ 금지 - alt 속성 누락
<Image src={image} width={100} height={100} />

// ✅ 필수 - 의미있는 alt 텍스트
<Image 
  src={userImage} 
  alt={`${user.nickname}의 프로필 사진`}
  width={100} 
  height={100} 
/>

// 장식용 이미지인 경우
<Image 
  src={decorativeImage} 
  alt=""
  width={100} 
  height={100} 
/>
```

## 📝 개발 워크플로우

### 1. 코드 작성 전 체크리스트
- Hook을 조건문 내에서 호출하지 않았는가?
- useEffect의 모든 의존성을 포함했는가?
- 이미지는 Next.js Image 컴포넌트를 사용했는가?
- JSX 내 특수문자를 적절히 이스케이프했는가?
- 모든 이미지에 alt 속성을 추가했는가?

### 2. 코드 작성 후 필수 검증
```bash
# 린트 에러 확인 (0개여야 함)
npm run lint

# 타입 체크
npm run type-check
```

### 3. 자주 발생하는 실수 패턴
- IntersectionObserver cleanup에서 stale reference 사용
- 객체 스프레드 연산자로 인한 불필요한 재렌더링
- 외부 라이브러리 함수의 의존성 누락
- 조건부 Hook 호출
- img 태그 대신 Image 컴포넌트 미사용

### 4. 문제 발생 시 해결 순서
1. 에러 메시지를 정확히 읽고 어떤 규칙을 위반했는지 파악
2. 위 가이드에서 해당 패턴 확인
3. 올바른 패턴으로 수정
4. `npm run lint`로 검증
5. 기능이 정상 동작하는지 확인

## 🎯 목표: 완벽한 린트 준수
**모든 코드는 린트 에러 0개, 경고 0개를 유지해야 합니다.**

## 코드 품질 기준
- TypeScript strict 모드 준수
- ESLint 규칙 준수
- 단위 테스트 커버리지 80% 이상
- 성능 메트릭 기준치 충족

## 검토 프로세스
1. **기능 검토**: PRD 명세 대비 완성도
2. **코드 검토**: 코딩 스타일 및 품질
3. **성능 검토**: 로딩 속도 및 반응성
4. **사용성 검토**: UX/UI 사용 편의성

## 디버깅 가이드

### React DevTools 활용
```typescript
// 컴포넌트 성능 측정
if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000)
  })
}
```

### 에러 경계 활용
```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }
    return this.props.children
  }
}
```

## 성능 최적화 체크리스트

### React 최적화
- [ ] 불필요한 리렌더링 방지 (React.memo)
- [ ] 무거운 계산 메모이제이션 (useMemo)
- [ ] 콜백 함수 메모이제이션 (useCallback)
- [ ] 큰 리스트 가상화 (react-window)

### Next.js 최적화
- [ ] 이미지 최적화 (next/image)
- [ ] 동적 임포트 활용
- [ ] API 응답 캐싱
- [ ] 정적 생성 페이지 활용

### 번들 최적화
- [ ] Tree shaking 확인
- [ ] 불필요한 의존성 제거
- [ ] 번들 분석 도구 활용
- [ ] 코드 스플리팅 적용

## 보안 체크리스트

### 입력 검증
- [ ] 모든 사용자 입력 검증
- [ ] SQL Injection 방지
- [ ] XSS 방지
- [ ] CSRF 보호

### 인증/인가
- [ ] 세션 관리 확인
- [ ] 권한 검증 로직
- [ ] 민감 정보 보호
- [ ] 안전한 쿠키 설정

### API 보안
- [ ] Rate limiting
- [ ] API 키 보호
- [ ] CORS 설정
- [ ] 에러 메시지 필터링