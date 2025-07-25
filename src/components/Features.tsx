import { 
  FileText, 
  Zap, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Shield,
  Building,
  Settings
} from 'lucide-react';
import FeatureCard from './FeatureCard';

const Features = () => {
  const features = [
    {
      icon: FileText,
      title: "Documents locatifs",
      description: "Générateur de documents conformes avec templates personnalisables",
      color: "bg-blue-600",
      features: [
        "Templates de documents personnalisables",
        "Génération automatique de contrats",
        "Quittances de loyer automatisées",
        "États des lieux numériques",
        "Stockage sécurisé des documents"
      ]
    },
    {
      icon: TrendingUp,
      title: "Suivi financier",
      description: "Tableau de bord financier complet pour analyser votre rentabilité",
      color: "bg-purple-600",
      features: [
        "Dashboard financier en temps réel",
        "Suivi des revenus et dépenses",
        "Graphiques de performance",
        "Rapports mensuels automatiques",
        "Calcul de rentabilité par bien"
      ]
    },
    {
      icon: Building,
      title: "Gestion des biens",
      description: "Centralisez la gestion de tout votre patrimoine immobilier",
      color: "bg-green-600",
      features: [
        "Fiche détaillée par propriété",
        "Suivi des statuts d'occupation",
        "Gestion des caractéristiques",
        "Photos et documents associés",
        "Historique des modifications"
      ]
    },
    {
      icon: Users,
      title: "Gestion des locataires",
      description: "Centralisez toutes les informations de vos locataires",
      color: "bg-blue-500",
      features: [
        "Fiches locataires complètes",
        "Suivi des contrats en cours",
        "Historique des paiements",
        "Documents contractuels",
        "Communication intégrée"
      ]
    },
    {
      icon: Zap,
      title: "Automatisations",
      description: "Automatisez vos tâches répétitives et gagnez du temps",
      color: "bg-orange-600",
      features: [
        "Automatisations personnalisables",
        "Rappels automatiques",
        "Génération de documents programmée",
        "Notifications par email",
        "Workflows configurables"
      ]
    },
    {
      icon: AlertTriangle,
      title: "Alertes et notifications",
      description: "Restez informé des événements importants",
      color: "bg-yellow-600",
      features: [
        "Système d'alertes intelligent",
        "Notifications en temps réel",
        "Rappels d'échéances",
        "Suivi des tâches importantes",
        "Historique des activités"
      ]
    },
    {
      icon: Shield,
      title: "Sécurité & Conformité",
      description: "Vos données sont protégées et sécurisées",
      color: "bg-gray-600",
      features: [
        "Chiffrement des données",
        "Authentification sécurisée",
        "Gestion des sessions",
        "Sauvegarde automatique",
        "Conformité RGPD"
      ]
    },
    {
      icon: Settings,
      title: "Administration",
      description: "Outils d'administration et de configuration avancés",
      color: "bg-indigo-600",
      features: [
        "Tableau de bord administrateur",
        "Gestion des utilisateurs",
        "Configuration système",
        "Logs et monitoring",
        "Paramètres avancés"
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: Shield,
      title: "Sécurité des données",
      description: "Protection et chiffrement de vos données",
      color: "bg-gray-600",
      features: [
        "Authentification sécurisée",
        "Gestion des sessions",
        "Sauvegarde automatique",
        "Conformité RGPD"
      ]
    },
    {
      icon: FileText,
      title: "Rapports et exports",
      description: "Générez des rapports détaillés",
      color: "bg-green-600",
      features: [
        "Rapports financiers",
        "Export des données",
        "Historique détaillé",
        "Statistiques avancées"
      ]
    },
    {
      icon: Settings,
      title: "Configuration avancée",
      description: "Personnalisez l'application selon vos besoins",
      color: "bg-indigo-600",
      features: [
        "Paramètres utilisateur",
        "Templates personnalisés",
        "Automatisations sur mesure",
        "Interface adaptable"
      ]
    },
    {
      icon: AlertTriangle,
      title: "Support et maintenance",
      description: "Assistance et suivi continu",
      color: "bg-yellow-600",
      features: [
        "Support intégré",
        "Logs système",
        "Monitoring en temps réel",
        "Mises à jour automatiques"
      ]
    }
  ];

  return (
    <section id="fonctionnalites" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Toutes les fonctionnalités pour
            <span className="text-blue-600 block">gérer vos biens efficacement</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Plateforme complète de gestion locative avec les outils essentiels 
            pour gérer vos propriétés, locataires et finances.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              features={feature.features}
              color={feature.color}
            />
          ))}
        </div>

        {/* Additional Features - Simplified */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Et bien plus encore...
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-blue-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Prêt à simplifier votre gestion locative ?
            </h3>
            <p className="text-lg mb-6 text-blue-100">
              Découvrez toutes les fonctionnalités d'EasyBail
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                Commencer
              </button>
              <button className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold">
                Voir les fonctionnalités
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
