import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, FileText, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const Header: React.FC<HeaderProps> = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const menuItems = [
    {
      title: 'Contrats',
      items: [
        { name: 'Bail meublé', href: '/contrats' },
        { name: 'Bail non meublé', href: '/contrats' },
        { name: 'Bail étudiant', href: '/contrats' },
        { name: 'Bail de colocation', href: '/contrats' },
        { name: 'Bail de stationnement', href: '/contrats' },
      ]
    },
    {
      title: 'Documents',
      items: [
        { name: 'Quittance de loyer', href: '/documents' },
        { name: 'État des lieux', href: '/documents' },
        { name: 'Grille de vétusté', href: '/documents' },
        { name: 'Caution solidaire', href: '/documents' },
        { name: 'Congé locataire', href: '/documents' },
      ]
    },
    {
      title: 'Fonctionnalités',
      items: [
        { name: 'Baux & documents', href: '/fonctionnalites' },
        { name: 'Automatisations', href: '/fonctionnalites' },
        { name: 'Signature électronique', href: '/fonctionnalites' },
        { name: 'Espace locataire', href: '/fonctionnalites' },
        { name: 'Suivi des finances', href: '/fonctionnalites' },
        { name: 'Accompagnement', href: '/fonctionnalites' },
      ]
    },
    {
      title: 'Ressources',
      items: [
        { name: 'Guide du bailleur', href: '/ressources' },
        { name: 'Centre d\'aide', href: '/ressources' },
        { name: 'Actualité du locatif', href: '/ressources' },
        { name: 'Formation', href: '/ressources' },
      ]
    }
  ];

  const handleDropdownToggle = (title: string) => {
    setActiveDropdown(activeDropdown === title ? null : title);
  };

  const handleMouseEnter = (title: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveDropdown(title);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150); // Délai de 150ms avant de fermer le menu
  };

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">EasyBail</span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            {menuItems.map((menu) => (
              <div key={menu.title} className="relative group">
                <button
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold py-2"
                  onMouseEnter={() => handleMouseEnter(menu.title)}
                  onMouseLeave={handleMouseLeave}
                >
                  {menu.title}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {activeDropdown === menu.title && (
                  <div
                    className="absolute top-full left-0 mt-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                    onMouseEnter={() => handleMouseEnter(menu.title)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {menu.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <Link to="/tarifs" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold">
              Tarifs
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors"
            >
              Se connecter
            </Link>
            <Link
              to="/login?mode=signup"
              className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold"
            >
              Essai gratuit
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex flex-col space-y-4">
              {menuItems.map((menu) => (
                <div key={menu.title} className="border-b border-gray-100 dark:border-gray-800 pb-4">
                  <button
                    onClick={() => handleDropdownToggle(menu.title)}
                    className="flex items-center justify-between w-full text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium py-2"
                  >
                    {menu.title}
                    <ChevronDown className={`h-4 w-4 transform transition-transform ${activeDropdown === menu.title ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {activeDropdown === menu.title && (
                    <div className="mt-2 pl-4 space-y-2">
                      {menu.items.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <Link to="/tarifs" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium py-2">
                Tarifs
              </Link>
              
              <div className="flex flex-col space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors text-center py-2"
                >
                  Se connecter
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold text-center"
                >
                  Essai gratuit
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
