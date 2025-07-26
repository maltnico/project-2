import { Star, CheckCircle } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Rémy",
      initials: "RE",
      rating: 5,
      title: "Sur des rails",
      content: "Le site vous prend par la main pour la rédaction de vos premiers baux. La signature électronique des documents, importante à la fois pour le locataire et le bailleur, est très pratique.",
      verified: true,
      tags: ["Simplicité", "Rapidité", "Conformité", "Rentabilité", "Autonomie"]
    },
    {
      name: "Nicolas B.",
      initials: "NB",
      rating: 5,
      title: "L'outil le plus simple",
      content: "EasyBail est le meilleur outil pour gérer efficacement un parc locatif. Après plus de deux ans d'utilisation, j'en suis plus que satisfait et ne peux que vous recommander ce service.",
      verified: true,
      tags: ["Efficacité", "Satisfaction", "Recommandation"]
    },
    {
      name: "Marie L.",
      initials: "ML",
      rating: 5,
      title: "Gain de temps énorme",
      content: "Depuis que j'utilise EasyBail, je passe 80% moins de temps sur ma gestion locative. Les automatisations sont parfaites et me font gagner des heures chaque mois.",
      verified: true,
      tags: ["Automatisation", "Gain de temps", "Efficacité"]
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4 fill-current" />
            Plus de 1000+ propriétaires indépendants nous font confiance
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Avec EasyBail, vous êtes entre de bonnes mains
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choisir EasyBail, c'est bénéficier d'un logiciel et d'un accompagnement pour une gestion locative en toute sérénité.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    {testimonial.verified && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">Vérifié</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Rating */}
                <div className="flex items-center gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              {/* Title */}
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                {testimonial.title}
              </h5>

              {/* Content */}
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                {testimonial.content}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {testimonial.tags.slice(0, 3).map((tag, tagIndex) => (
                  <span key={tagIndex} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
                {testimonial.tags.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{testimonial.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Suivi rapide et personnalisé
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Support client réactif disponible 7j/7 pour vous accompagner
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎓</span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Formation continue
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Guides, webinaires et ressources pour maîtriser votre gestion
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Alertes & notifications
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ne ratez plus jamais une échéance importante
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
