// 이메일 템플릿 인터페이스
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * 이메일 인증 템플릿 생성
 */
export function createEmailVerificationTemplate(
  nickname: string,
  verificationUrl: string,
): EmailTemplate {
  const subject = '[ReadZone] 이메일 인증을 완료해주세요';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; font-size: 24px; margin: 0;">📚 ReadZone</h1>
        <p style="color: #666; margin: 5px 0 0 0;">독서 커뮤니티 플랫폼</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
        <h2 style="color: #333; margin: 0 0 20px 0;">안녕하세요, ${nickname}님!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 25px 0;">
          ReadZone에 가입해주셔서 감사합니다.<br>
          아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
        </p>
        
        <a href="${verificationUrl}" 
           style="display: inline-block; background: #007bff; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; font-weight: bold;">
          이메일 인증하기
        </a>
        
        <p style="color: #888; font-size: 14px; margin: 20px 0 0 0;">
          버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣어주세요:<br>
          <span style="word-break: break-all;">${verificationUrl}</span>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
        <p>이 이메일은 ReadZone 서비스에서 자동으로 발송되었습니다.</p>
        <p>본인이 요청하지 않았다면 이 이메일을 무시해주세요.</p>
      </div>
    </div>
  `;

  const text = `
ReadZone 이메일 인증

안녕하세요, ${nickname}님!

ReadZone에 가입해주셔서 감사합니다.
아래 링크를 클릭하여 이메일 인증을 완료해주세요.

인증 링크: ${verificationUrl}

이 이메일은 ReadZone 서비스에서 자동으로 발송되었습니다.
본인이 요청하지 않았다면 이 이메일을 무시해주세요.
  `;

  return { subject, html, text };
}

/**
 * 비밀번호 재설정 템플릿 생성
 */
export function createPasswordResetTemplate(
  nickname: string,
  resetUrl: string,
): EmailTemplate {
  const subject = '[ReadZone] 비밀번호 재설정 안내';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; font-size: 24px; margin: 0;">📚 ReadZone</h1>
        <p style="color: #666; margin: 5px 0 0 0;">독서 커뮤니티 플랫폼</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
        <h2 style="color: #333; margin: 0 0 20px 0;">안녕하세요, ${nickname}님!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 25px 0;">
          비밀번호 재설정을 요청하셨습니다.<br>
          아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.
        </p>
        
        <a href="${resetUrl}" 
           style="display: inline-block; background: #dc3545; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; font-weight: bold;">
          비밀번호 재설정
        </a>
        
        <p style="color: #888; font-size: 14px; margin: 20px 0 0 0;">
          버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣어주세요:<br>
          <span style="word-break: break-all;">${resetUrl}</span>
        </p>
        
        <p style="color: #dc3545; font-size: 14px; margin: 20px 0 0 0;">
          ⚠️ 이 링크는 1시간 후 만료됩니다.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
        <p>이 이메일은 ReadZone 서비스에서 자동으로 발송되었습니다.</p>
        <p>본인이 요청하지 않았다면 이 이메일을 무시해주세요.</p>
      </div>
    </div>
  `;

  const text = `
ReadZone 비밀번호 재설정

안녕하세요, ${nickname}님!

비밀번호 재설정을 요청하셨습니다.
아래 링크를 클릭하여 새로운 비밀번호를 설정해주세요.

재설정 링크: ${resetUrl}

⚠️ 이 링크는 1시간 후 만료됩니다.

이 이메일은 ReadZone 서비스에서 자동으로 발송되었습니다.
본인이 요청하지 않았다면 이 이메일을 무시해주세요.
  `;

  return { subject, html, text };
}
