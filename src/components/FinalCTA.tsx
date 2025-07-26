import { ArrowRight, Clock } from 'lucide-react';

const FinalCTA = () => {
  return (
    <section className="py-20 bg-blue-600 dark:bg-blue-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        {/* Clock Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
          <Clock className="h-8 w-8 text-white" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
          Démarrez en 2 minutes.
        </h2>

        {/* Subheading */}
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Rejoignez les milliers de propriétaires qui ont simplifié leur gestion locative avec EasyBail
        </p>

        {/* Benefits */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 mb-10 text-blue-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>7 jours d'essai gratuit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Sans engagement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Support 7j/7</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-50 transition-colors flex items-center group shadow-lg">
            Commencer gratuitement
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            Voir une démo
          </button>
        </div>

        {/* Small print */}
        <p className="text-blue-200 text-sm mt-6">
          Aucune carte bancaire requise pour l'essai gratuit
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 pt-16 border-t border-blue-500/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">1000+</div>
            <div className="text-blue-200">Propriétaires actifs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">5000+</div>
            <div className="text-blue-200">Biens gérés</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">99.9%</div>
            <div className="text-blue-200">Disponibilité</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
