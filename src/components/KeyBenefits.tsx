import { FileText, Zap, MessageSquare, TrendingUp, Clock } from 'lucide-react';

const KeyBenefits = () => {
  const benefits = [
    {
      icon: FileText,
      title: "Documents conformes & personnalisés",
      subtitle: "Prenez les bonnes actions au bon moment",
      description: "Arrivée du locataire, gestion courante, travaux, litiges, fin de location... Peu importe la situation, soyez certain de toujours savoir quoi faire, conformément à la loi.",
      color: "bg-blue-600",
      textColor: "text-blue-600"
    },
    {
      icon: Zap,
      title: "Automatisations complètes",
      subtitle: "Passez 5x moins de temps à gérer vos locations",
      description: "Quittances, révision du loyer et autres obligations locatives. Automatisez toutes les tâches locatives et gagnez un temps phénoménal dans votre gestion.",
      color: "bg-orange-600",
      textColor: "text-orange-600",
      highlight: "69% des propriétaires qui utilisent EasyBail depuis plus d'un an disent passer 5x moins de temps dans leur gestion locative."
    },
    {
      icon: MessageSquare,
      title: "Échanges en ligne simplifiés",
      subtitle: "Communiquez mieux pour être moins sollicité",
      description: "Soyez ultra réactif et transparent. Partagez vos documents en 1 clic. Signez-les à distance avec la signature électronique. Envoyez lettres et recommandés directement depuis votre espace.",
      color: "bg-purple-600",
      textColor: "text-purple-600"
    },
    {
      icon: TrendingUp,
      title: "Suivi des finances",
      subtitle: "Oubliez Excel, automatisez la gestion de vos flux locatifs",
      description: "Votre loyer, un prêt immobilier, une assurance, des travaux ? Renseignez vos dépenses et recettes via des flux ponctuels ou récurrents. Préparez facilement votre déclaration fiscale.",
      color: "bg-green-600",
      textColor: "text-green-600"
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Facile. Rapide. Conforme.
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Gardez le contrôle et mettez votre location en pilote automatique.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-20">
          {benefits.map((benefit, index) => (
            <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
              {/* Content */}
              <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${benefit.color} mb-6`}>
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                
                <h4 className={`text-lg font-semibold ${benefit.textColor} dark:${benefit.textColor} mb-4`}>
                  {benefit.subtitle}
                </h4>
                
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                  {benefit.description}
                </p>

                {benefit.highlight && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 text-sm">💡</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                          {benefit.highlight}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Sondage sur 2634 répondants.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {index === benefits.length - 1 && (
                  <div className="mt-8">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                      Essayer gratuitement
                    </button>
                  </div>
                )}
              </div>

              {/* Visual */}
              <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                <div className="relative">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                    {/* Mock interface preview based on the benefit */}
                    {index === 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-gray-900 dark:text-white">Documents générés</h5>
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">Conforme</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Contrat de bail - Appartement 2B</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <FileText className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">État des lieux d'entrée</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <FileText className="h-5 w-5 text-purple-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Quittance janvier 2025</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {index === 1 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-gray-900 dark:text-white">Automatisations actives</h5>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">3 actives</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quittances mensuelles</span>
                              <Clock className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Envoi automatique le 1er de chaque mois</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Révision de loyer</span>
                              <Clock className="h-4 w-4 text-blue-500" />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Calcul automatique selon IRL</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {index === 2 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-gray-900 dark:text-white">Communication</h5>
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="space-y-3">
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">JD</div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700 dark:text-gray-300">Document signé électroniquement</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 2 heures</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-xs font-semibold text-green-600 dark:text-green-400">ML</div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700 dark:text-gray-300">Quittance reçue et validée</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Hier</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {index === 3 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-gray-900 dark:text-white">Finances</h5>
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">+€4,280</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Revenus ce mois</p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">-€320</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Charges</p>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Déclaration fiscale</p>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Prête à 75%</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyBenefits;
