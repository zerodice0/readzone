/**
 * 프론트엔드 JWT 유틸리티 함수
 * 토큰 디코딩 및 만료 시간 계산
 */

interface JWTPayload {
  userId: string;
  email: string | null;
  nickname: string;
  type: 'access' | 'refresh' | 'email-verification' | 'password-reset';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

/**
 * JWT 토큰을 디코딩합니다 (서명 검증 없이)
 * 클라이언트에서는 만료 시간 확인용으로만 사용
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT는 '.'로 구분된 3부분으로 구성: header.payload.signature
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    // payload 부분을 base64 디코딩
    const payload = parts[1];

    if (!payload) {
      return null;
    }
    
    // URL-safe base64를 일반 base64로 변환
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // 패딩 추가 (필요한 경우)
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    
    // base64 디코딩 후 JSON 파싱
    const decoded = JSON.parse(atob(padded));
    
    return decoded as JWTPayload;
  } catch (error) {
    console.warn('Failed to decode JWT:', error);

    return null;
  }
}

/**
 * 토큰의 만료까지 남은 시간을 초 단위로 반환
 */
export function getTokenTimeUntilExpiration(token: string): number | null {
  try {
    const payload = decodeJWT(token);

    if (!payload?.exp) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = payload.exp - now;
    
    return Math.max(0, timeUntilExpiration);
  } catch (error) {
    console.warn('Failed to get token expiration:', error);

    return null;
  }
}

/**
 * 토큰이 만료되었는지 확인
 */
export function isTokenExpired(token: string): boolean {
  const timeUntilExpiration = getTokenTimeUntilExpiration(token);

  return timeUntilExpiration === null || timeUntilExpiration <= 0;
}

/**
 * 토큰이 곧 만료될지 확인 (기본: 30초 이내)
 */
export function isTokenExpiringSoon(token: string, thresholdSeconds = 30): boolean {
  const timeUntilExpiration = getTokenTimeUntilExpiration(token);

  return timeUntilExpiration !== null && timeUntilExpiration <= thresholdSeconds;
}

/**
 * 토큰의 만료 시간을 사람이 읽기 쉬운 형태로 반환
 */
export function formatTokenExpiration(token: string): string {
  const timeUntilExpiration = getTokenTimeUntilExpiration(token);
  
  if (timeUntilExpiration === null) {
    return 'Invalid token';
  }
  
  if (timeUntilExpiration <= 0) {
    return 'Expired';
  }
  
  if (timeUntilExpiration < 60) {
    return `${timeUntilExpiration}s`;
  }
  
  const minutes = Math.floor(timeUntilExpiration / 60);
  const seconds = timeUntilExpiration % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${seconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m ${seconds}s`;
}

/**
 * 개발 모드에서 토큰 정보를 로그에 출력
 */
export function logTokenInfo(token: string, label = 'Token'): void {
  if (import.meta.env.DEV) {
    const payload = decodeJWT(token);

    if (payload) {
      // eslint-disable-next-line no-console
      console.log(`[${label}] Type: ${payload.type}, Expires in: ${formatTokenExpiration(token)}`);
    }
  }
}