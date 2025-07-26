import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Quel est le meilleur site de gestion locative en ligne ?",
      answer: "EasyBail se distingue par sa simplicité d'utilisation, ses automatisations complètes et son support client réactif. Nous proposons une solution tout-en-un qui couvre tous les aspects de la gestion locative, de la création des baux à la gestion financière, en passant par les automatisations et la signature électronique."
    },
    {
      question: "EasyBail propose-t-il une version gratuite ?",
      answer: "Nous proposons un essai gratuit de 7 jours pour découvrir toutes les fonctionnalités d'EasyBail. Après cette période, notre abonnement commence à partir de 9,99€/mois, ce qui reste très économique comparé aux frais d'agence traditionnels."
    },
    {
      question: "EasyBail est-il adapté à tous les types de locations ?",
      answer: "Oui, EasyBail s'adapte à tous types de locations : appartements, maisons, locations meublées ou non meublées, colocations, locations saisonnières, garages, bureaux... Notre plateforme propose des modèles de documents spécifiques à chaque situation."
    },
    {
      question: "EasyBail est-il pensé pour tous les bailleurs ?",
      answer: "Absolument ! Que vous soyez propriétaire d'un seul bien, d'un patrimoine locatif important, ou même professionnel de l'immobilier, EasyBail s'adapte à vos besoins. Nos fonctionnalités évoluent avec la taille de votre parc locatif."
    },
    {
      question: "Est-ce vraiment sans engagement ?",
      answer: "Oui, notre service est sans engagement. Vous pouvez arrêter votre abonnement à tout moment depuis votre espace personnel. Aucune pénalité ni frais de résiliation ne s'appliquent."
    },
    {
      question: "Quels moyens de paiement puis-je utiliser ?",
      answer: "Nous acceptons toutes les cartes bancaires (Visa, Mastercard, American Express) ainsi que les virements SEPA. Le paiement est sécurisé et traité par notre partenaire de confiance Stripe."
    },
    {
      question: "Puis-je déduire le coût du service de mes revenus locatifs ?",
      answer: "Oui, l'abonnement EasyBail constitue une charge déductible de vos revenus locatifs dans le cadre de votre déclaration fiscale, au même titre que les autres frais de gestion locative."
    },
    {
      question: "Comment mes données et celles de mes locataires sont-elles sécurisées ?",
      answer: "La sécurité est notre priorité. Vos données sont chiffrées, hébergées en France sur des serveurs sécurisés, et nous respectons scrupuleusement le RGPD. Nous réalisons régulièrement des audits de sécurité et disposons de sauvegardes automatiques."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Questions fréquentes
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Trouvez rapidement les réponses à vos questions sur EasyBail
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Help */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Vous ne trouvez pas la réponse à votre question ?
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Contactez notre support
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
