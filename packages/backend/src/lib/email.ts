import { Resend } from 'resend'

// Resend 클라이언트 초기화
const resend = new Resend(process.env.RESEND_API_KEY)

// 이메일 템플릿 인터페이스
interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * 이메일 인증 템플릿 생성
 */
export function createEmailVerificationTemplate(
  nickname: string, 
  verificationUrl: string
): EmailTemplate {
  const subject = '[ReadZone] 이메일 인증을 완료해주세요'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ReadZone 이메일 인증</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .content { background: #f8fafc; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #1d4ed8; }
        .footer { text-align: center; font-size: 14px; color: #64748b; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📚 ReadZone</div>
          <p>독서 커뮤니티에 오신 것을 환영합니다!</p>
        </div>
        
        <div class="content">
          <h2>안녕하세요, ${nickname}님!</h2>
          <p>ReadZone 회원가입을 환영합니다. 계정 활성화를 위해 이메일 인증을 완료해주세요.</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">이메일 인증하기</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ 보안 안내</strong><br>
            • 본 링크는 24시간 동안만 유효합니다<br>
            • 링크를 클릭할 수 없다면 아래 URL을 직접 복사해서 브라우저에 붙여넣어주세요<br>
            • 본인이 요청하지 않았다면 이 이메일을 무시해주세요
          </div>
          
          <p><strong>인증 링크:</strong><br>
          <code style="background: #e2e8f0; padding: 8px; border-radius: 4px; word-break: break-all;">${verificationUrl}</code></p>
        </div>
        
        <div class="footer">
          <p>ReadZone 팀 드림<br>
          <small>이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.</small></p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
ReadZone 이메일 인증

안녕하세요, ${nickname}님!

ReadZone 회원가입을 환영합니다. 계정 활성화를 위해 아래 링크를 클릭하여 이메일 인증을 완료해주세요.

인증 링크: ${verificationUrl}

* 본 링크는 24시간 동안만 유효합니다.
* 본인이 요청하지 않았다면 이 이메일을 무시해주세요.

ReadZone 팀 드림
  `

  return { subject, html, text }
}

/**
 * 비밀번호 재설정 템플릿 생성
 */
export function createPasswordResetTemplate(
  nickname: string, 
  resetUrl: string
): EmailTemplate {
  const subject = '[ReadZone] 비밀번호 재설정 요청'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ReadZone 비밀번호 재설정</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .content { background: #f8fafc; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #b91c1c; }
        .footer { text-align: center; font-size: 14px; color: #64748b; }
        .warning { background: #fef2f2; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📚 ReadZone</div>
          <p>비밀번호 재설정 요청</p>
        </div>
        
        <div class="content">
          <h2>안녕하세요, ${nickname}님!</h2>
          <p>계정의 비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">비밀번호 재설정하기</a>
          </div>
          
          <div class="warning">
            <strong>🔒 보안 안내</strong><br>
            • 본 링크는 1시간 동안만 유효합니다<br>
            • 본인이 요청하지 않았다면 즉시 계정 보안을 확인해주세요<br>
            • 의심스러운 활동이 있다면 support@readzone.com으로 연락주세요
          </div>
          
          <p><strong>재설정 링크:</strong><br>
          <code style="background: #e2e8f0; padding: 8px; border-radius: 4px; word-break: break-all;">${resetUrl}</code></p>
        </div>
        
        <div class="footer">
          <p>ReadZone 팀 드림<br>
          <small>이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.</small></p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
ReadZone 비밀번호 재설정

안녕하세요, ${nickname}님!

계정의 비밀번호 재설정을 요청하셨습니다. 아래 링크를 클릭하여 새로운 비밀번호를 설정해주세요.

재설정 링크: ${resetUrl}

* 본 링크는 1시간 동안만 유효합니다.
* 본인이 요청하지 않았다면 즉시 계정 보안을 확인해주세요.

ReadZone 팀 드림
  `

  return { subject, html, text }
}

/**
 * 이메일 발송 함수
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  fromName = 'ReadZone'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // 프로덕션 환경에서만 실제 이메일 발송
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const result = await resend.emails.send({
      from: `${fromName} <noreply@readzone.com>`,
      to: [to],
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (result.error) {
      console.error('Resend API error:', result.error)

      return {
        success: false,
        error: result.error.message || 'Email sending failed'
      }
    }

    return {
      success: true,
      messageId: result.data?.id
    }

  } catch (error) {
    console.error('Email sending error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    }
  }
}

/**
 * 이메일 인증 발송
 */
export async function sendEmailVerification(
  email: string,
  nickname: string,
  verificationToken: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://readzone.vercel.app'
    : 'http://localhost:3000'
  
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`
  const template = createEmailVerificationTemplate(nickname, verificationUrl)
  
  return await sendEmail(email, template)
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function sendPasswordResetEmail(
  email: string,
  nickname: string,
  resetToken: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://readzone.vercel.app'
    : 'http://localhost:3000'
  
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`
  const template = createPasswordResetTemplate(nickname, resetUrl)
  
  return await sendEmail(email, template)
}

// 이메일 유효성 검증
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return emailRegex.test(email) && email.length <= 320
}

// 개발 환경에서의 이메일 로깅
export function logEmailInDevelopment(
  to: string,
  subject: string,
  verificationUrl?: string
) {
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경에서 stdout으로 이메일 로그 출력
    process.stdout.write('\n=== 📧 EMAIL SENT (Development) ===\n')
    process.stdout.write(`To: ${to}\n`)
    process.stdout.write(`Subject: ${subject}\n`)
    if (verificationUrl) {
      process.stdout.write(`Verification URL: ${verificationUrl}\n`)
    }
    process.stdout.write('=====================================\n\n')
  }
}