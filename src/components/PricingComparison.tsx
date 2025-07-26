import { useState } from 'react';
import { Check, Calculator, ArrowRight } from 'lucide-react';

const PricingComparison = () => {
  const [monthlyRent, setMonthlyRent] = useState(625);
  
  const agencyFee = monthlyRent * 12 * 0.08; // 8% des loyers annuels
  const easyBailFee = 120; // 10€/mois * 12
  const savings = agencyFee - easyBailFee;
  const savingsIn10Years = savings * 10;

  const features = [
    "Entrées/sorties locataires illimitées",
    "Signatures électroniques illimitées",
    "État des lieux sur smartphone",
    "Automatisations (quittance, révision du loyer...)",
    "50+ documents légaux & pré-remplis",
    "Gestion des finances",
    "Espace locataire",
    "Stockage de documents illimité",
    "Assistance réactive 7j/7"
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Une offre complète & tout inclus
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Sans frais cachés. Sans engagement. Sans risque.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Price Calculator */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Calculator className="h-6 w-6 text-blue-600" />
              Comparez avec une agence
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mon loyer s'élève à :
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold text-gray-900 dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    € par mois
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Économisez</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {Math.round(savings)}€ par an
                  </p>
                  <p className="text-lg text-gray-700 dark:text-gray-300">
                    soit <span className="font-semibold text-green-600 dark:text-green-400">
                      {Math.round(savingsIn10Years).toLocaleString()}€ en 10 ans
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center border-2 border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Avec EasyBail</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{easyBailFee}€ par an</p>
                  <p className="text-xs text-blue-500 dark:text-blue-300">en gestion autonome</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center border-2 border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">Tarif d'une agence</p>
                  <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{Math.round(agencyFee)}€ par an*</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">en mandat de gestion</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                * Comparatif basé sur des frais d'agence à 8 % des loyers annuels
              </p>
            </div>
          </div>

          {/* Pricing Plan */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800 relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                Le plus populaire
              </span>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Gestion locative en ligne
              </h3>
              <div className="mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">À partir de</span>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">9,99 €</span>
                  <span className="text-gray-600 dark:text-gray-300 pb-1">par mois</span>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 group">
              Commencer gratuitement
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
              7 jours d'essai offerts. Sans engagement.
            </p>
          </div>
        </div>

        {/* Why Choose EasyBail */}
        <div className="mt-20">
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Voici pourquoi EasyBail est le n°1 de la gestion locative en ligne
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {[
              { icon: "👌", title: "Intuitif", description: "Simple à prendre en main et à utiliser." },
              { icon: "🔔", title: "Toujours là pour vous", description: "Conseillers réactifs et disponibles 7j/7." },
              { icon: "🧰", title: "Tout compris", description: "Plateforme de gestion et signature électronique." },
              { icon: "🧘", title: "Transparent", description: "Sans frais cachés, sans engagement." },
              { icon: "⚖️", title: "Conforme", description: "À jour des dernières lois et protégeant vos intérêts." }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingComparison;
