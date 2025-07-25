'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui'
import { Mail, Search, AlertTriangle, ExternalLink, CheckCircle, Clock, Target, HelpCircle, Shield, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { memo, useMemo, useCallback } from 'react'

interface EmailGuideModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

interface GuideStepProps {
  number: number
  title: string
  children: React.ReactNode
  icon?: React.ReactNode
}

const GuideStep = memo(function GuideStep({ number, title, children, icon }: GuideStepProps) {
  return (
    <div className="flex space-x-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
          {icon || <span className="text-sm font-medium text-primary-600 dark:text-primary-400">{number}</span>}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
          {title}
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {children}
        </div>
      </div>
    </div>
  )
})

interface EmailDomainGuide {
  name: string
  steps: string[]
  spamPath: string
  troubleshooting?: string[]
  specialInstructions?: string[]
  estimatedTime?: string
  difficultyLevel?: 'easy' | 'medium' | 'hard'
  commonIssues?: string[]
}

// Memoization cache for email domain guides
const emailDomainGuideCache = new Map<string, EmailDomainGuide>()

function getEmailDomainGuide(email: string): EmailDomainGuide {
  const domain = email.split('@')[1]?.toLowerCase()
  
  // Return cached result if available
  if (emailDomainGuideCache.has(domain)) {
    return emailDomainGuideCache.get(domain)!
  }
  
  let guide: EmailDomainGuide
  
  switch (domain) {
    case 'gmail.com':
      guide = {
        name: 'Gmail',
        steps: [
          '받은편지함에서 "ReadZone" 또는 "onboarding@resend.dev"로 검색해보세요.',
          '스팸함 → 모든 메일 탭에서 확인해보세요.',
          '프로모션 탭, 업데이트 탭도 확인해보세요.',
          '중요하지 않은 메일함도 확인해보세요.'
        ],
        spamPath: '스팸함 → 모든 메일',
        troubleshooting: [
          '필터 설정이 자동으로 메일을 분류하고 있을 수 있습니다.',
          '설정 → 필터 및 차단된 주소에서 확인해보세요.',
          'Gmail 앱을 사용 중이라면 새로고침을 해보세요.'
        ],
        specialInstructions: [
          '스팸함에서 메일을 찾으면 "스팸 아님" 버튼을 클릭하세요.',
          '발신자를 주소록에 추가하면 향후 메일이 스팸으로 분류되지 않습니다.'
        ],
        estimatedTime: '2-5분',
        difficultyLevel: 'easy',
        commonIssues: [
          '프로모션 탭으로 자동 분류',
          '구글 스마트 필터에 의한 자동 분류'
        ]
      }
    
    case 'naver.com':
      guide = {
        name: 'Naver 메일',
        steps: [
          '받은편지함에서 "ReadZone" 또는 "resend.dev" 검색을 해보세요.',
          '스팸메일함 전체를 확인해보세요.',
          '환경설정 → 스팸설정 → 차단된 메일 주소에서 확인해보세요.',
          '모든 메일함에서 날짜별로 정렬하여 확인해보세요.'
        ],
        spamPath: '스팸메일함',
        troubleshooting: [
          '네이버 SafeBox 기능이 활성화되어 있으면 비활성화해보세요.',
          '메일 용량이 90% 이상이면 새 메일을 받을 수 없습니다.',
          'PC와 모바일 앱의 동기화가 지연될 수 있습니다.'
        ],
        specialInstructions: [
          '스팸메일함에서 찾은 경우 "스팸해제" 버튼을 클릭하세요.',
          '발신자를 안심주소로 등록하면 향후 스팸 처리되지 않습니다.',
          '환경설정 → 수신허용에 "resend.dev" 도메인을 추가하세요.'
        ],
        estimatedTime: '3-7분',
        difficultyLevel: 'medium',
        commonIssues: [
          '네이버의 강력한 스팸 필터',
          'SafeBox 자동 분류',
          '외부 메일 차단 설정'
        ]
      }
    
    case 'daum.net':
    case 'hanmail.net':
      guide = {
        name: 'Daum/Kakao 메일',
        steps: [
          '받은편지함에서 "ReadZone" 또는 "resend" 검색을 해보세요.',
          '스팸차단함 전체를 확인해보세요.',
          '휴지통도 확인해보세요 (자동 삭제 전).',
          '설정 → 스팸차단설정 → 차단목록에서 확인해보세요.'
        ],
        spamPath: '스팸차단함',
        troubleshooting: [
          'Daum 메일의 스팸 필터가 매우 엄격합니다.',
          '메일함 용량이 부족하면 메일을 받을 수 없습니다.',
          '오래된 계정은 보안 설정이 강화되어 있을 수 있습니다.'
        ],
        specialInstructions: [
          '스팸차단함에서 "차단해제" 버튼을 클릭하세요.',
          '수신허용 목록에 "onboarding@resend.dev"를 추가하세요.',
          '설정 → 메일 수신 → 수신허용에서 도메인을 추가할 수 있습니다.'
        ],
        estimatedTime: '5-10분',
        difficultyLevel: 'hard',
        commonIssues: [
          '매우 엄격한 스팸 정책',
          '자동 휴지통 이동',
          '외부 도메인 차단'
        ]
      }
    
    case 'outlook.com':
    case 'hotmail.com':
    case 'live.com':
      guide = {
        name: 'Outlook/Hotmail',
        steps: [
          '받은편지함에서 "ReadZone" 검색을 해보세요.',
          '정크 이메일 폴더를 확인해보세요.',
          '집중 받은편지함 → 기타 탭을 확인해보세요.',
          '보관함과 삭제된 항목도 확인해보세요.'
        ],
        spamPath: '정크 이메일',
        troubleshooting: [
          'Outlook의 집중 받은편지함 기능이 메일을 자동 분류합니다.',
          '정크 메일 필터 수준이 "높음"으로 설정되어 있을 수 있습니다.',
          'Clutter 기능이 활성화되어 있으면 비활성화해보세요.'
        ],
        specialInstructions: [
          '정크 이메일에서 "정크 메일 아님"을 클릭하세요.',
          '발신자를 안전한 보낸 사람 목록에 추가하세요.',
          '설정 → 정크 이메일 → 안전한 보낸 사람에 추가하세요.'
        ],
        estimatedTime: '3-5분',
        difficultyLevel: 'medium',
        commonIssues: [
          '집중 받은편지함 자동 분류',
          'Clutter 기능에 의한 자동 이동'
        ]
      }
    
    case 'icloud.com':
    case 'me.com':
    case 'mac.com':
      guide = {
        name: 'iCloud 메일',
        steps: [
          '받은편지함에서 "ReadZone" 검색을 해보세요.',
          '정크 메일 폴더를 확인해보세요.',
          'VIP가 아닌 메일함도 확인해보세요.',
          '휴지통을 확인해보세요.'
        ],
        spamPath: '정크 메일',
        troubleshooting: [
          'iCloud의 스팸 필터가 외부 도메인을 차단할 수 있습니다.',
          'Mail Drop 기능이 큰 첨부파일을 차단할 수 있습니다.',
          'iCloud 저장 공간이 부족하면 메일을 받을 수 없습니다.'
        ],
        specialInstructions: [
          '정크 메일에서 "정크 메일 아님" 표시를 하세요.',
          '규칙을 만들어 ReadZone 메일을 받은편지함으로 이동시키세요.',
          'iCloud.com에서 웹으로 확인하는 것이 더 정확합니다.'
        ],
        estimatedTime: '3-5분',
        difficultyLevel: 'medium',
        commonIssues: [
          'Apple의 엄격한 프라이버시 정책',
          '자동 정크 메일 분류'
        ]
      }
    
    case 'yahoo.com':
    case 'yahoo.co.kr':
      guide = {
        name: 'Yahoo 메일',
        steps: [
          '받은편지함에서 "ReadZone" 검색을 해보세요.',
          '스팸함을 확인해보세요.',
          '휴지통도 확인해보세요.',
          '필터 설정을 확인해보세요.'
        ],
        spamPath: '스팸함',
        troubleshooting: [
          'Yahoo의 스팸 필터가 매우 민감하게 작동합니다.',
          '오래된 계정은 보안 설정이 강화되어 있습니다.',
          '일시적인 서버 지연이 있을 수 있습니다.'
        ],
        specialInstructions: [
          '스팸함에서 "스팸 아님" 버튼을 클릭하세요.',
          '주소록에 발신자를 추가하세요.',
          '필터를 만들어 ReadZone 메일을 받은편지함으로 이동시키세요.'
        ],
        estimatedTime: '3-7분',
        difficultyLevel: 'medium',
        commonIssues: [
          '강력한 스팸 필터',
          '자동 삭제 정책'
        ]
      }
    
    case 'qq.com':
    case '163.com':
    case '126.com':
      guide = {
        name: '중국 이메일 서비스',
        steps: [
          '收件箱에서 "ReadZone" 검색을 해보세요.',
          '垃圾邮件 (스팸함)을 확인해보세요.',
          '已删除 (삭제함)도 확인해보세요.',
          '邮件设置에서 차단 목록을 확인해보세요.'
        ],
        spamPath: '垃圾邮件',
        troubleshooting: [
          '중국 이메일 서비스는 해외 메일을 자주 차단합니다.',
          '그레이트 파이어월이 메일 전송을 지연시킬 수 있습니다.',
          '언어 설정이 메일 필터링에 영향을 줄 수 있습니다.'
        ],
        specialInstructions: [
          '스팸함에서 "非垃圾邮件" (스팸 아님)을 클릭하세요.',
          '白名单 (화이트리스트)에 발신자를 추가하세요.',
          'VPN 사용 시 메일 수신이 원활하지 않을 수 있습니다.'
        ],
        estimatedTime: '5-15분',
        difficultyLevel: 'hard',
        commonIssues: [
          '해외 메일 차단',
          '언어 필터링',
          '네트워크 지연'
        ]
      }
    
    default:
      guide = {
        name: '이메일 서비스',
        steps: [
          '받은편지함에서 "ReadZone" 또는 "onboarding@resend.dev"로 검색해보세요.',
          '스팸함 또는 정크메일 폴더를 확인해보세요.',
          '차단된 발신자 목록을 확인해보세요.',
          '필터 또는 규칙 설정을 확인해보세요.'
        ],
        spamPath: '스팸함/정크메일함',
        troubleshooting: [
          '이메일 서비스의 스팸 정책을 확인해보세요.',
          '메일함 용량이 충분한지 확인해보세요.',
          '외부 도메인 차단 설정을 확인해보세요.'
        ],
        specialInstructions: [
          '스팸함에서 찾은 경우 스팸 해제를 해주세요.',
          '발신자를 안전한 발신자 목록에 추가해주세요.',
          '이메일 서비스 고객센터에 문의해보세요.'
        ],
        estimatedTime: '5-10분',
        difficultyLevel: 'medium',
        commonIssues: [
          '스팸 필터링',
          '용량 부족',
          '보안 설정'
        ]
      }
      break
  }
  
  // Cache the result
  emailDomainGuideCache.set(domain, guide)
  return guide
}

// Pre-computed badge configurations for performance
const DIFFICULTY_BADGES = {
  easy: { text: '쉬움', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  medium: { text: '보통', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  hard: { text: '어려움', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
} as const

const DifficultyBadge = memo(function DifficultyBadge({ level }: { level: 'easy' | 'medium' | 'hard' }) {
  const badge = DIFFICULTY_BADGES[level]
  
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
      badge.color
    )}>
      <Target className="h-3 w-3 mr-1" />
      {badge.text}
    </span>
  )
})

const EstimatedTime = memo(function EstimatedTime({ time }: { time: string }) {
  return (
    <div className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400">
      <Clock className="h-3 w-3 mr-1" />
      예상 소요시간: {time}
    </div>
  )
})

const TroubleshootingSection = memo(function TroubleshootingSection({ items }: { items: string[] }) {
  if (!items.length) return null
  
  return (
    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
          문제 해결 팁
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={`troubleshoot-${index}`} className="flex items-start space-x-2 text-xs text-amber-700 dark:text-amber-300">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
})

const SpecialInstructionsSection = memo(function SpecialInstructionsSection({ items }: { items: string[] }) {
  if (!items.length) return null
  
  return (
    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
          특별 안내사항
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={`instruction-${index}`} className="flex items-start space-x-2 text-xs text-blue-700 dark:text-blue-300">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
})

const CommonIssuesSection = memo(function CommonIssuesSection({ items }: { items: string[] }) {
  if (!items.length) return null
  
  return (
    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
          자주 발생하는 문제
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={`issue-${index}`} className="flex items-start space-x-2 text-xs text-purple-700 dark:text-purple-300">
            <span className="text-purple-500 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
})

// Pre-computed support URLs for better performance
const SUPPORT_URLS = {
  'gmail.com': 'https://support.google.com/mail/answer/1366858',
  'naver.com': 'https://help.naver.com/support/contents/contents.help?serviceNo=1262&categoryNo=1263',
  'daum.net': 'https://cs.daum.net/faq/15/4376.html',
  'hanmail.net': 'https://cs.daum.net/faq/15/4376.html',
  'outlook.com': 'https://support.microsoft.com/ko-kr/office/정크-이메일-및-피싱-필터-개요-5ae3ea8e-cf41-4fa0-b02a-3b96e21de089',
  'hotmail.com': 'https://support.microsoft.com/ko-kr/office/정크-이메일-및-피싱-필터-개요-5ae3ea8e-cf41-4fa0-b02a-3b96e21de089',
  'live.com': 'https://support.microsoft.com/ko-kr/office/정크-이메일-및-피싱-필터-개요-5ae3ea8e-cf41-4fa0-b02a-3b96e21de089',
  'icloud.com': 'https://support.apple.com/ko-kr/HT204137',
  'me.com': 'https://support.apple.com/ko-kr/HT204137',
  'mac.com': 'https://support.apple.com/ko-kr/HT204137',
  'yahoo.com': 'https://help.yahoo.com/kb/SLN2568.html',
  'yahoo.co.kr': 'https://help.yahoo.com/kb/SLN2568.html'
} as const

// Pre-computed domains that support help links for performance
const SUPPORTED_DOMAINS = new Set([
  'gmail.com', 'naver.com', 'daum.net', 'hanmail.net', 'outlook.com', 
  'hotmail.com', 'live.com', 'icloud.com', 'me.com', 'mac.com', 
  'yahoo.com', 'yahoo.co.kr'
])

export const EmailGuideModal = memo(function EmailGuideModal({ isOpen, onClose, userEmail }: EmailGuideModalProps): JSX.Element {
  // Memoize email guide to prevent recalculation
  const emailGuide = useMemo(() => getEmailDomainGuide(userEmail), [userEmail])
  
  // Memoize domain extraction
  const domain = useMemo(() => userEmail.split('@')[1]?.toLowerCase(), [userEmail])
  
  // Memoize support link availability check
  const hasSupportLink = useMemo(() => domain && SUPPORTED_DOMAINS.has(domain), [domain])
  
  const handleContactSupport = useCallback(() => {
    // 실제 고객 지원 페이지로 이동 또는 이메일 작성
    window.open(`mailto:support@readzone.com?subject=이메일 인증 문의&body=이메일 주소: ${userEmail}`, '_blank')
  }, [userEmail])

  const handleCheckSpamInstructions = useCallback(() => {
    // Use pre-computed URL lookup for better performance
    if (!domain) return
    
    const url = SUPPORT_URLS[domain as keyof typeof SUPPORT_URLS]
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [domain])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <span>이메일 인증 확인 가이드</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 사용자 이메일 정보 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  인증 메일 발송 주소
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {emailGuide.difficultyLevel && <DifficultyBadge level={emailGuide.difficultyLevel} />}
              </div>
            </div>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300 font-mono">
              {userEmail}
            </p>
            {emailGuide.estimatedTime && (
              <div className="mt-2">
                <EstimatedTime time={emailGuide.estimatedTime} />
              </div>
            )}
          </div>

          {/* 단계별 가이드 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {emailGuide.name} 이메일 확인 방법
              </h3>
            </div>

            <div className="space-y-6" role="tablist" aria-label="이메일 확인 단계">
              <GuideStep 
                number={1} 
                title="받은편지함 확인"
                icon={<Search className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
              >
                <div className="space-y-3">
                  <p className="mb-2">받은편지함에서 다음 키워드로 검색해보세요:</p>
                  <div className="space-y-1">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-xs font-mono">
                      ReadZone
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-xs font-mono">
                      onboarding@resend.dev
                    </div>
                  </div>
                  
                  {/* 상세 단계별 안내 */}
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">단계별 확인 방법:</p>
                    <ul className="space-y-1 text-xs">
                      {emailGuide.steps.slice(0, 2).map((step, index) => (
                        <li key={`step-${index}`} className="flex items-start space-x-2">
                          <span className="text-primary-500 font-medium">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </GuideStep>

              <GuideStep 
                number={2} 
                title={`${emailGuide.spamPath} 확인`}
                icon={<AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
              >
                <div className="space-y-3">
                  <p>인증 메일이 스팸으로 분류되었을 수 있습니다.</p>
                  <ul className="space-y-1 text-xs">
                    {emailGuide.steps.slice(2).map((step, index) => (
                      <li key={`spam-step-${index}`} className="flex items-start space-x-2">
                        <span className="text-amber-500">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* 스팸함 확인 도움말 링크 */}
                  {hasSupportLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckSpamInstructions}
                      className="mt-3 text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {emailGuide.name} 스팸함 확인 방법 보기
                    </Button>
                  )}
                  
                  {/* 특별 안내사항 섹션 - 성능 최적화된 조건부 렌더링 */}
                  {emailGuide.specialInstructions?.length > 0 && (
                    <SpecialInstructionsSection items={emailGuide.specialInstructions} />
                  )}
                </div>
              </GuideStep>

              <GuideStep 
                number={3} 
                title="이메일 설정 확인"
                icon={<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
              >
                <div className="space-y-3">
                  <p>다음 사항을 확인해주세요:</p>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-start space-x-2">
                      <span className="text-gray-400">•</span>
                      <span>차단된 발신자 목록에 ReadZone이 없는지 확인</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-gray-400">•</span>
                      <span>이메일 용량이 가득 차지 않았는지 확인</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-gray-400">•</span>
                      <span>외부 메일 차단 설정이 되어있지 않은지 확인</span>
                    </li>
                  </ul>
                  
                  {/* 문제 해결 팁 섹션 - 성능 최적화된 조건부 렌더링 */}
                  {emailGuide.troubleshooting?.length > 0 && (
                    <TroubleshootingSection items={emailGuide.troubleshooting} />
                  )}
                </div>
              </GuideStep>
              
              {/* 자주 발생하는 문제 섹션 - 성능 최적화된 조건부 렌더링 */}
              {emailGuide.commonIssues?.length > 0 && (
                <div className="mt-6">
                  <CommonIssuesSection items={emailGuide.commonIssues} />
                </div>
              )}
            </div>
          </div>

          {/* 발신자 정보 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              인증 메일 발신자 정보
            </h4>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <p><span className="font-medium">발신자:</span> ReadZone</p>
              <p><span className="font-medium">이메일:</span> onboarding@resend.dev</p>
              <p><span className="font-medium">제목:</span> ReadZone 회원가입 이메일 인증</p>
            </div>
          </div>

          {/* 추가 도움 */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              여전히 이메일을 찾을 수 없나요?
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                위의 방법으로도 이메일을 찾을 수 없다면 고객 지원팀에 문의해주세요.
              </p>
              <Button
                onClick={handleContactSupport}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Mail className="h-3 w-3 mr-1" />
                고객 지원 문의하기
              </Button>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})