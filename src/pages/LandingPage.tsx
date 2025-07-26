import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';
import KeyBenefits from '../components/KeyBenefits';
import Testimonials from '../components/Testimonials';
import PricingComparison from '../components/PricingComparison';
import FAQ from '../components/FAQ';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = () => {
    navigate('/login?mode=signup');
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header 
        onLoginClick={handleLoginClick}
        onSignupClick={handleSignupClick}
      />
      <Hero 
        onLoginClick={handleLoginClick}
        onSignupClick={handleSignupClick}
      />
      <KeyBenefits />
      <Testimonials />
      <PricingComparison />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
