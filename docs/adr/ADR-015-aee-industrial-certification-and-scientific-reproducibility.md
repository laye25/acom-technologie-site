# ADR-015 : Cadre de Certification Industrielle, de Reproductibilité Scientifique et d'Archivage des Régressions (SPR-008.8 & SPR-008.9)

**Date :** 2026-07-13  
**Auteur :** ACOM Chief Scientist & Audit Center  
**Statut :** Accepté  
**Maturité (Règle 52) :** Designed & Implemented  

## Contexte
Le compilateur ATCP a atteint une précision remarquable (scores géométriques, de ruban et d'interpolation de 95% à 99% sur le Golden Dataset). Cependant, pour asseoir la crédibilité industrielle de la plateforme d'ingénierie CAO/FAO, nous devons passer d'une logique de développement réactif à un cadre rigoureux de **validation scientifique et d'audit reproductible**. 

L'overfitting du benchmark (sur-apprentissage des hyperparamètres sur un nombre restreint de motifs de test) et l'arbitrage topologique basé sur des dictionnaires manuels représentent les derniers verrous méthodologiques avant d'engager la modélisation dynamique du simulateur physique de machine (SPR-009).

## Décisions

### 1. Quadruple Partitionnement Hermétique des Données
Afin de garantir une évaluation impartiale et d'éliminer tout biais d'optimisation spécifique (anti-overfitting), la base de motifs d'ATCP est segmentée en quatre sous-ensembles étanches :
* **Training Dataset (Jeu d'Entraînement)** : Utilisé librement lors de la phase de recherche et d'ingénierie active pour calibrer les hyperparamètres (epsilon adaptatif, pas de rééchantillonnage, coefficients élastiques).
* **Golden Dataset (Jeu d'Or, v1.0.0)** : Référentiel figé en lecture seule de 10 motifs représentatifs, servant uniquement à détecter les régressions immédiates du pipeline.
* **Regression Archive (Archive de Bugs)** : Chaque bug identifié et corrigé (ex. `BUG_0001_A_Triangle`, `BUG_0002_Tatami_Tunnel`, `BUG_0003_Bresenham_Rounding`) est converti en un cas de test et un motif de broderie immuables ajoutés à cette base. Aucune régression n'est tolérée sur ce référentiel historique.
* **Industrial Validation Dataset (Jeu d'Audit Invisible)** : Une bibliothèque de plus de 1000 motifs réels et complexes (logos d'entreprises, calligraphies arabes, dentelles africaines, armoiries nationales, lettrages fins) tenus secrets des algorithmes de calibrage automatique. Ce jeu sert exclusivement au calcul du score de certification final.

```
[ Algorithmes de Compilation ]
       │
       ├─► [ Training Dataset ] ─────── (Calibrage interactif des hyperparamètres)
       ├─► [ Regression Archive ] ───── (0% de régression toléré sur les bugs résolus)
       ├─► [ Golden Dataset (Frozen) ] ── (Contrôle continu de non-régression)
       └─► [ Industrial Validation ] ── (Audit aveugle de certification finale)
```

### 2. Validation Topologique Purement Mathématique (Sans Dictionnaire)
Le dictionnaire statique d'évaluation topologique (`Expected Holes`) est entièrement déprécié au profit d'un solveur topologique autonome au sein de l'AEE-Kernel. La validité topologique de l'interpolation est calculée dynamiquement via :
* **L'Arbre de Régions Topologiques (Region Tree)** construit par analyse géométrique d'inclusion (Winding Number adaptatif et algorithme Ray-Casting).
* **La Caractéristique d'Euler ($\chi$)** des graphes d'adjacence plans construits à partir des tracés : 
  $$\chi = V - E + F = 1 + (C - H)$$
  *(Où $V$ est le nombre de sommets, $E$ d'arêtes, $F$ de faces, $C$ de composantes connexes et $H$ de trous / cavités)*.
* **L'Isomorphisme de Graphes Topologiques** : La structure d'adjacence du motif généré par rapport au motif de référence doit présenter un isomorphisme parfait pour valider l'intégrité de la broderie (conservation absolue des contreformes et des zones d'exclusion).

### 3. Traçabilité Complète des Métriques (Séries Temporelles)
Toute exécution du Benchmark Runner génère et enregistre un enregistrement immuable au sein d'une série temporelle (`/benchmark-history/metric_history.json`). Chaque rapport d'audit intègre automatiquement le bloc de métadonnées suivant :
```json
{
  "auditMetadata": {
    "timestamp": "2026-07-13T19:45:00Z",
    "commitHash": "a1b2c3d4e5f6...",
    "versions": {
      "atcp": "1.0.0-rc2",
      "compiler": "2.4.1",
      "atir": "1.1.0",
      "goldenDataset": "1.0.0",
      "industrialDataset": "2.0.0",
      "physicsModel": "1.8.0"
    },
    "system": {
      "hardware": "x86_64-node-v20",
      "determinismVerification": "PASS"
    }
  }
}
```

### 4. Matrice d'Essais Physiques et d'Étalonnage (Multi-Matières)
Afin de faire correspondre les coefficients d'amortissement, de friction et de relaxation avec des machines industrielles réelles, le compilateur s'appuie sur une matrice de calibrage multi-paramètres :
* **Substrats (Tissus)** : Popeline fine (sans élasticité), Jersey extensible (haute élasticité), Denim (haute rigidité), Polaire épaisse (fort écrasement).
* **Fils** : Polyester 40wt (standard), Rayon (brillant, plus fragile), Fil métallique (très forte tension et friction).
* **Aiguilles** : 75/11 Sharp (tissu fin), 80/12 Ballpoint (maille), 90/14 (tissu lourd).
* **Stabilisateurs (Backing)** : Hydrosoluble, Déchirable (Tear-away), Découpable (Cut-away).
* **Vitesses Machine** : 600 RPM, 850 RPM, 1000 RPM.

Chaque couple de paramètres physiques réels alimente les lois d'élasto-friction d'ATCP pour prédire avec exactitude la dérive dimensionnelle et la tension de fil.

### 5. Cartographie des Limites Prédictives du Simulateur Physique
Le modèle d'éléments finis du Physics Engine documente explicitement son spectre d'action :
* **Prédit avec précision** : Le plissement de tissu (buckling risk), la rupture de fil par pic de tension accumulée (take-up lever), la distorsion géométrique par contraction élastique (push-pull), la friction au chas de l'aiguille.
* **Non modélisé (hors limites)** : L'usure mécanique des boucleurs de la machine, l'accumulation de poussières de fil dans la canette, les erreurs de tension d'enfilage manuel de l'opérateur, le gauchissement thermique de l'environnement de broderie.

### 6. Matrice de Passage (Gatekeeping) Strict avant SPR-009 (Machine Simulator)
L'engagement du développement de l'émulateur machine physique (SPR-009) est strictement conditionné à l'atteinte simultanée des jalons de certification industrielle suivants :

| Jalon de Certification | Critère d'Acceptation | Statut Actuel |
| :--- | :--- | :--- |
| **Intégrité Compilation** | 100% sans erreur (TypeScript strict, 0 warning ESLint) | ✅ CONFORME |
| **Déterminisme** | 100% de répétabilité (les hashs binaires des fichiers DST/PES générés sur 5 exécutions successives sont identiques à 100%) | ✅ CONFORME |
| **Golden Dataset** | 10/10 motifs à l'état `PASS` avec un score moyen $\ge 98\%$ | ✅ CONFORME |
| **Industrial Dataset** | $\ge 99\%$ de conformité topologique et géométrique sur 1000 motifs | 🔄 SPR-008.8 |
| **Régression** | 0 anomalie résiduelle dans la *Regression Archive* | ✅ CONFORME |
| **Calibration** | Rapports d'essais réels documentés et corrélés avec les prédictions physiques | 🔄 SPR-008.8 |

## Conséquences

* **Avantages** :
  * **Rigueur Académique et Industrielle** : La plateforme se positionne comme un laboratoire d'ingénierie textile validé scientifiquement, augmentant sa valeur de propriété intellectuelle.
  * **Robustesse à toute épreuve** : L'archivage systématique des bugs empêche définitivement les régressions historiques.
  * **Indépendance absolue du moteur** : La validation topologique automatique permet de certifier n'importe quel dessin vectoriel importé sans intervention humaine préalable.
* **Inconvénients** :
  * Processus de validation plus long nécessitant l'exécution d'audits aveugles avant chaque publication majeure.

## 7. Registre de Validation Expérimentale (Preuves Scientifiques)
<!-- CERTIFICATION_EVIDENCE_START -->
*Aucune campagne de certification n'a encore été enregistrée.*
<!-- CERTIFICATION_EVIDENCE_END -->

