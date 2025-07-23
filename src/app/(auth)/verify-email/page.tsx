import { type Metadata } from 'next'
import VerifyEmailContent from './verify-email-content'

export const metadata: Metadata = {
  title: '이메일 인증 | ReadZone',
  description: 'ReadZone 계정 이메일 인증을 완료하세요.',
}

export default function VerifyEmailPage(): JSX.Element {
  return <VerifyEmailContent />
}