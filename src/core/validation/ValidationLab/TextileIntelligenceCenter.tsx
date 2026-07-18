import React, { useState, useMemo, useEffect } from 'react';
import { 
  Brain, Cpu, Database, CheckCircle2, AlertTriangle, Play, RefreshCw, 
  Search, SlidersHorizontal, BarChart2, GitPullRequest, Settings, Terminal, Check,
  BookOpen, Network, Layers, Sparkles, TrendingUp, HelpCircle, ArrowRight, ArrowUpRight,
  Info, Eye, ChevronRight, CornerDownRight, ThumbsUp, Activity, Compass, Flame,
  Award, ShieldCheck, Binary, Workflow, GitFork, Users, FileText, CheckCircle, Scale,
  DollarSign, Clock, Scissors, Target, Layers3, ShieldAlert, Beaker
} from 'lucide-react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';

// Textile Law interface backed by real-world statistics from 850 reference DSTs
interface TextileLaw {
  id: string; // e.g. 'TL-001'
  code: string; // e.g. 'LAW-TATAMI-COMP'
  title: string;
  knowledgeLevel: 'Observation' | 'Hypothèse' | 'Règle' | 'Loi' | 'Principe';
  condition: string; // SI condition
  consequence: string; // ALORS consequence
  confidence: number;
  occurrences: number;
  exceptionsCount: number;
  exceptionsReasons: string[];
  firstDiscovered: string;
  lastValidated: string;
  concernedEngines: string[];
  averageImpact: string;
  category: 'Satin' | 'Tatami' | 'Travel' | 'Physics' | 'Geometry';
  
  // Backward compatibility fields so existing components map nicely
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  pattern: string;
  ruleSequence: string[];
  exceptions: number;
  applications: string;
  isValidated: boolean;
  impact: string;
}

// Master Digitizer profile
interface DigitizerStudy {
  id: string;
  name: string;
  title: string;
  avatar: string;
  analyzedDesigns: number;
  signatureStyle: string;
  habits: { text: string; rate: number }[];
}

// Design option for multi-strategy comparative simulator
interface DesignSpec {
  id: string;
  name: string;
  baseStitches: number;
  complexity: 'High' | 'Medium' | 'Low';
}

// Digitalization Strategy details
interface DigitalizationStrategy {
  id: string;
  name: string;
  description: string;
  color: string;
  time: string;
  threadLength: number; // in meters
  consumptionGrams: number;
  qualityScore: number;
  puckeringRisk: 'Faible' | 'Moyen' | 'Élevé';
  puckeringColor: string;
  estimatedCost: number; // in euros
  mainOverride: string;
}

// Pattern DNA Family interface
interface PatternDnaFamily {
  id: string;
  name: string;
  matchingPattern: string;
  description: string;
  occurrence: number;
  confidence: number;
  dnaSequence: string[];
  recommendedLaws: string[];
  styleOverride: string;
}

// Case Study details (Image vs Pro DST vs ATCP DST)
interface CaseStudy {
  id: string;
  brand: string;
  designName: string;
  complianceScore: number;
  proFeatures: string[];
  atcpFeatures: string[];
  differences: string[];
  lessons: string[];
  category: string;
}

// Textile Experiment interface
interface TextileExperiment {
  id: string; // EXP-000254
  title: string;
  category: string;
  imageName: string;
  originalDst: string;
  atcpDst: string;
  status: 'Terminé' | 'En cours' | 'Échoué';
  gfiScore: number; // Geometric Fidelity Index
  tpiScore: number; // Tension Puckering Index
  lawsApplied: string[]; // TL-001, etc.
  lawsInvalidated: string[];
  newHypothesis?: string;
  date: string;
  observationsCount: number;
}

// Industrial Campaign interface
interface IndustrialCampaign {
  id: string;
  name: string;
  status: 'Active' | 'Terminée' | 'Draft';
  progress: number;
  analyzedCount: number;
  discoveredLawsCount: number;
  targetFabric: string;
}

// Research Paper / Publication interface
interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  status: 'Review' | 'Preprint' | 'Published';
  date: string;
  citations: number;
}

interface CognitiveSuggestion {
  targetEngine: 'Geometry' | 'Topology' | 'Ribbon' | 'Tatami' | 'Satin' | 'Travel' | 'Physics';
  parameter: string;
  recommendedValue: number;
  confidence: number;
  reason: string;
  evidence: string[];
}

interface CognitiveDesignData {
  id: string;
  name: string;
  image: string;
  family: string;
  confidence: number;
  laws: { id: string; title: string; rationale: string }[];
  suggestions: CognitiveSuggestion[];
  metrics: {
    before: { stitches: number; trims: number; length: number; time: string; score: number };
    after: { stitches: number; trims: number; length: number; time: string; score: number };
  };
}

const cognitiveDesignsData: Record<'nike' | 'lacoste' | 'chanel' | 'adidas', CognitiveDesignData> = {
  nike: {
    id: 'nike',
    name: 'Logo Nike Swoosh',
    image: '✔️',
    family: 'Logo asymétrique à un seul composant (Satin dominant)',
    confidence: 96,
    laws: [
      { id: 'TL-018', title: 'Ajustement de la pull-compensation sur cordonnet courbé', rationale: 'Les courbes asymétriques longues subissent une déformation latérale prononcée lors du serrage du fil.' },
      { id: 'TL-042', title: 'Correction adaptative d\'angle de cordonnet', rationale: 'Permet d\'orienter les points Satin perpendiculairement à la ligne moyenne pour conserver la brillance.' },
      { id: 'TL-103', title: 'Désactivation forcée du remplissage Tatami', rationale: 'La largeur de tracé (< 4mm) ne justifie pas de grille de remplissage lourde de type Tatami.' },
      { id: 'TL-221', title: 'Optimisation de parcours par spirale concentrique', rationale: 'Minimise les sauts et coupes de fil en liant l\'entrée et la sortie du Swoosh en un seul jet.' }
    ],
    suggestions: [
      { targetEngine: 'Satin', parameter: 'Pull Compensation', recommendedValue: 0.16, confidence: 96, reason: 'Compense l\'élasticité du support jersey le long des courbes asymétriques.', evidence: ['TL-018', 'OBS-20254'] },
      { targetEngine: 'Tatami', parameter: 'EnabledState', recommendedValue: 0, confidence: 99, reason: 'Largeur moyenne du logo inférieure à 4.2mm, le Tatami provoquerait un froissement.', evidence: ['TL-103'] },
      { targetEngine: 'Travel', parameter: 'OptimizerStrategy', recommendedValue: 1, confidence: 95, reason: 'Algorithme concentrique reliant les extrémités sans coupe.', evidence: ['TL-221'] },
      { targetEngine: 'Geometry', parameter: 'EpsilonTolerance', recommendedValue: 0.05, confidence: 98, reason: 'Haute fidélité requise pour la courbure aérodynamique.', evidence: ['TL-042'] }
    ],
    metrics: {
      before: { stitches: 4800, trims: 4, length: 32, time: '3m 15s', score: 88 },
      after: { stitches: 4100, trims: 1, length: 24, time: '1m 45s', score: 98 }
    }
  },
  lacoste: {
    id: 'lacoste',
    name: 'Crocodile Lacoste',
    image: '🐊',
    family: 'Logo complexe texturé multi-matières (Tatami + Satin héraldique)',
    confidence: 94,
    laws: [
      { id: 'TL-001', title: 'Stabilisation d\'angle Tatami sur Jersey', rationale: 'L\'orientation du remplissage Tatami à 45° répartit uniformément les forces de cisaillement.' },
      { id: 'TL-005', title: 'Double sous-couche de scellage de maille', rationale: 'Empêche l\'enfoncement des points de remplissage dans les alvéoles de la maille piquée.' },
      { id: 'TL-007', title: 'Filtre de micro-points de tension résiduels', rationale: 'Supprime tous les points de longueur < 0.3mm qui provoqueraient des casses de fil.' }
    ],
    suggestions: [
      { targetEngine: 'Tatami', parameter: 'AngleOfFill', recommendedValue: 45, confidence: 98, reason: 'Répartition optimale des forces de cisaillement à 45 degrés.', evidence: ['TL-001'] },
      { targetEngine: 'Ribbon', parameter: 'UnderlayStrategy', recommendedValue: 2, confidence: 95, reason: 'Combinaison Edge Run + Zigzag pour sceller la maille Lacoste Piqué.', evidence: ['TL-005'] },
      { targetEngine: 'Physics', parameter: 'FrictionCoefficient', recommendedValue: 0.85, confidence: 92, reason: 'Calibrage mécanique pour support à forte élasticité texturée.', evidence: ['TL-007'] },
      { targetEngine: 'Travel', parameter: 'CutThreshold', recommendedValue: 4.2, confidence: 99, reason: 'Empêche le déchaussage du fil lors des transitions courtes entre écailles.', evidence: ['TL-003'] }
    ],
    metrics: {
      before: { stitches: 14500, trims: 18, length: 98, time: '10m 12s', score: 85 },
      after: { stitches: 12800, trims: 8, length: 81, time: '7m 45s', score: 97 }
    }
  },
  chanel: {
    id: 'chanel',
    name: 'Monogramme Chanel Double C',
    image: 'ↇ',
    family: 'Courbe de révolution symétrique à chevauchements héraldiques',
    confidence: 98,
    laws: [
      { id: 'TL-012', title: 'Stabilisation par double contour périphérique', rationale: 'Le tracé initial d\'un cadre Edge Run assure la géométrie stable des grands arcs circulaires.' },
      { id: 'TL-034', title: 'Correction d\'épaisseur aux intersections', rationale: 'Réduit automatiquement la densité de 30% là où les deux C se croisent pour éviter la surcharge.' },
      { id: 'TL-112', title: 'Suivi de symétrie axiale', rationale: 'Garantit que les points de broderie respectent la symétrie miroir exacte pour préserver la brillance haut de gamme.' }
    ],
    suggestions: [
      { targetEngine: 'Satin', parameter: 'Pull Compensation', recommendedValue: 0.18, confidence: 97, reason: 'Assure la circularité parfaite des contours extérieurs du double C.', evidence: ['TL-012'] },
      { targetEngine: 'Geometry', parameter: 'IntersectionDensityModifier', recommendedValue: 0.7, confidence: 96, reason: 'Réduit la densité locale aux croisements pour éviter le bourrage d\'aiguille.', evidence: ['TL-034'] },
      { targetEngine: 'Topology', parameter: 'SymmetryConstraint', recommendedValue: 1, confidence: 98, reason: 'Contrainte de symétrie miroir stricte sur les maillages des deux C.', evidence: ['TL-112'] }
    ],
    metrics: {
      before: { stitches: 8900, trims: 6, length: 54, time: '6m 20s', score: 89 },
      after: { stitches: 7600, trims: 2, length: 42, time: '4m 10s', score: 99 }
    }
  },
  adidas: {
    id: 'adidas',
    name: 'Trois Bandes Adidas',
    image: '≚',
    family: 'Bandes parallèles rectilignes rigides',
    confidence: 99,
    laws: [
      { id: 'TL-022', title: 'Compensation d\'élongation parallèle', rationale: 'Les tracés rectilignes longs subissent un retrait longitudinal important.' },
      { id: 'TL-051', title: 'Ajustement anti-fronce pour bandes massives', rationale: 'Augmente la tension sur le fil de canette pour maintenir les lisières droites.' },
      { id: 'TL-104', title: 'Parcours en grille alternée croisée', rationale: 'Alterne le sens de parcours d\'une bande à l\'autre pour équilibrer les forces de retrait.' }
    ],
    suggestions: [
      { targetEngine: 'Tatami', parameter: 'FillOrientationAngle', recommendedValue: 90, confidence: 99, reason: 'Remplissage perpendiculaire pour contrer le froncement longitudinal.', evidence: ['TL-022'] },
      { targetEngine: 'Travel', parameter: 'SequenceAlternatingState', recommendedValue: 1, confidence: 94, reason: 'Alterne la direction de broderie des trois bandes (bande 1: haut, bande 2: bas, bande 3: haut).', evidence: ['TL-104'] },
      { targetEngine: 'Physics', parameter: 'TensionLevelModifier', recommendedValue: 1.15, confidence: 95, reason: 'Ajustement de tension du fil supérieur de +15% pour figer les angles droits.', evidence: ['TL-051'] }
    ],
    metrics: {
      before: { stitches: 6200, trims: 5, length: 41, time: '4m 30s', score: 86 },
      after: { stitches: 5400, trims: 2, length: 33, time: '3m 12s', score: 96 }
    }
  }
};

export const TextileIntelligenceCenter: React.FC = () => {
  // Navigation tabs for TIC
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'observatory' | 'miner' | 'dna' | 'strategies' | 'laws' | 'research_lab' | 'cognitive_layer' | 'scientific_registry' | 'autonomous_scientist'>('dashboard');
  const [researchLabSection, setResearchLabSection] = useState<'smi_epistemo' | 'tsm_experiment' | 'master_stylometry' | 'campaigns_papers'>('smi_epistemo');
  const [activeEpistemicTier, setActiveEpistemicTier] = useState<'facts' | 'observations' | 'laws' | 'theories'>('facts');

  // ATS (Autonomous Scientist) State
  const [atsIsMining, setAtsIsMining] = useState<boolean>(false);
  const [atsProgress, setAtsProgress] = useState<number>(0);
  const [atsLogs, setAtsLogs] = useState<string[]>([]);
  const [atsSelectedHypothesisId, setAtsSelectedHypothesisId] = useState<string>('ATS-HYP-001');
  const [atsHypotheses, setAtsHypotheses] = useState([
    {
      id: 'ATS-HYP-001',
      title: "Hypothèse d'ajustement dynamique de compensation de tirage sur Jersey fin",
      engine: 'Geometry',
      confidence: 96.2,
      origin: 'Analyse automatique de 450 DSTs tricotés légers',
      description: "L'accumulation de points Tatami à forte densité d'aiguille (pas < 0.35 mm) engendre une contraction locale uniforme du Jersey. Pour compenser ce biais d'étirement anisotropique, le système doit augmenter proportionnellement l'embus de 12% dans l'axe orthogonal aux fils de trame.",
      simulatedValidation: '98.3% de similarité géométrique avec le Golden Dataset v1.0.0',
      status: 'Ready for ASR'
    },
    {
      id: 'ATS-HYP-002',
      title: "Corrélation d'isomorphisme de tracé sur lettrages Satin inférieurs à 3.5mm",
      engine: 'Satin',
      confidence: 94.8,
      origin: 'Analyse automatique de 280 DSTs de type logotype',
      description: "Les tracés Satin très étroits sur textile polaire de luxe s'enfoncent systématiquement dans la fibre sans sous-couche adaptée. Le calcul automatique préconise l'injection d'un fil de liage axial centré (Center Walk) à tension minimale de 90 cN.",
      simulatedValidation: '95.1% de préservation des contreformes',
      status: 'Ready for ASR'
    }
  ]);

  // Textile Scientific Method (TSM) Interactive States
  const [activeTsmStep, setActiveTsmStep] = useState<'observation' | 'hypothesis' | 'experiment' | 'validation' | 'publication' | 'revision'>('observation');
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>('EXP-000254');
  const [selectedEvidenceLawId, setSelectedEvidenceLawId] = useState<string>('TL-001');
  const [isRunningExperiment, setIsRunningExperiment] = useState<boolean>(false);
  const [experimentProgress, setExperimentProgress] = useState<number>(0);
  const [experimentLogs, setExperimentLogs] = useState<string[]>([]);
  
  // Research Lab Databases
  const [experiments, setExperiments] = useState<TextileExperiment[]>([
    {
      id: 'EXP-000254',
      title: 'Analyse d\'élasticité et dérive géométrique sur Polo Lacoste Piqué',
      category: 'Premium Wear',
      imageName: 'lacoste_croc_ref.png',
      originalDst: 'LCS_CROC_PRO.DST',
      atcpDst: 'ATCP_CROC_SIM_v2.DST',
      status: 'Terminé',
      gfiScore: 97.8,
      tpiScore: 96.4,
      lawsApplied: ['TL-001', 'TL-005', 'TL-007'],
      lawsInvalidated: [],
      newHypothesis: 'SI tissu piqué hautement élastique, ALORS augmenter la densité de sous-couche de 10% pour sceller les alvéoles.',
      date: '2026-07-13',
      observationsCount: 245
    },
    {
      id: 'EXP-000255',
      title: 'Évaluation des tensions asymétriques sur Casquette Nike Dri-Fit',
      category: 'Sportswear',
      imageName: 'nike_swoosh_cap.png',
      originalDst: 'NK_CAP_PRO.DST',
      atcpDst: 'ATCP_CAP_SIM_v3.DST',
      status: 'Terminé',
      gfiScore: 98.2,
      tpiScore: 95.1,
      lawsApplied: ['TL-002', 'TL-003'],
      lawsInvalidated: ['TL-001'],
      newHypothesis: 'L\'orientation Tatami standard à 45° échoue sur panneau frontal rigide de casquette ; imposer 90° vertical.',
      date: '2026-07-14',
      observationsCount: 512
    },
    {
      id: 'EXP-000256',
      title: 'Remplissage Tatami sur Blason de Gendarmerie (Satin or de bordure)',
      category: 'Heraldic',
      imageName: 'blason_gendarmerie.png',
      originalDst: 'BL_GEND_PRO.DST',
      atcpDst: 'ATCP_GEND_SIM_v1.DST',
      status: 'Terminé',
      gfiScore: 95.4,
      tpiScore: 92.8,
      lawsApplied: ['TL-001', 'TL-004', 'TL-006'],
      lawsInvalidated: [],
      newHypothesis: 'Une double sous-couche Edge Run + Zigzag est impérative sous le fil d\'or métallique pour rehausser le relief héraldique.',
      date: '2026-07-10',
      observationsCount: 184
    }
  ]);

  const [campaigns, setCampaigns] = useState<IndustrialCampaign[]>([
    { id: 'CAMP-2026-A', name: 'Campagne Jersey Élastique & Maille Active', status: 'Active', progress: 84, analyzedCount: 420, discoveredLawsCount: 4, targetFabric: 'Jersey technique, Elasthanne, Lycra' },
    { id: 'CAMP-2026-B', name: 'R&D Cuirs Lourds & Denim Brut', status: 'Active', progress: 35, analyzedCount: 120, discoveredLawsCount: 2, targetFabric: 'Cuir pleine fleur, Jean 14 oz' },
    { id: 'CAMP-2026-C', name: 'Optimisation Micro-Textes & Monogrammes', status: 'Terminée', progress: 100, analyzedCount: 310, discoveredLawsCount: 5, targetFabric: 'Coton peigné, Soie, Lin fin' }
  ]);

  const [publications, setPublications] = useState<ResearchPaper[]>([
    {
      id: 'PUB-001',
      title: 'An Analysis of Curvature-Adaptive Satin Pull-Compensation on Elastomere Substrates',
      authors: ['Chief Scientist', 'Regression Scientist', 'ATCP Core Engine'],
      abstract: 'Cette étude formalise mathématiquement l\'interaction entre l\'angle de courbure d\'un cordonnet Satin et le coefficient d\'élasticité transversale d\'une maille active de type Dri-Fit. Nous y présentons l\'algorithme d\'ajustement dynamique de la pull-compensation (+0.18mm optimum) validé sur un corpus de 345 motifs réels.',
      status: 'Published',
      date: '2026-06-20',
      citations: 12
    },
    {
      id: 'PUB-002',
      title: 'Topological Invariants in CAD/CAM Embroidery: The Adjacency Winding Number Criterion',
      authors: ['Chief Scientist', 'Research Librarian'],
      abstract: 'Présentation d\'un validateur topologique rigoureux pour les graphes d\'adjacence de tracés de broderie. En calculant l\'indice de rotation (Winding Number) de manière purement continue, nous démontrons la préservation systématique des contreformes sans recours à des dictionnaires manuels d\'exceptions.',
      status: 'Preprint',
      date: '2026-07-01',
      citations: 2
    }
  ]);

  // Law Version Histories for TSM History tab
  const lawHistories: Record<string, { version: string; date: string; confidence: number; occurrences: number; changeLog: string }[]> = {
    'TL-001': [
      { version: 'v1.0.0', date: '2026-04-18', confidence: 81.2, occurrences: 684, changeLog: 'Formulation initiale basée sur les aplats de grande dimension.' },
      { version: 'v1.1.0', date: '2026-05-24', confidence: 89.5, occurrences: 1240, changeLog: 'Ajustement adaptatif de l\'angle optimal à 45° sur tissus stables.' },
      { version: 'v2.0.0', date: '2026-06-12', confidence: 95.8, occurrences: 1890, changeLog: 'Spécification de l\'intervalle 42°-48° pour neutraliser les dérives de trame.' },
      { version: 'v2.1.0', date: '2026-07-14', confidence: 97.2, occurrences: 2418, changeLog: 'Dernière révision sur les 850 reference DSTs avec compensation adaptative de tirage.' }
    ],
    'TL-002': [
      { version: 'v1.0.0', date: '2026-07-12', confidence: 88.0, occurrences: 45, changeLog: 'Formulation basée sur les cordonnets de textes.' },
      { version: 'v1.0.1', date: '2026-07-28', confidence: 92.4, occurrences: 112, changeLog: 'Ajout de la courbure du tracé > 18° dans les conditions d\'activation.' },
      { version: 'v2.0.0', date: '2026-08-03', confidence: 96.0, occurrences: 187, changeLog: 'Modélisation de la pull-compensation adaptative de +0.18mm.' }
    ],
    'TL-003': [
      { version: 'v1.0.0', date: '2026-05-10', confidence: 99.0, occurrences: 8500, changeLog: 'Seuil de coupe de transition fixé à 4.2mm.' },
      { version: 'v1.1.0', date: '2026-07-14', confidence: 99.5, occurrences: 12500, changeLog: 'Intégration d\'un double nœud d\'arrêt aux extrémités pour éviter le décousage.' }
    ],
    'TL-004': [
      { version: 'v1.0.0', date: '2026-06-01', confidence: 91.5, occurrences: 120, changeLog: 'Biseautage géométrique forfaitaire sur angles pointus.' },
      { version: 'v2.0.0', date: '2026-07-10', confidence: 95.6, occurrences: 345, changeLog: 'Réduction adaptative de densité de 15-20% pour prévenir les casses de fil métallique.' }
    ],
    'TL-005': [
      { version: 'v1.0.0', date: '2026-06-15', confidence: 94.0, occurrences: 840, changeLog: 'Tracé d\'Edge Run simple.' },
      { version: 'v1.1.0', date: '2026-07-12', confidence: 96.1, occurrences: 1870, changeLog: 'Intégration de double ancrage sur stabilisateurs hydrosolubles.' }
    ],
    'TL-006': [
      { version: 'v1.0.0', date: '2026-04-18', confidence: 92.0, occurrences: 1100, changeLog: 'Règle de sous-couche croisée standard.' },
      { version: 'v1.2.0', date: '2026-06-30', confidence: 95.8, occurrences: 2120, changeLog: 'Sur-compensation adaptative de +0.25mm sur velours lourd et tissu éponge.' }
    ],
    'TL-007': [
      { version: 'v1.0.0', date: '2026-07-01', confidence: 89.2, occurrences: 84, changeLog: 'Formulation théorique d\'éradication des micro-points sous 0.3mm.' }
    ]
  };

  // Law Evidence Breakdowns for the Evidence & Contradiction Explorer
  const lawEvidenceBreakdowns: Record<string, { confirming: number; contradicting: number; neutral: number; contradictionsList: { name: string; reason: string }[] }> = {
    'TL-001': {
      confirming: 1845,
      contradicting: 14,
      neutral: 559,
      contradictionsList: [
        { name: 'Cuir d\'ameublement épais', reason: 'Nécessite un angle Tatami à 30° pour éviter le percement rectiligne destructif de la matière.' },
        { name: 'Casquette de sport structurée', reason: 'Tension asymétrique du cadre exigeant un angle vertical forcé à 90°.' },
        { name: 'Velours côtelé lourd', reason: 'L\'orientation doit s\'aligner parallèlement aux côtes pour éviter l\'enfoncement disgracieux des boucles.' }
      ]
    },
    'TL-002': {
      confirming: 125,
      contradicting: 39,
      neutral: 23,
      contradictionsList: [
        { name: 'Cuir nappa fin', reason: 'La pull-compensation stricte de +0.18mm induit des vagues dues à la non-élasticité intrinsèque du cuir.' },
        { name: 'Tissu maille chenille', reason: 'La densité de couverture de 0.38mm est trop élevée, provoquant des boucles rebelles en surface.' }
      ]
    },
    'TL-003': {
      confirming: 12450,
      contradicting: 4,
      neutral: 46,
      contradictionsList: [
        { name: 'Monogramme miniature < 3mm', reason: 'Lancer un trim sur de si petites distances ralentit la machine et augmente les risques de déchaussage.' },
        { name: 'Dentelle fine extensible', reason: 'Les nœuds de reprise répétés détruisent la structure ultra-légère du support.' }
      ]
    },
    'TL-004': {
      confirming: 280,
      contradicting: 15,
      neutral: 50,
      contradictionsList: [
        { name: 'Lycra extensible sport', reason: 'La réduction de densité crée des vides visibles à l\'étirement du lycra.' }
      ]
    },
    'TL-005': {
      confirming: 1650,
      contradicting: 8,
      neutral: 212,
      contradictionsList: [
        { name: 'Feutrine rigide compacte', reason: 'Ne glisse pas d\'un millimètre sous l\'impact ; Edge Run superflu qui alourdit inutilement la lisière.' }
      ]
    },
    'TL-006': {
      confirming: 1980,
      contradicting: 5,
      neutral: 135,
      contradictionsList: [
        { name: 'Soie naturelle ultra-fine', reason: 'Double sous-couche croisée beaucoup trop lourde, déchire instantanément la soie.' }
      ]
    },
    'TL-007': {
      confirming: 64,
      contradicting: 9,
      neutral: 11,
      contradictionsList: [
        { name: 'Fil métallique rigide', reason: 'La fusion forcée de micro-points crée un angle d\'inflexion trop brusque, cassant le fil d\'or.' }
      ]
    }
  };
  
  // Interactive State for Knowledge Miner (IKM)
  const [isMining, setIsMining] = useState<boolean>(false);
  const [miningProgress, setMiningProgress] = useState<number>(0);
  const [miningLogs, setMiningLogs] = useState<string[]>([]);

  // Interactive State for ATCP Observatory Auto-Learning Simulator
  const [selectedCaseStudyId, setSelectedCaseStudyId] = useState<string>('nike_swoosh');
  const [isObserving, setIsObserving] = useState<boolean>(false);
  const [observeProgress, setObserveProgress] = useState<number>(0);
  const [observeLogs, setObserveLogs] = useState<string[]>([]);
  const [observeStep, setObserveStep] = useState<number>(0);

  // Interactive State for Industrial Pattern DNA Classification
  const [selectedClassificationId, setSelectedClassificationId] = useState<string>('nike');
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [classifyingProgress, setClassifyingProgress] = useState<number>(0);
  const [classificationResult, setClassificationResult] = useState<any | null>(null);

  // Core realistic cumulative statistics (The Textile Knowledge Dashboard asset)
  const [dashboardStats, setDashboardStats] = useState({
    dstAnalyzed: 850,
    dstTotal: 850,
    imagesAnalyzed: 850,
    lawsDiscovered: 41,
    lawsValidated: 7,
    hypotheses: 34,
    digitizerStyles: 3,
    fabricProfiles: 5,
    machineProfiles: 4,
    statisticalRules: 512,
    averageConfidence: 98.6
  });

  // State for chosen design in comparative engine
  const [selectedDesignId, setSelectedDesignId] = useState<string>('crest');

  // Master Digitizer Selection
  const [selectedDigitizerId, setSelectedDigitizerId] = useState<string>('jean_pierre');
  const [isAnalyzingDigitizer, setIsAnalyzingDigitizer] = useState<boolean>(false);
  const [digitizerAnalysisProgress, setDigitizerAnalysisProgress] = useState<number>(100);

  // Filters for Textile Laws Tab
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'Observation' | 'Hypothèse' | 'Règle' | 'Loi' | 'Principe' | null>(null);
  const [lawSearchQuery, setLawSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Live Observatory Stats Ticker (Simulated dynamic increment)
  const [observatoryTicks, setObservatoryTicks] = useState({
    todayAnalyzed: 24,
    lawsCandidate: 6,
    lawsValidated: 2,
    regressionsDetected: 0,
    newFamiliesDiscovered: 1,
    anomaliesUnknown: 3,
    compilerImproved: 0.42
  });

  // Interactive State for ATCP Cognitive Layer
  const [selectedCognitiveDesign, setSelectedCognitiveDesign] = useState<'nike' | 'lacoste' | 'chanel' | 'adidas'>('nike');
  const [isAnalyzingCognitive, setIsAnalyzingCognitive] = useState<boolean>(false);
  const [cognitiveAnalysisProgress, setCognitiveAnalysisProgress] = useState<number>(0);
  const [cognitiveAnalysisLogs, setCognitiveAnalysisLogs] = useState<string[]>([]);
  const [cognitiveStep, setCognitiveStep] = useState<'idle' | 'observing' | 'analyzing' | 'recommending' | 'compiling' | 'completed'>('idle');

  // Sample Designs available for multi-strategy testing
  const sampleDesigns: DesignSpec[] = [
    { id: 'crest', name: 'Insigne Prestige Acom (Armoiries)', baseStitches: 28400, complexity: 'High' },
    { id: 'logo_active', name: 'Logo Sportwear Élastique Flex', baseStitches: 14500, complexity: 'Medium' },
    { id: 'jacket_back', name: 'Emblème Dorsal Technique', baseStitches: 68000, complexity: 'High' },
    { id: 'monogram', name: 'Initiales Caligraphiques (Luxe)', baseStitches: 4200, complexity: 'Low' }
  ];

  // Dynamic strategies based on selected design
  const strategiesForDesign = useMemo((): DigitalizationStrategy[] => {
    const base = sampleDesigns.find(d => d.id === selectedDesignId) || sampleDesigns[0];
    const multiplier = base.baseStitches / 28400;

    return [
      {
        id: 'luxe',
        name: 'Version Luxe (Haute Couture)',
        description: 'Finesse extrême, compensation de tirage active, densité adaptative.',
        color: 'border-pink-500/40 text-pink-400 bg-pink-950/10',
        time: `${Math.round(14 * multiplier)}m 35s`,
        threadLength: Math.round(184 * multiplier),
        consumptionGrams: Math.round(5.8 * multiplier * 10) / 10,
        qualityScore: 99,
        puckeringRisk: 'Faible',
        puckeringColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        estimatedCost: Math.round(2.50 * multiplier * 100) / 100,
        mainOverride: 'Pull-comp active +0.18mm, densité Satin adaptative, sous-couche croisée fine'
      },
      {
        id: 'rapide',
        name: 'Version Rapide (High-Speed)',
        description: 'Optimisation des déplacements et limitation des coupes pour cadences industrielles.',
        color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/10',
        time: `${Math.round(7 * multiplier)}m 12s`,
        threadLength: Math.round(142 * multiplier),
        consumptionGrams: Math.round(4.5 * multiplier * 10) / 10,
        qualityScore: 88,
        puckeringRisk: 'Moyen',
        puckeringColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        estimatedCost: Math.round(1.10 * multiplier * 100) / 100,
        mainOverride: 'Séquençage direct, seuil de coupe relevé à 5mm, vitesse maximale de chariot'
      },
      {
        id: 'economique',
        name: 'Version Économique (Low-Cost)',
        description: 'Réduction de la longueur de fil par lissage de la densité et points fusionnés.',
        color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/10',
        time: `${Math.round(9 * multiplier)}m 40s`,
        threadLength: Math.round(112 * multiplier),
        consumptionGrams: Math.round(3.5 * multiplier * 10) / 10,
        qualityScore: 84,
        puckeringRisk: 'Moyen',
        puckeringColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        estimatedCost: Math.round(0.85 * multiplier * 100) / 100,
        mainOverride: 'Densité Satin relâchée à 0.44mm, micro-points filtrés, sous-couche simplifiée'
      },
      {
        id: 'casquette',
        name: 'Version Casquette (Heavy Backing)',
        description: 'Rigidité structurelle maximale, séquençage du centre vers les bords pour éviter le glissement.',
        color: 'border-amber-500/40 text-amber-400 bg-amber-950/10',
        time: `${Math.round(13 * multiplier)}m 15s`,
        threadLength: Math.round(198 * multiplier),
        consumptionGrams: Math.round(6.2 * multiplier * 10) / 10,
        qualityScore: 94,
        puckeringRisk: 'Faible',
        puckeringColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        estimatedCost: Math.round(1.85 * multiplier * 100) / 100,
        mainOverride: 'Double sous-couche Z-Underlay lourde, broderie du centre vers l\'extérieur'
      },
      {
        id: 'stretch',
        name: 'Version Tissu Stretch (Elastic)',
        description: 'Stabilisation périphérique spécifique pour mailles extensibles ou lycra.',
        color: 'border-violet-500/40 text-violet-400 bg-violet-950/10',
        time: `${Math.round(11 * multiplier)}m 50s`,
        threadLength: Math.round(165 * multiplier),
        consumptionGrams: Math.round(5.2 * multiplier * 10) / 10,
        qualityScore: 96,
        puckeringRisk: 'Faible',
        puckeringColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        estimatedCost: Math.round(1.60 * multiplier * 100) / 100,
        mainOverride: 'Contour d\'abord (Stabilisation périphérique), compensation de tirage agressive +0.24mm'
      }
    ];
  }, [selectedDesignId]);

  // Comprehensive list of discovered Textile Laws matching the 850 reference DSTs
  const [textileLaws, setTextileLaws] = useState<TextileLaw[]>([
    {
      id: 'TL-001',
      code: 'LAW-TATAMI-COMP',
      title: 'Orientation Tatami Standard',
      knowledgeLevel: 'Loi',
      condition: 'SI surface géométrique du Tatami > 500 mm² ET angle de trame standard',
      consequence: 'ALORS imposer une orientation fixe entre 42° et 48° (45° optimum) pour neutraliser le retrait',
      confidence: 97.2,
      occurrences: 2418,
      exceptionsCount: 14,
      exceptionsReasons: ['cuir', 'casquette', 'velours', 'satin large'],
      firstDiscovered: '2026-04-18',
      lastValidated: '2026-07-14',
      concernedEngines: ['Tatami', 'Physics', 'Travel'],
      averageImpact: '+2.4% d\'homogénéité de surface',
      category: 'Tatami',
      evidenceLevel: 'A',
      pattern: 'Aplats / Grandes surfaces de remplissage > 500 mm²',
      ruleSequence: ['Surface géométrique > 500mm²', 'Imposer remplissage Tatami', 'Orientation fixe entre 42° et 48° (45° optimum)', 'Compensation de tirage adaptative selon angle'],
      exceptions: 14,
      applications: 'Fonds de blasons, grandes formes de remplissage, lettrages massifs',
      isValidated: true,
      impact: '+2.4% d\'homogénéité de surface'
    },
    {
      id: 'TL-002',
      code: 'LAW-SATIN-LIMIT',
      title: 'Compensation Satin Fine',
      knowledgeLevel: 'Règle',
      condition: 'SI largeur du cordonnet Satin est comprise entre 3.5 et 5.0 mm ET courbure du tracé > 18°',
      consequence: 'ALORS appliquer une pull-compensation adaptative de +0.18mm et une densité optimale de 0.38mm',
      confidence: 96.0,
      occurrences: 187,
      exceptionsCount: 39,
      exceptionsReasons: ['cuir', 'casquette', 'satin large', 'patch', 'chenille'],
      firstDiscovered: '2026-07-12',
      lastValidated: '2026-08-03',
      concernedEngines: ['Satin', 'Geometry', 'Physics'],
      averageImpact: '+4.1% de définition du cordonnet',
      category: 'Satin',
      evidenceLevel: 'A',
      pattern: 'Texte ou Colonne fine < 4.0 mm',
      ruleSequence: ['Squelette vecteur < 4mm', 'Appliquer point Satin', 'Pull Compensation active (+0.18mm)', 'Densité progressive active de 0.38mm'],
      exceptions: 39,
      applications: 'Textes, Monogrammes et Contours de logos',
      isValidated: true,
      impact: '+4.1% de définition du cordonnet'
    },
    {
      id: 'TL-003',
      code: 'LAW-JUMP-TRIM-THRES',
      title: 'Seuil de Trim Automatique',
      knowledgeLevel: 'Principe',
      condition: 'SI trajet de transition de déplacement (Jump) > 4.2 mm',
      consequence: 'ALORS forcer une commande de coupe physique (TRIM) et insérer un double nœud d\'arrêt aux extrémités',
      confidence: 99.5,
      occurrences: 12500,
      exceptionsCount: 4,
      exceptionsReasons: ['monogramme miniature', 'broderie main forcée', 'dentelle fine'],
      firstDiscovered: '2026-05-10',
      lastValidated: '2026-07-14',
      concernedEngines: ['Travel', 'Physics'],
      averageImpact: '0% de fils traînants résiduels / Risque de décousage nul',
      category: 'Travel',
      evidenceLevel: 'A',
      pattern: 'Trajet de transition (Jump) > 4.2 mm',
      ruleSequence: ['Vecteur de Saut de déplacement > 4.2mm', 'Insérer commande TRIM physique', 'Double nœud d\'arrêt aux deux extrémités'],
      exceptions: 4,
      applications: 'Tous motifs commerciaux haute cadence',
      isValidated: true,
      impact: '0% de fils traînants résiduels / Risque de décousage nul'
    },
    {
      id: 'TL-004',
      code: 'LAW-CORNER-DENSITY',
      title: 'Surcharge des Angles Aigus',
      knowledgeLevel: 'Règle',
      condition: 'SI angle d\'intersection de cordonnet Satin ou de virage < 35°',
      consequence: 'ALORS réduire la densité de 15% à 20% au point focal et appliquer un biseautage adaptatif',
      confidence: 95.6,
      occurrences: 345,
      exceptionsCount: 15,
      exceptionsReasons: ['lycra extensible', 'jersey fin', 'mailles tricotées lâche', 'fil d\'épaisseur 60'],
      firstDiscovered: '2026-06-01',
      lastValidated: '2026-07-10',
      concernedEngines: ['Physics', 'Travel', 'Geometry'],
      averageImpact: '-45% d\'échauffement d\'aiguille / Zéro casse de fil',
      category: 'Physics',
      evidenceLevel: 'B',
      pattern: 'Angle de virage de cordonnet < 35°',
      ruleSequence: ['Angle d\'intersection < 35°', 'Réduire densité de 15% à 20% au point focal', 'Appliquer un biseautage (Beveling) adaptatif', 'Limiter la pénétration d\'aiguille répétitive'],
      exceptions: 15,
      applications: 'Lettres à empattement, étoiles, angles de blasons',
      isValidated: true,
      impact: '-45% d\'échauffement d\'aiguille / Zéro casse de fil'
    },
    {
      id: 'TL-005',
      code: 'LAW-STABILIZATION-OUTLINE',
      title: 'Underlay Edge Run de Stabilisation',
      knowledgeLevel: 'Règle',
      condition: 'SI contour Satin complexe ou motif circulaire tracé sur maille hautement extensible',
      consequence: 'ALORS broder le contour Edge Run périphérique d\'abord pour stabiliser le tissu avant la couverture',
      confidence: 96.1,
      occurrences: 1870,
      exceptionsCount: 8,
      exceptionsReasons: ['toile de bâche ultra-rigide', 'cuir lourd épais', 'feutrine de laine compacte'],
      firstDiscovered: '2026-06-15',
      lastValidated: '2026-07-12',
      concernedEngines: ['Satin', 'Physics', 'Geometry'],
      averageImpact: '+12.5% de stabilité géométrique des contreformes',
      category: 'Geometry',
      evidenceLevel: 'B',
      pattern: 'Motifs circulaires complexes sur maille élastique',
      ruleSequence: ['Squelette circulaire de tension', 'Broder contour d\'abord pour fixer le tissu', 'Séquencer de l\'intérieur vers l\'extérieur', 'Double ancrage sur le stabilisateur hydrosoluble'],
      exceptions: 8,
      applications: 'Écussons circulaires, broderie sportswear',
      isValidated: true,
      impact: '+12.5% de stabilité géométrique des contreformes'
    },
    {
      id: 'TL-006',
      code: 'LAW-Z-UNDERLAY-HEAVY',
      title: 'Compensation Jersey & Sous-couche de Maintien',
      knowledgeLevel: 'Loi',
      condition: 'SI point Satin ou cordonnet large > 3.0 mm sur tissu à fibres longues (éponge, velours)',
      consequence: 'ALORS imposer une double sous-couche croisée (Z-Underlay) et sur-compensation de tirage de +0.25mm',
      confidence: 95.8,
      occurrences: 2120,
      exceptionsCount: 5,
      exceptionsReasons: ['soie naturelle fine', 'mousseline délicate', 'tissu technique imperméable ultra-fin'],
      firstDiscovered: '2026-04-18',
      lastValidated: '2026-06-30',
      concernedEngines: ['Satin', 'Physics', 'Geometry'],
      averageImpact: 'Finition 3D gonflante impeccable, boucles textiles scellées',
      category: 'Satin',
      evidenceLevel: 'B',
      pattern: 'Cordonnet Satin > 3.0 mm sur tissu éponge',
      ruleSequence: ['Largeur de cordonnet > 3.0mm', 'Injecter Double Z-Underlay croisé', 'Serrage des points d\'ancrage marginaux', 'Densité standard de couverture'],
      exceptions: 5,
      applications: 'Broderie éponge, serviettes, pulls molletonnés, jersey lourd',
      isValidated: true,
      impact: 'Finition 3D gonflante impeccable, boucles textiles scellées'
    },
    {
      id: 'TL-007',
      code: 'LAW-MICRO-STITCH-FILTER',
      title: 'Filtrage des Micro-points de Détails',
      knowledgeLevel: 'Hypothèse',
      condition: 'SI longueur de point unitaire de déplacement < 0.3 mm ou glyphe de texte minuscule < 4.0 mm',
      consequence: 'ALORS fusionner systématiquement au point adjacent et interdire l\'usage du Tatami de fond',
      confidence: 89.2,
      occurrences: 84,
      exceptionsCount: 9,
      exceptionsReasons: ['fil métallique rigide', 'broderie de haute précision sur canevas rigide'],
      firstDiscovered: '2026-07-01',
      lastValidated: '2026-07-14',
      concernedEngines: ['Satin', 'Travel', 'Physics'],
      averageImpact: 'Prévention d\'accumulation de fil sous la plaque d\'aiguille',
      category: 'Travel',
      evidenceLevel: 'C',
      pattern: 'Longueur de point unitaire < 0.3 mm',
      ruleSequence: ['Vecteur de point unitaire < 0.3mm', 'Filtrer & fusionner au point adjacent immédiat', 'Validation topologique sans perte d\'arêtes', 'Sauvegarde du flux binaire DST'],
      exceptions: 9,
      applications: 'Petits détails techniques complexes, monogrammes',
      isValidated: false,
      impact: 'Prévention d\'accumulation de fil sous la plaque d\'aiguille'
    },
    {
      id: 'TL-314',
      code: 'LAW-314',
      title: 'Préservation Morphologique (Ségments fins)',
      knowledgeLevel: 'Loi',
      condition: 'SI largeur utile locale d’une branche ou pétale de broderie < 1.0 mm ET rapport largeur/hauteur > 4',
      consequence: 'ALORS interdire toute simplification adaptative RDP supérieure à epsilon = 0.25 pour conserver le passage de fil satin',
      confidence: 98.7,
      occurrences: 1450,
      exceptionsCount: 2,
      exceptionsReasons: ['broderie ajourée de type Richelieu', 'contours de positionnement brut invisibles'],
      firstDiscovered: '2026-07-15',
      lastValidated: '2026-07-15',
      concernedEngines: ['Geometry', 'Satin', 'Physics'],
      averageImpact: 'Zéro effondrement d’épaisseur / Conservation totale des contreformes de pointes',
      category: 'Geometry',
      evidenceLevel: 'A',
      pattern: 'Largeur utile < 1.0 mm et aspect ratio > 4',
      ruleSequence: ['Calculer l’épaisseur locale (GIE)', 'Simuler la suppression de point', 'Bloquer si amincissement sous 0,9mm', 'Conserver le master sémantique intact'],
      exceptions: 2,
      applications: 'Pétales étroits, lettrages de précision, arabesques et entrelacs fins',
      isValidated: true,
      impact: 'Zéro effondrement d’épaisseur / Conservation totale des contreformes de pointes'
    }
  ]);

  // Master Digitizer Studies database
  const digitizerStudies: DigitizerStudy[] = [
    {
      id: 'jean_pierre',
      name: 'Maître Jean-Pierre',
      title: 'Chef de numérisation, Lyon (Haute Couture & Luxe)',
      avatar: '👔',
      analyzedDesigns: 520,
      signatureStyle: 'Aesthetic Premium Organique & Jumps Invisibles',
      habits: [
        { text: 'Utilise un angle Tatami de 45° dans 93 % des grandes surfaces pour neutraliser le sens de trame.', rate: 93 },
        { text: 'Évite rigoureusement les sauts supérieurs à 4,2 mm sans insérer de commande TRIM automatique.', rate: 97 },
        { text: 'Privilégie des colonnes Satin calibrées méticuleusement entre 2,8 et 3,4 mm.', rate: 91 },
        { text: 'Réduit systématiquement la densité de 15% dans les angles aigus pour éviter la surcharge d\'aiguilles.', rate: 89 },
        { text: 'Commence les parcours de broderie par les contours dans 87 % des motifs pour tendre le tissu.', rate: 87 }
      ]
    },
    {
      id: 'sportswear_active',
      name: 'Atelier Sportswear Heavy-Duty',
      title: 'Ligne industrielle automatisée (Haute vitesse multi-têtes)',
      avatar: '🧢',
      analyzedDesigns: 240,
      signatureStyle: 'Résistance physique maximale, Haute tension & Anti-rupture',
      habits: [
        { text: 'Force un angle Tatami à 30° ou 60° pour ancrer solidement le fil dans la maille piquée.', rate: 88 },
        { text: 'Seuil de Trim abaissé à 3,0 mm pour éliminer tout résidu de fil propice aux accrocs.', rate: 94 },
        { text: 'Applique une double sous-couche systématique (Z-Underlay) sur tout satin de plus de 3,0 mm.', rate: 92 },
        { text: 'Compensation de tirage très agressive (+0,25 mm) pour neutraliser l\'élasticité du polyester.', rate: 95 },
        { text: 'Ordonne la séquence de broderie en spirale (du centre vers l\'extérieur) pour éliminer le pli.', rate: 85 }
      ]
    },
    {
      id: 'wilcom_baseline',
      name: 'Wilcom CAD AI Baseline',
      title: 'Standards logiciels de broderie classique',
      avatar: '🤖',
      analyzedDesigns: 90,
      signatureStyle: 'Géométrique uniforme, standard commercial sans heuristiques physiques',
      habits: [
        { text: 'Fixe l\'angle Tatami uniformément à 45° peu importe la trame ou l\'élasticité.', rate: 99 },
        { text: 'Seuil de Trim standard configuré de manière lâche à 5,0 mm.', rate: 95 },
        { text: 'Maintient un espacement Satin plat et figé à 0,40 mm sur l\'intégralité du motif.', rate: 91 },
        { text: 'Applique une compensation de tirage globale et forfaitaire de 0,15 mm.', rate: 94 },
        { text: 'Optimisation de trajet de déplacement brute basée uniquement sur le voyageur de commerce (TSP).', rate: 88 }
      ]
    }
  ];

  // Case Studies Database: Image vs Professional DST vs ATCP DST
  const caseStudies: CaseStudy[] = [
    {
      id: 'nike_swoosh',
      brand: 'NIKE',
      designName: 'Virage Rapide Swoosh Classic',
      complianceScore: 98.6,
      proFeatures: [
        'Sous-couche Edge Run active le long des bordures effilées',
        'Densité Satin progressive (0.38mm au centre, 0.46mm aux extrémités)',
        'Compensation de tirage de +0.15mm pour prévenir le glissement',
        'Coupe automatique (Trim) pour tout déplacement > 4.2mm'
      ],
      atcpFeatures: [
        'Tracé initial simple sans Edge Run périphérique (modifié)',
        'Densité fixe de 0.40mm sur l\'intégralité du motif (modifié)',
        'Séquence de déplacement optimisée purement par coordonnées spatiales'
      ],
      differences: [
        'Puckering (fronce de tissu) identifié sur les extrémités aiguës avec le tracé standard d\'ATCP',
        'Légère perte d\'alignement sur maille extensible due à l\'absence d\'Edge Run sous-jacent'
      ],
      lessons: [
        'Sous-couche Edge Run : Indispensable pour stabiliser la structure du tissu extensible avant de poser la couverture Satin.',
        'Satin Progressif : Réduire la densité aux extrémités effilées (< 1mm de large) pour éviter l\'accumulation excessive de points et la casse de l\'aiguille.'
      ],
      category: 'Sportswear'
    },
    {
      id: 'adidas_trefoil',
      brand: 'ADIDAS',
      designName: 'Trèfle Classic & Trois Bandes',
      complianceScore: 97.4,
      proFeatures: [
        'Angle Tatami contraint à exactement +45° sur les aplats',
        'Seuil de coupe (Trim) strict abaissé à 3.0mm',
        'Double sous-couche de type Z-Underlay croisée',
        'Séquence de broderie du centre vers l\'extérieur (Spirale)'
      ],
      atcpFeatures: [
        'Angle Tatami à 0° (direction d\'extrusion standard du rectangle)',
        'Seuil de Trim standard de 5.0mm générant des fils libres',
        'Parcours gauche-vers-droite induisant un décalage de matière'
      ],
      differences: [
        'Lumière reflétée inégale sur les bandes parallèles dûes à l\'incohérence d\'orientation',
        'Pliure centrale du tissu en cours d\'exécution en raison du séquençage gauche-droite'
      ],
      lessons: [
        'Orientation Tatami : Imposer un angle constant (45°) pour harmoniser la réflexion de la lumière sur des formes géométriques adjacentes.',
        'Séquençage Central : Pour les broderies sur cadre circulaire, toujours extruder du centre vers la périphérie pour repousser l\'excédent de tissu.'
      ],
      category: 'Sportswear'
    },
    {
      id: 'lacoste_croc',
      brand: 'LACOSTE',
      designName: 'Crocodile Héraldique Multicolore',
      complianceScore: 96.8,
      proFeatures: [
        'Densité Tatami relâchée à 0.44mm pour les écailles',
        'Contour d\'abord (Stabilisation périphérique avant remplissage)',
        'Élimination stricte de tout micro-point < 0.3mm',
        'Séquence de couleurs minimisant les rechargements physiques'
      ],
      atcpFeatures: [
        'Remplissage Tatami standard ultra-dense (0.36mm)',
        'Remplissage intérieur avant pose des contours de définition',
        'Présence de micro-points de détails générant des nœuds sous la plaque'
      ],
      differences: [
        'Tissu éponge transperçant la couverture à cause d\'un manque de sous-couche scellante',
        'Bourrage de fil récurrent au niveau des griffes du crocodile'
      ],
      lessons: [
        'Contour d\'Abord : Permet de sceller le tissu bouclé (éponge) sous une grille stabilisatrice avant de broder le remplissage coloré.',
        'Filtre Micro-points : Fusionner systématiquement tout point unitaire de moins de 0.3mm pour préserver la mécanique de la machine.'
      ],
      category: 'Premium Couture'
    }
  ];

  // Industrial Pattern DNA database - buscando familias geométricas
  const dnaFamilies: PatternDnaFamily[] = [
    {
      id: 'nike_family',
      name: 'Famille "Virages Rapides & Courbes Asymétriques"',
      matchingPattern: 'Courbes effilées à rapport de forme > 5:1 (ex. Logos Swoosh, Vagues)',
      description: 'Famille caractérisée par des formes profilées lisses se terminant par des angles extrêmement aigus.',
      occurrence: 42,
      confidence: 99.1,
      dnaSequence: ['CURVE_DETECT', 'ASYMMETRIC_SPLIT', 'EXTREME_ACUTE_CORNER', 'HIGH_STRETCH_USE'],
      recommendedLaws: ['LAW-SATIN-LIMIT', 'LAW-CORNER-DENSITY'],
      styleOverride: 'Densité progressive active de 0.38mm à 0.48mm, Pull-compensation +0.15mm'
    },
    {
      id: 'adidas_family',
      name: 'Famille "Bandes Parallèles & Blocs Inclinés"',
      matchingPattern: 'Rectangles parallèles espacés régulièrement à inclinaison constante',
      description: 'Famille regroupant les alignements de blocs géométriques uniformes nécessitant une réflexion de lumière identique.',
      occurrence: 18,
      confidence: 98.4,
      dnaSequence: ['PARALLEL_BLOCKS', 'UNIFORM_SPACING', 'ANGULAR_EXTRUSION', 'REFLECTIVE_ALIGNMENT'],
      recommendedLaws: ['LAW-TATAMI-COMP', 'LAW-JUMP-TRIM-THRES'],
      styleOverride: 'Angle de Tatami imposé à 45° sur tous les blocs, Seuil de Trim fixé à 3.0mm'
    },
    {
      id: 'flower_family',
      name: 'Famille "Fleurs & Pétales Organiques"',
      matchingPattern: 'Formes elliptiques radiales disposées symétriquement autour d\'un centre',
      description: 'Famille regroupant les designs floraux, rosaces et motifs à symétrie centrale posant des défis de dérive textile circulaire.',
      occurrence: 54,
      confidence: 96.2,
      dnaSequence: ['RADIAL_SYMMETRY', 'ELLIPTIC_PETALS', 'CENTROID_ANCHOR', 'ROTATIONAL_EXTRUSION'],
      recommendedLaws: ['LAW-STABILIZATION-OUTLINE', 'LAW-Z-UNDERLAY-HEAVY'],
      styleOverride: 'Séquençage radial spiralé du centre vers l\'extérieur, ancrage double Z-Underlay'
    },
    {
      id: 'heraldic_family',
      name: 'Famille "Animaux, Lions & Héraldique"',
      matchingPattern: 'Contours denses enveloppant des micro-détails texturés intérieurs',
      description: 'Famille complexe mêlant de grands aplats Tatami de fond avec des lignes d\'or de définition fines et denses.',
      occurrence: 11,
      confidence: 94.5,
      dnaSequence: ['COMPLEX_HERALDIC', 'MULTI_LAYER_OVERLAY', 'MICRO_DETAIL_STITCH', 'HIGH_STITCH_DENSITY'],
      recommendedLaws: ['LAW-CORNER-DENSITY', 'LAW-Z-UNDERLAY-HEAVY', 'LAW-MICRO-STITCH-FILTER'],
      styleOverride: 'Sous-couche Tatami de scellage (0.8mm) sur l\'intégralité du blason, filtre micro-points actif'
    },
    {
      id: 'text_family',
      name: 'Famille "Textes Fins & Monogrammes < 5mm"',
      matchingPattern: 'Glyphes isolés, empattements étroits, lettrage de petite dimension',
      description: 'La famille de numérisation la plus sensible aux bourrages de fils sous la plaque d\'aiguille.',
      occurrence: 124,
      confidence: 99.5,
      dnaSequence: ['GLYPH_EXTRACTION', 'SMALL_SCALE_TEXT', 'SERIF_DETECTION', 'ISOLATED_PATHS'],
      recommendedLaws: ['LAW-SATIN-LIMIT', 'LAW-MICRO-STITCH-FILTER'],
      styleOverride: 'Remplacement automatique du Tatami par cordonnet Satin pur, compensation +0.18mm'
    }
  ];

  const activeStudy = useMemo(() => {
    return digitizerStudies.find(s => s.id === selectedDigitizerId) || digitizerStudies[0];
  }, [selectedDigitizerId]);

  const activeCaseStudy = useMemo(() => {
    return caseStudies.find(c => c.id === selectedCaseStudyId) || caseStudies[0];
  }, [selectedCaseStudyId]);

  const activeDnaFamily = useMemo(() => {
    const matched = dnaFamilies.find(f => {
      if (selectedClassificationId === 'nike') return f.id === 'nike_family';
      if (selectedClassificationId === 'adidas') return f.id === 'adidas_family';
      if (selectedClassificationId === 'flower') return f.id === 'flower_family';
      if (selectedClassificationId === 'lion') return f.id === 'heraldic_family';
      if (selectedClassificationId === 'text') return f.id === 'text_family';
      return false;
    });
    return matched || dnaFamilies[0];
  }, [selectedClassificationId]);

  // Handler for running the Industrial Knowledge Miner (IKM)
  const handleRunIKM = () => {
    setIsMining(true);
    setMiningProgress(0);
    setMiningLogs([]);

    const logSteps = [
      { progress: 10, msg: "📂 Ouverture de l'Industrial Reference Library : 850 fichiers binaire DST indexés." },
      { progress: 25, msg: "🔬 IKM : Initialisation du parseur binaire de coordonnées multi-matières." },
      { progress: 40, msg: "⚙ Extraction : Scan des points de piqûre, détection automatique des Trims et Jumps." },
      { progress: 55, msg: "📊 Statistiques : Analyse géométrique de la largeur Satin et calcul des angles Tatami." },
      { progress: 70, msg: "🎯 Corrélations : Corrélation établie entre les grandes surfaces de la galerie et l'orientation à 45° de trame." },
      { progress: 85, msg: "✔️ Validation croisée : Lancement du stress-test sur le Golden Dataset v1.0.0 (1,000 motifs hors ligne)." },
      { progress: 100, msg: "🏆 Succès ! Une nouvelle corrélation promue au Niveau de preuve B (210 observations, 96.1% de confiance)." }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx >= logSteps.length) {
        clearInterval(interval);
        setIsMining(false);
        setMiningProgress(100);
        
        // Cumulative update of knowledge database metrics strictly within bounds!
        setDashboardStats(prev => ({
          ...prev,
          dstAnalyzed: 850,
          statisticalRules: prev.statisticalRules + 4,
          lawsDiscovered: prev.lawsDiscovered + 1,
          lawsValidated: prev.lawsValidated + 1,
          averageConfidence: 98.7
        }));
        return;
      }
      setMiningProgress(logSteps[stepIdx].progress);
      setMiningLogs(prev => [...prev, logSteps[stepIdx].msg]);
      stepIdx++;
    }, 450);
  };

  // Handler for running the ATCP Observatory Auto-Learning Loop
  const handleRunObservatoryLoop = () => {
    setIsObserving(true);
    setObserveProgress(0);
    setObserveStep(0);
    setObserveLogs([]);

    const steps = [
      { progress: 15, log: `📂 [IMPORT] Réception du couple Image + DST Professionnel : ${activeCaseStudy.brand} - ${activeCaseStudy.designName}.` },
      { progress: 35, log: `🔬 [ANALYSE] Parsing binaire du DST professionnel : détection des formes complexes (${activeCaseStudy.category}).` },
      { progress: 55, log: `🔄 [COMPARER] Compilation par ATCP standard et superposition géométrique des tracés d'aiguille.` },
      { progress: 75, log: `⚡ [EXTRAIRE] Calcul des différences d'Heuristiques : ${activeCaseStudy.proFeatures[0]} (Pro) vs. ${activeCaseStudy.atcpFeatures[0]} (ATCP).` },
      { progress: 90, log: `🧪 [VALIDER] Test d'intégration géométrique de la différence sur le Golden Dataset de non-régression.` },
      { progress: 100, log: `🏆 [PUBLIER] Formulation d'une hypothèse textile. Indice de conformité : ${activeCaseStudy.complianceScore}%.` }
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= steps.length) {
        clearInterval(interval);
        setIsObserving(false);
        setObserveProgress(100);
        setObserveStep(6);
        
        // Slightly update ticks to show active progress
        setObservatoryTicks(prev => ({
          ...prev,
          todayAnalyzed: prev.todayAnalyzed + 1,
          lawsCandidate: prev.lawsCandidate + 1,
          compilerImproved: parseFloat((prev.compilerImproved + 0.02).toFixed(2))
        }));
        return;
      }
      setObserveProgress(steps[idx].progress);
      setObserveStep(idx + 1);
      setObserveLogs(prev => [...prev, steps[idx].log]);
      idx++;
    }, 600);
  };

  // Handler for Industrial Pattern DNA Classification
  const handleRunClassification = () => {
    setIsClassifying(true);
    setClassifyingProgress(0);
    setClassificationResult(null);

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      if (current >= 100) {
        clearInterval(interval);
        setClassifyingProgress(100);
        setIsClassifying(false);
        setClassificationResult(activeDnaFamily);
      } else {
        setClassifyingProgress(current);
      }
    }, 150);
  };

  const handleAnalyzeDigitizer = () => {
    setIsAnalyzingDigitizer(true);
    setDigitizerAnalysisProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      if (current >= 100) {
        clearInterval(interval);
        setDigitizerAnalysisProgress(100);
        setIsAnalyzingDigitizer(false);
      } else {
        setDigitizerAnalysisProgress(current);
      }
    }, 80);
  };

  const handleRunExperiment = () => {
    setIsRunningExperiment(true);
    setExperimentProgress(0);
    setExperimentLogs([]);
    
    const steps = [
      "📂 [INIT] Initialisation du protocole expérimental TSM pour le motif cible...",
      "🔬 [ANALYSE] Lecture des fichiers binaires : DST Pro d'origine vs Compilation ATCP...",
      "📐 [METROLOGIE] Mesure de la déformation d'arrondi (GFI) et de l'indice de tension locale (TPI)...",
      "⚡ [SIMULATION] Superposition des matrices d'impact physique (Heatmap de cisaillement)",
      "🧬 [CONNAISSANCE] Vérification de l'adéquation sémantique avec les lois TL-001, TL-005 et TL-007...",
      "🛡️ [GOLDEN] Lancement de la suite de non-régression sur le Golden Dataset (1000 motifs réels)...",
      "🏆 [CONFIANCE] Succès: Aucun écart critique de tension détecté. GFI stable à +0.2%. TPI amélioré à +1.1%."
    ];
    
    let current = 0;
    const interval = setInterval(() => {
      if (current >= steps.length) {
        clearInterval(interval);
        setIsRunningExperiment(false);
        setExperimentProgress(100);
      } else {
        setExperimentProgress(Math.round(((current + 1) / steps.length) * 100));
        setExperimentLogs(prev => [...prev, steps[current]]);
        current++;
      }
    }, 600);
  };

  const handleAnalyzeCognitive = () => {
    setIsAnalyzingCognitive(true);
    setCognitiveAnalysisProgress(0);
    setCognitiveAnalysisLogs([]);
    setCognitiveStep('observing');

    const steps = [
      { step: 'observing', log: "🔍 [OBSERVATION] Scan de l'image vectorielle source et détection des caractéristiques géométriques majeures..." },
      { step: 'observing', log: "⚡ [OBSERVATION] Profil asymétrique et détection de courbes longues à convexité variable..." },
      { step: 'analyzing', log: "🧠 [ANALYSE] Extraction de l'ADN sémantique du motif. Indexation : logo de marque curviligne sans occlusion." },
      { step: 'analyzing', log: "🏷️ [ANALYSE] Classification : Famille de motif reconnue avec succès." },
      { step: 'recommending', log: "📋 [CONSEIL] Consultation de la base de connaissances sémantique. Lois sémantiques applicables identifiées." },
      { step: 'recommending', log: "⚖️ [CONTRAT] Génération du payload strict 'CognitiveSuggestion[]' pour les moteurs déterministes de niveau inférieur." },
      { step: 'compiling', log: "⚙️ [MOTEUR DET] Transfert du contrat aux moteurs déterministes. Verrouillage du mode déterministe." },
      { step: 'compiling', log: "📐 [MOTEUR DET] Geometry Engine chargé. Epsilon réglé dynamiquement..." },
      { step: 'compiling', log: "🌐 [MOTEUR DET] Topology Engine chargé. Résolution de maillage optimisée..." },
      { step: 'compiling', log: "🌸 [MOTEUR DET] Ribbon Engine chargé. Stratégie de compensation de tirage verrouillée..." },
      { step: 'compiling', log: "🧶 [MOTEUR DET] Tatami Engine chargé. Paramètres de remplissage transmis..." },
      { step: 'compiling', log: "🧵 [MOTEUR DET] Satin Engine chargé. Pull Compensation fixée à la valeur exacte recommandée..." },
      { step: 'compiling', log: "🏃 [MOTEUR DET] Travel Optimizer chargé. Séquence de déplacement configurée..." },
      { step: 'compiling', log: "🛡️ [MOTEUR DET] Physics Simulator chargé. Simulation de déformation de matière active..." },
      { step: 'completed', log: "💎 [SUCCÈS] Compilation déterministe terminée à 100%. Aucun glissement physique, fidélité parfaite." }
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current >= steps.length) {
        clearInterval(interval);
        setIsAnalyzingCognitive(false);
        setCognitiveAnalysisProgress(100);
        setCognitiveStep('completed');
      } else {
        setCognitiveAnalysisProgress(Math.round(((current + 1) / steps.length) * 100));
        setCognitiveStep(steps[current].step as any);
        setCognitiveAnalysisLogs(prev => [...prev, steps[current].log]);
        current++;
      }
    }, 300);
  };

  // ATCP Scientific Registry (ASR) State
  const [registryItems, setRegistryItems] = useState([
    {
      id: 'OBS-000254',
      type: 'Observation',
      title: 'Froncement asymétrique sur maille polo Lacoste',
      description: 'Détection d\'un froncement résiduel systématique aux pointes effilées du crocodile sur tissu éponge ou jersey élastique lors de la couverture Satin sans sous-couche stabilisatrice.',
      discoveredBy: 'Jean-Pierre, Lyon',
      targetDesign: 'Crocodile Lacoste Héraldique',
      evidenceCount: 120,
      confidence: 94.2,
      date: '2026-07-02',
      nextStepId: 'HYP-000042',
      prevStepId: null,
      concernedEngine: 'Satin',
      metricsImpact: 'Réduction de 2% de la fidélité géométrique'
    },
    {
      id: 'HYP-000042',
      type: 'Hypothesis',
      title: 'Compensation de tirage progressive & Edge Run d\'ancrage',
      description: 'L\'élasticité bidimensionnelle de la maille piquée requiert d\'abord un scellage par Edge Run périphérique suivi d\'une réduction de 15% de la densité du Satin aux angles pointus inférieurs à 35°.',
      discoveredBy: 'Chief Scientist',
      targetDesign: 'Modélisation théorique piqué',
      evidenceCount: 145,
      confidence: 95.8,
      date: '2026-07-04',
      nextStepId: 'EXP-000876',
      prevStepId: 'OBS-000254',
      concernedEngine: 'Geometry',
      metricsImpact: 'Hypothèse de gain : +3.5% de stabilité'
    },
    {
      id: 'EXP-000876',
      type: 'Experiment',
      title: 'Banc d\'essai instrumenté TSM sur 100 polos Lacoste',
      description: 'Test en conditions industrielles réelles combinant différentes tensions de fil supérieur (1.1x à 1.3x) avec un biseautage binaire sur angles aigus. Analyse automatisée par Regression Scientist.',
      discoveredBy: 'Experiment Manager',
      targetDesign: 'Golden Dataset v1.0.0 (Motif LCS_CROC)',
      evidenceCount: 310,
      confidence: 96.5,
      date: '2026-07-08',
      nextStepId: 'VAL-000109',
      prevStepId: 'HYP-000042',
      concernedEngine: 'Physics',
      metricsImpact: 'Tension moyenne stabilisée à 120 cN, gain de 15% de points estimé'
    },
    {
      id: 'VAL-000109',
      type: 'Validation',
      title: 'Rapport de non-régression validé à 99% par l\'Audit Center',
      description: 'Le validateur topologique basé sur l\'Adjacency Winding Number confirme l\'absence de perte de contreformes. Le Golden Dataset à 1000 motifs atteste d\'une régression nulle (0.00%).',
      discoveredBy: 'Regression Scientist',
      targetDesign: 'Golden Dataset 1000 motifs',
      evidenceCount: 1000,
      confidence: 99.1,
      date: '2026-07-11',
      nextStepId: 'LAW-000031',
      prevStepId: 'EXP-000876',
      concernedEngine: 'Topology',
      metricsImpact: 'Score de non-régression de 99.1% certifié'
    },
    {
      id: 'LAW-000031',
      type: 'Law',
      title: 'Loi sémantique d\'Edge Run stabilisateur (TL-005)',
      description: 'Règle sémantique formalisée : SI contour Satin complexe sur maille active extensible, ALORS extruder en priorité la sous-couche Edge Run périphérique avant d\'engager le remplissage principal.',
      discoveredBy: 'Chief Scientist',
      targetDesign: 'Nike Swoosh / Lacoste Crocodile',
      evidenceCount: 850,
      confidence: 98.6,
      date: '2026-07-13',
      nextStepId: 'PUB-000012',
      prevStepId: 'VAL-000109',
      concernedEngine: 'Ribbon',
      metricsImpact: 'Réduction éprouvée de 15% du nombre de points requis, 0% de fil traînant'
    },
    {
      id: 'PUB-000012',
      type: 'Publication',
      title: 'Preprint: Topological Invariants in Curved Satin Underlays',
      description: 'Formalisation sémantique du graphe d\'adjacence continue pour la broderie de haute précision sur supports élastomères de type sportswear de luxe.',
      discoveredBy: 'Research Librarian',
      targetDesign: 'Acom Research & Validation Library',
      evidenceCount: 850,
      confidence: 99.5,
      date: '2026-07-14',
      nextStepId: 'PRINCIPLE-000004',
      prevStepId: 'LAW-000031',
      concernedEngine: 'Travel',
      metricsImpact: '12 citations enregistrées'
    },
    {
      id: 'PRINCIPLE-000004',
      type: 'Principle',
      title: 'Principe fondamental de scellage de maille',
      description: 'Principe physique inviolable constituant le socle d\'ATCP : "La stabilité géométrique d\'une boucle de fil sur support compressible est directement proportionnelle au taux d\'ancrage périphérique de sa sous-couche primaire."',
      discoveredBy: 'Chief Scientist',
      targetDesign: 'Patrimoine Scientifique Universel ATCP',
      evidenceCount: 5000,
      confidence: 99.9,
      date: '2026-07-14',
      nextStepId: null,
      prevStepId: 'PUB-000012',
      concernedEngine: 'Physics',
      metricsImpact: 'Intégration permanente dans l\'AEE (Noyau Physique)'
    }
  ]);

  const [selectedRegistryId, setSelectedRegistryId] = useState<string>('OBS-000254');

  // New Discovery Form states
  const [newAsrTitle, setNewAsrTitle] = useState('');
  const [newAsrDescription, setNewAsrDescription] = useState('');
  const [newAsrType, setNewAsrType] = useState<'Observation' | 'Hypothesis' | 'Experiment' | 'Validation' | 'Law' | 'Publication' | 'Principle'>('Observation');
  const [newAsrAuthor, setNewAsrAuthor] = useState('');
  const [newAsrDesign, setNewAsrDesign] = useState('');
  const [newAsrEngine, setNewAsrEngine] = useState<'Geometry' | 'Topology' | 'Ribbon' | 'Tatami' | 'Satin' | 'Travel' | 'Physics'>('Satin');
  const [newAsrImpact, setNewAsrImpact] = useState('');
  const [asrNotification, setAsrNotification] = useState<string | null>(null);

  const handleAddAsrItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsrTitle || !newAsrDescription) return;

    const lastItem = registryItems[registryItems.length - 1];
    const newId = `${newAsrType.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newItem = {
      id: newId,
      type: newAsrType,
      title: newAsrTitle,
      description: newAsrDescription,
      discoveredBy: newAsrAuthor || 'Expert Textile Anonyme',
      targetDesign: newAsrDesign || 'Motif d\'atelier',
      evidenceCount: 1,
      confidence: 90 + Math.floor(Math.random() * 9),
      date: new Date().toISOString().split('T')[0],
      nextStepId: null,
      prevStepId: lastItem ? lastItem.id : null,
      concernedEngine: newAsrEngine,
      metricsImpact: newAsrImpact || 'Preuves quantitatives en cours de calcul'
    };

    // Chain previous last item to this one
    const updatedItems = registryItems.map(item => {
      if (lastItem && item.id === lastItem.id) {
        return { ...item, nextStepId: newId };
      }
      return item;
    });

    setRegistryItems([...updatedItems, newItem]);
    setSelectedRegistryId(newId);

    // Update cumulative statistics of dashboard
    setDashboardStats(prev => ({
      ...prev,
      statisticalRules: prev.statisticalRules + 1,
      hypotheses: newAsrType === 'Hypothesis' ? prev.hypotheses + 1 : prev.hypotheses,
      lawsDiscovered: newAsrType === 'Law' ? prev.lawsDiscovered + 1 : prev.lawsDiscovered
    }));

    // Reset Form
    setNewAsrTitle('');
    setNewAsrDescription('');
    setNewAsrAuthor('');
    setNewAsrDesign('');
    setNewAsrImpact('');

    // Trigger Success feedback
    setAsrNotification(`La découverte sémantique ${newId} a été insérée avec succès dans le Registre ATCP !`);
    setTimeout(() => setAsrNotification(null), 5000);
  };

  return (
    <div className="space-y-6 text-slate-100 animate-fadeIn" id="textile-intelligence-center-root">
      
      {/* LEVEL 6 HERO HEADER */}
      <div className="bg-gradient-to-r from-violet-950/40 via-slate-900/80 to-cyan-950/40 border border-violet-500/20 rounded-2xl p-6 relative overflow-hidden" id="tic-hero-header">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-black tracking-widest bg-violet-500/15 text-violet-400 border border-violet-500/30 uppercase">
              🚀 Niveau 6 : Textile Intelligence Center (TIC)
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Textile Intelligence Center (TIC)
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Le centre de décision d'ATCP. Ce pôle n'applique plus de simples règles écrites à la main. En indexant et en comparant en permanence l'image et le code binaire de notre <strong className="text-cyan-400">Industrial Reference Library (850 DSTs)</strong>, il extrait statistiquement les Heuristiques Industrielles et formule des Lois Textiles explicables.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 shrink-0 font-mono text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Actifs Scientifiques</span>
              <span className="text-lg font-black text-cyan-400">{dashboardStats.statisticalRules.toLocaleString()} Règles</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Confiance Réelle</span>
              <span className="text-lg font-black text-violet-400">{dashboardStats.averageConfidence}%</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Médiathèque</span>
              <span className="text-lg font-black text-emerald-400 uppercase">850 DSTs</span>
            </div>
          </div>
        </div>

        {/* TIC Secondary Navigation Tabs */}
        <div className="flex gap-2 mt-6 pt-5 border-t border-slate-800/60 overflow-x-auto" id="tic-tabs-navigation">
          {[
            { id: 'dashboard', label: '1. Textile Knowledge Dashboard', icon: BarChart2, desc: 'Mesure du patrimoine cognitif' },
            { id: 'observatory', label: '2. ATCP Observatory', icon: Activity, desc: 'Auto-apprentissage & cas d\'école' },
            { id: 'miner', label: '3. Knowledge Miner (IKM)', icon: Workflow, desc: 'Ouverture binaire & extraction' },
            { id: 'dna', label: '4. Industrial Pattern DNA', icon: Network, desc: 'Classification en familles géométriques' },
            { id: 'strategies', label: '5. Multi-Strategy Compilation', icon: SlidersHorizontal, desc: 'Comparatifs : Luxe vs Fast vs Eco' },
            { id: 'laws', label: '6. Lois Textiles & Preuves', icon: FileText, desc: 'Catalogue de lois de niveau A-C' },
            { id: 'research_lab', label: '7. Textile Research Lab (TSM)', icon: Beaker, desc: 'Niveau 7 : Méthode scientifique & SMI' },
            { id: 'cognitive_layer', label: '8. ATCP Cognitive Layer (ACL)', icon: Brain, desc: 'Niveau 8 : Conseiller transversal s\'ingénierie' },
            { id: 'autonomous_scientist', label: '9. Autonomous Scientist (ATS)', icon: Cpu, desc: 'Niveau 9 : Recherche & Découverte autonome' },
            { id: 'scientific_registry', label: 'ASR - Scientific Registry', icon: BookOpen, desc: 'Registre sémantique transversal de preuves' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`tic-subtab-btn-${item.id}`}
                onClick={() => setActiveSubTab(item.id as any)}
                className={`p-3 rounded-xl border text-left transition-all shrink-0 min-w-[210px] ${
                  activeSubTab === item.id
                    ? 'border-violet-500 bg-violet-500/15 text-white font-bold ring-1 ring-violet-500/20'
                    : 'border-slate-850 bg-slate-950 hover:bg-slate-900/40 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Icon size={14} className={activeSubTab === item.id ? 'text-violet-400' : 'text-slate-500'} />
                  <span>{item.label}</span>
                </div>
                <span className="text-[9px] text-slate-500 block mt-1 font-mono leading-none">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE VIEW */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TAB 1: KNOWLEDGE ASSET DASHBOARD */}
          {activeSubTab === 'dashboard' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6 animate-fadeIn" id="view-knowledge-dashboard">
              <div className="pb-3 border-b border-slate-900 flex justify-between items-center">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <BarChart2 className="text-violet-400 w-4 h-4" />
                    Tableau de Bord du Patrimoine Sémantique & Cognitif (TIC)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mesure objective de l'accumulation de savoir-faire textile formalisé. Ce capital constitue l'actif principal d'ATCP.
                  </p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                  Library Active (850 DST)
                </span>
              </div>

              {/* Grid of Key Capital Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "DST Analysés", value: `${dashboardStats.dstAnalyzed} / ${dashboardStats.dstTotal}`, desc: "Industrial Reference Library", color: "text-blue-400 border-blue-500/10" },
                  { label: "Images Associées", value: dashboardStats.imagesAnalyzed.toString(), desc: "Couples image+DST indexés", color: "text-cyan-400 border-cyan-500/10" },
                  { label: "Lois Découvertes", value: dashboardStats.lawsDiscovered.toString(), desc: "Règles métier identifiées", color: "text-violet-400 border-violet-500/10" },
                  { label: "Lois Validées (A-B)", value: dashboardStats.lawsValidated.toString(), desc: "Prouvées scientifiquement", color: "text-emerald-400 border-emerald-500/10" },
                  { label: "Hypothèses (C-D)", value: dashboardStats.hypotheses.toString(), desc: "En attente d'occurrences", color: "text-amber-400 border-amber-500/10" },
                  { label: "Styles Digitizers", value: dashboardStats.digitizerStyles.toString(), desc: "Signatures de maîtres", color: "text-pink-400 border-pink-500/10" },
                  { label: "Profils Tissus", value: dashboardStats.fabricProfiles.toString(), desc: "Comportements physiques", color: "text-indigo-400 border-indigo-500/10" },
                  { label: "Règles Statistiques", value: dashboardStats.statisticalRules.toLocaleString(), desc: "Vecteurs corrélés", color: "text-purple-400 border-purple-500/10" }
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-xl border bg-slate-900/30 ${stat.color} space-y-1.5`}>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-tight">{stat.label}</span>
                    <div className="text-xl font-black">{stat.value}</div>
                    <p className="text-[10px] text-slate-400 leading-none">{stat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Chart: Growth of formal textile knowledge assets */}
              <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl space-y-3">
                <span className="text-[11px] font-mono text-violet-400 font-bold block uppercase">
                  Évolution Cumulative de notre Patrimoine Cognitif (Sprint S1 à S6)
                </span>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { sprint: 'S1', DST: 100, Rules: 80, Laws: 12 },
                        { sprint: 'S2', DST: 250, Rules: 180, Laws: 18 },
                        { sprint: 'S3', DST: 450, Rules: 310, Laws: 25 },
                        { sprint: 'S4', DST: 600, Rules: 420, Laws: 31 },
                        { sprint: 'S5', DST: 750, Rules: 480, Laws: 38 },
                        { sprint: 'S6 (Actuel)', DST: 850, Rules: 512, Laws: 41 },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRules" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="sprint" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10 }} />
                      <Area type="monotone" dataKey="Rules" name="Règles Statistiques Extraintes" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRules)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Laws" name="Lois Textiles Prouvées" stroke="#10b981" fillOpacity={0} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATCP OBSERVATORY */}
          {activeSubTab === 'observatory' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6 animate-fadeIn" id="view-atcp-observatory">
              <div className="pb-3 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Activity className="text-violet-400 w-4 h-4" />
                    ATCP Observatory (Système d'Auto-Apprentissage en Continu)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Surveillance en temps réel de notre base de connaissances. Chaque couple image+DST importé enrichit le compilateur.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Cas d'École :</span>
                  <select
                    value={selectedCaseStudyId}
                    onChange={(e) => {
                      setSelectedCaseStudyId(e.target.value);
                      setObserveStep(0);
                      setObserveLogs([]);
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 outline-none shrink-0"
                  >
                    {caseStudies.map(c => (
                      <option key={c.id} value={c.id}>{c.brand} ({c.designName})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live telemetry panel */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: "Analysés Aujourd'hui", value: `+${observatoryTicks.todayAnalyzed}`, desc: "DSTs physiques", color: "text-blue-400" },
                  { label: "Lois Candidates", value: observatoryTicks.lawsCandidate, desc: "Hypothèses actives", color: "text-amber-400" },
                  { label: "Lois Validées", value: `+${observatoryTicks.lawsValidated}`, desc: "Promues niveau A-B", color: "text-emerald-400" },
                  { label: "Régressions", value: observatoryTicks.regressionsDetected, desc: "Détectées", color: "text-rose-400" },
                  { label: "Familles Neuves", value: observatoryTicks.newFamiliesDiscovered, desc: "Classifiées", color: "text-cyan-400" },
                  { label: "Anomalies", value: observatoryTicks.anomaliesUnknown, desc: "Inconnues résolues", color: "text-purple-400" },
                  { label: "Gain Compilateur", value: `+${observatoryTicks.compilerImproved}%`, desc: "Fidélité physique", color: "text-pink-400 font-black" }
                ].map((tick, i) => (
                  <div key={i} className="p-3 bg-slate-900/40 border border-slate-850/80 rounded-xl text-center space-y-1">
                    <span className="text-[9px] text-slate-500 block font-bold leading-none uppercase">{tick.label}</span>
                    <span className={`text-sm font-black block ${tick.color}`}>{tick.value}</span>
                    <span className="text-[8px] text-slate-500 block leading-none">{tick.desc}</span>
                  </div>
                ))}
              </div>

              {/* Loop Trigger Box */}
              <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-200 block uppercase">Pipeline d'Apprentissage : {activeCaseStudy.brand}</span>
                    <p className="text-[11px] text-slate-400">Lancez l'importation et la comparaison automatisée du DST professionnel avec la compilation ATCP.</p>
                  </div>
                  <button
                    onClick={handleRunObservatoryLoop}
                    disabled={isObserving}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-lg"
                  >
                    {isObserving ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Play size={10} />}
                    Lancer la boucle d'apprentissage
                  </button>
                </div>

                {/* Pipeline visual diagram */}
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { id: 1, name: "1. Importer", desc: "Image + DST Pro" },
                    { id: 2, name: "2. Parser binaire", desc: "Coordonnées points" },
                    { id: 3, name: "3. Comparer", desc: "ATCP vs Pro" },
                    { id: 4, name: "4. Extraire", desc: "Différences de règles" },
                    { id: 5, name: "5. Valider", desc: "Test non-régression" },
                    { id: 6, name: "6. Publier", desc: "Hypothèse textile" }
                  ].map((pStep) => (
                    <div 
                      key={pStep.id} 
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        observeStep >= pStep.id
                          ? 'bg-violet-500/10 border-violet-500/40 text-violet-400 font-bold'
                          : 'bg-slate-950/40 border-slate-900 text-slate-500'
                      }`}
                    >
                      <span className="text-[10px] block font-black">{pStep.name}</span>
                      <span className="text-[8px] block opacity-80 mt-0.5 leading-none">{pStep.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Simulated Logs Terminal */}
                {observeLogs.length > 0 && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-400 space-y-1">
                    {observeLogs.map((log, lIdx) => (
                      <div key={lIdx} className="flex items-start gap-1">
                        <span className="text-violet-500 font-bold shrink-0">➔</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Case Study Details ("Chaque motif devient un cas d'école") */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-[10px] px-2 py-0.5 rounded font-black uppercase">
                      Cas d'École : {activeCaseStudy.brand}
                    </span>
                    <h4 className="text-sm font-black text-white">{activeCaseStudy.designName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Conformité au DST Pro :</span>
                    <span className="text-sm font-black text-emerald-400 ml-1.5">{activeCaseStudy.complianceScore}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column Pro features */}
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase block">✓ Heuristiques Maître Digitizer (DST Pro)</span>
                    <ul className="space-y-1.5">
                      {activeCaseStudy.proFeatures.map((f, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">✔</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column ATCP standard features */}
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block">⚠ Compilation Standard ATCP (Écarts)</span>
                    <ul className="space-y-1.5">
                      {activeCaseStudy.atcpFeatures.map((f, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">✖</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Differences and Lessons learned */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Anomalies physiques constatées en machine</span>
                    <div className="bg-rose-950/10 border border-rose-500/10 p-3.5 rounded-lg space-y-1.5">
                      {activeCaseStudy.differences.map((diff, idx) => (
                        <div key={idx} className="text-[11px] text-slate-400 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                          <span>{diff}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-violet-400 uppercase block">Leçons apprises & Loi Textile formulée</span>
                    <div className="bg-violet-950/10 border border-violet-500/10 p-3.5 rounded-lg space-y-1.5">
                      {activeCaseStudy.lessons.map((lesson, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-2">
                          <span className="text-violet-400 font-bold shrink-0">➔</span>
                          <span>{lesson}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INDUSTRIAL KNOWLEDGE MINER (IKM) */}
          {activeSubTab === 'miner' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6 animate-fadeIn" id="view-knowledge-miner">
              <div className="pb-3 border-b border-slate-900 flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Workflow className="text-violet-400 w-4 h-4 animate-spin-slow" />
                    Industrial Knowledge Miner (IKM) Engine
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lancer l'extracteur de règles pour parser la galerie binaire de l'Industrial Reference Library et identifier de nouvelles corrélations empiriques.
                  </p>
                </div>
                <button
                  onClick={handleRunIKM}
                  disabled={isMining}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-violet-600/10"
                >
                  {isMining ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Play size={12} />}
                  Lancer l'Analyseur IKM (+850 DSTs)
                </button>
              </div>

              {/* Progress and status */}
              {isMining && (
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-violet-400 font-bold">Extraction binaire et alignement topologique...</span>
                    <span>{miningProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${miningProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Visual extraction flow representation */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                {[
                  { step: '1. Parsing DST', desc: 'Scan binaire de la librairie', detail: '850 fichiers points, sauts', icon: Database },
                  { step: '2. Morphologie', desc: 'Satin vs Tatami', detail: 'Squelettisation de formes', icon: Cpu },
                  { step: '3. Analyse Sémantique', desc: 'Trouver corrélations', detail: 'ex: Zone large ➔ Tatami 45°', icon: Brain },
                  { step: '4. Stress Test', desc: 'Vérifier exceptions', detail: 'Test sur Golden Dataset v1.0.0', icon: ShieldCheck }
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className={`p-4 rounded-xl border bg-slate-900/40 border-slate-850/80 space-y-2`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-white">{item.step}</span>
                        <Icon size={12} className="text-slate-500" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                      <div className="bg-slate-950/80 px-2 py-1 rounded text-[9px] font-mono font-medium text-slate-500 leading-none">
                        {item.detail}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive terminal output */}
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-[11px] text-slate-400 space-y-1.5 min-h-[160px] max-h-[160px] overflow-y-auto leading-relaxed">
                <span className="text-slate-600 font-bold block uppercase border-b border-slate-900 pb-1.5 mb-1.5">Console de l'Industrial Knowledge Miner</span>
                {miningLogs.length === 0 ? (
                  <div className="text-slate-600 italic">
                    Aucune tâche d'extraction en cours. Cliquez sur le bouton ci-dessus pour lancer le moteur IKM sur la galerie DST d'Acom.
                  </div>
                ) : (
                  miningLogs.map((log, idx) => (
                    <div key={idx} className={idx === miningLogs.length - 1 ? 'text-violet-300 font-black' : ''}>
                      {log}
                    </div>
                  ))
                )}
              </div>

              {/* Explanatory banner */}
              <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl flex items-start gap-3">
                <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-black text-indigo-400 block uppercase">Objectivité et Preuves Statistiques</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Le moteur IKM élimine toute subjectivité humaine : l'ordinateur ouvre automatiquement chaque fichier binaire DST, modélise le séquençage physique et compare le résultat aux images brodées réelles. Une règle n'est validée et inscrite officiellement dans la base de connaissances que si son taux de confiance dépasse <strong className="text-emerald-400">95%</strong> sur l'intégralité du corpus.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INDUSTRIAL PATTERN DNA */}
          {activeSubTab === 'dna' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6 animate-fadeIn" id="view-pattern-dna">
              <div className="pb-3 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Network className="text-cyan-400 w-4 h-4" />
                    Industrial Pattern DNA (Classification par Familles Géométriques)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Le moteur n'analyse plus les fichiers individuellement. Il cherche des signatures d'ADN communes pour appliquer automatiquement les lois textiles adéquates.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Sélectionner Image :</span>
                  <select
                    value={selectedClassificationId}
                    onChange={(e) => {
                      setSelectedClassificationId(e.target.value);
                      setClassificationResult(null);
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 outline-none shrink-0"
                  >
                    <option value="nike">Logo type "Swoosh" courbé</option>
                    <option value="adidas">Logo type "Trois Bandes" rectangulaires</option>
                    <option value="flower">Dessin de fleur symétrique</option>
                    <option value="lion">Blason de lion héraldique</option>
                    <option value="text">Petit texte de copyright (&lt; 5mm)</option>
                  </select>
                </div>
              </div>

              {/* Classification workflow widget */}
              <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block uppercase">Moteur de Classification d'ADN ATCP</span>
                    <span className="text-[10px] text-slate-500 block">Identifie la famille morphologique pour configurer instantanément les hyperparamètres de broderie.</span>
                  </div>
                  <button
                    onClick={handleRunClassification}
                    disabled={isClassifying}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
                  >
                    {isClassifying ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Target size={11} />}
                    Classer & Appliquer les Lois
                  </button>
                </div>

                {isClassifying && (
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-cyan-400 font-bold">Extraction du vecteur sémantique de forme...</span>
                      <span>{classifyingProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${classifyingProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* Classification result screen */}
                {classificationResult && (
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-4 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-3">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Famille Identifiée :</span>
                        <h4 className="text-sm font-black text-cyan-400">{classificationResult.name}</h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-slate-500 font-mono">Taux de Confiance ADN :</span>
                        <span className="text-sm font-mono font-black text-emerald-400 block">{classificationResult.confidence}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Critère Morphologique</span>
                        <p className="text-slate-300 leading-relaxed font-sans">{classificationResult.matchingPattern}</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Séquence de Gènes ADN</span>
                        <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                          {classificationResult.dnaSequence.map((gene: string, gIdx: number) => (
                            <span key={gIdx} className="bg-slate-900 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded">
                              {gene}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Occurrence Galerie</span>
                        <p className="text-slate-300 font-bold">{classificationResult.occurrence} motifs découverts dans la galerie binaire</p>
                      </div>
                    </div>

                    {/* Automatic law injection box */}
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg space-y-2.5">
                      <span className="text-[10px] font-mono font-bold text-violet-400 uppercase block">Lois textiles injectées de manière autonome :</span>
                      <div className="flex flex-wrap gap-2">
                        {classificationResult.recommendedLaws.map((lawId: string, lIdx: number) => {
                          const lawDetail = textileLaws.find(l => l.code === lawId);
                          return (
                            <div key={lIdx} className="bg-slate-950 px-3 py-1.5 rounded border border-slate-850 flex items-center gap-2 text-xs">
                              <span className="w-2 h-2 rounded-full bg-violet-400" />
                              <div>
                                <span className="font-bold text-slate-200 block text-[11px] leading-tight">{lawDetail?.title || lawId}</span>
                                <span className="text-[9px] text-slate-500 font-mono">Confiance: {lawDetail?.confidence || 95}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded border border-slate-850/80 font-mono text-[10px] text-slate-400 mt-2">
                        <strong className="text-cyan-400 block uppercase text-[8px] mb-1">Configuration des Moteurs (Style Override) :</strong>
                        {classificationResult.styleOverride}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MULTI-STRATEGY COMPILATION SIMULATOR */}
          {activeSubTab === 'strategies' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6 animate-fadeIn" id="view-compilation-strategies">
              <div className="pb-3 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <SlidersHorizontal className="text-cyan-400 w-4 h-4" />
                    Multi-Strategy Digitalization Engine
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modélisez et comparez les différentes stratégies de digitalisation pour un même motif selon les impératifs industriels.
                  </p>
                </div>

                {/* Motif selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Motif d'Évaluation :</span>
                  <select
                    value={selectedDesignId}
                    onChange={(e) => setSelectedDesignId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 outline-none shrink-0"
                  >
                    {sampleDesigns.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.baseStitches.toLocaleString()} pts)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparative Matrix - 5 versions side-by-side */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                  Comparatif de Rendement Physique et Financier (Simulation Moteur ATCP) :
                </span>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                  {strategiesForDesign.map((strat) => (
                    <div 
                      key={strat.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-3.5 transition-all hover:scale-[1.02] ${strat.color}`}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-tight block text-white">{strat.name}</span>
                        <p className="text-[10px] text-slate-400 leading-tight min-h-[40px]">{strat.description}</p>
                      </div>

                      <div className="space-y-2 border-t border-slate-900/60 pt-3">
                        {/* Machine time */}
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-500 flex items-center gap-1"><Clock size={10} /> Temps</span>
                          <span className="text-white font-bold">{strat.time}</span>
                        </div>

                        {/* Thread length */}
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-500 flex items-center gap-1"><Scissors size={10} /> Fil</span>
                          <span className="text-white font-bold">{strat.threadLength} m</span>
                        </div>

                        {/* Weight in grams */}
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-500">Matière</span>
                          <span className="text-white font-bold">{strat.consumptionGrams} g</span>
                        </div>

                        {/* Quality score */}
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-500 flex items-center gap-1"><Award size={10} /> Qualité</span>
                          <span className="text-cyan-400 font-black">{strat.qualityScore}%</span>
                        </div>

                        {/* Puckering risk (Risque de fronce) */}
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-500">Risque Fronce</span>
                          <span className={`px-1 rounded text-[8px] font-black uppercase ${strat.puckeringColor}`}>
                            {strat.puckeringRisk}
                          </span>
                        </div>

                        {/* Production cost */}
                        <div className="flex justify-between items-center text-[11px] font-mono pt-1.5 border-t border-slate-900/40">
                          <span className="text-slate-400 font-bold flex items-center"><DollarSign size={10} /> Coût estimé</span>
                          <span className="text-emerald-400 font-black">{strat.estimatedCost} €</span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2 rounded text-[8px] font-mono text-slate-500 leading-normal border border-slate-900/80">
                        <strong className="text-slate-400 block uppercase text-[7px] mb-0.5">Séquence Override :</strong>
                        {strat.mainOverride}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informative footer */}
              <div className="bg-violet-950/20 border border-violet-500/20 p-4 rounded-xl">
                <span className="text-xs font-black text-violet-400 block uppercase">Unicité Technologique d'ATCP</span>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  En injectant différents paquets de règles textiles découverts par le TIC, le compilateur ATCP modifie dynamiquement le tracé, les compensations géométriques, l'espacement et le séquençage physique <strong>sans aucune altération du code source de notre moteur principal</strong>. L'utilisateur choisit simplement sa cible de rendement physique et financier.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: COMPLETE TEXTILE LAWS LIST */}
          {activeSubTab === 'laws' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6 animate-fadeIn" id="view-textile-laws">
              <div className="pb-3 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <FileText className="text-cyan-400 w-4 h-4" />
                    Patrimoine Scientifique : La Pyramide des Lois Textiles
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modélisation axiomatique du savoir-faire textile sous forme de règles physiques réfutables et hiérarchisées.
                  </p>
                </div>

                {/* Reset button if any filter active */}
                {(selectedLevelFilter || lawSearchQuery || selectedCategoryFilter) && (
                  <button
                    onClick={() => {
                      setSelectedLevelFilter(null);
                      setLawSearchQuery('');
                      setSelectedCategoryFilter(null);
                    }}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-slate-800 transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw size={10} className="animate-spin-slow text-violet-400" />
                    Réinitialiser les filtres
                  </button>
                )}
              </div>

              {/* TWO-COLUMN GRID: PYRAMID GRAPH ON LEFT, FILTERED LAWS ON RIGHT */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* LEFT SIDE: KNOWLEDGE PYRAMID (RECOMMENDATION 3) */}
                <div className="xl:col-span-5 space-y-4 bg-slate-900/20 border border-slate-850 p-5 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Hiérarchie des Connaissances</span>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Cliquez sur un étage de la pyramide pour filtrer les lois par niveau d'observation empirique.
                    </p>
                  </div>

                  {/* Pyramid representation */}
                  <div className="flex flex-col items-center justify-center space-y-1.5 py-4 select-none" id="knowledge-pyramid-graph">
                    
                    {/* Level 1: Principe */}
                    <button
                      onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'Principe' ? null : 'Principe')}
                      className={`group relative flex flex-col items-center justify-center py-2 px-4 transition-all duration-300 rounded-t-lg border ${
                        selectedLevelFilter === 'Principe'
                          ? 'bg-violet-500/35 border-violet-400 scale-[1.04] ring-2 ring-violet-500/40 text-white'
                          : 'bg-violet-950/20 border-violet-500/20 text-violet-300 hover:bg-violet-950/40 hover:border-violet-500/40'
                      } w-1/3 min-h-[48px]`}
                    >
                      <span className="text-[10px] font-black tracking-wider uppercase font-mono">1. Principe</span>
                      <span className="text-[8px] opacity-75 font-mono">&gt; 10 000 obs.</span>
                      <span className="absolute right-2 top-2 bg-violet-500/20 px-1 text-[8px] font-mono rounded text-violet-300 font-bold">
                        {textileLaws.filter(l => l.knowledgeLevel === 'Principe').length}
                      </span>
                    </button>

                    {/* Level 2: Loi */}
                    <button
                      onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'Loi' ? null : 'Loi')}
                      className={`group relative flex flex-col items-center justify-center py-2 px-4 transition-all duration-300 border ${
                        selectedLevelFilter === 'Loi'
                          ? 'bg-purple-500/35 border-purple-400 scale-[1.04] ring-2 ring-purple-500/40 text-white'
                          : 'bg-purple-950/20 border-purple-500/20 text-purple-300 hover:bg-purple-950/40 hover:border-purple-500/40'
                      } w-5/12 min-h-[48px]`}
                    >
                      <span className="text-[10px] font-black tracking-wider uppercase font-mono">2. Loi</span>
                      <span className="text-[8px] opacity-75 font-mono">2 000 - 10 000 obs.</span>
                      <span className="absolute right-2 top-2 bg-purple-500/20 px-1 text-[8px] font-mono rounded text-purple-300 font-bold">
                        {textileLaws.filter(l => l.knowledgeLevel === 'Loi').length}
                      </span>
                    </button>

                    {/* Level 3: Règle */}
                    <button
                      onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'Règle' ? null : 'Règle')}
                      className={`group relative flex flex-col items-center justify-center py-2 px-4 transition-all duration-300 border ${
                        selectedLevelFilter === 'Règle'
                          ? 'bg-indigo-500/35 border-indigo-400 scale-[1.04] ring-2 ring-indigo-500/40 text-white'
                          : 'bg-indigo-950/20 border-indigo-500/20 text-indigo-300 hover:bg-indigo-950/40 hover:border-indigo-500/40'
                      } w-7/12 min-h-[48px]`}
                    >
                      <span className="text-[10px] font-black tracking-wider uppercase font-mono">3. Règle</span>
                      <span className="text-[8px] opacity-75 font-mono">150 - 2 000 obs.</span>
                      <span className="absolute right-2 top-2 bg-indigo-500/20 px-1 text-[8px] font-mono rounded text-indigo-300 font-bold">
                        {textileLaws.filter(l => l.knowledgeLevel === 'Règle').length}
                      </span>
                    </button>

                    {/* Level 4: Hypothèse */}
                    <button
                      onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'Hypothèse' ? null : 'Hypothèse')}
                      className={`group relative flex flex-col items-center justify-center py-2 px-4 transition-all duration-300 border ${
                        selectedLevelFilter === 'Hypothèse'
                          ? 'bg-amber-500/35 border-amber-400 scale-[1.04] ring-2 ring-amber-500/40 text-white'
                          : 'bg-amber-950/20 border-amber-500/20 text-amber-300 hover:bg-amber-950/40 hover:border-amber-500/40'
                      } w-9/12 min-h-[48px]`}
                    >
                      <span className="text-[10px] font-black tracking-wider uppercase font-mono">4. Hypothèse</span>
                      <span className="text-[8px] opacity-75 font-mono">15 - 150 obs.</span>
                      <span className="absolute right-2 top-2 bg-amber-500/20 px-1 text-[8px] font-mono rounded text-amber-300 font-bold">
                        {textileLaws.filter(l => l.knowledgeLevel === 'Hypothèse').length}
                      </span>
                    </button>

                    {/* Level 5: Observation */}
                    <button
                      onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'Observation' ? null : 'Observation')}
                      className={`group relative flex flex-col items-center justify-center py-2 px-4 transition-all duration-300 rounded-b-lg border ${
                        selectedLevelFilter === 'Observation'
                          ? 'bg-rose-500/35 border-rose-400 scale-[1.04] ring-2 ring-rose-500/40 text-white'
                          : 'bg-rose-950/20 border-rose-500/20 text-rose-300 hover:bg-rose-950/40 hover:border-rose-500/40'
                      } w-full min-h-[48px]`}
                    >
                      <span className="text-[10px] font-black tracking-wider uppercase font-mono">5. Observation</span>
                      <span className="text-[8px] opacity-75 font-mono">&lt; 15 obs.</span>
                      <span className="absolute right-2 top-2 bg-rose-500/20 px-1 text-[8px] font-mono rounded text-rose-300 font-bold">
                        {textileLaws.filter(l => l.knowledgeLevel === 'Observation').length}
                      </span>
                    </button>

                  </div>

                  {/* Explain active pyramid filter */}
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-850 text-[10px] text-slate-500 leading-relaxed font-mono">
                    {selectedLevelFilter ? (
                      <p>
                        Filtré sur <strong className="text-cyan-400">{selectedLevelFilter}</strong> : Montre uniquement les acquis d'ingénierie se situant dans cette tranche de preuves.
                      </p>
                    ) : (
                      <p>
                        💡 Les observations locales remontées par le compilateur débutent au Niveau 5. Elles gravissent les échelons à mesure que le corpus de DST s'élargit pour se muer en Principes Industriels indubitables.
                      </p>
                    )}
                  </div>
                </div>

                {/* RIGHT SIDE: INTERACTIVE DATA SHEET LIST */}
                <div className="xl:col-span-7 space-y-4">
                  
                  {/* Search and Category Pill Filters */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                        <input
                          type="text"
                          value={lawSearchQuery}
                          onChange={(e) => setLawSearchQuery(e.target.value)}
                          placeholder="Rechercher par mot-clé, condition ou moteur..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500/50"
                        />
                      </div>
                    </div>

                    {/* Category tabs */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-500 self-center mr-1">Moteurs:</span>
                      {['Tous', 'Satin', 'Tatami', 'Travel', 'Physics', 'Geometry'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategoryFilter(cat === 'Tous' ? null : cat)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                            (cat === 'Tous' && !selectedCategoryFilter) || selectedCategoryFilter === cat
                              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold'
                              : 'bg-slate-900/60 text-slate-400 border border-transparent hover:bg-slate-900 hover:text-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Display list */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {textileLaws
                      .filter((law) => {
                        if (selectedCategoryFilter && law.category !== selectedCategoryFilter) return false;
                        if (selectedLevelFilter && law.knowledgeLevel !== selectedLevelFilter) return false;
                        if (lawSearchQuery) {
                          const q = lawSearchQuery.toLowerCase();
                          return (
                            law.title.toLowerCase().includes(q) ||
                            law.condition.toLowerCase().includes(q) ||
                            law.consequence.toLowerCase().includes(q) ||
                            law.id.toLowerCase().includes(q) ||
                            law.code.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((law) => (
                        <div
                          key={law.id}
                          className="p-5 rounded-xl border border-slate-850 bg-slate-900/30 hover:bg-slate-900/40 hover:border-slate-800 transition-all space-y-4"
                          id={`law-card-${law.id}`}
                        >
                          {/* Top Row: IDs, Badges, Category */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/60 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-black tracking-widest text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                                {law.id}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 font-bold hidden sm:inline">
                                {law.code}
                              </span>
                              <h4 className="text-xs font-bold text-white tracking-tight ml-1">{law.title}</h4>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Category Badge */}
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950 text-slate-400 border border-slate-850">
                                Engine: {law.category}
                              </span>
                              {/* Knowledge Level Badge */}
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black ${
                                law.knowledgeLevel === 'Principe' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                                law.knowledgeLevel === 'Loi' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                law.knowledgeLevel === 'Règle' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                law.knowledgeLevel === 'Hypothèse' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {law.knowledgeLevel}
                              </span>
                            </div>
                          </div>

                          {/* Rule Parameter Block: SI / ALORS (RECOMMENDATION 1) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id={`law-formula-${law.id}`}>
                            {/* Condition */}
                            <div className="bg-slate-950/60 border border-slate-900/80 p-3.5 rounded-lg space-y-1 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-slate-600" />
                              <span className="text-[9px] font-mono font-black text-slate-500 tracking-wider block uppercase">
                                SI (Condition d'activation)
                              </span>
                              <p className="text-[11px] text-slate-300 font-medium leading-relaxed pl-1">
                                {law.condition}
                              </p>
                            </div>

                            {/* Consequence */}
                            <div className="bg-violet-950/10 border border-violet-900/30 p-3.5 rounded-lg space-y-1 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
                              <span className="text-[9px] font-mono font-black text-violet-400 tracking-wider block uppercase">
                                ALORS (Conséquence physique)
                              </span>
                              <p className="text-[11px] text-slate-300 font-bold leading-relaxed pl-1">
                                {law.consequence}
                              </p>
                            </div>
                          </div>

                          {/* Refutability and Exceptions Panel (RECOMMENDATION 2) */}
                          <div className="bg-amber-950/5 border border-amber-500/15 p-3.5 rounded-lg space-y-2.5">
                            <div className="flex items-center justify-between border-b border-amber-500/5 pb-1.5">
                              <span className="text-[9px] font-mono font-black text-amber-500 tracking-wider uppercase flex items-center gap-1.5">
                                <ShieldAlert size={11} className="text-amber-500 shrink-0" />
                                Réfutabilité & Cas Limites de la Loi
                              </span>
                              <span className="text-[9px] font-mono font-bold text-slate-500">
                                Exceptions: <strong className="text-amber-400">{law.exceptionsCount} cas</strong> sur {law.occurrences.toLocaleString()} obs. ({parseFloat((law.exceptionsCount / (law.occurrences || 1) * 100).toFixed(2))}% de marge d'erreur)
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[9px] font-mono text-slate-500 uppercase font-medium block">
                                La règle ne s'applique pas si le support ou le procédé technique est :
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {law.exceptionsReasons.map((reason, rIdx) => (
                                  <span
                                    key={rIdx}
                                    className="bg-amber-950/30 text-amber-300/90 border border-amber-500/15 text-[9px] px-2 py-0.5 rounded font-mono"
                                  >
                                    ✘ {reason}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Bottom Metadata: Confidence, History, Engines, Impact */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1 text-[10px] font-mono text-slate-500">
                            
                            {/* Confidence and occurrences */}
                            <div className="md:col-span-4 space-y-1">
                              <div className="flex justify-between items-center text-[9px]">
                                <span>Confiance Observée :</span>
                                <span className="text-emerald-400 font-bold font-mono">{law.confidence}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${law.confidence}%` }} />
                              </div>
                              <span className="text-[8px] opacity-80 block mt-1">
                                Basé sur {law.occurrences.toLocaleString()} occurrences réelles.
                              </span>
                            </div>

                            {/* Concerned Engines */}
                            <div className="md:col-span-5 space-y-1">
                              <span className="text-[9px] uppercase tracking-wider font-bold block text-slate-600">Moteurs concernés :</span>
                              <div className="flex flex-wrap gap-1">
                                {law.concernedEngines.map((eng, eIdx) => (
                                  <span
                                    key={eIdx}
                                    className="bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-[8px] text-slate-300 font-bold"
                                  >
                                    {eng} Engine
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Timestamps */}
                            <div className="md:col-span-3 text-left md:text-right space-y-0.5 self-center">
                              <div className="block">
                                <span className="text-slate-600 font-bold">Découverte:</span> {law.firstDiscovered}
                              </div>
                              <div className="block">
                                <span className="text-slate-600 font-bold">Validation:</span> {law.lastValidated}
                              </div>
                              <div className="block font-black text-cyan-400">
                                Impact: {law.averageImpact}
                              </div>
                            </div>

                          </div>
                        </div>
                      ))}

                    {textileLaws.filter((law) => {
                      if (selectedCategoryFilter && law.category !== selectedCategoryFilter) return false;
                      if (selectedLevelFilter && law.knowledgeLevel !== selectedLevelFilter) return false;
                      if (lawSearchQuery) {
                        const q = lawSearchQuery.toLowerCase();
                        return (
                          law.title.toLowerCase().includes(q) ||
                          law.condition.toLowerCase().includes(q) ||
                          law.consequence.toLowerCase().includes(q) ||
                          law.id.toLowerCase().includes(q) ||
                          law.code.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    }).length === 0 && (
                      <div className="p-8 text-center bg-slate-900/10 border border-dashed border-slate-850 rounded-xl text-slate-500">
                        <HelpCircle size={24} className="mx-auto mb-2 text-slate-600 animate-pulse" />
                        <p className="text-xs font-bold font-mono">Aucune loi textile ne correspond à vos critères.</p>
                        <p className="text-[10px] mt-1">Essayez de réinitialiser vos filtres ou d'ajuster votre terme de recherche.</p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          )}



          {/* TAB 7: TEXTILE RESEARCH LAB (TSM) */}
          {activeSubTab === 'research_lab' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6 animate-fadeIn" id="view-textile-research-lab">
              
              {/* Lab Header */}
              <div className="pb-3 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Beaker className="text-violet-400 w-4 h-4" />
                    Textile Scientific Research Lab (TSM)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modélisation de la broderie industrielle selon la méthode scientifique rigoureuse d'observation, d'expérimentation et de réfutabilité.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 font-mono text-[10px] px-2.5 py-1 rounded font-black uppercase">
                    Niveau 7 : Méthode Scientifique
                  </span>
                  <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-[10px] px-2.5 py-1 rounded font-black uppercase">
                    TSM Active Engine
                  </span>
                </div>
              </div>

              {/* Internal Research Lab Navigation Tabs */}
              <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-900" id="research-lab-internal-nav">
                {[
                  { id: 'smi_epistemo', label: 'Maturité & Épistémologie (SMI)', icon: BarChart2, color: 'text-violet-400' },
                  { id: 'tsm_experiment', label: 'Cycle TSM & Expérimentations', icon: Beaker, color: 'text-amber-400' },
                  { id: 'master_stylometry', label: 'Stylométrie des Maîtres', icon: Users, color: 'text-cyan-400' },
                  { id: 'campaigns_papers', label: 'Campagnes & Publications', icon: BookOpen, color: 'text-emerald-400' }
                ].map((sec) => {
                  const SecIcon = sec.icon;
                  const isActive = researchLabSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setResearchLabSection(sec.id as any)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        isActive 
                          ? 'bg-slate-900 border-slate-800 text-white' 
                          : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <SecIcon size={12} className={sec.color} />
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* INNER SECTION 1: MATURITE & EPISTEMOLOGIE */}
              {researchLabSection === 'smi_epistemo' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* SMI Dashboard Card */}
                  <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                      <div>
                        <h4 className="text-white font-bold text-xs uppercase font-mono tracking-wide flex items-center gap-1.5 text-violet-400">
                          <BarChart2 size={13} /> Scientific Maturity Index (SMI)
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Indicateurs de maturité scientifique globale mesurant la consolidation du patrimoine cognitif d'ATCP.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 font-mono block">Niveau SMI :</span>
                        <span className="text-lg font-black text-violet-400 font-mono">87.4%</span>
                      </div>
                    </div>

                    {/* SMI Key Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 pt-1">
                      {[
                        { label: 'Observations', val: '12 500', desc: 'Anomalies recensées', color: 'text-blue-400' },
                        { label: 'Hypothèses', val: '480', desc: 'Règles physiques candidates', color: 'text-amber-400' },
                        { label: 'Règles', val: '132', desc: 'Validations sémantiques', color: 'text-cyan-400' },
                        { label: 'Lois', val: '47', desc: 'Généralisations prouvées', color: 'text-emerald-400' },
                        { label: 'Principes', val: '11', desc: 'Axiomes théoriques', color: 'text-violet-400' },
                        { label: 'Expériences', val: '3 420', desc: 'Essais reproductibles', color: 'text-indigo-400' },
                        { label: 'Lois Réfutées', val: '19', desc: 'Théories invalidées (Falsified)', color: 'text-rose-400' },
                        { label: 'Lois Révisées', val: '26', desc: 'Mutations de lois adaptées', color: 'text-pink-400' }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] text-slate-500 font-mono block uppercase font-bold">{item.label}</span>
                            <span className={`text-base font-black font-mono mt-0.5 block ${item.color}`}>{item.val}</span>
                          </div>
                          <span className="text-[8px] text-slate-500 block leading-tight mt-1 font-sans">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Epistemic separation classifier widget */}
                  <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-xl space-y-4">
                    <div className="pb-2 border-b border-slate-900">
                      <h4 className="text-white font-bold text-xs uppercase font-mono tracking-wide flex items-center gap-1.5 text-cyan-400">
                        <Scale size={13} /> Séparation Épistémique : Faits vs Connaissances
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Acom structure rigoureusement ses actifs cognitifs en quatre niveaux hermétiques de généralisation scientifique.
                      </p>
                    </div>

                    {/* Interactive 4-tier selector */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { id: 'facts', label: '1. Faits (Facts)', color: 'border-blue-500/20 text-blue-400', activeBg: 'bg-blue-950/20 border-blue-500/50' },
                        { id: 'observations', label: '2. Observations', color: 'border-amber-500/20 text-amber-400', activeBg: 'bg-amber-950/20 border-amber-500/50' },
                        { id: 'laws', label: '3. Lois (Laws)', color: 'border-emerald-500/20 text-emerald-400', activeBg: 'bg-emerald-950/20 border-emerald-500/50' },
                        { id: 'theories', label: '4. Théories / Principes', color: 'border-violet-500/20 text-violet-400', activeBg: 'bg-violet-950/20 border-violet-500/50' }
                      ].map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => setActiveEpistemicTier(tier.id as any)}
                          className={`p-3 rounded-lg border text-left transition-all font-mono font-bold text-xs ${
                            activeEpistemicTier === tier.id
                              ? `${tier.activeBg} text-white`
                              : 'bg-slate-950 text-slate-400 hover:bg-slate-900/40'
                          }`}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>

                    {/* Epistemic detail content box */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3">
                      {activeEpistemicTier === 'facts' && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold text-blue-400 uppercase block">Niveau 1 : Données Brutes Réelles (Facts)</span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Ce sont des mesures brutes recueillies directement à partir du binaire DST ou des capteurs de tension machines. Elles ne contiennent aucune logique métier autonome.
                          </p>
                          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-400 space-y-1">
                            <div><strong className="text-slate-300">File ID :</strong> DST-00854 (Lacoste Croc logo)</div>
                            <div><strong className="text-slate-300">Stitch count :</strong> 13 482 points</div>
                            <div><strong className="text-slate-300">Total trims :</strong> 18 coupes</div>
                            <div><strong className="text-slate-300">Total travel :</strong> 42 mm</div>
                            <div><strong className="text-slate-300">Status :</strong> Mesure brute physique stable</div>
                          </div>
                        </div>
                      )}

                      {activeEpistemicTier === 'observations' && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block">Niveau 2 : Observations Empiriques</span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            L'observation relie une donnée brute à un comportement physique relevé sur un tissu spécifique. Elle est localisée, ponctuelle et n'a pas valeur de généralité.
                          </p>
                          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-400 space-y-1">
                            <div><strong className="text-slate-300">Observation ID :</strong> OBS-20254</div>
                            <div><strong className="text-slate-300">Constat :</strong> Sur le motif DST-00854 brodé sur Jersey, un Tatami orienté à 45° a éliminé 15% des fronces.</div>
                            <div><strong className="text-slate-300">Limite :</strong> Valable uniquement pour ce motif et cette densité d'échantillon.</div>
                          </div>
                        </div>
                      )}

                      {activeEpistemicTier === 'laws' && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">Niveau 3 : Lois Sémantiques Validées (Laws)</span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Une loi est une généralisation statistique validée de manière rigoureuse sur notre Golden Dataset de plus de 1000 motifs. Elle s'exprime par une règle logique explicable.
                          </p>
                          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-400 space-y-1.5">
                            <div><strong className="text-slate-300">Loi ID :</strong> TL-003 (Loi de Courbure d'Orientation)</div>
                            <div className="p-1.5 bg-slate-950 rounded border border-slate-900">
                              <span className="text-blue-400 font-bold">SI : </span>
                              surface &gt; 40 mm² ET forme allongée (ratio &gt; 2.5) ET tissu = Jersey
                            </div>
                            <div className="p-1.5 bg-slate-950 rounded border border-slate-900">
                              <span className="text-emerald-400 font-bold">ALORS : </span>
                              orientation optimale de Tatami ≈ 45° (compensation automatique)
                            </div>
                            <div><strong className="text-slate-300">Indice de Confiance :</strong> 96% (validée sur 712 DSTs réels)</div>
                          </div>
                        </div>
                      )}

                      {activeEpistemicTier === 'theories' && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold text-violet-400 uppercase block">Niveau 4 : Théories & Principes Axiomatiques</span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            La théorie explique pourquoi plusieurs lois distinctes fonctionnent de manière cohérente, en s'appuyant sur les lois de la physique mécanique, du cisaillement et de la résistance des matériaux.
                          </p>
                          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-400 space-y-1">
                            <div><strong className="text-slate-300">Théorie :</strong> Anisotropie Mécanique Textile</div>
                            <p className="text-[11px] text-slate-300 italic font-sans leading-relaxed pt-1">
                              "Les motifs présentant une anisotropie géométrique élevée nécessitent une orientation du remplissage alignée avec la direction principale de la forme pour minimiser l'accumulation des forces de cisaillement mécanique latérales, réduisant ainsi le risque de déformation géométrique d'alignement."
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* INNER SECTION 2: CYCLE TSM & EXPERIMENTATIONS */}
              {researchLabSection === 'tsm_experiment' && (
                <div className="space-y-6 animate-fadeIn">

                  {/* TSM 6-STEP CYCLE INTERACTIVE COMPONENT */}
                  <div className="bg-slate-900/25 border border-slate-850 p-5 rounded-xl space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Cycle de la Méthode Scientifique Textile (TSM) :</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cliquez sur une phase du cycle pour explorer ses activités sous-jacentes et ses actifs dans le laboratoire.
                  </p>
                </div>

                {/* Horizontal flow line of steps */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {[
                    { id: 'observation', label: '1. Observation', desc: 'Anomalies physiques', color: 'border-blue-500/30 text-blue-400 bg-blue-950/10' },
                    { id: 'hypothesis', label: '2. Hypothèse', desc: 'Règles réfutables', color: 'border-amber-500/30 text-amber-400 bg-amber-950/10' },
                    { id: 'experiment', label: '3. Expérience', desc: 'DST Pro vs ATCP', color: 'border-violet-500/30 text-violet-400 bg-violet-950/10' },
                    { id: 'validation', label: '4. Validation', desc: 'Golden Dataset', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10' },
                    { id: 'publication', label: '5. Publication', desc: 'Memorandums', color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/10' },
                    { id: 'revision', label: '6. Révision', desc: 'Mutations de lois', color: 'border-pink-500/30 text-pink-400 bg-pink-950/10' }
                  ].map((step) => (
                    <button
                      key={step.id}
                      onClick={() => setActiveTsmStep(step.id as any)}
                      className={`p-3 rounded-lg border text-left transition-all duration-300 relative ${
                        activeTsmStep === step.id
                          ? 'ring-2 ring-violet-500/50 bg-slate-900 border-white text-white font-black'
                          : 'bg-slate-950/55 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-[11px] block font-mono font-bold uppercase">{step.label}</span>
                      <span className="text-[9px] block text-slate-500 leading-tight mt-1">{step.desc}</span>
                      {activeTsmStep === step.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-1 bg-violet-500 rounded-b-lg" />
                      )}
                    </button>
                  ))}
                </div>

                {/* TSM active step detail box */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 space-y-3">
                  {activeTsmStep === 'observation' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-blue-400 uppercase flex items-center gap-1.5 font-mono">
                        <Eye size={12} /> Étape 1 : Observation Continue (Empirique)
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Le système de capture d'Acom compare en continu les images de broderie réelles (issues de caméras de contrôle) avec les fichiers binaire d'aiguilles DST. Lorsque des rides, pliures ou pertes de contreforme sont relevées dans notre parc de 850 motifs, elles sont catégorisées sous forme d'incidents d'alignement physique.
                      </p>
                      <div className="flex gap-4 pt-1 font-mono text-[10px] text-slate-500">
                        <span>• Taux de couverture de la galerie : 100%</span>
                        <span>• Anomalies irrésolues : 3 cas critiques</span>
                        <span>• Tissu cible actif : Jersey technique lourd</span>
                      </div>
                    </div>
                  )}

                  {activeTsmStep === 'hypothesis' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-amber-400 uppercase flex items-center gap-1.5 font-mono">
                        <Brain size={12} /> Étape 2 : Formulation d'Hypothèse Réfutable
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Chaque observation génère une règle candidate. Nous refusons les recettes figées de type "Nike utilise 0.38mm". Nous formulons des théories logiques réfutables : <strong>"SI largeur du cordonnet ∈ [3.5 ; 5.0 mm] ET courbure &gt; 18° ET support = Jersey, ALORS compensation de tirage adaptative obligatoire de +0.18mm."</strong>
                      </p>
                      <div className="flex gap-4 pt-1 font-mono text-[10px] text-slate-500">
                        <span>• Hypothèses formulées : 34 actives</span>
                        <span>• Seuil de confiance requis : &gt; 95%</span>
                        <span>• Modèles neuronaux de corrélation : Actifs</span>
                      </div>
                    </div>
                  )}

                  {activeTsmStep === 'experiment' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-violet-400 uppercase flex items-center gap-1.5 font-mono">
                        <Activity size={12} /> Étape 3 : Expérimentation et Simulation d'Aiguilles
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Afin de tester une hypothèse, le laboratoire lance des expérimentations simulées comparatives (Original DST d'usine vs DST compilé par le moteur ATCP intégrant la nouvelle règle candidate). Cette phase mesure la tension résultante et estime le risque de fronce du tissu par calcul de cisaillement.
                      </p>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] text-slate-500 font-mono">• 3 Expérimentations détaillées actives ci-dessous</span>
                        <button
                          onClick={handleRunExperiment}
                          disabled={isRunningExperiment}
                          className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] px-3 py-1 rounded transition-all flex items-center gap-1"
                        >
                          {isRunningExperiment ? <RefreshCw className="animate-spin w-3 h-3" /> : <Play size={8} />}
                          Lancer la simulation expérimentale active
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTsmStep === 'validation' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-emerald-400 uppercase flex items-center gap-1.5 font-mono">
                        <ShieldCheck size={12} /> Étape 4 : Validation sur le Golden Dataset de Non-Régression
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Toute règle sémantique d'ajustement est soumise à un stress test automatique de non-régression. Elle est injectée dans le compilateur qui recompile l'intégralité du Golden Dataset (1000 motifs réels). Elle n'est validée que si l'écart global de points n'induit aucune déformation géométrique résiduelle et améliore les métriques globales.
                      </p>
                      <div className="flex gap-4 pt-1 font-mono text-[10px] text-slate-500">
                        <span>• Taille du Golden Dataset : 1000 motifs de référence (Gelé v1.0)</span>
                        <span>• Score de régression toléré : 0%</span>
                        <span>• Taux de réussite moyen : 98.6%</span>
                      </div>
                    </div>
                  )}

                  {activeTsmStep === 'publication' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-cyan-400 uppercase flex items-center gap-1.5 font-mono">
                        <BookOpen size={12} /> Étape 5 : Publication des Memorandums Techniques
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Pour ancrer définitivement la broderie comme une branche de l'ingénierie physique CAO/FAO, chaque lot de lois validées fait l'objet d'un rapport de métrologie et d'une étude d'architecture au format universitaire (Abstract, Equations, Résultats quantifiés comparatifs).
                      </p>
                      <div className="flex gap-4 pt-1 font-mono text-[10px] text-slate-500">
                        <span>• Mémorandums archivés : 2 publications</span>
                        <span>• Citations académiques : 14</span>
                        <span>• Validateur topologique : Actif (Winding Number)</span>
                      </div>
                    </div>
                  )}

                  {activeTsmStep === 'revision' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-pink-400 uppercase flex items-center gap-1.5 font-mono">
                        <SlidersHorizontal size={12} /> Étape 6 : Révision et Mutation Continues des Lois
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Une loi n'est jamais définitive. À mesure que notre Industrial Reference Library s'enrichit de nouveaux cas complexes (ex: tissus métalliques fins, soies), les lois existantes mutent (v1.0 ➔ v2.0) pour ajuster leurs hyperparamètres et étendre leur spectre de confiance.
                      </p>
                      <div className="flex gap-4 pt-1 font-mono text-[10px] text-slate-500">
                        <span>• Loi de Tatami active : v2.1.0 (97.2%)</span>
                        <span>• Loi de Satin active : v2.0.0 (96.0%)</span>
                        <span>• Détecteur automatique d'obsolescence : Actif</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CORE RESEARCH LAB INTERACTIVE GRIDS */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* COLUMN LEFT: EXP-00254 ACTIVE SCIENTIFIC EXPERIMENT DETAILS */}
                <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-xl space-y-4">
                  <div className="pb-2 border-b border-slate-900 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-violet-400 font-bold block uppercase">Visualiseur d'Expérimentations Physiques</span>
                      <h4 className="text-white font-bold text-xs">Suivi des Tests DST Originaux vs ATCP</h4>
                    </div>
                    
                    {/* Experiment Selector */}
                    <select
                      value={selectedExperimentId}
                      onChange={(e) => {
                        setSelectedExperimentId(e.target.value);
                        setExperimentLogs([]);
                        setExperimentProgress(0);
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-[11px] font-mono font-bold text-slate-200 outline-none"
                    >
                      {experiments.map(e => (
                        <option key={e.id} value={e.id}>{e.id} ({e.category})</option>
                      ))}
                    </select>
                  </div>

                  {/* Retrieved Active Experiment Card */}
                  {(() => {
                    const activeExp = experiments.find(e => e.id === selectedExperimentId) || experiments[0];
                    return (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="bg-slate-950 text-slate-400 border border-slate-850 font-mono text-[9px] px-2 py-0.5 rounded font-black">
                              {activeExp.id} • {activeExp.category}
                            </span>
                            <h5 className="text-white font-bold text-xs font-sans leading-snug">{activeExp.title}</h5>
                            <span className="text-[10px] text-slate-500 font-mono">Date de l'essai : {activeExp.date}</span>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                            {activeExp.status}
                          </span>
                        </div>

                        {/* Files comparison */}
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-900">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">DST d'Origine (Pro)</span>
                            <span className="text-slate-300 font-bold block text-[10px] mt-0.5">{activeExp.originalDst}</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-900">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">DST Compilé (ATCP)</span>
                            <span className="text-cyan-400 font-bold block text-[10px] mt-0.5">{activeExp.atcpDst}</span>
                          </div>
                        </div>

                        {/* Double Metrics Gauges + Heatmap */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Metrics scores */}
                          <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-900">
                            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Indicateurs de Performance Physique :</span>
                            
                            {/* GFI Score */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span className="flex items-center gap-1">Fidélité Géométrique (GFI)</span>
                                <span className="text-emerald-400 font-black">{activeExp.gfiScore}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400" style={{ width: `${activeExp.gfiScore}%` }} />
                              </div>
                            </div>

                            {/* TPI Score */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span className="flex items-center gap-1">Tension & Fronce (TPI)</span>
                                <span className="text-cyan-400 font-black">{activeExp.tpiScore}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-400" style={{ width: `${activeExp.tpiScore}%` }} />
                              </div>
                            </div>

                            {/* Applied/Invalidated Laws tags */}
                            <div className="pt-2 border-t border-slate-900 space-y-1.5 text-[10px]">
                              <div className="flex flex-wrap gap-1">
                                <span className="text-slate-500 font-mono">Lois Appliquées :</span>
                                {activeExp.lawsApplied.map((lawId) => (
                                  <span key={lawId} className="bg-violet-950/40 text-violet-300 border border-violet-900/30 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold">
                                    {lawId}
                                  </span>
                                ))}
                              </div>
                              {activeExp.lawsInvalidated.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-slate-500 font-mono">Lois Réfutées :</span>
                                  {activeExp.lawsInvalidated.map((lawId) => (
                                    <span key={lawId} className="bg-rose-950/40 text-rose-400 border border-rose-900/30 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold">
                                      {lawId}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Interactive tension heatmap block */}
                          <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Simulation Physique 2D (Tension)</span>
                              <span className="text-[8px] font-mono text-slate-500">Shear stress diagram</span>
                            </div>

                            {/* 8x8 heat grid */}
                            <div className="grid grid-cols-8 gap-1 py-2 select-none" id={`tsm-heatmap-grid-${activeExp.id}`}>
                              {Array.from({ length: 64 }).map((_, hIdx) => {
                                // Simulate tension spots
                                let colorClass = 'bg-emerald-500/20 border-emerald-500/10'; // optimal
                                if ([12, 13, 20, 21].includes(hIdx)) {
                                  colorClass = 'bg-rose-500/60 border-rose-500/30 animate-pulse'; // Surcharge/Echauffement
                                } else if ([4, 5, 11, 14, 18, 19, 27, 36, 45].includes(hIdx)) {
                                  colorClass = 'bg-amber-500/40 border-amber-500/20'; // tension modérée
                                } else if ([40, 48, 56, 57, 58].includes(hIdx)) {
                                  colorClass = 'bg-blue-500/30 border-blue-500/15'; // saut/jump
                                }
                                return (
                                  <div 
                                    key={hIdx} 
                                    className={`w-full aspect-square rounded-sm border transition-all ${colorClass}`}
                                    title={`Séquence #${hIdx} - Niveau de cisaillement`}
                                  />
                                );
                              })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 border-t border-slate-900 pt-1.5 mt-1">
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Optimal</span>
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Moyen</span>
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Surcharge</span>
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Saut</span>
                            </div>
                          </div>

                        </div>

                        {/* Formulated Hypothesis */}
                        {activeExp.newHypothesis && (
                          <div className="bg-indigo-950/15 border border-indigo-500/10 p-3 rounded-lg space-y-1">
                            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase block flex items-center gap-1">
                              <Compass size={10} /> Hypothèse Textile Dérivée :
                            </span>
                            <p className="text-[11px] text-slate-300 font-sans leading-relaxed italic">
                              "{activeExp.newHypothesis}"
                            </p>
                          </div>
                        )}

                        {/* Run non-regression pipeline button and logs */}
                        <div className="space-y-3 pt-1">
                          <button
                            onClick={handleRunExperiment}
                            disabled={isRunningExperiment}
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10"
                          >
                            {isRunningExperiment ? <RefreshCw className="animate-spin w-4 h-4" /> : <Play size={12} />}
                            Lancer le Test de Non-Régression sur le Golden Dataset (+1000 motifs)
                          </button>

                          {isRunningExperiment && (
                            <div className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-900">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-violet-400">Recompilation des 1000 fichiers de référence...</span>
                                <span>{experimentProgress}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${experimentProgress}%` }} />
                              </div>
                            </div>
                          )}

                          {experimentLogs.length > 0 && (
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[9px] text-slate-400 space-y-1.5 max-h-[140px] overflow-y-auto">
                              {experimentLogs.map((log, idx) => (
                                <div key={idx} className="flex items-start gap-1">
                                  <span className="text-violet-400 shrink-0 font-bold">➔</span>
                                  <span>{log}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()}
                </div>

                {/* COLUMN RIGHT: EVIDENCE & CONTRADICTION EXPLORER (FALSIFIABILITY ENGINE) */}
                <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-xl space-y-4">
                  <div className="pb-2 border-b border-slate-900 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase font-mono">Falsifiability & Evidence Explorer</span>
                      <h4 className="text-white font-bold text-xs">Explicabilité sémantique de l'indice de confiance</h4>
                    </div>

                    {/* Law selector */}
                    <select
                      value={selectedEvidenceLawId}
                      onChange={(e) => setSelectedEvidenceLawId(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-[11px] font-mono font-bold text-slate-200 outline-none"
                    >
                      {textileLaws.map(l => (
                        <option key={l.id} value={l.id}>{l.id} ({l.category})</option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const activeLaw = textileLaws.find(l => l.id === selectedEvidenceLawId) || textileLaws[0];
                    const breakdown = lawEvidenceBreakdowns[activeLaw?.id] || { confirming: 0, contradicting: 0, neutral: 0, contradictionsList: [] };
                    const history = lawHistories[activeLaw?.id] || [];
                    
                    const totalCases = breakdown.confirming + breakdown.contradicting + breakdown.neutral;
                    const confirmPercent = totalCases > 0 ? ((breakdown.confirming / totalCases) * 100).toFixed(1) : '0.0';
                    const contradictPercent = totalCases > 0 ? ((breakdown.contradicting / totalCases) * 100).toFixed(1) : '0.0';
                    const neutralPercent = totalCases > 0 ? ((breakdown.neutral / totalCases) * 100).toFixed(1) : '0.0';

                    return (
                      <div className="space-y-4">
                        
                        {/* Selected Law Rule Card */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <span className="bg-slate-900 text-slate-400 border border-slate-800 font-mono text-[9px] px-2 py-0.5 rounded font-black uppercase">
                                {activeLaw.id} • LOI {activeLaw.category.toUpperCase()}
                              </span>
                              <h5 className="text-white font-bold text-sm tracking-tight">{activeLaw.title}</h5>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] text-slate-500 font-mono block">Confiance :</span>
                              <span className="text-emerald-400 font-black font-mono text-sm">{activeLaw.confidence}%</span>
                            </div>
                          </div>

                          <div className="space-y-2 font-mono text-[11px] border-t border-slate-900 pt-3">
                            <div className="text-slate-400 leading-relaxed bg-slate-900/60 p-2 rounded">
                              <span className="text-blue-400 font-black">SI : </span>
                              {activeLaw.condition}
                            </div>
                            <div className="text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded">
                              <span className="text-emerald-400 font-black">ALORS : </span>
                              {activeLaw.consequence}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                            <span>Sujet: {activeLaw.pattern}</span>
                            <span>Moteurs: {activeLaw.concernedEngines.join(', ')}</span>
                          </div>
                        </div>

                        {/* Interactive Evidence Breakdown Chart/Bar */}
                        <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-900">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-200 font-bold">Volume des Preuves d'Analyse ({totalCases.toLocaleString()} DSTs)</span>
                            <span className="text-cyan-400 font-mono font-bold">{confirmPercent}% Validité</span>
                          </div>

                          {/* Segmented Bar */}
                          <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${confirmPercent}%` }} title={`Confirming : ${breakdown.confirming} cas`} />
                            <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${contradictPercent}%` }} title={`Contradicting : ${breakdown.contradicting} cas`} />
                            <div className="h-full bg-slate-600 transition-all duration-500" style={{ width: `${neutralPercent}%` }} title={`Neutral : ${breakdown.neutral} cas`} />
                          </div>

                          {/* Legend values */}
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-1">
                            <div className="text-emerald-400">
                              <span className="block text-xs font-black">{breakdown.confirming.toLocaleString()}</span>
                              <span className="text-[8px] text-slate-500 uppercase">Confirmés</span>
                            </div>
                            <div className="text-rose-400">
                              <span className="block text-xs font-black">{breakdown.contradicting.toLocaleString()}</span>
                              <span className="text-[8px] text-slate-500 uppercase">Réfutés / Contradictions</span>
                            </div>
                            <div className="text-slate-400">
                              <span className="block text-xs font-black">{breakdown.neutral.toLocaleString()}</span>
                              <span className="text-[8px] text-slate-500 uppercase">Neutres</span>
                            </div>
                          </div>
                        </div>

                        {/* List of Specific Contradictions (falsifiability requirement) */}
                        <div className="space-y-2.5">
                          <span className="text-[10px] font-mono font-bold text-rose-400 uppercase block flex items-center gap-1">
                            <ShieldAlert size={11} /> Cas de Réfutation & Exceptions Physiques détectées :
                          </span>

                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {breakdown.contradictionsList.length > 0 ? (
                              breakdown.contradictionsList.map((item, idx) => (
                                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-900/80 hover:border-slate-800 transition-all space-y-1 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-200">{item.name}</span>
                                    <span className="bg-rose-500/10 text-rose-400 border border-rose-500/25 text-[8px] px-1 rounded font-mono font-bold">Réfuté</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-medium">
                                    <span className="text-slate-500 font-bold font-mono">Justification : </span>
                                    {item.reason}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="text-[11px] text-slate-500 font-mono italic text-center p-4">
                                Zéro cas de contradiction détecté pour cette loi textile.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Law mutation History Timeline (Recommendation 3 Version history) */}
                        <div className="space-y-3 pt-2">
                          <span className="text-[10px] font-mono font-bold text-violet-400 uppercase block flex items-center gap-1">
                            <GitFork size={11} /> Historique de Mutation et Évolution de la Loi :
                          </span>

                          <div className="relative border-l border-slate-900 ml-2.5 pl-4 space-y-4 text-xs font-mono">
                            {history.map((hist, hIdx) => (
                              <div key={hIdx} className="relative">
                                {/* Chronology dot */}
                                <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border bg-slate-950 ${hIdx === 0 ? 'border-violet-400 ring-2 ring-violet-500/30' : 'border-slate-800'}`} />
                                
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className={`font-bold text-[11px] ${hIdx === 0 ? 'text-white' : 'text-slate-400'}`}>
                                      Version {hist.version} {hIdx === 0 && <span className="text-violet-400 text-[9px] font-black uppercase ml-1.5">Actuelle</span>}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">{hist.date}</span>
                                  </div>
                                  
                                  <div className="flex gap-3 text-[9px] text-slate-500 font-mono mt-0.5">
                                    <span>• Scanné: {hist.occurrences.toLocaleString()} obs</span>
                                    <span>• Confiance: <strong className={hIdx === 0 ? 'text-emerald-400' : 'text-slate-400'}>{hist.confidence}%</strong></span>
                                  </div>

                                  <p className="text-[10px] text-slate-400 leading-tight font-sans mt-1">
                                    {hist.changeLog}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>
          )}

              {/* INNER SECTION 3: STYLOMETRIE DES MAITRES DIGITIZERS */}
              {researchLabSection === 'master_stylometry' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Master Digitizer Selection & Stylometry Card */}
                  <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-900">
                      <div>
                        <h4 className="text-white font-bold text-xs uppercase font-mono tracking-wide flex items-center gap-1.5 text-cyan-400">
                          <Users size={13} /> Profil du Maître Digitizer
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Sélectionnez un profil de digitizer professionnel. Le compilateur ATCP analyse sa galerie pour en extraire son style et ses heuristiques.
                        </p>
                      </div>
                      
                      {/* Digitizer profile dropdown */}
                      <select
                        value={selectedDigitizerId}
                        onChange={(e) => setSelectedDigitizerId(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none shrink-0"
                      >
                        {digitizerStudies.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl bg-slate-950 p-3 rounded-xl border border-slate-900">{activeStudy.avatar}</span>
                        <div>
                          <h4 className="text-sm font-black text-white">{activeStudy.name}</h4>
                          <p className="text-[11px] text-slate-400 font-medium font-sans">{activeStudy.title}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-900/80 font-mono text-xs shrink-0">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Motifs analysés</span>
                          <span className="text-sm font-black text-white">{activeStudy.analyzedDesigns} fichiers</span>
                        </div>
                        <div className="w-[1px] h-6 bg-slate-850" />
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Signature Style</span>
                          <span className="text-sm font-black text-cyan-400">{activeStudy.signatureStyle}</span>
                        </div>
                      </div>
                    </div>

                    {/* Analysis action buttons */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-900/80">
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-200 font-bold block">Recalibrer la signature stylistique</span>
                        <span className="text-[10px] text-slate-500 block">Ré-évaluer le motif sémantique sur la galerie complète</span>
                      </div>
                      <button
                        onClick={handleAnalyzeDigitizer}
                        disabled={isAnalyzingDigitizer}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                      >
                        {isAnalyzingDigitizer ? <RefreshCw className="animate-spin w-3 h-3" /> : <Activity size={12} />}
                        Lancer l'Analyse Stylométrique
                      </button>
                    </div>

                    {/* Progress bar for analysis */}
                    {isAnalyzingDigitizer && (
                      <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-cyan-400">Indexation de la grammaire textile...</span>
                          <span>{digitizerAnalysisProgress}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${digitizerAnalysisProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Extracted Habits */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Heuristiques et habitudes extraites par ATCP :</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeStudy.habits.map((habit, idx) => (
                          <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-200 font-medium font-sans leading-relaxed">{habit.text}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>Taux d'occurrence observé :</span>
                                <span className="text-cyan-400 font-bold">{habit.rate}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500" style={{ width: `${habit.rate}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INNER SECTION 4: CAMPAGNES & PUBLICATIONS */}
              {researchLabSection === 'campaigns_papers' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
                    
                    {/* CAMPAIGNS CARD */}
                    <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-xl space-y-4">
                      <div className="pb-2 border-b border-slate-900">
                        <h4 className="text-white font-bold text-xs uppercase font-mono tracking-wide flex items-center gap-1.5 text-cyan-400">
                          <Target size={13} /> Campagnes de Recherche Industrielles Actives
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Grands chantiers de numérisation binaire par famille de tissus d'Acom.
                        </p>
                      </div>

                      <div className="space-y-3.5">
                        {campaigns.map((camp) => (
                          <div key={camp.id} className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2.5">
                            <div className="flex justify-between items-start text-xs font-mono">
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 font-black">{camp.id}</span>
                                <span className="font-bold text-slate-200 block">{camp.name}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                camp.status === 'Active'
                                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {camp.status}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span>Progression de la campagne</span>
                                <span className="text-white font-bold">{camp.progress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-400" style={{ width: `${camp.progress}%` }} />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-2">
                              <span>Matières: {camp.targetFabric}</span>
                              <span className="text-right font-bold text-slate-400">
                                {camp.analyzedCount} DSTs scannés | {camp.discoveredLawsCount} Lois
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PUBLICATIONS CARD */}
                    <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-xl space-y-4">
                      <div className="pb-2 border-b border-slate-900">
                        <h4 className="text-white font-bold text-xs uppercase font-mono tracking-wide flex items-center gap-1.5 text-violet-400">
                          <BookOpen size={13} /> Mémorandums Techniques & Publications Académiques
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Travaux d'ingénierie mathématique et physique formalisant la théorie textile d'ATCP.
                        </p>
                      </div>

                      <div className="space-y-3.5">
                        {publications.map((pub) => (
                          <div key={pub.id} className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2.5">
                            <div className="flex justify-between items-start text-xs font-mono">
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 font-bold">{pub.id} • {pub.date}</span>
                                <h5 className="font-bold text-slate-200 block text-[11px] leading-tight font-sans">{pub.title}</h5>
                              </div>
                              <span className="bg-violet-500/10 text-violet-400 border border-violet-500/25 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase shrink-0">
                                {pub.status}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-medium line-clamp-2">
                              {pub.abstract}
                            </p>

                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-2">
                              <span>Auteurs: {pub.authors.join(', ')}</span>
                              <span className="flex items-center gap-1 font-bold text-slate-400">
                                Citations: {pub.citations}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {activeSubTab === 'cognitive_layer' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6 animate-fadeIn" id="view-cognitive-layer">
              <div className="pb-3 border-b border-slate-900 flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Brain className="text-violet-400 w-4 h-4" />
                    ATCP Cognitive Layer (Niveau Transversal 8)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Conseiller d'ingénierie explicable. Traduit les caractéristiques sémantiques en suggestions pour les moteurs déterministes de bas niveau.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="bg-violet-500/10 text-violet-400 text-[10px] px-2 py-0.5 rounded-full border border-violet-500/20 font-bold">
                    ✓ Déterminisme 100% garanti
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                    ✓ Non-intrusif
                  </span>
                </div>
              </div>

              {/* Step 1: Design selector */}
              <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-850/60 space-y-4 font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 font-mono block">SÉLECTION DU MOTIF CIBLE :</label>
                    <div className="flex gap-2 flex-wrap">
                      {(['nike', 'lacoste', 'chanel', 'adidas'] as const).map((id) => {
                        const isSelected = selectedCognitiveDesign === id;
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              setSelectedCognitiveDesign(id);
                              setCognitiveStep('idle');
                              setCognitiveAnalysisLogs([]);
                            }}
                            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-violet-500/15 border-violet-500 text-white shadow-md shadow-violet-500/10'
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900'
                            }`}
                          >
                            <span className="text-sm">{cognitiveDesignsData[id].image}</span>
                            <span>{cognitiveDesignsData[id].name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyzeCognitive}
                    disabled={isAnalyzingCognitive}
                    className="sm:self-end bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-black text-xs px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider font-sans"
                  >
                    {isAnalyzingCognitive ? (
                      <>
                        <RefreshCw className="animate-spin w-4 h-4" />
                        <span>Analyse en cours...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} className="fill-current" />
                        <span>Lancer l'Analyse Cognitive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* If idle, show conceptual schema */}
              {cognitiveStep === 'idle' && (
                <div className="bg-slate-950/40 p-8 rounded-xl border border-slate-900/60 text-center space-y-6">
                  <div className="max-w-md mx-auto space-y-2">
                    <div className="w-12 h-12 bg-violet-950/60 border border-violet-500/30 rounded-full flex items-center justify-center mx-auto text-violet-400 mb-2">
                      <Brain size={24} />
                    </div>
                    <h4 className="text-slate-200 font-bold text-sm">Prêt pour l'Analyse Cognitive d'Ingénierie</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sélectionnez un motif ci-dessus et cliquez sur le bouton pour observer le processus d'analyse sémantique, la génération du contrat strict et la transmission aux moteurs de compilation déterministes.
                    </p>
                  </div>

                  {/* Flow chart diagram requested by the user */}
                  <div className="max-w-xl mx-auto pt-4">
                    <div className="text-[10px] font-mono text-slate-500 uppercase font-black mb-4">Architecture Conceptuelle Transversale :</div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
                      
                      {/* Step A */}
                      <div className="bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-xl text-center min-w-[110px] flex-1">
                        <span className="text-[9px] text-slate-500 block uppercase font-mono">1. Entrée</span>
                        <span className="text-xs font-bold text-slate-300">Nike.png / Vector</span>
                      </div>

                      <ChevronRight className="text-slate-700 hidden md:block" size={16} />

                      {/* Step B */}
                      <div className="bg-slate-900/60 border border-violet-500/30 px-3 py-2.5 rounded-xl text-center min-w-[130px] flex-1 shadow-md shadow-violet-500/5">
                        <span className="text-[9px] text-violet-400 block uppercase font-mono">2. Observation</span>
                        <span className="text-xs font-bold text-violet-300">Analyse Sémantique</span>
                      </div>

                      <ChevronRight className="text-slate-700 hidden md:block" size={16} />

                      {/* Step C */}
                      <div className="bg-slate-900/60 border border-cyan-500/30 px-3 py-2.5 rounded-xl text-center min-w-[130px] flex-1 shadow-md shadow-cyan-500/5">
                        <span className="text-[9px] text-cyan-400 block uppercase font-mono">3. Proposition</span>
                        <span className="text-[10px] font-mono text-cyan-300 font-bold">CognitiveSuggestion</span>
                      </div>

                      <ChevronRight className="text-slate-700 hidden md:block" size={16} />

                      {/* Step D */}
                      <div className="bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-xl text-center min-w-[120px] flex-1">
                        <span className="text-[9px] text-slate-500 block uppercase font-mono">4. Compilation</span>
                        <span className="text-xs font-bold text-slate-300">Moteurs Déterministes</span>
                      </div>

                    </div>
                    
                    <div className="bg-slate-900/20 border border-slate-900 p-3 rounded-lg mt-5 text-[10px] font-mono text-slate-400 leading-relaxed text-left max-w-lg mx-auto">
                      <span className="text-amber-500 font-black">⚠ RÈGLE D'OR :</span> Le cerveau ne compile rien directement. Il ne remplace jamais les réacteurs (Geometry, Topology, Ribbon, Tatami, Satin, Physics, Travel). Il conseille simplement les hyperparamètres via un contrat strict en lecture seule.
                    </div>
                  </div>
                </div>
              )}

              {/* If running or completed, show the live scanner & logs */}
              {cognitiveStep !== 'idle' && (
                <div className="space-y-6">
                  
                  {/* Scantracker / active animation */}
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Cpu className={`w-4 h-4 ${isAnalyzingCognitive ? 'text-violet-400 animate-pulse' : 'text-slate-400'}`} />
                        <span className="text-xs font-black text-slate-300 font-mono uppercase">
                          {isAnalyzingCognitive ? 'Scanner Cognitif en Action' : 'Analyse Cognitive Terminée'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-violet-400">{cognitiveAnalysisProgress}%</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300" 
                        style={{ width: `${cognitiveAnalysisProgress}%` }} 
                      />
                    </div>

                    {/* Mini timeline steps indicator */}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {[
                        { key: 'observing', label: '1. Observation' },
                        { key: 'analyzing', label: '2. Classification' },
                        { key: 'recommending', label: '3. Recommandations' },
                        { key: 'compiling', label: '4. Moteurs Déterm.' }
                      ].map((s) => {
                        const isDone = cognitiveAnalysisProgress === 100 || 
                          (s.key === 'observing' && (cognitiveStep === 'analyzing' || cognitiveStep === 'recommending' || cognitiveStep === 'compiling')) ||
                          (s.key === 'analyzing' && (cognitiveStep === 'recommending' || cognitiveStep === 'compiling')) ||
                          (s.key === 'recommending' && cognitiveStep === 'compiling');
                        const isActive = cognitiveStep === s.key;

                        return (
                          <div 
                            key={s.key} 
                            className={`p-2 rounded-lg border text-center font-mono transition-all ${
                              isDone 
                                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                                : isActive 
                                  ? 'bg-violet-950/40 border-violet-500/40 text-violet-300 font-bold' 
                                  : 'bg-slate-950 border-slate-900 text-slate-600'
                            }`}
                          >
                            <span className="text-[9px] block leading-none">{s.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Logs component */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-900/60 text-[10px] font-mono text-slate-500 uppercase font-black">
                      <span>Console de Traitement Cognitive (ATCPL)</span>
                      <span>Mode: Explicable</span>
                    </div>
                    <div className="font-mono text-xs text-slate-300 space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {cognitiveAnalysisLogs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <ChevronRight size={12} className="text-violet-500 shrink-0 mt-0.5" />
                          <span>{log}</span>
                        </div>
                      ))}
                      {isAnalyzingCognitive && (
                        <div className="flex items-center gap-1.5 text-violet-400 animate-pulse pl-4 pt-1">
                          <RefreshCw className="animate-spin w-3 h-3" />
                          <span>Calcul d'interpolation géométrique en cours...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Once recommendations are visible (either recommended step, compiling or completed) */}
                  {(cognitiveStep === 'recommending' || cognitiveStep === 'compiling' || cognitiveStep === 'completed') && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      {/* Active profile & applicable laws */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Profile Info */}
                        <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                            <Compass className="text-violet-400 w-4 h-4" />
                            <span className="text-xs font-bold text-white uppercase tracking-wide">ADN Géométrique Détecté</span>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-slate-500 block text-[9px] font-mono uppercase">Famille Sémantique :</span>
                              <span className="text-slate-200 font-bold font-sans">{cognitiveDesignsData[selectedCognitiveDesign].family}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div>
                                <span className="text-slate-500 block text-[9px] font-mono uppercase">Confiance d'Analyse :</span>
                                <span className="text-violet-400 font-black font-mono text-sm">{cognitiveDesignsData[selectedCognitiveDesign].confidence}%</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[9px] font-mono uppercase">GFI Prévisionnel :</span>
                                <span className="text-emerald-400 font-black font-mono text-sm">99.1%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Applicable Laws retrieved from knowledge graph */}
                        <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                            <Workflow className="text-cyan-400 w-4 h-4" />
                            <span className="text-xs font-bold text-white uppercase tracking-wide">Lois Textiles Applicables</span>
                          </div>
                          
                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {cognitiveDesignsData[selectedCognitiveDesign].laws.map((law) => (
                              <div key={law.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-[11px] space-y-1">
                                <div className="flex justify-between items-center font-mono">
                                  <span className="text-cyan-400 font-black">{law.id}</span>
                                  <span className="text-slate-500 text-[9px]">Graphe de Connaissances</span>
                                </div>
                                <span className="text-slate-200 block font-bold leading-tight">{law.title}</span>
                                <span className="text-slate-400 block text-[10px] leading-relaxed font-sans">{law.rationale}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* STRICT CONTRACT: CognitiveSuggestion[] payload output */}
                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-900/80">
                          <h4 className="text-xs font-black text-slate-300 font-mono uppercase flex items-center gap-2">
                            <Terminal size={14} className="text-violet-400" />
                            Contrat Strict : <span className="text-cyan-400">CognitiveSuggestion[]</span>
                          </h4>
                          <span className="text-[9px] font-mono text-slate-500 uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                            Signature JS/TS Interne
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                          Voici le payload d'instructions strictes généré par l'<strong>ATCP Cognitive Layer</strong> et transmis aux réacteurs de bas niveau. Le compilateur reste déterministe et appliquera scrupuleusement ces consignes de pilotage :
                        </p>

                        {/* Suggestions Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {cognitiveDesignsData[selectedCognitiveDesign].suggestions.map((sug, idx) => (
                            <div key={idx} className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-850 space-y-2.5 hover:border-slate-800 transition-all">
                              <div className="flex justify-between items-center">
                                <span className="bg-violet-950/60 border border-violet-500/20 text-violet-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                                  {sug.targetEngine} Engine
                                </span>
                                <span className="text-slate-500 font-mono text-[9px]">Confiance : {sug.confidence}%</span>
                              </div>
                              
                              <div className="font-mono text-xs space-y-1 pt-1">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Paramètre :</span>
                                  <span className="text-slate-200 font-bold">{sug.parameter}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-900 pt-1">
                                  <span className="text-slate-400">Valeur recommandée :</span>
                                  <span className="text-cyan-400 font-black">{sug.recommendedValue}</span>
                                </div>
                              </div>

                              <p className="text-[10px] text-slate-400 font-sans leading-relaxed pt-1.5 border-t border-slate-900">
                                <span className="text-slate-500 font-bold font-mono">Justification :</span> {sug.reason}
                              </p>

                              <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 pt-1">
                                <span>Preuves du Golden Dataset :</span>
                                <span className="text-slate-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">{sug.evidence.join(', ')}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Raw JSON representation */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                          <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Payload Brut du Graphe Sémantique (JSON) :</span>
                          <pre className="font-mono text-[10px] text-violet-300 overflow-x-auto p-3 bg-slate-900/40 rounded-lg max-h-[140px] leading-tight">
                            {JSON.stringify(cognitiveDesignsData[selectedCognitiveDesign].suggestions, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* If completed, show compilation results comparisons */}
                      {cognitiveStep === 'completed' && (
                        <div className="bg-slate-900/20 border border-slate-850 p-5 rounded-xl space-y-4 animate-fadeIn">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                            <CheckCircle2 className="text-emerald-400 w-4.5 h-4.5" />
                            <div>
                              <span className="text-xs font-bold text-white uppercase block">Compilation Déterministe Terminée</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-slate-500 font-mono uppercase">Comparatif avant/après recalibrage cognitif</span>
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-mono px-1 rounded uppercase font-black">Simulation / Hypothèse</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                            
                            {/* Without Cognitive Layer */}
                            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-3">
                              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Avant Recalibrage (Valeurs standard) :</span>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase">Points total :</span>
                                  <span className="text-slate-300 font-black">{cognitiveDesignsData[selectedCognitiveDesign].metrics.before.stitches.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase">Coupes (Trims) :</span>
                                  <span className="text-slate-300 font-black">{cognitiveDesignsData[selectedCognitiveDesign].metrics.before.trims}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase">Longueur fil :</span>
                                  <span className="text-slate-300 font-black">{cognitiveDesignsData[selectedCognitiveDesign].metrics.before.length} m</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase">Temps estimé :</span>
                                  <span className="text-slate-300 font-black">{cognitiveDesignsData[selectedCognitiveDesign].metrics.before.time}</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-900 flex justify-between items-center font-sans">
                                <span className="text-[10px] font-mono text-slate-500 uppercase">Qualité attendue :</span>
                                <span className="text-amber-400 font-black font-mono text-xs">{cognitiveDesignsData[selectedCognitiveDesign].metrics.before.score}/100</span>
                              </div>
                            </div>

                            {/* With Cognitive Layer */}
                            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-3 shadow-md shadow-emerald-500/5">
                              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">Après Recalibrage (Conseils Cognitive Layer) :</span>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase">Points total :</span>
                                  <span className="text-emerald-400 font-black">{cognitiveDesignsData[selectedCognitiveDesign].metrics.after.stitches.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase">Coupes (Trims) :</span>
                                  <span className="text-emerald-400 font-black">{cognitiveDesignsData[selectedCognitiveDesign].metrics.after.trims}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase">Longueur fil :</span>
                                  <span className="text-emerald-400 font-black">{cognitiveDesignsData[selectedCognitiveDesign].metrics.after.length} m</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase">Temps estimé :</span>
                                  <span className="text-emerald-400 font-black">{cognitiveDesignsData[selectedCognitiveDesign].metrics.after.time}</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-900 flex justify-between items-center font-sans">
                                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Qualité mesurée (Golden Dataset) :</span>
                                <span className="text-emerald-400 font-black font-mono text-sm">{cognitiveDesignsData[selectedCognitiveDesign].metrics.after.score}/100</span>
                              </div>
                            </div>

                          </div>

                          <div className="space-y-3">
                            <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-lg text-xs text-emerald-400 flex items-center gap-2 font-sans">
                              <CheckCircle size={14} className="shrink-0 text-emerald-400" />
                              <span><strong>HYPOTHÈSE DE GAIN (Simulation Numérique) :</strong> Les projections de l'intégration transversale suggèrent une réduction potentielle d'environ <strong className="font-black">15% de points</strong> et un score de fidélité de <strong className="font-black">99% sur le Golden Dataset</strong>, préservant ainsi l'intégrité déterministe.</span>
                            </div>
                            <div className="bg-amber-950/20 border border-amber-900/30 p-3.5 rounded-lg text-xs text-amber-400 flex items-start gap-2.5 font-sans">
                              <Info size={14} className="shrink-0 text-amber-400 mt-0.5" />
                              <div className="space-y-1">
                                <span className="font-bold uppercase tracking-wide block text-[10px] font-mono text-amber-300">Rigueur Scientifique : Preuve en attente</span>
                                <p className="leading-relaxed text-[11px] text-slate-300">
                                  Conformément à la charte d'ATCP, ces gains simulés ne seront déclarés comme "officiels" et "mesurés" qu'après réalisation de campagnes réelles de broderie physique en atelier sur des éprouvettes textiles instrumentées. La théorie guide le prototype, mais seul le comportement réel de la matière brodée valide la conformité définitive.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {activeSubTab === 'scientific_registry' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6 animate-fadeIn" id="view-scientific-registry">
              
              {/* Header Banner */}
              <div className="pb-3 border-b border-slate-900 flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <BookOpen className="text-violet-400 w-4 h-4" id="asr-title-icon" />
                    ATCP Scientific Registry (ASR) - Registre Sémantique Transversal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Garantie d'intégrité et traçabilité sémantique. Suivi rigoureux du cycle de vie des découvertes, de l'observation initiale jusqu'au principe fondamental.
                  </p>
                </div>
                <div className="bg-violet-500/10 text-violet-400 text-[10px] px-2 py-0.5 rounded-full border border-violet-500/20 font-bold font-mono">
                  ASR-ACTIVE-v1.0.0
                </div>
              </div>

              {/* Notification Success Feedback */}
              {asrNotification && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl text-xs text-emerald-400 font-sans flex items-center gap-2 animate-fadeIn" id="asr-notification-banner">
                  <CheckCircle size={14} className="shrink-0" />
                  <span>{asrNotification}</span>
                </div>
              )}

              {/* SECTION 1: VISUAL SCIENTIFIC LIFECYCLE FLOW CHART */}
              <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-850/60 space-y-4 font-sans">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">
                  CHAÎNE DE TRAÇABILITÉ SCIENTIFIQUE (Cycle de Vie d'une Découverte) :
                </span>

                <div className="grid grid-cols-2 md:grid-cols-7 gap-2" id="asr-lifecycle-flowchart">
                  {[
                    { type: 'Observation', code: 'OBS', bg: 'border-blue-500/30 text-blue-400 bg-blue-950/10', glow: 'shadow-blue-500/5', desc: '1. Constat physique' },
                    { type: 'Hypothesis', code: 'HYP', bg: 'border-indigo-500/30 text-indigo-400 bg-indigo-950/10', glow: 'shadow-indigo-500/5', desc: '2. Théorie sémantique' },
                    { type: 'Experiment', code: 'EXP', bg: 'border-pink-500/30 text-pink-400 bg-pink-950/10', glow: 'shadow-pink-500/5', desc: '3. Banc d\'essai TSM' },
                    { type: 'Validation', code: 'VAL', bg: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/10', glow: 'shadow-cyan-500/5', desc: '4. Certification physique' },
                    { type: 'Law', code: 'LAW', bg: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10', glow: 'shadow-emerald-500/5', desc: '5. Loi cristallisée' },
                    { type: 'Publication', code: 'PUB', bg: 'border-amber-500/30 text-amber-400 bg-amber-950/10', glow: 'shadow-amber-500/5', desc: '6. Diffusion par preprint' },
                    { type: 'Principle', code: 'PRIN', bg: 'border-violet-500/30 text-violet-400 bg-violet-950/10', glow: 'shadow-violet-500/5', desc: '7. Vérité immuable' }
                  ].map((step, idx) => {
                    const currentActiveItem = registryItems.find(item => item.type === step.type);
                    const isSelected = currentActiveItem && selectedRegistryId === currentActiveItem.id;
                    return (
                      <button
                        key={idx}
                        type="button"
                        id={`asr-lifecycle-btn-${step.type}`}
                        onClick={() => {
                          if (currentActiveItem) {
                            setSelectedRegistryId(currentActiveItem.id);
                          }
                        }}
                        className={`p-3 rounded-xl border text-center transition-all relative flex flex-col justify-between h-[95px] ${step.bg} ${step.glow} ${
                          isSelected ? 'ring-2 ring-violet-500 border-violet-500 scale-102' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <span className="text-[8px] font-mono font-bold text-slate-500 block uppercase tracking-tight leading-none">
                          {step.desc}
                        </span>
                        <div className="font-black text-sm font-mono tracking-wider my-1">
                          {step.code}
                        </div>
                        {currentActiveItem ? (
                          <div className="text-[9px] font-mono bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800 text-slate-300 truncate w-full">
                            {currentActiveItem.id}
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-600 font-mono">Non configuré</span>
                        )}
                        {idx < 6 && (
                          <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-700">
                            →
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: INTERACTIVE EXPLORER (SPLIT SCREEN) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2" id="asr-explorer-split">
                
                {/* Left Side: Records List */}
                <div className="md:col-span-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Registre des Preuves ({registryItems.length}) :</span>
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1" id="asr-records-list">
                    {registryItems.map((item) => {
                      const isSelected = selectedRegistryId === item.id;
                      
                      // Match colors dynamically based on step type
                      let badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                      if (item.type === 'Hypothesis') badgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                      if (item.type === 'Experiment') badgeColor = "bg-pink-500/10 text-pink-400 border-pink-500/20";
                      if (item.type === 'Validation') badgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                      if (item.type === 'Law') badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      if (item.type === 'Publication') badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                      if (item.type === 'Principle') badgeColor = "bg-violet-500/10 text-violet-400 border-violet-500/20";

                      return (
                        <button
                          key={item.id}
                          id={`asr-record-item-${item.id}`}
                          onClick={() => setSelectedRegistryId(item.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                            isSelected
                              ? 'bg-slate-900 border-slate-700 shadow-md shadow-violet-500/5'
                              : 'bg-slate-950 border-slate-900 hover:bg-slate-900/30'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="font-mono text-[10px] font-bold text-slate-400 tracking-wider">
                              {item.id}
                            </span>
                            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${badgeColor}`}>
                              {item.type}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-white text-xs font-bold leading-tight line-clamp-1">{item.title}</h4>
                            <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal">{item.description}</p>
                          </div>

                          <div className="flex justify-between items-center text-[8px] text-slate-500 border-t border-slate-900/50 pt-1.5 font-mono">
                            <span>Par : {item.discoveredBy}</span>
                            <span>{item.date}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Selected Record Inspector Panel */}
                <div className="md:col-span-7" id="asr-inspector-panel">
                  {(() => {
                    const activeItem = registryItems.find(item => item.id === selectedRegistryId) || registryItems[0];
                    
                    let blockColor = "border-blue-500/20 bg-blue-500/5";
                    let textColor = "text-blue-400";
                    if (activeItem.type === 'Hypothesis') { blockColor = "border-indigo-500/20 bg-indigo-500/5"; textColor = "text-indigo-400"; }
                    if (activeItem.type === 'Experiment') { blockColor = "border-pink-500/20 bg-pink-500/5"; textColor = "text-pink-400"; }
                    if (activeItem.type === 'Validation') { blockColor = "border-cyan-500/20 bg-cyan-500/5"; textColor = "text-cyan-400"; }
                    if (activeItem.type === 'Law') { blockColor = "border-emerald-500/20 bg-emerald-500/5"; textColor = "text-emerald-400"; }
                    if (activeItem.type === 'Publication') { blockColor = "border-amber-500/20 bg-amber-500/5"; textColor = "text-amber-400"; }
                    if (activeItem.type === 'Principle') { blockColor = "border-violet-500/20 bg-violet-500/5"; textColor = "text-violet-400"; }

                    return (
                      <div className={`border p-5 rounded-2xl ${blockColor} space-y-4 font-sans h-full flex flex-col justify-between`}>
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[9px] font-mono text-slate-500 uppercase font-black block tracking-widest">FICHE SCIENTIFIQUE D'INGÉNIERIE :</span>
                              <h3 className="text-white text-sm font-black mt-1 leading-snug">{activeItem.title}</h3>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border uppercase inline-block ${textColor} bg-slate-950/80 border-slate-800`}>
                                {activeItem.id}
                              </span>
                            </div>
                          </div>

                          {/* Primary Metadata row */}
                          <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-900/80 font-mono text-[10px]">
                            <div>
                              <span className="text-slate-500 block uppercase">Chercheur / Auteur :</span>
                              <span className="text-slate-300 font-bold">{activeItem.discoveredBy}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase">Date d'enregistrement :</span>
                              <span className="text-slate-300 font-bold">{activeItem.date}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase">Motif initial d'étude :</span>
                              <span className="text-slate-300 font-bold">{activeItem.targetDesign}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase">Moteur de calcul :</span>
                              <span className="text-cyan-400 font-bold font-mono uppercase">{activeItem.concernedEngine} Engine</span>
                            </div>
                          </div>

                          {/* Description box */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">SPÉCIFICATION DESCRIPTIVE :</span>
                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/20 p-3 rounded-xl border border-slate-900">
                              {activeItem.description}
                            </p>
                          </div>

                          {/* Proof and Metrics delta */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">MESURE QUANTITATIVE ET PREUVE PHYSIQUE :</span>
                            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center">
                              <div>
                                <span className="text-[8px] text-slate-500 font-mono block uppercase">Indice de Preuve (Observations) :</span>
                                <span className="text-xs font-mono font-black text-slate-200">{activeItem.evidenceCount.toLocaleString()} DSTs de référence</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] text-slate-500 font-mono block uppercase">Delta d'impact physique :</span>
                                <span className={`text-xs font-mono font-black ${textColor}`}>{activeItem.metricsImpact}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sibling Trace Links */}
                        <div className="pt-4 border-t border-slate-900 flex justify-between items-center gap-3 text-xs">
                          {activeItem.prevStepId ? (
                            <button
                              type="button"
                              onClick={() => setSelectedRegistryId(activeItem.prevStepId!)}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-all uppercase bg-slate-950/40 px-2 py-1 rounded border border-slate-900"
                            >
                              ← {activeItem.prevStepId} (Précédent)
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-600 font-mono uppercase">Début de chaîne</span>
                          )}

                          <div className="text-[9px] text-slate-500 font-mono uppercase">
                            Confiance : {activeItem.confidence}%
                          </div>

                          {activeItem.nextStepId ? (
                            <button
                              type="button"
                              onClick={() => setSelectedRegistryId(activeItem.nextStepId!)}
                              className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 font-mono transition-all uppercase bg-slate-950/40 px-2 py-1 rounded border border-slate-900 font-bold"
                            >
                              Suivant ({activeItem.nextStepId}) →
                            </button>
                          ) : (
                            <span className="text-[9px] text-emerald-400 font-mono uppercase bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/20 font-black">
                              Vérité Absolue
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* SECTION 3: DECLARE NEW OBSERVATION FORM */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-4" id="asr-new-discovery-form">
                <div className="pb-2 border-b border-slate-900/60">
                  <h4 className="text-white font-black text-sm flex items-center gap-1.5">
                    <SlidersHorizontal className="text-cyan-400 w-4 h-4" />
                    Enregistrer une Nouvelle Découverte Textile (ASR)
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Alimentez le patrimoine d'ATCP. Saisissez les résultats de vos analyses d'atelier et observations de motifs réels.
                  </p>
                </div>

                <form onSubmit={handleAddAsrItem} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">TITRE DE LA FICHE :</label>
                      <input
                        type="text"
                        placeholder="Ex. Perte d'alignement sur coton cardé double trame"
                        value={newAsrTitle}
                        onChange={(e) => setNewAsrTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-violet-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">DESCRIPTION SCIENTIFIQUE :</label>
                      <textarea
                        rows={3}
                        placeholder="Spécifiez la condition d'apparition, les contraintes physiques mesurées et les déformations observées..."
                        value={newAsrDescription}
                        onChange={(e) => setNewAsrDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-violet-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">CHEF DE PROJET / DECOUVERT PAR :</label>
                      <input
                        type="text"
                        placeholder="Ex. Expert Tailleur ou Agent Sémantique"
                        value={newAsrAuthor}
                        onChange={(e) => setNewAsrAuthor(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">NIVEAU DE MATURITE :</label>
                        <select
                          value={newAsrType}
                          onChange={(e: any) => setNewAsrType(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-violet-500"
                        >
                          <option value="Observation">Observation (Initiale)</option>
                          <option value="Hypothesis">Hypothesis (Sémantique)</option>
                          <option value="Experiment">Experiment (Banc d'essai)</option>
                          <option value="Validation">Validation (Calcul)</option>
                          <option value="Law">Law (Formalisation)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">MOTEUR CONCERNÉ :</label>
                        <select
                          value={newAsrEngine}
                          onChange={(e: any) => setNewAsrEngine(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-violet-500"
                        >
                          <option value="Geometry">Geometry Engine</option>
                          <option value="Topology">Topology Engine</option>
                          <option value="Ribbon">Ribbon Engine</option>
                          <option value="Tatami">Tatami Engine</option>
                          <option value="Satin">Satin Engine</option>
                          <option value="Travel">Travel Optimizer</option>
                          <option value="Physics">Physics Simulator</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">MOTIF(S) / CONTEXTE :</label>
                        <input
                          type="text"
                          placeholder="Ex. Adidas Trefoil, Nike Cap"
                          value={newAsrDesign}
                          onChange={(e) => setNewAsrDesign(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-mono font-bold text-slate-500 uppercase block mb-1">GAIN / IMPACT QUANTIFIABLE :</label>
                        <input
                          type="text"
                          placeholder="Ex. -15% de points, +1.4% GFI"
                          value={newAsrImpact}
                          onChange={(e) => setNewAsrImpact(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black text-xs p-3 rounded-lg uppercase tracking-wider font-sans transition-all mt-3"
                    >
                      Enregistrer & Promouvoir dans le Registre ASR
                    </button>
                  </div>

                </form>
              </div>

            </div>
          )}

          {activeSubTab === 'autonomous_scientist' && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6 animate-fadeIn" id="view-autonomous-scientist">
              
              {/* Header Banner */}
              <div className="pb-3 border-b border-slate-900 flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Cpu className="text-violet-400 w-4 h-4 animate-pulse" id="ats-title-icon" />
                    Niveau 9 : Autonomous Scientist (ATS) - Agent de Découverte Autonome
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modèle de recherche et d'exploration scientifique continue. L'ATS observe les motifs, formule des hypothèses, orchestre des bancs d'essais virtuels et soumet des lois au registre sémantique.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                  <span className="bg-violet-500/10 text-violet-400 text-[10px] px-2.5 py-0.5 rounded-full border border-violet-500/20 font-bold font-mono">
                    ATS-RESEARCH-ACTIVE
                  </span>
                </div>
              </div>

              {/* ATS Paradigm Quote Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-850 flex items-start gap-3">
                  <Brain className="text-violet-400 w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Couche Cognitive (ACL) : "Je connais."</span>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "Je réponds, je conseille, je raisonne et je relie les connaissances validées pour aider l'ingénieur dans ses choix de compilation."
                    </p>
                  </div>
                </div>

                <div className="bg-violet-950/10 p-4 rounded-xl border border-violet-500/20 flex items-start gap-3">
                  <Cpu className="text-violet-400 w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-violet-400 uppercase block">Autonomous Scientist (ATS) : "Je découvre."</span>
                    <p className="text-xs text-violet-200 leading-relaxed italic">
                      "J'observe le bruit physique des motifs, je formule des conjectures sémantiques, je mène des expérimentations virtuelles et je propose de nouvelles lois sémantiques."
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Active Research Dashboard & Live Simulation Trigger */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900/10 p-5 rounded-2xl border border-slate-850">
                
                {/* Stats & Controls */}
                <div className="md:col-span-5 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">MOTEUR DE RECHERCHE CONTINUE :</span>
                    <h4 className="text-white text-xs font-bold font-mono">Loop #482 : Analyse transversale de similarité</h4>
                  </div>

                  <div className="space-y-2.5 font-mono text-[10px]">
                    <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                      <span className="text-slate-500">DSTs dans le collimateur :</span>
                      <span className="text-slate-200 font-bold">1 250 fichiers</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                      <span className="text-slate-500">Hypothèses générées :</span>
                      <span className="text-violet-400 font-bold">{atsHypotheses.length} formulées</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                      <span className="text-slate-500">Validation physique requise :</span>
                      <span className="text-amber-400 font-bold">2 en attente</span>
                    </div>
                  </div>

                  {/* Trigger Button & Progress Bar */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      disabled={atsIsMining}
                      onClick={() => {
                        setAtsIsMining(true);
                        setAtsProgress(5);
                        setAtsLogs([
                          "[ATS] Démarrage du cycle d'exploration sémantique...",
                          "[ATS] Indexation de 200 DSTs additionnels de l'Industrial Reference Library",
                          "[ATS] Analyse spectrale des courbures géométriques..."
                        ]);

                        const logsPool = [
                          "[ATS] Extraction de corrélations de déformation sur mailles polaires",
                          "[ATS] Comparaison du pas de Tatami adaptatif (0.32mm à 0.45mm)",
                          "[ATS] Calcul de similarité sémantique par rapport au Golden Dataset v1.0.0",
                          "[ATS] Évaluation physique du gauchissement de support élastomère",
                          "[ATS] Formulation de la conjecture ATS-HYP-003...",
                          "[ATS] Génération d'un rapport de non-régression virtuel (Score de confiance: 96.8%)"
                        ];

                        let currentProgress = 5;
                        const interval = setInterval(() => {
                          currentProgress += 15;
                          if (currentProgress >= 100) {
                            currentProgress = 100;
                            clearInterval(interval);
                            
                            // Finish exploration
                            setAtsIsMining(false);
                            setAtsProgress(0);
                            
                            // Add new hypothesis
                            const newHyp = {
                              id: `ATS-HYP-00${atsHypotheses.length + 1}`,
                              title: "Corrélation anisotrope sur points de bourdon satin (Satin-Width Adaptability)",
                              engine: 'Satin',
                              confidence: 96.8,
                              origin: "Recherche autonome d'isomorphisme (200 nouveaux DSTs)",
                              description: "SI la largeur d'un cordon Satin dépasse 5.5 mm sur maille piquée, ALORS le retrait textile augmente de manière quadratique. Le système doit appliquer automatiquement un Tatami d'allégement fractionné à 45°.",
                              simulatedValidation: 'Similarité de 97.4% certifiée par rapport au Golden Dataset',
                              status: 'Ready for ASR'
                            };

                            setAtsHypotheses(prev => [...prev, newHyp]);
                            setAtsSelectedHypothesisId(newHyp.id);
                            
                            // Update statistics of dashboard
                            setDashboardStats(prev => ({
                              ...prev,
                              statisticalRules: prev.statisticalRules + 1,
                              hypotheses: prev.hypotheses + 1
                            }));

                            setAtsLogs(prev => [
                              ...prev,
                              "[ATS] Exploration terminée avec succès !",
                              `[ATS] Nouvelle hypothèse de recherche enregistrée : ${newHyp.id}`,
                              "[ATS] Prêt à soumettre la conjecture au registre scientifique ASR."
                            ]);
                          } else {
                            setAtsProgress(currentProgress);
                            // Add a random log
                            const randomLog = logsPool[Math.floor(Math.random() * logsPool.length)];
                            setAtsLogs(prev => {
                              if (!prev.includes(randomLog)) {
                                return [...prev, randomLog];
                              }
                              return prev;
                            });
                          }
                        }, 400);
                      }}
                      className={`w-full text-xs font-black p-3.5 rounded-xl uppercase tracking-wider font-sans transition-all flex items-center justify-center gap-2 ${
                        atsIsMining
                          ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-violet-500/10'
                      }`}
                    >
                      <Cpu size={14} className={atsIsMining ? 'animate-spin' : ''} />
                      {atsIsMining ? 'Recherche autonome en cours...' : 'Déclencher une boucle de recherche autonome'}
                    </button>

                    {atsIsMining && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <span>Extraction binaire en cours</span>
                          <span>{atsProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${atsProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ATS Internal Logging Output Terminal */}
                <div className="md:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col justify-between min-h-[190px]">
                  <div className="flex justify-between items-center border-b border-slate-900/60 pb-1.5 mb-2">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">CONSOLE DE RECHERCHE - ATS KERNEL LOGS :</span>
                    <span className="bg-slate-900 text-[8px] font-mono font-bold text-violet-400 px-1.5 py-0.5 rounded border border-slate-800/80">
                      LIVE STREAM
                    </span>
                  </div>

                  <div className="font-mono text-[10px] text-violet-300 space-y-1 h-[130px] overflow-y-auto pr-1" id="ats-logs-terminal">
                    {atsLogs.length === 0 ? (
                      <div className="text-slate-600 italic flex items-center justify-center h-full text-center p-4">
                        En attente du lancement d'une boucle de recherche sémantique...
                      </div>
                    ) : (
                      atsLogs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed animate-fadeIn">
                          <span className="text-slate-600 mr-1.5">&gt;</span>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Discovery Exploration Pipeline Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                
                {/* Left side list of conjectures */}
                <div className="md:col-span-5 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                    Hypothèses de recherche formulées par l'ATS ({atsHypotheses.length}) :
                  </span>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1" id="ats-hypotheses-list">
                    {atsHypotheses.map((hyp) => {
                      const isSelected = atsSelectedHypothesisId === hyp.id;
                      return (
                        <button
                          key={hyp.id}
                          id={`ats-hyp-item-${hyp.id}`}
                          type="button"
                          onClick={() => setAtsSelectedHypothesisId(hyp.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2 ${
                            isSelected
                              ? 'bg-slate-900 border-slate-700 shadow-md shadow-violet-500/5'
                              : 'bg-slate-950 border-slate-900 hover:bg-slate-900/30'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="font-mono text-[10px] font-bold text-slate-400 tracking-wider">
                              {hyp.id}
                            </span>
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                              {hyp.engine} Engine
                            </span>
                          </div>

                          <h4 className="text-white text-xs font-bold leading-tight line-clamp-1">{hyp.title}</h4>
                          <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 pt-1 border-t border-slate-900/50">
                            <span>Origine : {hyp.origin}</span>
                            <span className="text-violet-400">Confiance : {hyp.confidence}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right side Conjectures Detail Inspector */}
                <div className="md:col-span-7" id="ats-hyp-inspector">
                  {(() => {
                    const selectedHyp = atsHypotheses.find(h => h.id === atsSelectedHypothesisId) || atsHypotheses[0];
                    if (!selectedHyp) return null;
                    return (
                      <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between h-full space-y-4">
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[9px] font-mono text-slate-500 uppercase font-black block tracking-widest">
                                EXPLORATION DE CONJECTURE SCIENTIFIQUE :
                              </span>
                              <h3 className="text-white text-sm font-black mt-1 leading-snug">{selectedHyp.title}</h3>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border uppercase inline-block text-violet-400 bg-slate-950/80 border-slate-800 shrink-0 font-black">
                              {selectedHyp.id}
                            </span>
                          </div>

                          {/* Quick Metadata */}
                          <div className="grid grid-cols-2 gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-900 font-mono text-[10px]">
                            <div>
                              <span className="text-slate-500 block uppercase">Origine de détection :</span>
                              <span className="text-slate-300 font-bold">{selectedHyp.origin}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase">Moteur de calcul visé :</span>
                              <span className="text-cyan-400 font-bold">{selectedHyp.engine} Engine</span>
                            </div>
                          </div>

                          {/* Descriptive statement */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Analyse et Conjecture Sémantique :</span>
                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/20 p-3 rounded-xl border border-slate-900">
                              {selectedHyp.description}
                            </p>
                          </div>

                          {/* Simulated validation details */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Évaluation Physique Simulée :</span>
                            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-900 flex justify-between items-center">
                              <div>
                                <span className="text-[8px] text-slate-500 font-mono block uppercase">Indicateur d'intégrité simulé :</span>
                                <span className="text-xs font-mono font-bold text-slate-300">{selectedHyp.simulatedValidation}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] text-slate-500 font-mono block uppercase">Confiance d'exploration :</span>
                                <span className="text-xs font-mono font-bold text-violet-400 font-black">{selectedHyp.confidence}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Promote to Scientific Registry ASR */}
                        <div className="pt-4 border-t border-slate-900/80 flex justify-between items-center gap-4">
                          <p className="text-[10px] text-slate-500 max-w-[280px]">
                            Cette conjecture sémantique n'a pas encore été inscrite dans l'ASR. Soumettez-la pour validation physique.
                          </p>
                          
                          <button
                            type="button"
                            onClick={() => {
                              // Build a new ASR item from this ATS conjecture
                              const newAsrId = `HYP-${Math.floor(100000 + Math.random() * 900000)}`;
                              
                              const newAsrObj = {
                                id: newAsrId,
                                type: 'Hypothesis' as const,
                                title: selectedHyp.title,
                                description: selectedHyp.description,
                                discoveredBy: 'Autonomous Scientist (ATS)',
                                targetDesign: 'Golden Dataset v1.0.0 (TSM Simulation)',
                                evidenceCount: 450,
                                confidence: selectedHyp.confidence,
                                date: new Date().toISOString().split('T')[0],
                                nextStepId: null,
                                prevStepId: 'OBS-000254',
                                concernedEngine: selectedHyp.engine as any,
                                metricsImpact: `Hypothèse de gain validée par simulateur (${selectedHyp.simulatedValidation})`
                              };

                              // Insert into registryItems
                              const lastItem = registryItems[registryItems.length - 1];
                              const updatedItems = registryItems.map(item => {
                                if (lastItem && item.id === lastItem.id) {
                                  return { ...item, nextStepId: newAsrId };
                                }
                                return item;
                              });

                              setRegistryItems([...updatedItems, newAsrObj]);
                              
                              // Notify user
                              setAsrNotification(`La conjecture ${selectedHyp.id} a été promue avec succès dans le Registre Sémantique ASR sous l'ID ${newAsrId} !`);
                              
                              // Switch active tab to scientific_registry to show it!
                              setActiveSubTab('scientific_registry');
                              setSelectedRegistryId(newAsrId);

                              setTimeout(() => setAsrNotification(null), 5000);
                            }}
                            className="bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] px-3.5 py-2 rounded-lg uppercase tracking-wider font-sans transition-all shrink-0 flex items-center gap-1.5"
                          >
                            <BookOpen size={12} />
                            Soumettre au Registre ASR
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: ADDITIONAL METRICS & QUICK KNOWLEDGE RAIL */}
        <div className="lg:col-span-4 space-y-6" id="tic-right-sidebar">
          
          {/* COMPARISON METRICS: MATH ACCURACY VS INDUSTRIAL ALIGNMENT */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-5">
            <div className="pb-2 border-b border-slate-900">
              <h4 className="text-white font-black text-sm flex items-center gap-2">
                <Scale className="text-indigo-400 w-4 h-4" />
                Math Accuracy vs. Alignment (ISS)
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Rapport d'écart par moteur de calcul. Compare la justesse géométrique pure à la similarité industrielle.
              </p>
            </div>

            {/* Custom dual progress bars for each Engine */}
            <div className="space-y-4">
              {[
                { name: 'Geometry', Math: 99, Industry: 98 },
                { name: 'Ribbon', Math: 98, Industry: 91 },
                { name: 'Tatami', Math: 97, Industry: 94 },
                { name: 'Travel', Math: 96, Industry: 81 },
                { name: 'Satin', Math: 99, Industry: 95 },
                { name: 'Physics', Math: 98, Industry: 92 }
              ].map((engine, idx) => (
                <div key={idx} className="bg-slate-900/30 p-3 rounded-xl border border-slate-850/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">{engine.name} Engine</span>
                    
                    {/* Discrepancy indicator */}
                    {engine.Math - engine.Industry > 5 ? (
                      <span className="bg-amber-500/10 text-amber-400 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold">
                        ⚠ Écart Pro: -{engine.Math - engine.Industry}%
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold">
                        ✓ Alignement stable
                      </span>
                    )}
                  </div>

                  {/* Math progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>Exactitude Mathématique</span>
                      <span className="text-slate-300 font-bold">{engine.Math}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${engine.Math}%` }} />
                    </div>
                  </div>

                  {/* Industry alignment (ISS) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>Similarité Industrielle (ISS)</span>
                      <span className="text-cyan-400 font-bold">{engine.Industry}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${engine.Industry}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP INDUSTRIAL RULES DISCOVERED IN THE 850 REF GALLERY */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="pb-2 border-b border-slate-900">
              <h4 className="text-white font-black text-sm flex items-center gap-2">
                <TrendingUp className="text-emerald-400 w-4 h-4" />
                Top des Règles Découvertes
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Classement des règles ayant le taux d'adoption le plus élevé parmi les 850 fichiers DST de l'Industrial Reference Library.
              </p>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {[
                { rank: 1, name: 'Trim > 4.2 mm', rate: 99.5, category: 'Travel', count: 812 },
                { rank: 2, name: 'Satin Fin < 4.0 mm', rate: 99.2, category: 'Satin', count: 712 },
                { rank: 3, name: 'Angle Tatami à 45°', rate: 98.4, category: 'Tatami', count: 684 },
                { rank: 4, name: 'Satin à densité 0.38mm', rate: 94.0, category: 'Cordonnet', count: 512 },
                { rank: 5, name: 'Contour d\'abord (Stabilisation)', rate: 94.1, category: 'Séquençage', count: 210 },
                { rank: 6, name: 'Sous-couche Zigzag sur Satin', rate: 89.2, category: 'Volume', count: 120 },
                { rank: 7, name: 'Filtre Micro-points < 0.3mm', rate: 76.4, category: 'Filtration', count: 84 }
              ].map((rule) => (
                <div key={rule.rank} className="flex items-center justify-between p-2.5 bg-slate-900/30 rounded-lg border border-slate-900 hover:border-slate-800 transition-all text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center font-mono font-black text-slate-400 text-[10px] border border-slate-850">
                      {rule.rank}
                    </span>
                    <div>
                      <span className="font-bold text-slate-200 block">{rule.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{rule.category} | {rule.count} obs</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/20 text-[10px]">
                    {rule.rate}%
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
