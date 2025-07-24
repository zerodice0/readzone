import { Resend } from 'resend'
import { logger } from '@/lib/logger'

// Email result type
interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Resend 클라이언트 초기화
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Resend 설정 검증
 */
export function validateEmailConfig(): { isValid: boolean; error?: string } {
  if (!process.env.RESEND_API_KEY) {
    return { isValid: false, error: 'RESEND_API_KEY가 설정되지 않았습니다.' }
  }
  
  if (!process.env.RESEND_FROM_EMAIL) {
    return { isValid: false, error: 'RESEND_FROM_EMAIL이 설정되지 않았습니다.' }
  }

  return { isValid: true }
}

/**
 * 이메일 인증 템플릿 HTML
 */
function getVerificationEmailTemplate(email: string, token: string): string {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`
  
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ReadZone 이메일 인증</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 30px; 
          text-align: center; 
          border-radius: 8px 8px 0 0; 
        }
        .content { 
          background: #ffffff; 
          padding: 30px; 
          border: 1px solid #e5e7eb; 
          border-top: none; 
        }
        .button { 
          display: inline-block; 
          background: #667eea; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: 600; 
          margin: 20px 0; 
        }
        .footer { 
          background: #f9fafb; 
          padding: 20px; 
          text-align: center; 
          border: 1px solid #e5e7eb; 
          border-top: none; 
          border-radius: 0 0 8px 8px; 
          font-size: 14px; 
          color: #6b7280; 
        }
        .token-info {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
          font-size: 14px;
          border-left: 4px solid #667eea;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌟 ReadZone</h1>
        <p>독서의 감동을 함께 나누세요</p>
      </div>
      
      <div class="content">
        <h2>이메일 인증을 완료해주세요</h2>
        <p>안녕하세요!</p>
        <p><strong>${email}</strong>으로 ReadZone에 가입해주셔서 감사합니다.</p>
        <p>아래 버튼을 클릭하여 이메일 인증을 완료하시면, ReadZone의 모든 서비스를 이용하실 수 있습니다.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" class="button">이메일 인증하기</a>
        </div>
        
        <div class="token-info">
          <strong>💡 버튼이 작동하지 않나요?</strong><br>
          아래 링크를 복사하여 브라우저 주소창에 직접 입력해주세요:<br>
          <a href="${verificationUrl}" style="word-break: break-all; color: #667eea;">${verificationUrl}</a>
        </div>
        
        <div class="token-info">
          <strong>⏰ 중요 안내</strong><br>
          • 이 인증 링크는 24시간 후 만료됩니다<br>
          • 만료된 경우 로그인 페이지에서 '인증 이메일 재발송'을 이용해주세요<br>
          • 본 이메일은 ReadZone 가입 시에만 발송됩니다
        </div>
        
        <p>독서를 통한 새로운 만남과 인사이트가 기다리고 있습니다!</p>
        <p>ReadZone과 함께 즐거운 독서 여행을 시작해보세요. 📚</p>
      </div>
      
      <div class="footer">
        <p>ReadZone - 독서 전용 커뮤니티 SNS</p>
        <p>이 이메일은 ${email}로 전송되었습니다.</p>
        <p>본인이 요청하지 않은 이메일이라면 무시하셔도 됩니다.</p>
      </div>
    </body>
    </html>
  `
}

/**
 * 이메일 인증 메일 발송
 */
export async function sendVerificationEmail(email: string, token: string): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    // 설정 검증
    const config = validateEmailConfig()
    if (!config.isValid) {
      logger.error('이메일 설정 오류', { error: config.error })
      return { success: false, error: config.error }
    }

    const htmlContent = getVerificationEmailTemplate(email, token)
    
    // 이메일 전송 전 상세 로깅
    logger.debug('이메일 전송 시도', {
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      apiKeyPresent: !!process.env.RESEND_API_KEY,
      environment: process.env.NODE_ENV
    })
    
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [email],
      subject: '🌟 ReadZone 이메일 인증을 완료해주세요',
      html: htmlContent,
      // 텍스트 버전도 제공 (HTML을 지원하지 않는 클라이언트용)
      text: `
ReadZone 이메일 인증

안녕하세요! ReadZone에 가입해주셔서 감사합니다.

아래 링크를 클릭하여 이메일 인증을 완료해주세요:
${process.env.NEXTAUTH_URL}/verify-email?token=${token}

이 인증 링크는 24시간 후 만료됩니다.
본인이 요청하지 않은 이메일이라면 무시하셔도 됩니다.

ReadZone - 독서 전용 커뮤니티 SNS
      `.trim(),
      // 태그 추가 (Resend에서 이메일 분류용)
      tags: [
        { name: 'category', value: 'verification' },
        { name: 'environment', value: process.env.NODE_ENV || 'development' }
      ]
    })

    // Resend API 응답 전체 로깅
    logger.debug('Resend API 응답', {
      success: !!result.data,
      messageId: result.data?.id,
      hasError: !!result.error
    })

    logger.email('인증 이메일 발송 성공', { 
      email, 
      messageId: result.data?.id,
      environment: process.env.NODE_ENV 
    })

    return { 
      success: true, 
      messageId: result.data?.id 
    }

  } catch (error) {
    logger.error('인증 이메일 발송 실패', { email, error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined)
    
    // Resend API 에러 처리
    if (error instanceof Error) {
      return { 
        success: false, 
        error: `이메일 발송 실패: ${error.message}` 
      }
    }
    
    return { 
      success: false, 
      error: '알 수 없는 오류로 이메일 발송에 실패했습니다.' 
    }
  }
}

/**
 * 이메일 재발송 (기존 함수와 동일하지만 로깅 구분)
 */
export async function resendVerificationEmail(email: string, token: string): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    const result = await sendVerificationEmail(email, token)
    
    if (result.success) {
      logger.email('인증 이메일 재발송 성공', { 
        email, 
        messageId: result.messageId 
      })
    }
    
    return result
  } catch (error) {
    logger.error('인증 이메일 재발송 실패', { email, error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined)
    return { 
      success: false, 
      error: '이메일 재발송에 실패했습니다.' 
    }
  }
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function sendPasswordResetEmail(
  email: string, 
  nickname: string, 
  resetToken: string
): Promise<EmailResult> {
  try {
    if (!resend) {
      throw new Error('Resend 클라이언트가 초기화되지 않았습니다.')
    }

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    // HTML 템플릿
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ReadZone 비밀번호 재설정</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- 헤더 -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 40px 20px; text-align: center;">
            <div style="background-color: rgba(255, 255, 255, 0.1); display: inline-block; padding: 12px; border-radius: 12px; margin-bottom: 16px;">
              <div style="width: 40px; height: 40px; background-color: white; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="color: #2563eb; font-size: 24px; font-weight: bold;">R</span>
              </div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">ReadZone</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">독서 전용 커뮤니티</p>
          </div>

          <!-- 메인 콘텐츠 -->
          <div style="padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 80px; height: 80px; background-color: #fef3c7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <span style="font-size: 36px;">🔐</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">비밀번호 재설정 요청</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px;">
                안녕하세요, <strong style="color: #1f2937;">${nickname}</strong>님!<br>
                ReadZone 계정의 비밀번호 재설정을 요청하셨습니다.
              </p>
            </div>

            <!-- 재설정 버튼 -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.3);">
                새 비밀번호 설정하기
              </a>
            </div>

            <!-- 안내 정보 -->
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 32px 0;">
              <h3 style="color: #374151; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📋 안내사항</h3>
              <ul style="color: #6b7280; margin: 0; padding-left: 20px; font-size: 14px;">
                <li style="margin-bottom: 8px;">이 링크는 <strong>15분 후 자동으로 만료</strong>됩니다.</li>
                <li style="margin-bottom: 8px;">보안을 위해 링크는 일회용이며, 재사용할 수 없습니다.</li>
                <li style="margin-bottom: 8px;">본인이 요청하지 않았다면 이 이메일을 무시하세요.</li>
                <li>문제가 있으시면 고객지원팀에 문의해주세요.</li>
              </ul>
            </div>

            <!-- 링크가 작동하지 않는 경우 -->
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
              <p style="background-color: #f9fafb; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #374151; word-break: break-all; margin: 0;">
                ${resetUrl}
              </p>
            </div>
          </div>

          <!-- 푸터 -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
              이 이메일은 ReadZone 계정 보안을 위해 발송되었습니다.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 ReadZone. 모든 권리 보유.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [email],
      subject: '🔐 ReadZone 비밀번호 재설정',
      html: htmlContent,
      // 텍스트 버전도 제공
      text: `
ReadZone 비밀번호 재설정

안녕하세요, ${nickname}님!
ReadZone 계정의 비밀번호 재설정을 요청하셨습니다.

아래 링크를 클릭하여 새 비밀번호를 설정해주세요:
${resetUrl}

이 링크는 15분 후 자동으로 만료됩니다.
본인이 요청하지 않은 이메일이라면 무시하셔도 됩니다.

ReadZone - 독서 전용 커뮤니티 SNS
      `.trim(),
      // 태그 추가
      tags: [
        { name: 'category', value: 'password-reset' },
        { name: 'environment', value: process.env.NODE_ENV || 'development' }
      ]
    })

    if (result.error) {
      logger.error('Resend API 오류', { error: result.error.message || 'Resend API 오류' })
      return {
        success: false,
        error: result.error.message || 'Resend API 오류'
      }
    }

    logger.email('비밀번호 재설정 이메일 발송 성공', {
      messageId: result.data?.id,
      to: email
    })

    return {
      success: true,
      messageId: result.data?.id
    }

  } catch (error) {
    logger.error('비밀번호 재설정 이메일 발송 실패', { email, error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류 발생'
    }
  }
}

/**
 * 테스트용 이메일 발송 함수
 */
export async function sendTestEmail(to: string): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    const config = validateEmailConfig()
    if (!config.isValid) {
      logger.error('이메일 설정 검증 실패', { error: config.error })
      return { success: false, error: config.error }
    }

    // 테스트 이메일 전송 전 상세 로깅
    logger.debug('테스트 이메일 전송 시도', {
      from: process.env.RESEND_FROM_EMAIL,
      to: to,
      apiKeyPresent: !!process.env.RESEND_API_KEY,
      environment: process.env.NODE_ENV
    })

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [to],
      subject: '🧪 ReadZone 이메일 테스트',
      html: `
        <h2>이메일 전송 테스트</h2>
        <p>ReadZone 이메일 시스템이 정상적으로 작동하고 있습니다.</p>
        <p>발송 시간: ${new Date().toLocaleString('ko-KR')}</p>
        <p>API 키: ${process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) + '...' : 'MISSING'}</p>
      `,
      text: 'ReadZone 이메일 테스트 - 시스템이 정상 작동 중입니다.',
      tags: [
        { name: 'category', value: 'test' },
        { name: 'environment', value: process.env.NODE_ENV || 'development' }
      ]
    })

    // 테스트 이메일 Resend API 응답 전체 로깅
    logger.debug('테스트 이메일 Resend API 응답', {
      success: !!result.data,
      messageId: result.data?.id,
      hasError: !!result.error
    })

    return { 
      success: true, 
      messageId: result.data?.id 
    }
  } catch (error) {
    logger.error('테스트 이메일 발송 실패', { to, error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }
  }
}