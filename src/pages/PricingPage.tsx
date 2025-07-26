const PricingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tarifs
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Choisissez l'offre qui vous convient
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              title: "Starter",
              price: "9,99",
              description: "Parfait pour débuter",
              features: ["1 bien", "Documents de base", "Support email"]
            },
            {
              title: "Pro",
              price: "19,99",
              description: "Pour les propriétaires actifs",
              features: ["5 biens", "Toutes les fonctionnalités", "Support prioritaire", "Automatisations"],
              popular: true
            },
            {
              title: "Expert",
              price: "39,99",
              description: "Pour les gros patrimoines",
              features: ["Biens illimités", "API access", "Support téléphonique", "Formation personnalisée"]
            }
          ].map((plan, index) => (
            <div key={index} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 ${plan.popular ? 'ring-2 ring-blue-500' : ''} hover:shadow-lg transition-shadow`}>
              {plan.popular && (
                <div className="text-center mb-4">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">Plus populaire</span>
                </div>
              )}
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {plan.title}
              </h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {plan.price}€<span className="text-lg text-gray-500">/mois</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {plan.description}
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-600 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                plan.popular 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}>
                Choisir ce plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
