import Header from '../components/Header';
import Footer from '../components/Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
