const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Fonctionnalités
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Découvrez toutes les fonctionnalités d'EasyBail
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "Baux & documents", description: "Génération automatique de tous vos documents" },
            { title: "Automatisations", description: "Automatisez vos tâches répétitives" },
            { title: "Signature électronique", description: "Signez vos documents à distance" },
            { title: "Espace locataire", description: "Interface dédiée à vos locataires" },
            { title: "Suivi des finances", description: "Tableau de bord financier complet" },
            { title: "Accompagnement", description: "Support et formation continue" },
          ].map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {feature.description}
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                En savoir plus
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
