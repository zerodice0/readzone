import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <main className="flex-1 w-full">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;