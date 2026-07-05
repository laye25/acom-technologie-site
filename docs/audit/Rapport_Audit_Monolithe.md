# Rapport d'Audit Technique & Plan de Découpage du Monolithe `MerchantSaaS.tsx`
**Auteur : ACOM Audit Center & Architecture Compliance Auditor**  
**Date : 3 Juillet 2026**  
**Statut : RECOMMANDATION CRITIQUE (P0)**  

---

## 1. Diagnostic de l'Existant (Constats)

La page principale du portail commerçant, `src/pages/MerchantSaaS.tsx`, présente un niveau de centralisation extrême qui met en péril la maintenabilité, l'évolutivité et les performances de l'application :

- **Taille du Fichier** : **36 058 lignes** (~1.9 Mo de code source). Un tel volume dépasse largement les capacités de traitement fluide des EDI, des linters et des agents de développement d'IA.
- **Rupture des Directives `AGENTS.md`** : Notre charte technique exige explicitement des **fichiers < 1500 lignes** et une **séparation stricte de l'UI et de la logique**. Actuellement, toute l'UI des 8 domaines d'activité (Éducation, Médical, BTP/Chantier, Pressing, etc.) cohabite avec la logique de synchronisation, d'affichage et de gestion d'état locale.
- **Risques Opérationnels** :
  1. **Effets de bord massifs** : Une modification sur le module "Pressing" ou "Médical" peut introduire des régressions sur le module "École" ou "RH".
  2. **Performance de rendu** : React doit évaluer un arbre de composants titanesque. Même avec des optimisations, le risque de re-renders intempestifs est critique.
  3. **Conflits de fusion (Merge Conflicts)** : Toute l'équipe d'ingénierie travaillant sur les différents modules métier modifie le même fichier physique.

---

## 2. Cartographie des 8 Domaines Métiers

L'analyse du routeur interne de `MerchantSaaS.tsx` révèle 8 typologies d'applications (SaaS) distinctes configurées via le champ `merchant.licenseType` (ou `merchant.domain`) :

| Domaine | Description Métier | Groupes de Fonctionnalités Clés |
| :--- | :--- | :--- |
| **`scolaire`** | Gestion d'Établissements Scolaires | Scolarité, Notes, Absence, Cantine, Transport, Scolarité, AI Éducation |
| **`medical`** | Gestion de Cabinets Médicaux | Dossier Patients, Rendez-vous, Facturation, Diagnostics, Ordonnances |
| **`chantier`** | Suivi de Chantiers & BTP | Phases, Suivi Budgétaire, Approvisionnements, Journal de Chantier |
| **`pressing`** | Gestion d'Activités de Pressing | Fiches Réception, Inventaire, Tarifs, États de Commande, Livraison |
| **`entreprise`** | Gestion Commerciale Générale | Facturation, Devis, Trésorerie, KPI, Commandes, Clients |
| **`transport`** | Logistique & Flottes de Transport | Chauffeurs, Véhicules, Itinéraires, Consommation, Maintenance |
| **`rh`** | Gestion des Ressources Humaines | Fiches Employés, Pointage, Congés, Bulletins de Paie, Recrutement |
| **`tailleur`** | Ateliers de Couture & Confection | Mesures Clients, Commandes de Tissus, Suivi d'Atelier, Facturation |

---

## 3. Architecture Cible : Le Répertoire `/src/modules/`

Pour respecter la Clean Architecture, nous préconisons la création d'un dossier `/src/modules/` hébergeant un sous-dossier autonome pour chaque domaine métier. Le fichier `MerchantSaaS.tsx` deviendra alors un **routeur d'aiguillage ultra-léger** (~150 lignes).

### Structure type d'un Module (ex: `/src/modules/medical/`)

```text
src/modules/medical/
├── types.ts                    # Interfaces TypeScript spécifiques au domaine
├── hooks/
│   └── useMedicalSaaS.ts       # Hook d'état, fetch et mutations via Dexie
├── services/
│   └── medicalService.ts       # Règles de calcul métier et sync d'API spécifiques
└── components/
    ├── MedicalDashboard.tsx    # Vue principale du tableau de bord médical
    ├── PatientFolder.tsx       # Composant de gestion des fiches patients
    ├── AppointmentCalendar.tsx # Calendrier de planification
    └── MedicalBilling.tsx      # Gestion de la facturation médicale
```

---

## 4. Plan de Remédiation Priorisé (Roadmap de Découpage)

Le découpage doit s'effectuer de manière incrémentale sans interrompre le flux de production.

### Phase 1 : Initialisation & Création des Squelettes (P1)
- Création du répertoire `/src/modules/`.
- Création des dossiers pour les deux domaines prioritaires : `scolaire` (le plus volumineux) et `medical`.
- Définition des types stricts dans `/src/modules/{domaine}/types.ts`.

### Phase 2 : Extraction de la Logique d'État (P2)
- Écriture des hooks personnalisés (`useSchoolSaaS.ts`, `useMedicalSaaS.ts`).
- Extraction des fonctions de chargement des données depuis Dexie et de synchronisation vers Firestore spécifiques à chaque métier.

### Phase 3 : Migration des Composants d'UI (P3)
- Extraction progressive des gros blocs JSX représentant les vues métiers vers les sous-dossiers `components/` de chaque module.
- Validation rigoureuse des imports d'icônes depuis `lucide-react`.

### Phase 4 : Simplification de `MerchantSaaS.tsx` (P4)
- Remplacement du swith-case géant de rendu de composants par un chargement dynamique ou un montage direct des routeurs de modules.
- Exemple du nouveau routeur d'aiguillage simplifié :

```tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const SchoolModule = lazy(() => import('@/modules/scolaire/components/SchoolDashboard'));
const MedicalModule = lazy(() => import('@/modules/medical/components/MedicalDashboard'));
// ... autres modules

export default function MerchantSaaS({ merchant, user }) {
  if (!merchant) return <Skeleton className="h-screen w-full" />;

  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      {merchant.domain === 'scolaire' && <SchoolModule merchantId={merchant.id} user={user} />}
      {merchant.domain === 'medical' && <MedicalModule merchantId={merchant.id} user={user} />}
      {/* ... autres cas */}
    </Suspense>
  );
}
```

---

## 5. Recommandation d'Action Immédiate (P0)

Pour matérialiser cette transition d'architecture, nous initions dès maintenant la **Phase 1** en créant la structure physique et les premiers squelettes de types et de hooks pour les domaines **`medical`** et **`scolaire`**. Ceci servira de modèle de référence pour les autres domaines.
