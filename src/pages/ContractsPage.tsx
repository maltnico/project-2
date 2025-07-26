const ContractsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contrats de location
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Générez tous vos contrats de bail en quelques clics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "Bail meublé", description: "Contrat pour location meublée" },
            { title: "Bail non meublé", description: "Contrat pour location vide" },
            { title: "Bail étudiant", description: "Contrat spécialisé pour étudiants" },
            { title: "Bail de colocation", description: "Contrat pour plusieurs locataires" },
            { title: "Bail de stationnement", description: "Contrat pour garage ou parking" },
          ].map((contract, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {contract.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {contract.description}
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Générer le contrat
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;
