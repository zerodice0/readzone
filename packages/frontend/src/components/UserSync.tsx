import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';

/**
 * UserSync 컴포넌트
 *
 * Clerk 로그인 상태를 감지하여 Convex users 테이블과 동기화합니다.
 * 로그인 시 사용자 정보(name, imageUrl, email)를 자동으로 업데이트합니다.
 */
export function UserSync() {
  const { isSignedIn, isLoaded } = useUser();
  const getOrCreateCurrentUser = useMutation(api.users.getOrCreateCurrentUser);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void getOrCreateCurrentUser();
    }
  }, [isLoaded, isSignedIn, getOrCreateCurrentUser]);

  return null;
}
