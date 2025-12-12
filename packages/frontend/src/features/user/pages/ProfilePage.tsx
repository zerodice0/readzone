import { useUser, UserProfile } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { UserLayout } from '../../../components/layout/UserLayout';
import EmailVerificationBanner from '../../../components/EmailVerificationBanner';

/**
 * T113: ProfilePage
 * User profile view and edit page using Clerk UserProfile component
 */

function ProfilePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <p className="text-stone-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Email Verification Banner */}
      {user && !user.primaryEmailAddress?.verification.status && (
        <EmailVerificationBanner />
      )}

      <UserLayout title="프로필">
        <UserProfile
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: '#f97316',
              colorBackground: '#ffffff',
              colorText: '#1c1917',
              colorTextSecondary: '#57534e',
              borderRadius: '0.75rem',
            },
            elements: {
              rootBox: 'w-full',
              card: 'shadow-sm border border-stone-200 rounded-xl',
              navbar: 'border-r border-stone-200',
              navbarButton:
                'text-stone-700 hover:text-primary-600 hover:bg-stone-50',
              navbarButtonActive: 'text-primary-600 bg-primary-50',
              pageScrollBox: 'p-6',
              formButtonPrimary:
                'bg-primary-600 hover:bg-primary-700 text-white rounded-lg',
              formButtonReset:
                'text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg',
              formFieldInput:
                'border-stone-300 focus:border-primary-500 focus:ring-primary-500 rounded-lg',
              badge: 'bg-primary-100 text-primary-700',
              avatarBox: 'rounded-full border-2 border-stone-200',
            },
          }}
        />
      </UserLayout>
    </>
  );
}

export default ProfilePage;
