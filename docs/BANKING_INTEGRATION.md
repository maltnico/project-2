# 🏦 Intégration Bancaire GoCardless - Easy Bail

## 🎯 Vue d'ensemble

Cette intégration permet de connecter vos comptes bancaires via l'API GoCardless (ex-Nordigen) conforme PSD2 pour importer automatiquement vos transactions dans Easy Bail.

## ✨ Fonctionnalités

- ✅ **Connexion sécurisée** aux banques via PSD2
- ✅ **Synchronisation automatique** des transactions
- ✅ **Catégorisation intelligente** des opérations immobilières
- ✅ **Support multi-banques** (2000+ institutions européennes)
- ✅ **Import automatique** dans les flux financiers existants
- ✅ **Gestion des erreurs** et reconnexion
- ✅ **Suivi des synchronisations** et historique

## 🚀 Configuration avec votre Token Sandbox

### Token d'Accès Fourni
```
sandbox_eFuTUSa27UQazMxbcBLcbnFAgw7WnPldRGjlr9vN
```

### 1. Configuration dans l'Application

1. Allez dans **Finances** > **Onglet Banques**
2. Cliquez sur **Configuration Bancaire**
3. Entrez les informations suivantes :
   - **Secret ID** : `sandbox_eFuTUSa27UQazMxbcBLcbnFAgw7WnPldRGjlr9vN`
   - **Secret Key** : `sandbox_eFuTUSa27UQazMxbcBLcbnFAgw7WnPldRGjlr9vN`
   - **Environnement** : `sandbox`
   - **Pays par défaut** : `FR`
   - **Synchronisation automatique** : `Activé`
   - **Fréquence de synchronisation** : `daily`

### 2. Test de la Configuration

Une fois configuré, vous pouvez :
- ✅ Tester la connexion avec le bouton **Tester la Connexion**
- ✅ Voir les banques françaises disponibles
- ✅ Connecter un compte bancaire de test

## 🚀 Configuration initiale

1. Allez sur [GoCardless Bank Account Data](https://gocardless.com/bank-account-data/)
2. Créez un compte développeur
3. Récupérez vos clés API (Secret ID et Secret Key)
4. Commencez avec l'environnement **Sandbox** pour tester

### 2. Configuration dans Easy Bail

1. Allez dans **Finances** → **Banques** → **Configuration**
2. Saisissez vos clés API GoCardless
3. Choisissez l'environnement (Sandbox pour test, Production pour usage réel)
4. Configurez les paramètres de synchronisation

### 3. Connecter votre première banque

1. Allez dans **Finances** → **Banques** → **Mes Banques**
2. Cliquez sur "Ajouter une banque"
3. Sélectionnez votre banque dans la liste
4. Suivez le processus d'authentification sécurisé
5. Autorisez l'accès à vos comptes

## 📊 Utilisation quotidienne

### Synchronisation automatique

Les transactions sont importées automatiquement selon la fréquence configurée :
- **Quotidienne** : Tous les jours à 6h00
- **Hebdomadaire** : Tous les lundis à 6h00
- **Manuelle** : Uniquement quand vous cliquez sur "Synchroniser"

### Synchronisation manuelle

Vous pouvez déclencher une synchronisation à tout moment :
1. Allez dans **Finances** → **Banques**
2. Cliquez sur "Synchroniser tout" ou sur l'icône de synchronisation d'une banque

### Catégorisation automatique

Les transactions sont automatiquement catégorisées selon des mots-clés :

| Catégorie | Mots-clés détectés |
|-----------|-------------------|
| **Loyer** | loyer, rent, location, bail |
| **Charges** | charges, syndic, copropriété |
| **Utilities** | edf, gdf, suez, veolia, eau, électricité, gaz |
| **Assurance** | assurance, axa, maif, macif, matmut |
| **Entretien** | réparation, plombier, électricien, entretien |

## 🔧 Architecture technique

### Services créés

- **`bankingService.ts`** : Service principal pour l'API GoCardless
- **`useBanking.ts`** : Hook React pour la gestion bancaire
- **`BankingConfiguration.tsx`** : Interface de configuration
- **`BankConnections.tsx`** : Gestion des connexions bancaires

### Base de données

Nouvelles tables créées :
- `bank_connections` : Connexions bancaires utilisateur
- `banking_configuration` : Configuration par utilisateur
- `banking_sync_history` : Historique des synchronisations
- `financial_flows.metadata` : Métadonnées des transactions (ajout)

### Sécurité

- ✅ Clés API chiffrées en localStorage
- ✅ Tokens d'accès temporaires (90 jours)
- ✅ Authentification OAuth2 via banque
- ✅ Pas de stockage des mots de passe bancaires
- ✅ Conforme PSD2 et RGPD

## 💰 Coûts GoCardless

### Plan gratuit
- **100 connexions/mois** - Gratuit
- Parfait pour démarrer et tester

### Plans payants (si nécessaire)
- **Startup** : 500 connexions/mois - ~30€/mois
- **Business** : 2000 connexions/mois - ~100€/mois

## 🐛 Résolution des problèmes

### Connexion échouée
1. Vérifiez vos clés API dans la configuration
2. Assurez-vous d'être dans le bon environnement (Sandbox/Production)
3. Vérifiez que la banque est supportée
4. Réessayez la connexion

### Synchronisation échouée
1. Vérifiez la connexion internet
2. Reconnectez-vous à votre banque si le token a expiré
3. Vérifiez les logs d'erreur dans la console développeur
4. Contactez le support si le problème persiste

### Transactions manquantes
1. Vérifiez la période de synchronisation (défaut : 90 jours)
2. Lancez une synchronisation manuelle
3. Vérifiez les filtres dans l'onglet Transactions

## 📈 Optimisations futures

### Version 1.1
- [ ] Support de plus de pays européens
- [ ] Catégorisation par machine learning
- [ ] Rapprochement automatique loyer/locataire
- [ ] Alertes sur transactions suspectes

### Version 1.2
- [ ] Prévisions de trésorerie
- [ ] Export bancaire vers comptable
- [ ] API webhooks pour notifications temps réel
- [ ] Support Open Banking UK

## 🆘 Support

### Documentation GoCardless
- [API Documentation](https://nordigen.com/en/docs/)
- [Supported Banks](https://nordigen.com/en/coverage/)
- [FAQ](https://nordigen.com/en/faq/)

### Support Easy Bail
- Email : support@easybail.fr
- GitHub Issues : [Easy-Bail/issues](https://github.com/maltnico/Easy-Bail/issues)

---

*Cette intégration a été développée pour Easy Bail V2 en juillet 2025. Elle est entièrement gratuite et open-source.*
