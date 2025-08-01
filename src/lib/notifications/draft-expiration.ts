/**
 * Draft Expiration Notification System
 * Handles 24-hour warnings and expiration notifications as per PRD requirements
 */

import { db } from '@/lib/db'
import { DRAFT_DEFAULTS } from '@/lib/validations/draft'

export interface ExpirationNotification {
  draftId: string
  userId: string
  userEmail: string
  bookTitle: string
  expiresAt: Date
  daysUntilExpiry: number
  notificationType: 'WARNING' | 'FINAL_WARNING' | 'EXPIRED'
}

export interface NotificationResult {
  sent: number
  failed: number
  errors: string[]
  notifications: ExpirationNotification[]
}

/**
 * 만료 예정 Draft에 대한 알림 대상 조회
 */
export async function getExpirationNotificationTargets(): Promise<ExpirationNotification[]> {
  const now = new Date()
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  // 24시간 내 만료 예정 Draft 조회
  const expiringSoon = await db.reviewDraft.findMany({
    where: {
      status: 'DRAFT',
      expiresAt: {
        gte: now,
        lte: oneDayFromNow,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      book: {
        select: {
          title: true,
        },
      },
    },
  })

  // 48시간 내 만료 예정 Draft 조회 (조기 경고)
  const earlyWarning = await db.reviewDraft.findMany({
    where: {
      status: 'DRAFT',
      expiresAt: {
        gt: oneDayFromNow,
        lte: twoDaysFromNow,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      book: {
        select: {
          title: true,
        },
      },
    },
  })

  // 이미 만료된 Draft 조회
  const expired = await db.reviewDraft.findMany({
    where: {
      status: 'DRAFT',
      expiresAt: {
        lt: now,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      book: {
        select: {
          title: true,
        },
      },
    },
  })

  const notifications: ExpirationNotification[] = []

  // 24시간 내 만료 - 최종 경고
  expiringSoon.forEach(draft => {
    const daysUntil = Math.ceil((draft.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    notifications.push({
      draftId: draft.id,
      userId: draft.userId,
      userEmail: draft.user.email,
      bookTitle: draft.book?.title || draft.title || '제목 없음',
      expiresAt: draft.expiresAt,
      daysUntilExpiry: daysUntil,
      notificationType: 'FINAL_WARNING',
    })
  })

  // 48시간 내 만료 - 조기 경고
  earlyWarning.forEach(draft => {
    const daysUntil = Math.ceil((draft.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    notifications.push({
      draftId: draft.id,
      userId: draft.userId,
      userEmail: draft.user.email,
      bookTitle: draft.book?.title || draft.title || '제목 없음',
      expiresAt: draft.expiresAt,
      daysUntilExpiry: daysUntil,
      notificationType: 'WARNING',
    })
  })

  // 이미 만료된 Draft - 만료 알림
  expired.forEach(draft => {
    const daysExpired = Math.ceil((now.getTime() - draft.expiresAt.getTime()) / (1000 * 60 * 60 * 24))
    notifications.push({
      draftId: draft.id,
      userId: draft.userId,
      userEmail: draft.user.email,
      bookTitle: draft.book?.title || draft.title || '제목 없음',
      expiresAt: draft.expiresAt,
      daysUntilExpiry: -daysExpired, // 음수로 표시
      notificationType: 'EXPIRED',
    })
  })

  return notifications
}

/**
 * 이메일 알림 발송 (Mock 구현)
 */
async function sendExpirationEmail(notification: ExpirationNotification): Promise<boolean> {
  try {
    const { notificationType, bookTitle, daysUntilExpiry, userEmail } = notification

    let subject = ''
    let message = ''

    switch (notificationType) {
      case 'WARNING':
        subject = `📝 ReadZone: ${bookTitle} 독후감 임시저장 만료 예정 (${daysUntilExpiry}일 남음)`
        message = `
안녕하세요! ReadZone입니다.

작성 중이던 "${bookTitle}" 독후감이 ${daysUntilExpiry}일 후 자동으로 삭제됩니다.

📅 만료일: ${notification.expiresAt.toLocaleDateString('ko-KR')}

독후감 작성을 계속하시려면 ReadZone에 접속하여 임시저장된 글을 확인해 주세요.

ReadZone에서 계속 작성하기: ${process.env.NEXT_PUBLIC_BASE_URL}/write

감사합니다.
ReadZone 팀 드림
        `.trim()
        break

      case 'FINAL_WARNING':
        subject = `⚠️ ReadZone: ${bookTitle} 독후감 내일 삭제 예정 (긴급)`
        message = `
안녕하세요! ReadZone입니다.

작성 중이던 "${bookTitle}" 독후감이 내일 자동으로 삭제됩니다.

📅 만료일: ${notification.expiresAt.toLocaleDateString('ko-KR')}

지금 바로 독후감 작성을 완료하거나 임시저장을 연장해 주세요.

ReadZone에서 계속 작성하기: ${process.env.NEXT_PUBLIC_BASE_URL}/write

감사합니다.
ReadZone 팀 드림
        `.trim()
        break

      case 'EXPIRED':
        subject = `❌ ReadZone: ${bookTitle} 독후감 임시저장 만료`
        message = `
안녕하세요! ReadZone입니다.

작성 중이던 "${bookTitle}" 독후감이 만료되어 삭제되었습니다.

만료일: ${notification.expiresAt.toLocaleDateString('ko-KR')}

새로운 독후감을 작성하시려면 ReadZone에 접속해 주세요.

ReadZone에서 새 독후감 작성하기: ${process.env.NEXT_PUBLIC_BASE_URL}/write

감사합니다.
ReadZone 팀 드림
        `.trim()
        break
    }

    // 실제 환경에서는 이메일 서비스 (SendGrid, AWS SES 등) 연동
    console.log(`📧 이메일 발송: ${userEmail}`)
    console.log(`제목: ${subject}`)
    console.log(`내용:\n${message}`)

    // Mock: 90% 성공률로 시뮬레이션
    const success = Math.random() > 0.1
    
    if (success) {
      // 알림 발송 로그 생성
      await db.reviewDraftAudit.create({
        data: {
          draftId: notification.draftId,
          userId: notification.userId,
          action: 'UPDATED',
          newData: JSON.stringify({
            notificationType,
            emailSent: true,
            sentAt: new Date().toISOString(),
          }),
        },
      })
    }

    return success
  } catch (error) {
    console.error(`이메일 발송 실패 (${notification.userEmail}):`, error)
    return false
  }
}

/**
 * 만료 알림 일괄 발송
 */
export async function sendExpirationNotifications(): Promise<NotificationResult> {
  const notifications = await getExpirationNotificationTargets()
  const result: NotificationResult = {
    sent: 0,
    failed: 0,
    errors: [],
    notifications,
  }

  console.log(`📮 만료 알림 발송 시작: ${notifications.length}개`)

  for (const notification of notifications) {
    try {
      const success = await sendExpirationEmail(notification)
      
      if (success) {
        result.sent++
      } else {
        result.failed++
        result.errors.push(`이메일 발송 실패: ${notification.userEmail}`)
      }
    } catch (error) {
      result.failed++
      result.errors.push(`알림 처리 실패 (${notification.draftId}): ${error}`)
    }
  }

  console.log(`✅ 만료 알림 발송 완료:`)
  console.log(`  - 성공: ${result.sent}개`)
  console.log(`  - 실패: ${result.failed}개`)

  return result
}

/**
 * 특정 사용자의 만료 예정 Draft 알림 조회
 */
export async function getUserExpirationWarnings(userId: string): Promise<ExpirationNotification[]> {
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const drafts = await db.reviewDraft.findMany({
    where: {
      userId,
      status: 'DRAFT',
      expiresAt: {
        gte: now,
        lte: threeDaysFromNow,
      },
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
      book: {
        select: {
          title: true,
        },
      },
    },
    orderBy: { expiresAt: 'asc' },
  })

  return drafts.map(draft => {
    const daysUntil = Math.ceil((draft.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      draftId: draft.id,
      userId: draft.userId,
      userEmail: draft.user.email,
      bookTitle: draft.book?.title || draft.title || '제목 없음',
      expiresAt: draft.expiresAt,
      daysUntilExpiry: daysUntil,
      notificationType: daysUntil <= 1 ? 'FINAL_WARNING' : 'WARNING',
    }
  })
}

/**
 * Draft 만료일 연장
 */
export async function extendDraftExpiration(
  draftId: string, 
  userId: string, 
  additionalDays: number = DRAFT_DEFAULTS.EXPIRY_DAYS
): Promise<{ success: boolean; newExpiryDate?: Date; error?: string }> {
  try {
    const draft = await db.reviewDraft.findFirst({
      where: {
        id: draftId,
        userId,
        status: 'DRAFT',
      },
    })

    if (!draft) {
      return { success: false, error: 'Draft not found or access denied' }
    }

    const newExpiryDate = new Date(Date.now() + additionalDays * 24 * 60 * 60 * 1000)

    await db.reviewDraft.update({
      where: { id: draftId },
      data: {
        expiresAt: newExpiryDate,
        lastAccessed: new Date(),
      },
    })

    // 감사 로그 생성
    await db.reviewDraftAudit.create({
      data: {
        draftId,
        userId,
        action: 'UPDATED',
        oldData: JSON.stringify({ expiresAt: draft.expiresAt }),
        newData: JSON.stringify({ expiresAt: newExpiryDate }),
      },
    })

    console.log(`📅 Draft ${draftId} 만료일 연장: ${newExpiryDate.toLocaleDateString('ko-KR')}`)

    return { success: true, newExpiryDate }
  } catch (error) {
    console.error(`Draft 만료일 연장 실패 (${draftId}):`, error)
    return { success: false, error: `Failed to extend expiration: ${error}` }
  }
}