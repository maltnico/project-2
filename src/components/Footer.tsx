import { FileText, Mail, Phone, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        {/* Top Section */}
        <div className="border-b border-gray-800 pb-12 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <span className="text-3xl font-bold">EasyBail</span>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed mb-6">
                Logiciel N°1 en France pour gérer votre location simplement et en ligne.
              </p>
              <p className="text-lg text-blue-400 font-medium">
                Service client 7j/7.
              </p>
              
              {/* Trust Indicators */}
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-300">
                  Plus de 1000+ propriétaires nous font confiance
                </span>
              </div>
            </div>

            {/* Right - CTA */}
            <div className="bg-blue-600 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Prêt à commencer ?
              </h3>
              <p className="text-blue-100 mb-6">
                Rejoignez les milliers de propriétaires qui simplifient leur gestion locative
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Essayer gratuitement
                </button>
                <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                  Voir une démo
                </button>
              </div>
              <p className="text-blue-200 text-sm mt-3">
                7 jours d'essai • Sans engagement
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Contrats de location */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Contrats de location</h3>
            <ul className="space-y-3 text-gray-300">
              <li><Link to="/contrats" className="hover:text-blue-400 transition-colors">Bail meublé</Link></li>
              <li><Link to="/contrats" className="hover:text-blue-400 transition-colors">Bail non meublé</Link></li>
              <li><Link to="/contrats" className="hover:text-blue-400 transition-colors">Bail étudiant</Link></li>
              <li><Link to="/contrats" className="hover:text-blue-400 transition-colors">Bail de colocation</Link></li>
              <li><Link to="/contrats" className="hover:text-blue-400 transition-colors">Bail de stationnement</Link></li>
            </ul>
          </div>

          {/* Documents locatifs */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Documents locatifs</h3>
            <ul className="space-y-3 text-gray-300">
              <li><Link to="/documents" className="hover:text-blue-400 transition-colors">Quittance de loyer</Link></li>
              <li><Link to="/documents" className="hover:text-blue-400 transition-colors">État des lieux</Link></li>
              <li><Link to="/documents" className="hover:text-blue-400 transition-colors">Grille de vétusté</Link></li>
              <li><Link to="/documents" className="hover:text-blue-400 transition-colors">Caution solidaire</Link></li>
              <li><Link to="/documents" className="hover:text-blue-400 transition-colors">Congé locataire</Link></li>
            </ul>
          </div>

          {/* Fonctionnalités */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Fonctionnalités</h3>
            <ul className="space-y-3 text-gray-300">
              <li><Link to="/fonctionnalites" className="hover:text-blue-400 transition-colors">Baux & documents</Link></li>
              <li><Link to="/fonctionnalites" className="hover:text-blue-400 transition-colors">Automatisations</Link></li>
              <li><Link to="/fonctionnalites" className="hover:text-blue-400 transition-colors">Signature électronique</Link></li>
              <li><Link to="/fonctionnalites" className="hover:text-blue-400 transition-colors">Espace locataire</Link></li>
              <li><Link to="/fonctionnalites" className="hover:text-blue-400 transition-colors">Suivi des finances</Link></li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Ressources</h3>
            <ul className="space-y-3 text-gray-300">
              <li><Link to="/ressources" className="hover:text-blue-400 transition-colors">Guide du bailleur</Link></li>
              <li><Link to="/ressources" className="hover:text-blue-400 transition-colors">Centre d'aide</Link></li>
              <li><Link to="/ressources" className="hover:text-blue-400 transition-colors">Actualité du locatif</Link></li>
              <li><Link to="/ressources" className="hover:text-blue-400 transition-colors">Formation</Link></li>
              <li><Link to="/ressources" className="hover:text-blue-400 transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* À propos */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">À propos</h3>
            <ul className="space-y-3 text-gray-300">
              <li><Link to="/tarifs" className="hover:text-blue-400 transition-colors">Tarifs</Link></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Sécurité des données</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Pourquoi EasyBail ?</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Espace Presse</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Nous contacter</a></li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium">Email</p>
                <a href="mailto:contact@easybail.fr" className="text-gray-300 hover:text-blue-400 transition-colors">
                  contact@easybail.fr
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">Téléphone</p>
                <a href="tel:0180914282" className="text-gray-300 hover:text-green-400 transition-colors">
                  01 80 91 42 82
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 bg-opacity-20 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Adresse</p>
                <span className="text-gray-300">Paris, France</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2025 EasyBail SAS. Tous droits réservés. | RCS Paris 123 456 789
          </div>
          <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-white transition-colors">Conditions générales</a>
            <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
