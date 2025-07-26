const DocumentsPage = () => {
  return (
    <div className="space-y-8">
      {/* Enhanced Header with Icon */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documents locatifs</h1>
              <p className="text-gray-600 mt-1">
                Tous les documents essentiels pour votre gestion locative
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { title: "Quittance de loyer", description: "Justificatif de paiement mensuel" },
          { title: "État des lieux", description: "Constat d'entrée et de sortie" },
          { title: "Grille de vétusté", description: "Barème d'usure normale" },
          { title: "Caution solidaire", description: "Engagement de caution" },
          { title: "Congé locataire", description: "Préavis de départ" },
        ].map((document, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:scale-105">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {document.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {document.description}
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
              Générer le document
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentsPage;
