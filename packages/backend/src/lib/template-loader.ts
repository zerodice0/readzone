import * as fs from 'fs'
import * as path from 'path'

// 템플릿 변수 타입 정의
export type TemplateVariables = Record<string, string>

// 템플릿 캐시
const templateCache = new Map<string, string>()

// 템플릿 디렉토리 경로
const TEMPLATES_DIR = path.join(__dirname, '../templates')

/**
 * 템플릿 파일을 읽어서 캐시에 저장
 */
function loadTemplate(templateName: string): string {
  const cacheKey = templateName
  
  // 캐시에서 확인
  const cachedTemplate = templateCache.get(cacheKey)
  
  if (cachedTemplate) {
    return cachedTemplate
  }
  
  // 파일에서 읽기
  const templatePath = path.join(TEMPLATES_DIR, templateName)
  
  try {
    // eslint-disable-next-line no-sync
    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    
    templateCache.set(cacheKey, templateContent)
    
    return templateContent
  } catch (error) {
    throw new Error(`Failed to load template: ${templateName}. Error: ${error}`)
  }
}

/**
 * 템플릿 내 변수를 실제 값으로 치환
 */
function replaceVariables(template: string, variables: TemplateVariables): string {
  let result = template
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    
    result = result.replace(new RegExp(placeholder, 'g'), value)
  }
  
  return result
}

/**
 * 이메일 인증 템플릿 생성
 */
export function createEmailVerificationTemplate(
  nickname: string, 
  verificationUrl: string
): { subject: string; html: string; text: string } {
  const variables: TemplateVariables = {
    nickname,
    verificationUrl
  }
  
  const htmlTemplate = loadTemplate('email-verification.html')
  const textTemplate = loadTemplate('email-verification.txt')
  
  return {
    subject: '[ReadZone] 이메일 인증을 완료해주세요',
    html: replaceVariables(htmlTemplate, variables),
    text: replaceVariables(textTemplate, variables)
  }
}

/**
 * 비밀번호 재설정 템플릿 생성
 */
export function createPasswordResetTemplate(
  nickname: string,
  resetUrl: string
): { subject: string; html: string; text: string } {
  const variables: TemplateVariables = {
    nickname,
    resetUrl
  }
  
  const htmlTemplate = loadTemplate('password-reset.html')
  const textTemplate = loadTemplate('password-reset.txt')
  
  return {
    subject: '[ReadZone] 비밀번호 재설정 요청',
    html: replaceVariables(htmlTemplate, variables),
    text: replaceVariables(textTemplate, variables)
  }
}

/**
 * 개발용 - 템플릿 캐시 초기화 (핫 리로드용)
 */
export function clearTemplateCache(): void {
  templateCache.clear()
}