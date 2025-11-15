import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function App({ children }: { children: React.ReactNode }) {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
    | string
    | undefined;

  if (!clerkPubKey) {
    throw new Error('Missing Clerk Publishable Key');
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export default App;
