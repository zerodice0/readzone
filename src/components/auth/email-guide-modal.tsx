'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui'
import { Mail, Search, AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

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

function GuideStep({ number, title, children, icon }: GuideStepProps) {
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
}

function getEmailDomainGuide(email: string) {
  const domain = email.split('@')[1]?.toLowerCase()
  
  switch (domain) {
    case 'gmail.com':
      return {
        name: 'Gmail',
        steps: [
          '받은편지함에서 "ReadZone" 또는 "onboarding@resend.dev"로 검색해보세요.',
          '스팸함 → 모든 메일 탭에서 확인해보세요.',
          '프로모션 탭에서도 확인해보세요.'
        ],
        spamPath: '스팸함 → 모든 메일'
      }
    case 'naver.com':
      return {
        name: 'Naver 메일',
        steps: [
          '받은편지함에서 "ReadZone" 검색을 해보세요.',
          '스팸메일함에서 확인해보세요.',
          '환경설정 → 차단메일에서 확인해보세요.'
        ],
        spamPath: '스팸메일함'
      }
    case 'daum.net':
    case 'hanmail.net':
      return {
        name: 'Daum 메일',
        steps: [
          '받은편지함에서 "ReadZone" 검색을 해보세요.',
          '스팸차단함에서 확인해보세요.',
          '설정 → 스팸차단설정에서 차단해제하세요.'
        ],
        spamPath: '스팸차단함'
      }
    case 'outlook.com':
    case 'hotmail.com':
    case 'live.com':
      return {
        name: 'Outlook',
        steps: [
          '받은편지함에서 "ReadZone" 검색을 해보세요.',
          '정크 이메일 폴더에서 확인해보세요.',
          '집중 받은편지함 → 기타 탭에서 확인해보세요.'
        ],
        spamPath: '정크 이메일'
      }
    default:
      return {
        name: '이메일 서비스',
        steps: [
          '받은편지함에서 "ReadZone" 또는 "onboarding@resend.dev"로 검색해보세요.',
          '스팸함 또는 정크메일 폴더를 확인해보세요.',
          '차단된 발신자 목록을 확인해보세요.'
        ],
        spamPath: '스팸함/정크메일함'
      }
  }
}

export function EmailGuideModal({ isOpen, onClose, userEmail }: EmailGuideModalProps): JSX.Element {
  const emailGuide = getEmailDomainGuide(userEmail)
  
  const handleContactSupport = () => {
    // 실제 고객 지원 페이지로 이동 또는 이메일 작성
    window.open('mailto:support@readzone.com?subject=이메일 인증 문의', '_blank')
  }

  const handleCheckSpamInstructions = () => {
    // 이메일 서비스별 스팸함 확인 방법 안내
    const domain = userEmail.split('@')[1]?.toLowerCase()
    let url = ''
    
    switch (domain) {
      case 'gmail.com':
        url = 'https://support.google.com/mail/answer/1366858'
        break
      case 'naver.com':
        url = 'https://help.naver.com/support/contents/contents.help?serviceNo=1262&categoryNo=1263'
        break
      case 'outlook.com':
      case 'hotmail.com':
      case 'live.com':
        url = 'https://support.microsoft.com/ko-kr/office/정크-이메일-및-피싱-필터-개요-5ae3ea8e-cf41-4fa0-b02a-3b96e21de089'
        break
      default:
        return
    }
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <span>이메일 인증 확인 가이드</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 사용자 이메일 정보 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                인증 메일 발송 주소
              </span>
            </div>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300 font-mono">
              {userEmail}
            </p>
          </div>

          {/* 단계별 가이드 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {emailGuide.name} 이메일 확인 방법
            </h3>

            <div className="space-y-4">
              <GuideStep 
                number={1} 
                title="받은편지함 확인"
                icon={<Search className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
              >
                <p className="mb-2">받은편지함에서 다음 키워드로 검색해보세요:</p>
                <div className="space-y-1">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-xs font-mono">
                    ReadZone
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-xs font-mono">
                    onboarding@resend.dev
                  </div>
                </div>
              </GuideStep>

              <GuideStep 
                number={2} 
                title={`${emailGuide.spamPath} 확인`}
                icon={<AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
              >
                <div className="space-y-2">
                  <p>인증 메일이 스팸으로 분류되었을 수 있습니다.</p>
                  <ul className="space-y-1 text-xs">
                    {emailGuide.steps.map((step, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-gray-400">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                  {['gmail.com', 'naver.com', 'outlook.com', 'hotmail.com', 'live.com'].includes(userEmail.split('@')[1]?.toLowerCase()) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckSpamInstructions}
                      className="mt-2 text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      스팸함 확인 방법 보기
                    </Button>
                  )}
                </div>
              </GuideStep>

              <GuideStep 
                number={3} 
                title="이메일 설정 확인"
                icon={<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
              >
                <div className="space-y-2">
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
                </div>
              </GuideStep>
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
}