# AEE Research - AI Lab (08)
**Maturité (Règle 52) :** Prototype  

## 1. Mission Scientifique
L'**AI Lab** développe et évalue des modèles d'intelligence artificielle hautement spécialisés et optimisés pour la plateforme textile. Contrairement aux approches génératives lourdes, l'AI Lab conçoit des modèles prédictifs légers, déterministes et intégrables côté serveur ou client.

## 2. Modèles IA Spécialisés (Specialized Micro-Models)
Le laboratoire se concentre sur cinq micro-architectures critiques :

1. **Détecteur de Contreformes (Negative Space Detector)** : Identifie sémantiquement les zones vides au sein d'un motif complexe pour éviter les superpositions de broderie inutiles.
2. **Détecteur d'Entonnoirs (Funnel Artifact Detector)** : Repère les formes géométriques se rétrécissant brusquement, sujettes à de forts risques de sur-densité et de bris d'aiguille.
3. **Détecteur de Sur-densité Locale** : Analyse thermique de la carte de densité des points de broderie.
4. **Détecteur de Rupture de Ruban (Ribbon Discontinuity Predictor)** : Repère les discontinuités dans l'axe médian d'un ruban à reconstruire.
5. **Classificateur Sémantique de Motif** : Détermine automatiquement le style sémantique (ex : lettrage, armoiries, remplissage plein, ornement fin) pour adapter la feuille de styles de broderie associée.

## 3. Métriques de Précision Mathématique
Pour chaque modèle, l'AI Lab mesure :

- **Précision (Precision) & Rappel (Recall)** : Mesurés sur les jeux de données de validation du Golden Dataset.
- **Score F1 (F1-Score)** : Équilibre des performances de classification.
- **Temps d'Inférence ($T_{\text{inf}}$)** : Doit rester inférieur à $15\text{ ms}$ pour être transparent dans le cycle de vie de l'application.
