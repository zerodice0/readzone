import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="paper-page">
      <Header />
      <main id="main-content" role="main" className="pb-28 md:pb-0">
        {children}
      </main>
    </div>
  );
}
