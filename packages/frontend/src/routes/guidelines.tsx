import { createFileRoute } from '@tanstack/react-router'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Check, Mail, Shield, Sparkles, Users, X } from 'lucide-react'

export const Route = createFileRoute('/guidelines')({
  component: GuidelinesPage,
})

function GuidelinesPage() {
  const lastUpdated = '2025년 1월 5일'

  const principles = [
    {
      icon: BookOpen,
      title: '독서 중심 소통',
      description: '독서와 관련된 건전한 소통을 추구합니다',
    },
    {
      icon: Users,
      title: '상호 존중',
      description: '서로 다른 의견을 존중하며 배려합니다',
    },
    {
      icon: Shield,
      title: '안전한 공간',
      description: '모든 구성원이 안전하게 이용할 수 있는 공간을 만듭니다',
    },
    {
      icon: Sparkles,
      title: '함께 성장',
      description: '양질의 콘텐츠를 통해 함께 성장합니다',
    },
  ]

  const sections = [
    {
      id: 'respect',
      title: '상호 존중과 배려',
      content:
        '다른 사용자를 존중하고 배려하는 마음으로 소통해주세요. 개인적인 공격, 모욕, 비하 발언은 금지됩니다. 다양한 의견과 관점을 인정하고, 건설적인 대화를 나눠주세요.',
      examples: [
        {
          type: 'good' as const,
          description: '건설적인 비평',
          example:
            '"저는 이 책의 결말이 아쉬웠어요. 주인공의 선택이 앞뒤가 맞지 않는 것 같아서요."',
        },
        {
          type: 'bad' as const,
          description: '인신공격',
          example: '"이 정도도 이해 못 하면 독서 그만두세요."',
        },
      ],
    },
    {
      id: 'content',
      title: '콘텐츠 품질',
      content:
        '의미 있고 가치 있는 콘텐츠를 작성해주세요. 스팸, 광고, 도배성 게시물은 금지됩니다. 독후감은 최소 100자 이상, 댓글은 최소 10자 이상 작성해주세요.',
      examples: [
        {
          type: 'good' as const,
          description: '구체적인 독후감',
          example:
            '"이 책은 삶의 의미에 대해 깊이 생각하게 만들었습니다. 특히 3장의 주인공의 선택이 인상 깊었어요."',
        },
        {
          type: 'bad' as const,
          description: '단순 광고',
          example: '"▶▶ 최저가 도서 구매 링크 ◀◀ 클릭!"',
        },
      ],
    },
    {
      id: 'privacy',
      title: '개인정보 보호',
      content:
        '자신과 타인의 개인정보를 보호해주세요. 이름, 주소, 전화번호, 이메일 등 개인정보를 공개하지 마세요. 타인의 동의 없이 개인정보를 공유하는 것은 법적 처벌 대상입니다.',
      examples: [
        {
          type: 'good' as const,
          description: '일반적인 정보 공유',
          example: '"서울에 사는 20대 독서가입니다."',
        },
        {
          type: 'bad' as const,
          description: '개인정보 노출',
          example: '"제 번호는 010-1234-5678이에요. 연락주세요!"',
        },
      ],
    },
    {
      id: 'copyright',
      title: '저작권 존중',
      content:
        '타인의 저작물을 무단으로 사용하지 마세요. 책 내용을 인용할 때는 출처를 명시해주세요. 타인의 독후감이나 서평을 표절하지 마세요.',
      examples: [
        {
          type: 'good' as const,
          description: '적절한 인용',
          example: '"저자는 \'삶은 여행이다\'라고 말합니다. (3페이지)"',
        },
        {
          type: 'bad' as const,
          description: '무단 복사',
          example: '[타인의 독후감 전체를 복사하여 붙여넣기]',
        },
      ],
    },
  ]

  const violations = [
    {
      level: 1,
      violation: '경미한 위반 (1회 경고)',
      action: '경고 메시지 발송',
      duration: '-',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    {
      level: 2,
      violation: '중대한 위반 (2회 이상 또는 고의적)',
      action: '7일 이용 정지',
      duration: '7일',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    },
    {
      level: 3,
      violation: '심각한 위반 (불법 행위, 반복 위반)',
      action: '영구 이용 정지',
      duration: '영구',
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl font-bold text-foreground">
            ReadZone 커뮤니티 가이드라인
          </h1>
          <p className="text-lg text-muted-foreground">
            건전하고 활발한 독서 커뮤니티를 위한 행동 규범
          </p>
          <p className="text-sm text-muted-foreground">
            최종 업데이트: {lastUpdated}
          </p>
        </div>

        {/* Core Principles */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              기본 원칙
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {principles.map((principle) => {
                const Icon = principle.icon

                return (
                  <div
                    key={principle.title}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Icon className="w-6 h-6 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium text-foreground">
                        {principle.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {principle.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Guidelines Sections */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            상세 가이드라인
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {sections.map((section) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border border-border rounded-lg px-4"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-medium">{section.title}</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <p className="text-muted-foreground">{section.content}</p>

                  {section.examples.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-3">예시</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {section.examples.map((example, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border-l-4 ${
                              example.type === 'good'
                                ? 'bg-green-50 border-green-400 dark:bg-green-950/20 dark:border-green-600'
                                : 'bg-red-50 border-red-400 dark:bg-red-950/20 dark:border-red-600'
                            }`}
                          >
                            <div className="flex items-center mb-2">
                              {example.type === 'good' ? (
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                              ) : (
                                <X className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  example.type === 'good'
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-red-700 dark:text-red-300'
                                }`}
                              >
                                {example.type === 'good' ? '좋은 예' : '나쁜 예'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {example.description}
                            </p>
                            <div
                              className={`text-xs p-2 rounded ${
                                example.type === 'good'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                              }`}
                            >
                              {example.example}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Violation Policy */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              제재 정책
            </h2>
            <div className="space-y-3">
              {violations.map((violation) => (
                <div
                  key={violation.level}
                  className="flex items-start space-x-4 p-4 border border-border rounded-lg"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${violation.color}`}
                  >
                    {violation.level}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {violation.violation}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">조치:</span> {violation.action}
                      {violation.duration !== '-' && (
                        <span className="ml-2 text-red-600 dark:text-red-400">
                          ({violation.duration})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-medium text-foreground mb-2">이의 제기</h3>
              <p className="text-sm text-muted-foreground">
                부당한 제재를 받았다고 생각하시면 제재 알림에서 이의 제기를
                신청하실 수 있습니다. 이의 제기는 제재일로부터 7일 이내에
                가능하며, 검토 후 결과를 안내드립니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center space-y-4 border-t border-border pt-8">
          <h2 className="text-xl font-semibold text-foreground">추가 문의</h2>
          <p className="text-muted-foreground">
            가이드라인에 대한 문의사항이나 제안사항이 있으시면 언제든 연락주세요.
          </p>
          <a
            href="mailto:support@readzone.com"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
          >
            <Mail className="w-4 h-4 mr-2" />
            고객 지원팀에 문의하기
          </a>
        </div>
      </div>
    </div>
  )
}
