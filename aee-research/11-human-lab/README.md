# AEE Research - Human Embroidery Lab (11)
**Maturité (Règle 52) :** Designed  

## 1. Mission Scientifique
Le **Human Embroidery Lab** est chargé d'observer, de modéliser et de codifier de manière formelle le savoir-faire des maîtres brodeurs professionnels et tailleurs d'art d'Acom Technologie. Conformément à la **Règle 56 (Les connaissances métier sont des actifs)**, ce laboratoire capture les décisions subjectives des artisans d'art pour les transformer en règles d'inférence sémantiques exploitables par le compilateur et les algorithmes d'optimisation de l'AEE.

---

## 2. Protocoles d'Observation & Codification (Observation Protocols)

Pour chaque motif de broderie complexe confié à un maître brodeur, le laboratoire trace et enregistre les décisions de numérisation manuelle :

1. **Choix de la Trajectoire d'Aiguille (Stitch Layout)** :
   - *Pourquoi un point Satin a-t-il été préféré à un Tatami sur cette lettre de 3.2mm de large ?*
   - *Règle extraite* : Pour toute forme d'épaisseur transversale $w < 4.0\text{ mm}$, le point Satin est obligatoire pour préserver la brillance spéculaire du fil, sauf sur des matières molletonnées ou polaires où un Tatami stabilisé est requis.

2. **Stratégie d'Angle & d'Orientation** :
   - *Pourquoi l'artisan a-t-il orienté ses points Tatami à 45° sur ce motif de manche d'habit traditionnel ?*
   - *Règle extraite* : L'angle de remplissage principal doit impérativement s'écarter d'au moins $15^\circ$ par rapport à l'axe de tissage du substrat pour éliminer l'effet d'enfouissement du fil dans la trame.

3. **Sélection de Sous-Couche (Underlay Selection)** :
   - *Pourquoi ajouter un filet double sur cette soie légère ?*
   - *Règle extraite* : Sur de la soie naturelle ou des tissus élastiques de grammage inférieur à $120\text{ g/m}^2$, une sous-couche croisée (Double Zigzag Underlay) est indispensable pour ancrer les fibres du tissu avant la couche de remplissage.

---

## 3. Représentation Formelle & Transfert au Graphe de Connaissances
Chaque règle d'expert validée par le laboratoire est formalisée sous forme sémantique pour enrichir l'**Embroidery Knowledge Graph** (ADR-013) :

```json
{
  "rule_id": "RULE_EXPERT_042",
  "name": "Satin_Sizing_Over_Silk",
  "context": {
    "substrate": "Silk",
    "thread": "Madeira_Classic_40",
    "needle": "70_10_Sharp"
  },
  "conditions": {
    "feature_thickness": { "operator": "lt", "value": 4.0 }
  },
  "actions": {
    "stitch_type": "Satin",
    "pull_compensation": 0.15,
    "lock_stitch_before_trim": true
  }
}
```

---

## 4. Métriques de Fidélité Artisanale (Artisanal Fidelity)
1. **Taux d'Adoption Expert (Expert Alignment Index)** : Pourcentage de décisions générées automatiquement par l'AEE en accord complet avec les corrections manuelles d'un maître artisan sur le Golden Dataset.
2. **Indice d'Ancrage de Tension** : Mesure de la régularité d'enfoncement du fil pour correspondre au drapé traditionnel de la broderie à l'aiguille.
