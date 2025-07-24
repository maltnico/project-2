# Guide du Vault - Stockage Sécurisé des Configurations

## Vue d'ensemble

Le système de vault (coffre-fort) permet de stocker de manière sécurisée les configurations sensibles comme les mots de passe SMTP, clés API, et autres secrets dans la base de données Supabase avec chiffrement.

## Fonctionnalités

### 🔐 Sécurité
- **Chiffrement** : Les données sensibles sont chiffrées avant stockage
- **Isolation** : Chaque configuration est stockée séparément
- **Contrôle d'accès** : Seuls les administrateurs peuvent accéder au vault
- **Audit** : Traçabilité des modifications avec timestamps

### 🗂️ Catégories supportées
- `mail` : Configuration serveurs SMTP
- `database` : Paramètres base de données
- `api` : Clés API externes
- `system` : Configuration système
- `security` : Paramètres de sécurité

## Installation

### 1. Migration de la base de données

Exécutez la migration pour créer la table vault :

```sql
-- Applique automatiquement : supabase/migrations/20250724120000_create_vault_table.sql
```

### 2. Configuration des permissions

La table vault utilise Row Level Security (RLS) :
- Seuls les utilisateurs avec `role = 'admin'` peuvent accéder au vault
- Les données sont isolées par rôle utilisateur

## Utilisation

### Configuration Mail via le Vault

```typescript
import { vaultService } from '../lib/vaultService';
import { mailService } from '../lib/mailService';

// Sauvegarder la configuration mail
const mailConfig = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  username: 'user@example.com',
  password: 'secret-password', // Sera chiffré automatiquement
  from: 'noreply@example.com',
  enabled: true,
  provider: 'other'
};

await mailService.saveConfigToVault(mailConfig);

// Récupérer la configuration
const config = await mailService.getConfigFromVault();
```

### API du VaultService

#### Stockage d'une entrée
```typescript
await vaultService.storeEntry({
  key: 'api_key_stripe',
  value: 'sk_live_...', 
  encrypted: true,
  description: 'Clé API Stripe production',
  category: 'api'
});
```

#### Récupération d'une entrée
```typescript
const entry = await vaultService.getEntry('api_key_stripe');
if (entry) {
  console.log(entry.value); // Déchiffré automatiquement
}
```

#### Liste des entrées par catégorie
```typescript
const mailEntries = await vaultService.listEntries('mail');
```

## Interface Utilisateur

### Composant VaultMailConfig

Utilisez le composant `VaultMailConfig` pour une interface complète de gestion des configurations mail :

```tsx
import VaultMailConfig from '../components/app/VaultMailConfig';

function AdminMailSettings() {
  return <VaultMailConfig />;
}
```

#### Fonctionnalités de l'interface :
- ✅ Détection automatique du vault
- ✅ Basculement local/vault selon disponibilité
- ✅ Préconfigurations fournisseurs (OVH, Gmail, etc.)
- ✅ Test de connexion SMTP
- ✅ Chiffrement visuel des mots de passe
- ✅ Indicateurs de sécurité

## Sécurité

### Chiffrement
- **Algorithme** : Base64 + ROT13 (démonstration - remplacer par crypto.subtle en production)
- **Clés** : Rotation automatique recommandée
- **Stockage** : Données chiffrées dans PostgreSQL

### Bonnes pratiques
1. **Limitez l'accès** : Seuls les administrateurs
2. **Auditez** : Surveillez les modifications dans les logs
3. **Sauvegardez** : Incluez le vault dans vos backups
4. **Testez** : Vérifiez la connectivité régulièrement

### Migration production
Pour la production, remplacez les fonctions de chiffrement par :

```typescript
// Utiliser crypto.subtle pour un chiffrement robuste
private async encrypt(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  // ... implémentation crypto.subtle
}
```

## Structure de la table vault

```sql
create table public.vault (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  encrypted boolean default false,
  description text,
  category text check (category in ('mail', 'database', 'api', 'system', 'security')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Surveillance et Maintenance

### Monitoring
- Surveillez les erreurs de chiffrement/déchiffrement
- Vérifiez la connectivité vault périodiquement
- Auditez les accès aux données sensibles

### Maintenance
- Rotation des clés de chiffrement
- Nettoyage des entrées obsolètes
- Mise à jour des configurations selon les besoins

## Fallback et Récupération

Le système inclut un fallback automatique :
1. **Vault disponible** → Utilisation du vault sécurisé
2. **Vault indisponible** → Fallback vers localStorage
3. **Échec total** → Mode dégradé avec notification

## Support

Pour toute question sur l'implémentation du vault :
1. Vérifiez les logs de la console
2. Testez la connectivité avec `vaultService.testVaultConnection()`
3. Consultez la documentation Supabase pour RLS

---

**Note** : Ce système est conçu pour un usage démonstration. Pour un environnement de production, implémentez un chiffrement robuste avec des librairies spécialisées et une gestion avancée des clés.
