const ResourcesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ressources
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Guides, formations et support pour vous accompagner
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {[
            { title: "Guide du bailleur", description: "Guide complet pour les propriétaires" },
            { title: "Centre d'aide", description: "FAQ et documentation technique" },
            { title: "Actualité du locatif", description: "Dernières actualités immobilières" },
            { title: "Formation", description: "Webinaires et formations en ligne" },
          ].map((resource, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {resource.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {resource.description}
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Accéder
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
