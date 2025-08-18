# 13. 신고/차단 관리 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/moderation`
- **우선순위**: 3순위 (Enhanced Features)
- **설명**: 커뮤니티 안전 기능 - 신고, 차단, 커뮤니티 가이드라인 관리
- **인증**: 로그인 필수

## 📋 참조 문서

### 사용자 플로우
- **[커뮤니티 안전](../user-flows/safety.md)** - 신고 기능, 차단, 커뮤니티 가이드라인
- **[소셜 상호작용](../user-flows/social-interaction.md)** - 신고 트리거, 차단 효과
- **[오류 처리](../user-flows/error-handling.md)** - 신고 처리 실패, 복구

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 신고/차단의 커뮤니티 안전 체인
- **[사용자 흐름도 개요](../user-flows.md)** - 커뮤니티 안전 흐름

### 관련 PRD 문서
- **[독후감 상세 페이지](./05-review-detail.md)** - 콘텐츠 신고 기능
- **[프로필 페이지](./07-profile.md)** - 사용자 차단 기능
- **[설정 페이지](./08-settings.md)** - 차단 목록 관리
- **[메인 피드 페이지](./01-main-feed.md)** - 차단된 콘텐츠 숨김 처리

## 핵심 기능

### 1. 신고 시스템
- **6가지 신고 유형**: 스팸, 괴롭힘, 혐오표현, 성적 콘텐츠, 폭력적 콘텐츠, 기타
- **상세 신고**: 구체적 사유와 증거 제출
- **익명 신고**: 신고자 신원 보호
- **24시간 검토**: 신고 접수 후 24시간 내 검토 완료

### 2. 사용자 차단 기능
- **콘텐츠 숨김**: 차단한 사용자의 독후감, 댓글 숨김 처리
- **상호작용 차단**: 좋아요, 댓글, 팔로우 등 모든 상호작용 차단
- **차단 목록**: 차단한 사용자 목록 관리
- **차단 해제**: 언제든 차단 해제 가능

### 3. 나의 신고/차단 현황
- **신고 내역**: 내가 신고한 내용과 처리 현황
- **차단 목록**: 현재 차단 중인 사용자 목록
- **받은 조치**: 내 계정에 대한 제재 내역 (투명성)
- **이의 제기**: 부당한 제재에 대한 이의 제기

### 4. 커뮤니티 가이드라인
- **행동 규범**: 커뮤니티 이용 수칙
- **제재 정책**: 위반 시 제재 단계 안내
- **신고 가이드**: 효과적인 신고 방법 안내
- **교육 콘텐츠**: 건전한 커뮤니티 문화 조성

## 필요한 API

### POST `/api/moderation/report`
```typescript
interface ReportRequest {
  targetType: 'review' | 'comment' | 'user';
  targetId: string;
  category: 'spam' | 'harassment' | 'hate_speech' | 'sexual_content' | 'violence' | 'other';
  reason: string;
  evidence?: {
    screenshots?: string[]; // 이미지 URL들
    description?: string;   // 추가 설명
  };
  isAnonymous: boolean;
}

interface ReportResponse {
  success: boolean;
  reportId: string;
  message: string;
  estimatedReviewTime: string; // "24시간 내"
  
  // 자동 처리 결과 (명백한 위반의 경우)
  immediateAction?: {
    actionTaken: 'warning' | 'content_hidden' | 'temporary_suspension';
    duration?: string; // 임시 정지인 경우
  };
}
```

### POST `/api/moderation/block`
```typescript
interface BlockUserRequest {
  userId: string;
  reason?: string;
}

interface BlockUserResponse {
  success: boolean;
  message: string;
  blockedUser: {
    id: string;
    username: string;
    blockedAt: string;
  };
  
  // 차단 효과 안내
  effects: {
    contentHidden: boolean;
    interactionsPrevented: boolean;
    notificationsBlocked: boolean;
  };
}
```

### DELETE `/api/moderation/block/[userId]`
```typescript
interface UnblockUserResponse {
  success: boolean;
  message: string;
  unblockedUser: {
    id: string;
    username: string;
    unblockedAt: string;
  };
}
```

### GET `/api/moderation/my-reports`
```typescript
interface MyReportsRequest {
  status?: 'pending' | 'reviewed' | 'dismissed';
  cursor?: string;
  limit?: number;
}

interface MyReportsResponse {
  reports: Array<{
    id: string;
    targetType: 'review' | 'comment' | 'user';
    targetId: string;
    category: string;
    reason: string;
    status: 'pending' | 'under_review' | 'action_taken' | 'dismissed';
    createdAt: string;
    reviewedAt?: string;
    
    // 처리 결과
    moderatorResponse?: {
      action: 'warning_issued' | 'content_removed' | 'user_suspended' | 'no_violation_found';
      explanation: string;
      appealable: boolean;
    };
    
    // 대상 정보 (삭제되지 않은 경우)
    target?: {
      content: string; // 미리보기
      author?: {
        username: string;
      };
    };
  }>;
  
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
  
  summary: {
    pending: number;
    actionTaken: number;
    dismissed: number;
  };
}
```

### GET `/api/moderation/blocked-users`
```typescript
interface BlockedUsersResponse {
  blockedUsers: Array<{
    id: string;
    username: string;
    profileImage?: string;
    blockedAt: string;
    reason?: string;
    
    // 통계
    stats: {
      reviewCount: number;
      followerCount: number;
    };
  }>;
  
  total: number;
  lastUpdated: string;
}
```

### GET `/api/moderation/my-violations`
```typescript
interface MyViolationsResponse {
  violations: Array<{
    id: string;
    type: 'warning' | 'content_removal' | 'temporary_suspension' | 'permanent_suspension';
    category: string;
    reason: string;
    issuedAt: string;
    expiresAt?: string; // 임시 정지인 경우
    
    // 관련 콘텐츠
    relatedContent?: {
      type: 'review' | 'comment';
      id: string;
      content: string; // 미리보기
      removedContent?: string; // 삭제된 부분
    };
    
    // 이의 제기 정보
    appeal?: {
      status: 'pending' | 'approved' | 'denied';
      submittedAt: string;
      response?: string;
    };
    
    canAppeal: boolean;
    appealDeadline?: string;
  }>;
  
  currentStatus: {
    isSuspended: boolean;
    suspensionExpiresAt?: string;
    restrictedActions: string[];
  };
}
```

### POST `/api/moderation/appeal`
```typescript
interface AppealRequest {
  violationId: string;
  reason: string;
  evidence?: string; // 반박 증거
}

interface AppealResponse {
  success: boolean;
  appealId: string;
  message: string;
  estimatedReviewTime: string;
}
```

### GET `/api/moderation/guidelines`
```typescript
interface GuidelinesResponse {
  sections: Array<{
    id: string;
    title: string;
    content: string;
    examples: Array<{
      type: 'good' | 'bad';
      description: string;
      example: string;
    }>;
  }>;
  
  policies: {
    reportingProcess: string;
    escalationSteps: Array<{
      level: number;
      violation: string;
      action: string;
      duration?: string;
    }>;
    appealProcess: string;
  };
  
  lastUpdated: string;
  version: string;
}
```

## 컴포넌트 구조

### 1. ModerationPage (메인 컴포넌트)
```typescript
interface ModerationPageProps {
  initialTab?: 'reports' | 'blocked' | 'violations' | 'guidelines';
}

// 상태 관리
- activeTab: 'reports' | 'blocked' | 'violations' | 'guidelines'
- reports: Report[]
- blockedUsers: BlockedUser[]
- violations: Violation[]
- isLoading: boolean
```

### 2. ReportModal (신고 모달)
```typescript
interface ReportModalProps {
  isOpen: boolean;
  targetType: 'review' | 'comment' | 'user';
  targetId: string;
  targetContent?: string; // 미리보기용
  onClose: () => void;
  onSubmit: (report: ReportRequest) => Promise<void>;
}

// 신고 단계
- 1단계: 신고 카테고리 선택
- 2단계: 상세 사유 입력
- 3단계: 증거 자료 업로드 (선택)
- 4단계: 신고 완료 확인
```

### 3. MyReportsTab (내 신고 내역)
```typescript
interface MyReportsTabProps {
  reports: Report[];
  summary: ReportSummary;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}

// 신고 상태별 분류
- 검토 대기중
- 검토 중
- 조치 완료
- 기각됨
```

### 4. BlockedUsersTab (차단 목록)
```typescript
interface BlockedUsersTabProps {
  blockedUsers: BlockedUser[];
  onUnblock: (userId: string) => Promise<void>;
  onBlockMore: () => void;
}

// 차단 해제 기능
- 개별 차단 해제
- 차단 사유 확인
- 차단 일시 표시
```

### 5. ViolationsTab (받은 제재)
```typescript
interface ViolationsTabProps {
  violations: Violation[];
  currentStatus: UserStatus;
  onAppeal: (violationId: string, reason: string) => Promise<void>;
}

// 제재 내역 표시
- 제재 유형별 구분
- 만료 일시 표시
- 이의 제기 버튼
```

### 6. GuidelinesTab (커뮤니티 가이드라인)
```typescript
interface GuidelinesTabProps {
  guidelines: Guidelines;
}

// 가이드라인 섹션
- 기본 행동 규범
- 금지 행위
- 제재 단계
- 신고 방법
- FAQ
```

### 7. ReportCard (신고 카드)
```typescript
interface ReportCardProps {
  report: Report;
  onViewDetails: (reportId: string) => void;
  onCancel?: (reportId: string) => Promise<void>; // 검토 전만 가능
}

// 신고 정보 표시
- 신고 대상 미리보기
- 신고 카테고리
- 처리 상태
- 신고일시
- 처리 결과 (있는 경우)
```

### 8. BlockUserCard (차단 사용자 카드)
```typescript
interface BlockUserCardProps {
  user: BlockedUser;
  onUnblock: (userId: string) => Promise<void>;
  onViewProfile?: (userId: string) => void; // 차단 상태에서도 프로필 확인 가능
}

// 차단 사용자 정보
- 프로필 이미지
- 사용자명
- 차단 일시
- 차단 사유
- 차단 해제 버튼
```

## 상태 관리 (Zustand)

### ModerationStore
```typescript
interface ModerationState {
  // 신고 관련
  reports: Report[];
  reportsSummary: ReportSummary | null;
  
  // 차단 관련
  blockedUsers: BlockedUser[];
  blockingUser: string | null; // 차단 진행 중인 사용자 ID
  
  // 제재 관련
  violations: Violation[];
  currentStatus: UserStatus | null;
  
  // UI 상태
  activeTab: string;
  isLoading: boolean;
  error: string | null;
  
  // 액션
  submitReport: (report: ReportRequest) => Promise<void>;
  loadMyReports: (filter?: ReportFilter) => Promise<void>;
  blockUser: (userId: string, reason?: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  loadBlockedUsers: () => Promise<void>;
  loadViolations: () => Promise<void>;
  submitAppeal: (violationId: string, reason: string) => Promise<void>;
  
  // 유틸리티
  setActiveTab: (tab: string) => void;
  clearError: () => void;
  isUserBlocked: (userId: string) => boolean;
  canReport: (targetType: string, targetId: string) => boolean;
}
```

## 신고 처리 플로우

### 신고 모달 구현
```typescript
const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  targetType,
  targetId,
  targetContent,
  onClose,
  onSubmit
}) => {
  const [step, setStep] = useState(1);
  const [reportData, setReportData] = useState<Partial<ReportRequest>>({
    targetType,
    targetId,
    isAnonymous: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const categories = [
    {
      id: 'spam',
      name: '스팸',
      description: '반복적이고 원치 않는 콘텐츠',
      icon: '🚫'
    },
    {
      id: 'harassment',
      name: '괴롭힘',
      description: '특정인을 대상으로 한 괴롭힘이나 협박',
      icon: '😡'
    },
    {
      id: 'hate_speech',
      name: '혐오 표현',
      description: '특정 집단에 대한 차별이나 혐오를 조장하는 내용',
      icon: '💢'
    },
    {
      id: 'sexual_content',
      name: '성적 콘텐츠',
      description: '부적절한 성적 내용이나 노골적인 성적 표현',
      icon: '🔞'
    },
    {
      id: 'violence',
      name: '폭력적 콘텐츠',
      description: '폭력을 조장하거나 위험한 행동을 부추기는 내용',
      icon: '⚔️'
    },
    {
      id: 'other',
      name: '기타',
      description: '위 항목에 해당하지 않는 기타 위반 사항',
      icon: '❓'
    }
  ];
  
  const handleSubmit = async () => {
    if (!reportData.category || !reportData.reason) {
      toast.error('모든 필수 항목을 입력해주세요');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(reportData as ReportRequest);
      toast.success('신고가 접수되었습니다');
      onClose();
    } catch (error: any) {
      toast.error(error.message || '신고 처리 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">신고 카테고리를 선택해주세요</h3>
            
            <div className="grid grid-cols-1 gap-3">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setReportData({ ...reportData, category: category.id as any });
                    setStep(2);
                  }}
                  className={`p-4 text-left border-2 rounded-lg transition-colors ${
                    reportData.category === category.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-600">{category.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">구체적인 사유를 입력해주세요</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신고 사유 *
              </label>
              <textarea
                value={reportData.reason || ''}
                onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                placeholder="어떤 점이 문제인지 구체적으로 설명해주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                rows={4}
                maxLength={500}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {reportData.reason?.length || 0}/500자
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportData.isAnonymous}
                  onChange={(e) => setReportData({ ...reportData, isAnonymous: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm">익명으로 신고하기</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                익명 신고 시 신고자 정보가 공개되지 않습니다
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!reportData.reason?.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                다음
              </button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">증거 자료 (선택사항)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추가 설명
              </label>
              <textarea
                value={reportData.evidence?.description || ''}
                onChange={(e) => setReportData({
                  ...reportData,
                  evidence: { ...reportData.evidence, description: e.target.value }
                })}
                placeholder="추가적인 맥락이나 설명이 있다면 입력해주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
                maxLength={300}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                스크린샷 (최대 3개)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  max="3"
                  className="hidden"
                  id="screenshot-upload"
                />
                <label htmlFor="screenshot-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="text-4xl">📸</div>
                    <div className="text-sm text-gray-600">
                      클릭해서 스크린샷을 업로드하세요
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                다음
              </button>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">신고 내용 확인</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <span className="font-medium">카테고리: </span>
                {categories.find(c => c.id === reportData.category)?.name}
              </div>
              <div>
                <span className="font-medium">사유: </span>
                <div className="mt-1 text-sm">{reportData.reason}</div>
              </div>
              <div>
                <span className="font-medium">신고 방식: </span>
                {reportData.isAnonymous ? '익명' : '실명'}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p>• 허위 신고는 제재 대상이 될 수 있습니다</p>
              <p>• 신고는 24시간 내에 검토됩니다</p>
              <p>• 처리 결과는 알림으로 안내드립니다</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {isSubmitting ? '신고 중...' : '신고 완료'}
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* 진행 표시 */}
        <div className="flex items-center justify-center space-x-2">
          {[1, 2, 3, 4].map(stepNum => (
            <div
              key={stepNum}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNum <= step
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {stepNum}
            </div>
          ))}
        </div>
        
        {/* 신고 대상 미리보기 */}
        {targetContent && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="text-sm font-medium text-yellow-800 mb-1">신고 대상:</div>
            <div className="text-sm text-yellow-700 line-clamp-2">
              {targetContent}
            </div>
          </div>
        )}
        
        {renderStep()}
      </div>
    </Modal>
  );
};
```

## 차단 시스템

### 차단 효과 구현
```typescript
const useContentFiltering = () => {
  const { blockedUsers } = useModerationStore();
  
  const filterContent = useCallback(<T extends { authorId?: string }>(
    items: T[]
  ): T[] => {
    const blockedUserIds = new Set(blockedUsers.map(user => user.id));
    
    return items.filter(item => 
      !item.authorId || !blockedUserIds.has(item.authorId)
    );
  }, [blockedUsers]);
  
  const isBlocked = useCallback((userId: string): boolean => {
    return blockedUsers.some(user => user.id === userId);
  }, [blockedUsers]);
  
  const getBlockedMessage = (contentType: string): string => {
    return `차단한 사용자의 ${contentType}입니다. 차단을 해제하면 볼 수 있습니다.`;
  };
  
  return {
    filterContent,
    isBlocked,
    getBlockedMessage
  };
};

const BlockedContentPlaceholder: React.FC<{
  contentType: string;
  blockedUser: string;
  onUnblock: () => Promise<void>;
  onShowContent: () => void;
}> = ({ contentType, blockedUser, onUnblock, onShowContent }) => {
  const [isUnblocking, setIsUnblocking] = useState(false);
  
  const handleUnblock = async () => {
    setIsUnblocking(true);
    try {
      await onUnblock();
      toast.success('차단이 해제되었습니다');
    } catch (error) {
      toast.error('차단 해제에 실패했습니다');
    } finally {
      setIsUnblocking(false);
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="text-center space-y-3">
        <div className="text-gray-600">
          <EyeSlashIcon className="w-8 h-8 mx-auto mb-2" />
          <p>차단한 사용자 @{blockedUser}의 {contentType}입니다.</p>
        </div>
        
        <div className="flex justify-center space-x-2">
          <button
            onClick={onShowContent}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          >
            임시로 보기
          </button>
          <button
            onClick={handleUnblock}
            disabled={isUnblocking}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isUnblocking ? '해제 중...' : '차단 해제'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 커뮤니티 가이드라인

### 가이드라인 표시 컴포넌트
```typescript
const GuidelinesSection: React.FC<{
  guidelines: Guidelines;
}> = ({ guidelines }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">ReadZone 커뮤니티 가이드라인</h2>
        <p className="text-gray-600">
          건전하고 활발한 독서 커뮤니티를 위한 행동 규범
        </p>
        <p className="text-sm text-gray-500">
          최종 업데이트: {new Date(guidelines.lastUpdated).toLocaleDateString('ko-KR')}
        </p>
      </div>
      
      {/* 기본 원칙 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">기본 원칙</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">📚</span>
            독서와 관련된 건전한 소통을 추구합니다
          </li>
          <li className="flex items-start">
            <span className="mr-2">🤝</span>
            서로 다른 의견을 존중하며 배려합니다
          </li>
          <li className="flex items-start">
            <span className="mr-2">🛡️</span>
            모든 구성원이 안전하게 이용할 수 있는 공간을 만듭니다
          </li>
          <li className="flex items-start">
            <span className="mr-2">✨</span>
            양질의 콘텐츠를 통해 함께 성장합니다
          </li>
        </ul>
      </div>
      
      {/* 가이드라인 섹션들 */}
      {guidelines.sections.map(section => (
        <div key={section.id} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
          >
            <h3 className="text-lg font-semibold">{section.title}</h3>
            <ChevronDownIcon 
              className={`w-5 h-5 transition-transform ${
                expandedSections.has(section.id) ? 'rotate-180' : ''
              }`}
            />
          </button>
          
          {expandedSections.has(section.id) && (
            <div className="px-4 pb-4 space-y-4">
              <div className="prose prose-sm max-w-none">
                {section.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              
              {/* 예시 */}
              {section.examples.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">예시</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {section.examples.map((example, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${
                          example.type === 'good' 
                            ? 'bg-green-50 border-green-400' 
                            : 'bg-red-50 border-red-400'
                        }`}
                      >
                        <div className={`flex items-center mb-2 ${
                          example.type === 'good' 
                            ? 'text-green-800' 
                            : 'text-red-800'
                        }`}>
                          {example.type === 'good' ? (
                            <CheckIcon className="w-4 h-4 mr-2" />
                          ) : (
                            <XMarkIcon className="w-4 h-4 mr-2" />
                          )}
                          <span className="font-medium">
                            {example.type === 'good' ? '좋은 예' : '나쁜 예'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {example.description}
                        </p>
                        <div className={`text-xs p-2 rounded ${
                          example.type === 'good' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {example.example}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      {/* 제재 정책 */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">제재 정책</h3>
        
        <div className="space-y-4">
          {guidelines.policies.escalationSteps.map((step, index) => (
            <div key={step.level} className="flex items-start space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step.level === 1 ? 'bg-yellow-100 text-yellow-800' :
                step.level === 2 ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {step.level}
              </div>
              
              <div className="flex-1">
                <div className="font-medium">{step.violation}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">조치:</span> {step.action}
                  {step.duration && (
                    <span className="ml-2 text-red-600">({step.duration})</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">이의 제기</h4>
          <p className="text-sm text-gray-600">
            부당한 제재를 받았다고 생각하시면 제재 알림에서 이의 제기를 신청하실 수 있습니다.
            이의 제기는 제재일로부터 7일 이내에 가능하며, 검토 후 결과를 안내드립니다.
          </p>
        </div>
      </div>
      
      {/* 문의 및 지원 */}
      <div className="text-center space-y-4">
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold mb-2">추가 문의</h3>
          <p className="text-gray-600 mb-4">
            가이드라인에 대한 문의사항이나 제안사항이 있으시면 언제든 연락주세요.
          </p>
          <a
            href="mailto:support@readzone.com"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            고객 지원팀에 문의하기
          </a>
        </div>
      </div>
    </div>
  );
};
```

## 접근성

### 스크린 리더 지원
```typescript
// 신고 모달 접근성
<div role="dialog" aria-labelledby="report-title" aria-describedby="report-description">
  <h2 id="report-title">콘텐츠 신고</h2>
  <p id="report-description" className="sr-only">
    부적절한 콘텐츠를 신고할 수 있습니다. 4단계에 걸쳐 신고 내용을 입력합니다.
  </p>
  
  <div role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
    <span className="sr-only">{step}단계 / 총 4단계</span>
  </div>
</div>

// 차단된 콘텐츠 안내
<div role="region" aria-label="차단된 콘텐츠">
  <div aria-live="polite">
    {isBlocked && "차단한 사용자의 콘텐츠입니다."}
  </div>
</div>
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초 (페이지 렌더링)
- **FID**: < 100ms (신고/차단 버튼 응답성)
- **CLS**: < 0.1 (차단된 콘텐츠 숨김 시 레이아웃 안정성)

### 사용자 경험 지표
- 신고 제출: < 3초
- 차단 처리: < 2초
- 차단 콘텐츠 필터링: < 500ms
- 가이드라인 로딩: < 1.5초