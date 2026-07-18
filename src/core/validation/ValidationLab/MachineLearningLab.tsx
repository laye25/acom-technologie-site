import React, { useState, useMemo } from 'react';
import { 
  Brain, Cpu, Database, FileCode, CheckCircle2, AlertTriangle, Play, RefreshCw, 
  Search, SlidersHorizontal, BarChart2, GitPullRequest, Settings, Terminal, Check,
  BookOpen, Network, Layers, Sparkles, TrendingUp, HelpCircle, ArrowRight, ArrowUpRight,
  Info, Eye, ChevronRight, CornerDownRight, ThumbsUp, Activity, Compass, Flame,
  Award, ShieldCheck, Binary, Workflow, GitFork, Users
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

// Define structures for our Industrial DST files
interface GalleryItem {
  id: string;
  name: string;
  dstFile: string;
  imgFile: string;
  category: string;
  colors: number;
  stitches: number;
  trims: number;
  jumps: number;
  width: number;
  height: number;
  digitizerDefault: {
    satinWidth: number;
    satinSpacing: number;
    tatamiAngle: number;
    jumpTrimThreshold: number;
    travelSequence: string;
  }
}

// Discovered rules
interface IKERule {
  id: string;
  code: string;
  title: string;
  symptom: string;
  condition: string;
  observedPattern: string;
  occurrenceRate: number; // e.g. 96%
  affectedEngines: string[];
  suggestedAction: string;
  isActive: boolean;
  category: string;
  observations: number;
  impact: string;
}

// Master Digitizer Profile
interface DigitizerProfile {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  bio: string;
  analyzedFiles: number;
  habits: string[];
}

export const MachineLearningLab: React.FC = () => {
  // Navigation tabs for the ML lab
  const [activeTab, setActiveTab] = useState<'dataset' | 'compiler' | 'comparison' | 'ike' | 'tkg'>('tkg');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>('DST-003');
  const [selectedEngineView, setSelectedEngineView] = useState<'radar' | 'table'>('table');
  const [selectedDigitizerProfile, setSelectedDigitizerProfile] = useState<string>('jean_pierre');
  const [activeGraphNode, setActiveGraphNode] = useState<string>('satin');
  
  // Pipeline interactive states
  const [isBuildingDataset, setIsBuildingDataset] = useState<boolean>(false);
  const [datasetProgress, setDatasetProgress] = useState<number>(100);
  const [isDatasetBuilt, setIsDatasetBuilt] = useState<boolean>(true);
  const [datasetLogs, setDatasetLogs] = useState<string[]>([
    "[DATASET] Parsing gallery library directory...",
    "[DATASET] Found 840 matched (DST + PNG) pairs.",
    "[DATASET] Extracted metadata headers from all binary DST files.",
    "[DATASET] Created dataset hierarchy: logo_001/ to logo_840/",
    "[DATASET] Indexed in local Dexie DB. Machine learning dataset is ready for compile-testing."
  ]);

  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileProgress, setCompileProgress] = useState<number>(0);
  const [isCompiled, setIsCompiled] = useState<boolean>(false);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);

  // Gallery items matching DST Gallery
  const galleryItems: GalleryItem[] = [
    {
      id: 'DST-001',
      name: 'Rose Éternelle',
      dstFile: 'Rose.dst',
      imgFile: 'Rose.jpg',
      category: 'Floral / Nature',
      colors: 4,
      stitches: 14230,
      trims: 18,
      jumps: 11,
      width: 65,
      height: 80,
      digitizerDefault: {
        satinWidth: 3.2,
        satinSpacing: 0.38,
        tatamiAngle: 45,
        jumpTrimThreshold: 4.0,
        travelSequence: 'Contour -> Center -> Fill'
      }
    },
    {
      id: 'DST-002',
      name: 'Lion Royal Héraldique',
      dstFile: 'Lion.dst',
      imgFile: 'Lion.jpg',
      category: 'Blasons / Animaux',
      colors: 2,
      stitches: 28453,
      trims: 34,
      jumps: 22,
      width: 95,
      height: 120,
      digitizerDefault: {
        satinWidth: 4.0,
        satinSpacing: 0.40,
        tatamiAngle: 45,
        jumpTrimThreshold: 4.5,
        travelSequence: 'Contour -> Center -> Fill'
      }
    },
    {
      id: 'DST-003',
      name: 'Logo Acom Technologie Premium',
      dstFile: 'Logo_Acom.dst',
      imgFile: 'Logo_Acom.png',
      category: 'Identité / Logos',
      colors: 3,
      stitches: 8120,
      trims: 12,
      jumps: 6,
      width: 78,
      height: 45,
      digitizerDefault: {
        satinWidth: 2.8,
        satinSpacing: 0.35,
        tatamiAngle: 45,
        jumpTrimThreshold: 4.0,
        travelSequence: 'Contour -> Center -> Fill'
      }
    },
    {
      id: 'DST-004',
      name: 'Papillon Monarque Volant',
      dstFile: 'Papillon.dst',
      imgFile: 'Papillon.png',
      category: 'Floral / Nature',
      colors: 5,
      stitches: 19180,
      trims: 26,
      jumps: 15,
      width: 85,
      height: 70,
      digitizerDefault: {
        satinWidth: 3.0,
        satinSpacing: 0.38,
        tatamiAngle: 45,
        jumpTrimThreshold: 4.0,
        travelSequence: 'Contour -> Center -> Fill'
      }
    },
    {
      id: 'DST-005',
      name: 'Monogramme SM Entrelacé',
      dstFile: 'Monogramme_SM.dst',
      imgFile: 'Monogramme_SM.png',
      category: 'Monogrammes',
      colors: 1,
      stitches: 11240,
      trims: 16,
      jumps: 10,
      width: 55,
      height: 60,
      digitizerDefault: {
        satinWidth: 3.5,
        satinSpacing: 0.36,
        tatamiAngle: 45,
        jumpTrimThreshold: 3.5,
        travelSequence: 'Contour -> Center -> Fill'
      }
    },
    {
      id: 'DST-006',
      name: 'Nœud Celtique Géométrique',
      dstFile: 'Celtic_Knot.dst',
      imgFile: 'Celtic_Knot.png',
      category: 'Géométriques',
      colors: 2,
      stitches: 24500,
      trims: 20,
      jumps: 12,
      width: 90,
      height: 90,
      digitizerDefault: {
        satinWidth: 3.8,
        satinSpacing: 0.38,
        tatamiAngle: 45,
        jumpTrimThreshold: 4.0,
        travelSequence: 'Contour -> Center -> Fill'
      }
    }
  ];

  // Master Digitizer Profiles
  const digitizerProfiles: DigitizerProfile[] = [
    {
      id: 'jean_pierre',
      name: 'Maître Jean-Pierre',
      specialty: 'Haute Couture & Prêt-à-porter de Luxe',
      avatar: '👔',
      bio: 'Ancien chef de numérisation d\'un grand atelier lyonnais, fort de 35 ans de métier. Spécialiste de la popeline de soie et du lin ultra-fin. Il privilégie une esthétique organique parfaite et des trajectoires de broderie invisibles.',
      analyzedFiles: 520,
      habits: [
        'Utilise un angle Tatami de 45° dans 93 % des grandes surfaces pour compenser le sens de trame.',
        'Évite rigoureusement les sauts supérieurs à 4,2 mm sans trim automatique.',
        'Privilégie des colonnes Satin calibrées méticuleusement entre 2,8 et 3,4 mm.',
        'Réduit systématiquement la densité de 15 % dans les angles aigus pour éviter la surcharge d\'aiguilles.',
        'Commence les parcours par les contours dans 87 % des motifs pour fixer le tissu au stabilisateur.'
      ]
    },
    {
      id: 'sportswear_active',
      name: 'Atelier Sportswear Heavy-Duty',
      specialty: 'Casquettes, Sweats épais & Maillots Sport',
      avatar: '🧢',
      bio: 'Ligne de numérisation robotisée optimisée pour des machines multi-têtes tournant à haute vitesse (1200 tpm). La priorité est la robustesse absolue, la prévention de rupture de fil et la tenue aux lavages intensifs.',
      analyzedFiles: 1240,
      habits: [
        'Force un angle Tatami à 30° ou 60° pour s\'ancrer dans la maille piquée.',
        'Seuil de trim configuré très bas (3,0 mm) pour éliminer tout résidu de fil propice aux accrocs.',
        'Brode systématiquement une double sous-couche (Z-Underlay) sur le satin de plus de 3,0 mm.',
        'Applique une compensation de tirage très agressive (+0,25 mm) pour pallier l\'élasticité du Polyester.',
        'Ordonne la séquence de broderie en spirale (du centre vers les bords extérieurs) pour chasser le pli.'
      ]
    },
    {
      id: 'wilcom_baseline',
      name: 'Wilcom CAD AI Baseline',
      specialty: 'Standards Commerciaux Globaux',
      avatar: '🤖',
      bio: 'Algorithmes de génération automatique standards issus des suites logicielles professionnelles. Géométriquement optimisés mais sans les heuristiques physiques appliquées empiriquement par les maîtres-tailleurs.',
      analyzedFiles: 1140,
      habits: [
        'Angle Tatami figé uniformément à 45° sans adaptation aux contraintes de tension matière.',
        'Trims standardisés à un seuil de 5,0 mm.',
        'Espacement de Satin standard à 0,40 mm sur l\'intégralité du motif.',
        'Compensation de tirage globale et non-adaptative à 0,15 mm.',
        'Optimisation de parcours brute basée sur l\'algorithme mathématique du voyageur de commerce (TSP).'
      ]
    }
  ];

  // Active Profile Details
  const activeProfile = useMemo(() => {
    return digitizerProfiles.find(p => p.id === selectedDigitizerProfile) || digitizerProfiles[0];
  }, [selectedDigitizerProfile]);

  // Rules from IKE (Industrial Knowledge Extractor)
  const [rules, setRules] = useState<IKERule[]>([
    {
      id: 'R-1',
      code: 'IKE-JUMP-TRIM',
      title: 'Seuil de Trim des Sauts Longs',
      symptom: 'Sauts de fil non coupés provoquant des ratures sur le tissu.',
      condition: 'Saut (Jump) > 4.0 mm',
      observedPattern: '97.2% des digitizers pros insèrent une commande TRIM.',
      occurrenceRate: 97,
      affectedEngines: ['Travel Engine', 'Machine Backend'],
      suggestedAction: 'Forcer la commande Trim dès que le vecteur de déplacement dépasse 4.0mm.',
      isActive: true,
      category: 'Séquence & Coupe',
      observations: 482,
      impact: '+4.1% Travel'
    },
    {
      id: 'R-2',
      code: 'IKE-SATIN-WIDTH',
      title: 'Optimisation de Densité du Satin Large',
      symptom: 'Cordonnet Satin mou ou manquant de brillance sur les coins.',
      condition: 'Largeur du Satin >= 4.0 mm et angle de virage serré (<35°)',
      observedPattern: 'Espacement stabilisé à 0.38mm avec beveling biseauté adaptatif (88.4% d\'occurrence).',
      occurrenceRate: 94,
      affectedEngines: ['Satin Engine', 'Ribbon Engine'],
      suggestedAction: 'Établir l\'espacement à 0.38mm et appliquer un onglet adaptatif si largeur > 4mm.',
      isActive: false,
      category: 'Cordonnet Satin',
      observations: 310,
      impact: '+16.1% Ribbon'
    },
    {
      id: 'R-3',
      code: 'IKE-TATAMI-ANGLE',
      title: 'Orientation de Tension du Tatami',
      symptom: 'Déformation du tissu ou Moire optique lors du remplissage étendu.',
      condition: 'Grande zone (> 500 mm²)',
      observedPattern: '94.8% orienté de biais à 45° pour compenser la contraction de trame (0° proscrit).',
      occurrenceRate: 95,
      affectedEngines: ['Tatami Engine', 'Physics Engine'],
      suggestedAction: 'Forcer l\'angle de remplissage à 45° ou 135° pour annuler l\'effort d\'étirement tissulaire.',
      isActive: false,
      category: 'Aplats Tatami',
      observations: 285,
      impact: '+22.3% Tatami'
    },
    {
      id: 'R-4',
      code: 'IKE-TRAVEL-SEQ',
      title: 'Séquençage de Trajet Contours-Fonds',
      symptom: 'Remplissage qui glisse hors des contours brodés en premier.',
      condition: 'Motif complexe à plusieurs couches',
      observedPattern: 'Digitizers brodent toujours les aplats d\'abord, puis les détails et contours : Contour -> Center -> Fill (84% d\'occurrence).',
      occurrenceRate: 92,
      affectedEngines: ['Travel Engine', 'Topology Engine'],
      suggestedAction: 'Ordonner le parcours avec remplissages (Fill) d\'abord, puis détails fins et enfin contours de garde.',
      isActive: false,
      category: 'Optimisation de Trajet',
      observations: 198,
      impact: '+9.5% Travel'
    }
  ]);

  // Dynamic ranking of top 10 discovered rules in our system (from 3,000 DST files)
  const top10Rules = [
    { rank: 1, name: 'Trim > 4.0 mm', rate: 97, category: 'Séquençage', impact: 'Propreté fil', count: 482 },
    { rank: 2, name: 'Angle Tatami à 45°', rate: 95, category: 'Remplissage', impact: 'Tension trame', count: 440 },
    { rank: 3, name: 'Satin à densité 0.38mm', rate: 94, category: 'Cordonnet', impact: 'Fidélité relief', count: 310 },
    { rank: 4, name: 'Contour d\'abord (Stabilisation)', rate: 92, category: 'Séquençage', impact: 'Distorsion zéro', count: 298 },
    { rank: 5, name: 'Sous-couche Zigzag sur Satin', rate: 89, category: 'Volume', impact: 'Effet bombé 3D', count: 275 },
    { rank: 6, name: 'Compensation étirement +0.18mm', rate: 87, category: 'Physique', impact: 'Anti-glissement', count: 260 },
    { rank: 7, name: 'Densité réduite angles aigus', rate: 85, category: 'Densité', impact: 'Prévention casses', count: 245 },
    { rank: 8, name: 'Filtre Micro-points < 0.3mm', rate: 82, category: 'Filtration', impact: 'Zéro bourrage', count: 210 },
    { rank: 9, name: 'Double nœud d\'arrêt aux coupes', rate: 80, category: 'Sécurité', impact: 'Anti-défilage', count: 185 },
    { rank: 10, name: 'Recouvrement de jonction 0.8mm', rate: 78, category: 'Contours', impact: 'Raccord parfait', count: 155 }
  ];

  // Current selected item
  const activeItem = useMemo(() => {
    return galleryItems.find(item => item.id === selectedGalleryId) || galleryItems[0];
  }, [selectedGalleryId]);

  // Handle active rules count
  const activeRulesCount = useMemo(() => {
    return rules.filter(r => r.isActive).length;
  }, [rules]);

  // Dynamic simulation of matching metrics based on active rules
  const comparisonMetrics = useMemo(() => {
    // Basic ATCP compilation without rules applied
    let baseStitches = activeItem.stitches * 1.14; // 14% overestimation
    let baseTrims = activeItem.trims - 6; // 6 missing trims
    let baseJumps = activeItem.jumps + 4; // excess jumps due to bad travel routing
    let baseWidth = activeItem.digitizerDefault.satinWidth + 0.9;
    let baseSpacing = activeItem.digitizerDefault.satinSpacing + 0.08;
    let baseTatamiAngle = 0; // standard flat angle instead of pro 45

    // Alignment scores per engine (ISS: Industrial Similarity Scores)
    let ribbonScore = 78.4;
    let tatamiScore = 74.2;
    let satinScore = 80.5;
    let travelScore = 72.1;
    let physicsScore = 76.8;

    // Apply rules impact on Industrial Alignment (ISS)
    rules.forEach(rule => {
      if (rule.isActive) {
        if (rule.code === 'IKE-JUMP-TRIM') {
          baseTrims = activeItem.trims;
          baseJumps = activeItem.jumps;
          travelScore = Math.min(100, travelScore + 18.2);
          physicsScore = Math.min(100, physicsScore + 11.5);
        }
        if (rule.code === 'IKE-SATIN-WIDTH') {
          baseWidth = activeItem.digitizerDefault.satinWidth;
          baseSpacing = activeItem.digitizerDefault.satinSpacing;
          satinScore = Math.min(100, satinScore + 17.5);
          ribbonScore = Math.min(100, ribbonScore + 16.1);
        }
        if (rule.code === 'IKE-TATAMI-ANGLE') {
          baseTatamiAngle = activeItem.digitizerDefault.tatamiAngle;
          tatamiScore = Math.min(100, tatamiScore + 22.3);
          physicsScore = Math.min(100, physicsScore + 12.1);
        }
        if (rule.code === 'IKE-TRAVEL-SEQ') {
          travelScore = Math.min(100, travelScore + 9.5);
          tatamiScore = Math.min(100, tatamiScore + 3.2);
          baseStitches = activeItem.stitches * 1.02; // very close to original
        }
      }
    });

    // Compute overall closeness score (ISS)
    const totalScore = (ribbonScore + tatamiScore + satinScore + travelScore + physicsScore) / 5;

    // Mathematical accuracy of compilation is consistently excellent (98% + slight variations)
    const mathConfidenceBase = 98.2 + (activeRulesCount * 0.3);
    const confidenceMath = Number(Math.min(100, mathConfidenceBase).toFixed(1));

    return {
      stitches: Math.round(baseStitches),
      trims: baseTrims,
      jumps: baseJumps,
      satinWidth: Number(baseWidth.toFixed(2)),
      satinSpacing: Number(baseSpacing.toFixed(2)),
      tatamiAngle: baseTatamiAngle,
      scores: {
        ribbon: Number(ribbonScore.toFixed(1)),
        tatami: Number(tatamiScore.toFixed(1)),
        satin: Number(satinScore.toFixed(1)),
        travel: Number(travelScore.toFixed(1)),
        physics: Number(physicsScore.toFixed(1))
      },
      closeness: Number(totalScore.toFixed(1)), // ISS (Industrial Similarity Score)
      confidenceMath // Math Confidence
    };
  }, [activeItem, rules, activeRulesCount]);

  // Run Dataset Builder simulation
  const handleBuildDataset = () => {
    setIsBuildingDataset(true);
    setDatasetProgress(0);
    setDatasetLogs([]);

    const messages = [
      "🔄 Accessing local IndexedDB database...",
      "📂 Scanning folder: /public/galerie_dst/ ...",
      "🔍 Located 840 files. Mapping pairings...",
      "📦 logo_001/ -> image.png + original.dst + metadata.json generated.",
      "📦 monogram_012/ -> image.png + original.dst + metadata.json generated.",
      "📦 celt_092/ -> image.png + original.dst + metadata.json generated.",
      "📝 Generating statistics for 840 specimens...",
      "✓ Successfully formatted local Machine Learning Dataset in 1.4s."
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step >= messages.length) {
        clearInterval(interval);
        setIsBuildingDataset(false);
        setDatasetProgress(100);
        setIsDatasetBuilt(true);
        return;
      }
      setDatasetProgress(Math.floor((step / (messages.length - 1)) * 100));
      setDatasetLogs(prev => [...prev, `[DATASET] ${messages[step]}`]);
      step++;
    }, 200);
  };

  // Run Compilation Simulation
  const handleCompile = () => {
    setIsCompiling(true);
    setCompileProgress(0);
    setCompileLogs([]);

    const steps = [
      `Initializing ATCP Compiler for ${activeItem.imgFile}...`,
      "Loading Geometry Engine: Splitting vector segments...",
      "Topology analysis: Found stable Euler boundary loop (χ = 1)",
      "Ribbon Centerline: Extracting medial axis ribbons...",
      "Tatami Fill Optimizer: Generating parallel stitch layers...",
      "Satin Lacier: Fitting orthogonal zigzag stitch segments...",
      "Travel Optimizer: Calculating travel route and jump paths...",
      "Physics Engine: Simulating fabric tension and pull compensation...",
      "Tajima Writer: Packing binary instructions to DST format...",
      "✓ DST Compilation Complete! Target byte-stream is ready for comparison."
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= steps.length) {
        clearInterval(interval);
        setIsCompiling(false);
        setCompileProgress(100);
        setIsCompiled(true);
        return;
      }
      setCompileProgress(Math.floor((idx / (steps.length - 1)) * 100));
      setCompileLogs(prev => [...prev, `[COMPILER] ${steps[idx]}`]);
      idx++;
    }, 180);
  };

  // Toggle Rule
  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  // Apply all rules instantly
  const applyAllRules = () => {
    setRules(prev => prev.map(r => ({ ...r, isActive: true })));
  };

  // Radar chart data for scores
  const radarData = [
    { name: 'Ribbon', ATCP: comparisonMetrics.scores.ribbon, Pro: 100 },
    { name: 'Tatami', ATCP: comparisonMetrics.scores.tatami, Pro: 100 },
    { name: 'Satin', ATCP: comparisonMetrics.scores.satin, Pro: 100 },
    { name: 'Travel', ATCP: comparisonMetrics.scores.travel, Pro: 100 },
    { name: 'Physics', ATCP: comparisonMetrics.scores.physics, Pro: 100 }
  ];

  // Textile Knowledge Graph interactive node details
  const tkgNodeDetails: Record<string, { label: string; desc: string; type: string; details: string }> = {
    logo: {
      label: 'Motif d\'Entrée (Logo/Texte)',
      type: 'Source Image / Trame vectorielle',
      desc: 'Identification d\'un lettrage ou trame géométrique étroite inférieure à 4 mm.',
      details: 'La forme d\'entrée impose la détection automatique de micro-bords complexes et de zones de compression élevées.'
    },
    contour: {
      label: 'Contours Fins (Bords)',
      type: 'Analyse Topologique',
      desc: 'Détection des contours extérieurs requérant un renfort de tracé satin stabilisé.',
      details: 'Calcul des normales de bordure pour l\'application d\'une surcompensation de glissement.'
    },
    satin: {
      label: 'Cordonnet Satin (Satin Fill)',
      type: 'Engine de Remplissage',
      desc: 'Choix de points d\'allers-retours orthogonaux à amplitude variable.',
      details: 'La largeur de colonne de 3.0mm nécessite un pas calibré pour éviter le décollement mécanique.'
    },
    width: {
      label: 'Largeur Colonne (3.0 mm)',
      type: 'Calculateur Dimensionnel',
      desc: 'Contrainte géométrique mesurée par le Ribbon & Satin Engine.',
      details: 'Au-delà de 2.8mm, l\'algorithme de déformation doit appliquer une compensation de retrait proportionnelle.'
    },
    density: {
      label: 'Densité (0.38 mm Spacing)',
      type: 'Heuristique Industrielle',
      desc: 'Distance optimale entre deux piqures successives de l\'aiguille.',
      details: 'Cette densité assure la brillance du fil de soie ou polyester sans détériorer la sous-couche fibreuse.'
    },
    thread: {
      label: 'Fil Polyester 40',
      type: 'Paramètre Matière',
      desc: 'Sélection du type et du calibre de fil à broder physique.',
      details: 'La résistance mécanique du Polyester 40 supporte des tensions d\'étirement plus agressives.'
    },
    fabric: {
      label: 'Tissu Popeline de Coton',
      type: 'Support Textile',
      desc: 'Support de destination caractérisé par sa souplesse et sa contraction mécanique.',
      details: 'La popeline requiert un verrouillage serré mais une densité globale modérée pour écarter le froissement.'
    }
  };

  return (
    <div className="space-y-6 text-slate-100 animate-fadeIn">
      
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-violet-950/40 via-slate-900/80 to-cyan-950/40 border border-violet-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-black tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/30 uppercase">
              🧠 Machine Learning Laboratory & Textile Knowledge Graph
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Learning by Comparison & Textile Knowledge Graph (TKG)
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Nous n'entraînons pas un réseau opaque. Nous utilisons notre galerie industrielle de hundreds de paires (Image + DST Pro) pour comparer, diagnostiquer et extraire automatiquement des relations sémantiques explicables. Le système structure lui-même sa base de connaissances textile (TKG).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">Motifs Comparés</span>
              <span className="text-xl font-black font-mono text-cyan-400">840 Paire(s)</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Règles Extraites</span>
              <span className="text-xl font-black font-mono text-violet-400">{activeRulesCount} / {rules.length}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Relations TKG</span>
              <span className="text-xl font-black font-mono text-emerald-400">3,480</span>
            </div>
          </div>
        </div>

        {/* 5-Step Pipeline Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-6 pt-5 border-t border-slate-800/60">
          {[
            { step: 'Étape 1', title: 'Dataset Builder', tab: 'dataset', desc: 'Slicing automatique' },
            { step: 'Étape 2', title: 'ATCP Compiler', tab: 'compiler', desc: 'Compilation Image ➔ DST' },
            { step: 'Étape 3', title: 'Diff Comparator', tab: 'comparison', desc: 'Métriques physiques' },
            { step: 'Étape 4', title: 'Knowledge (IKE)', tab: 'ike', desc: 'Système expert' },
            { step: 'Étape 5', title: 'Textile Graph (TKG)', tab: 'tkg', desc: 'Graphe de connaissances' }
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(item.tab as any)}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                activeTab === item.tab
                  ? 'border-violet-500 bg-violet-500/15 text-white font-bold ring-1 ring-violet-500/30'
                  : 'border-slate-850 bg-slate-950 hover:bg-slate-900/40 text-slate-400'
              } ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-[9px] font-mono font-bold uppercase ${activeTab === item.tab ? 'text-violet-400' : 'text-slate-500'}`}>
                  {item.step}
                </span>
                <ChevronRight size={10} className={activeTab === item.tab ? 'text-violet-400' : 'text-slate-700'} />
              </div>
              <span className="text-xs font-black block mt-1 text-white">{item.title}</span>
              <span className="text-[8px] text-slate-500 block leading-none mt-0.5">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE TAB DISPLAY AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls, Logs & Workspace */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* STEP 1: DATASET BUILDER */}
          {activeTab === 'dataset' && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4 animate-fadeIn">
              <div className="flex justify-between items-start pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                    <Database className="text-violet-400 w-4 h-4" />
                    Étape 1 : Machine Learning Dataset Builder
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Transformez les exemples de la Galerie DST en fichiers de comparaison structurés.
                  </p>
                </div>
                <button
                  onClick={handleBuildDataset}
                  disabled={isBuildingDataset}
                  className="bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isBuildingDataset ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  Lancer le Slicing & Structuration
                </button>
              </div>

              {/* Progress and status */}
              {isBuildingDataset && (
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-violet-400 font-bold">Import en cours...</span>
                    <span>{datasetProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${datasetProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Ingestion hierarchy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase">Fichier original apparié</span>
                  <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-900">
                    <div className="w-12 h-12 bg-slate-900 rounded border border-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-500 font-bold text-center">
                      DST Pro
                    </div>
                    <div>
                      <span className="text-xs text-slate-200 block font-bold font-mono">{activeItem.dstFile}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Points: {activeItem.stitches} | Couleurs: {activeItem.colors}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-900">
                    <div className="w-12 h-12 bg-slate-900 rounded border border-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-500 font-bold text-center">
                      IMAGE
                    </div>
                    <div>
                      <span className="text-xs text-slate-200 block font-bold font-mono">{activeItem.imgFile}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Taille: {activeItem.width}x{activeItem.height}mm</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[9px] font-mono font-bold text-violet-400 block uppercase font-bold">Structure générée (dataset/)</span>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-300 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <ChevronRight size={10} /> <span className="text-white">logo_003/</span>
                    </div>
                    <div className="pl-4 flex items-center gap-1.5">
                      <span className="text-slate-600">├──</span> <span className="text-cyan-400">image.png</span>
                    </div>
                    <div className="pl-4 flex items-center gap-1.5">
                      <span className="text-slate-600">├──</span> <span className="text-indigo-400">original.dst</span>
                    </div>
                    <div className="pl-4 flex items-center gap-1.5">
                      <span className="text-slate-600">└──</span> <span className="text-amber-400">metadata.json</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logs */}
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl font-mono text-[9px] text-slate-400 h-28 overflow-y-auto space-y-1 leading-normal select-text">
                {datasetLogs.map((log, idx) => (
                  <div key={idx} className={idx === datasetLogs.length - 1 ? 'text-violet-300 font-bold' : ''}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: ATCP COMPILER RUN */}
          {activeTab === 'compiler' && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4 animate-fadeIn">
              <div className="flex justify-between items-start pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                    <Cpu className="text-cyan-400 w-4 h-4" />
                    Étape 2 : ATCP Image Compilation
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Exécutez notre chaîne de calcul de CAO textile pour compiler l'image et générer le fichier DST d'évaluation.
                  </p>
                </div>
                <button
                  onClick={handleCompile}
                  disabled={isCompiling}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isCompiling ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  Compiler le Motif
                </button>
              </div>

              {/* Progress */}
              {isCompiling && (
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-cyan-400 font-bold">Interpolation géométrique...</span>
                    <span>{compileProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${compileProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Status card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Compile Input</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span className="text-xs text-slate-200 font-bold">{activeItem.imgFile}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Fichier source utilisé par le Geometry Engine pour extraire les contours de broderie.
                  </p>
                </div>

                <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Compile Output</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs text-slate-200 font-bold">DST_ATCP.dst</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Fichier compilé de manière déterministe avec notre suite algorithmique locale.
                  </p>
                </div>
              </div>

              {/* Terminal Logs */}
              <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl font-mono text-[9px] text-slate-400 h-32 overflow-y-auto space-y-1.5 select-text leading-relaxed">
                {compileLogs.length === 0 ? (
                  <div className="text-slate-500 italic">En attente de compilation... Cliquez sur "Compiler le Motif".</div>
                ) : (
                  compileLogs.map((log, idx) => (
                     <div key={idx} className={idx === compileLogs.length - 1 ? 'text-cyan-300 font-bold' : ''}>
                       {log}
                     </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 3: COMPARISON ENGINE */}
          {activeTab === 'comparison' && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4 animate-fadeIn">
              <div className="pb-2 border-b border-slate-900">
                <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                  <SlidersHorizontal className="text-amber-400 w-4 h-4" />
                  Étape 3 : Comparaison Trame DST vs ATCP DST
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Confrontation directe des indicateurs physiques du fichier professionnel et du fichier compilé par ATCP.
                </p>
              </div>

              {/* Table of metrics */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 font-bold uppercase tracking-wider text-[10px]">Indicateur Physique</th>
                      <th className="py-2.5 font-bold uppercase tracking-wider text-[10px] text-center">DST Pro Original</th>
                      <th className="py-2.5 font-bold uppercase tracking-wider text-[10px] text-center">ATCP Généré</th>
                      <th className="py-2.5 font-bold uppercase tracking-wider text-[10px] text-right">Écart Relatif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    <tr>
                      <td className="py-3 font-bold text-slate-300">Nombre de points (Stitches)</td>
                      <td className="py-3 text-center text-slate-200">{activeItem.stitches} pts</td>
                      <td className="py-3 text-center text-slate-400">{comparisonMetrics.stitches} pts</td>
                      <td className="py-3 text-right">
                        <span className={`font-bold ${comparisonMetrics.stitches === activeItem.stitches ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {comparisonMetrics.stitches === activeItem.stitches ? 'Fidélité 100%' : `+${(((comparisonMetrics.stitches - activeItem.stitches)/activeItem.stitches)*100).toFixed(1)}%`}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-slate-300">Coupes de fil (Trims)</td>
                      <td className="py-3 text-center text-slate-200">{activeItem.trims} cuts</td>
                      <td className="py-3 text-center text-slate-400">{comparisonMetrics.trims} cuts</td>
                      <td className="py-3 text-right">
                        <span className={`font-bold ${comparisonMetrics.trims === activeItem.trims ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {comparisonMetrics.trims === activeItem.trims ? 'Conforme' : `Écart : ${comparisonMetrics.trims - activeItem.trims}`}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-slate-300">Sauts de raccord (Jumps)</td>
                      <td className="py-3 text-center text-slate-200">{activeItem.jumps} jumps</td>
                      <td className="py-3 text-center text-slate-400">{comparisonMetrics.jumps} jumps</td>
                      <td className="py-3 text-right">
                        <span className={`font-bold ${comparisonMetrics.jumps === activeItem.jumps ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {comparisonMetrics.jumps === activeItem.jumps ? 'Conforme' : `+${comparisonMetrics.jumps - activeItem.jumps} non-gérés`}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-slate-300">Largeur Cordonnet (Satin Width)</td>
                      <td className="py-3 text-center text-slate-200">{activeItem.digitizerDefault.satinWidth} mm</td>
                      <td className="py-3 text-center text-slate-400">{comparisonMetrics.satinWidth} mm</td>
                      <td className="py-3 text-right">
                        <span className={`font-bold ${comparisonMetrics.satinWidth === activeItem.digitizerDefault.satinWidth ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {comparisonMetrics.satinWidth === activeItem.digitizerDefault.satinWidth ? 'Conforme (0mm d\'écart)' : `+${(comparisonMetrics.satinWidth - activeItem.digitizerDefault.satinWidth).toFixed(2)}mm de dérive`}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-slate-300">Espacement Satin (Spacing)</td>
                      <td className="py-3 text-center text-slate-200">{activeItem.digitizerDefault.satinSpacing} mm</td>
                      <td className="py-3 text-center text-slate-400">{comparisonMetrics.satinSpacing} mm</td>
                      <td className="py-3 text-right">
                        <span className={`font-bold ${comparisonMetrics.satinSpacing === activeItem.digitizerDefault.satinSpacing ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {comparisonMetrics.satinSpacing === activeItem.digitizerDefault.satinSpacing ? 'Conforme (0mm d\'écart)' : `+${(comparisonMetrics.satinSpacing - activeItem.digitizerDefault.satinSpacing).toFixed(2)}mm d'écart`}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-slate-300">Angle de remplissage Tatami</td>
                      <td className="py-3 text-center text-slate-200">{activeItem.digitizerDefault.tatamiAngle}°</td>
                      <td className="py-3 text-center text-slate-400">{comparisonMetrics.tatamiAngle}°</td>
                      <td className="py-3 text-right">
                        <span className={`font-bold ${comparisonMetrics.tatamiAngle === activeItem.digitizerDefault.tatamiAngle ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {comparisonMetrics.tatamiAngle === activeItem.digitizerDefault.tatamiAngle ? 'Tension compensée' : 'Pas d\'angle appliqué (0°)'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Match overview */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium font-sans">Index de correspondance industriel :</span>
                <span className={`font-black font-mono text-base ${comparisonMetrics.closeness >= 95 ? 'text-emerald-400' : comparisonMetrics.closeness >= 85 ? 'text-cyan-400' : 'text-rose-400'}`}>
                  {comparisonMetrics.closeness}% {comparisonMetrics.closeness >= 95 ? '✓ HIGH ALIGNMENT' : '⚠ ALIGNMENT GAP DETECTED'}
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: KNOWLEDGE EXTRACTOR & RULE APPLIER */}
          {activeTab === 'ike' && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4 animate-fadeIn">
              <div className="flex justify-between items-start pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                    <Brain className="text-violet-400 w-4 h-4" />
                    Industrial Knowledge Extractor (IKE) - Système Expert
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Règles sémantiques identifiées en comparant plus de 840 fichiers de broderie professionnelle. Activez-les pour aligner le compilateur.
                  </p>
                </div>
                <button
                  onClick={applyAllRules}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles size={12} />
                  Activer Toutes les Règles
                </button>
              </div>

              {/* Live Rule list */}
              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                {rules.map((rule) => (
                  <div 
                    key={rule.id}
                    className={`p-4 rounded-xl border transition-all ${
                      rule.isActive 
                        ? 'border-violet-500/40 bg-violet-950/15 ring-1 ring-violet-500/10' 
                        : 'border-slate-850 bg-slate-900/30 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded ${
                            rule.isActive ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {rule.code}
                          </span>
                          <h4 className="text-sm font-bold text-white">{rule.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          <span className="text-slate-500 font-semibold font-mono">Condition :</span> {rule.condition}
                        </p>
                      </div>

                      {/* Toggle button */}
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                          rule.isActive 
                            ? 'bg-violet-500 text-white shadow-sm' 
                            : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {rule.isActive ? '✓ Activée' : 'Désactivée'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-850/50 text-[10px] font-mono leading-normal">
                      <div>
                        <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Heuristique pro observée ({rule.occurrenceRate}% d\'apparition)</span>
                        <p className="text-slate-300">{rule.observedPattern}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-bold">Action corrective sur le compilateur ATCP</span>
                        <p className="text-emerald-400 font-medium">{rule.suggestedAction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: TEXTILE KNOWLEDGE GRAPH (TKG) */}
          {activeTab === 'tkg' && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-5 animate-fadeIn">
              <div className="flex justify-between items-start pb-2 border-b border-slate-900">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                    <Workflow className="text-emerald-400 w-4 h-4 animate-pulse" />
                    Textile Knowledge Graph (TKG) - Cartographie Sémantique
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    L'IKE connecte et modélise les relations physiques du savoir-faire textile découvertes sur plus de 3 000 DST analysés.
                  </p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2.5 py-1 rounded-lg">
                  Indexation Active (Delta Sync)
                </span>
              </div>

              {/* VISUAL KNOWLEDGE GRAPH VIEW */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-5 relative overflow-hidden">
                <span className="text-[8px] font-mono text-slate-500 uppercase font-bold absolute top-3 left-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Visualiseur interactif de relations physiques
                </span>

                {/* GRAPH CANVAS DRAWING */}
                <div className="h-[200px] w-full flex flex-col justify-between items-center relative mt-3 select-none">
                  
                  {/* Row 1: Source Pattern Node */}
                  <div className="flex gap-4 z-10">
                    <button 
                      onClick={() => setActiveGraphNode('logo')}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                        activeGraphNode === 'logo'
                          ? 'bg-violet-600 border-violet-400 text-white shadow-lg scale-105'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ImageCodeIcon />
                      [Logo / Motif Input]
                    </button>
                  </div>

                  {/* SVG Animated Connector Pathways */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '100%' }}>
                    {/* Animated path curves */}
                    <path d="M 320, 32 Q 320, 60 170, 75" fill="none" stroke={activeGraphNode === 'contour' ? '#10b981' : '#334155'} strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_10s_linear_infinite]" />
                    <path d="M 170, 95 Q 170, 120 170, 135" fill="none" stroke={activeGraphNode === 'width' ? '#10b981' : '#334155'} strokeWidth="1.5" />
                    <path d="M 170, 155 Q 170, 180 320, 195" fill="none" stroke={activeGraphNode === 'thread' ? '#10b981' : '#334155'} strokeWidth="1.5" />
                    
                    <path d="M 320, 32 Q 320, 60 470, 75" fill="none" stroke={activeGraphNode === 'satin' ? '#10b981' : '#334155'} strokeWidth="1.5" strokeDasharray="4 4" />
                    <path d="M 470, 95 Q 470, 120 470, 135" fill="none" stroke={activeGraphNode === 'density' ? '#10b981' : '#334155'} strokeWidth="1.5" />
                    <path d="M 470, 155 Q 470, 180 320, 195" fill="none" stroke={activeGraphNode === 'fabric' ? '#10b981' : '#334155'} strokeWidth="1.5" />
                  </svg>

                  {/* Row 2: Structural Classification Nodes */}
                  <div className="flex justify-between w-full px-4 z-10">
                    <button 
                      onClick={() => setActiveGraphNode('contour')}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 ${
                        activeGraphNode === 'contour'
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg scale-105'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Workflow size={11} />
                      Contours Fins
                    </button>

                    <button 
                      onClick={() => setActiveGraphNode('satin')}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 ${
                        activeGraphNode === 'satin'
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg scale-105'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <SlidersHorizontal size={11} />
                      Cordonnet Satin
                    </button>
                  </div>

                  {/* Row 3: Parametric & Threshold Nodes */}
                  <div className="flex justify-between w-full px-4 z-10">
                    <button 
                      onClick={() => setActiveGraphNode('width')}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono transition-all flex items-center gap-1 ${
                        activeGraphNode === 'width'
                          ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg scale-105'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Binary size={11} />
                      Largeur 3.0 mm
                    </button>

                    <button 
                      onClick={() => setActiveGraphNode('density')}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono transition-all flex items-center gap-1 ${
                        activeGraphNode === 'density'
                          ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg scale-105'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers size={11} />
                      Densité 0.38
                    </button>
                  </div>

                  {/* Row 4: Material & Fabric Grounding Nodes */}
                  <div className="flex gap-4 z-10">
                    <button 
                      onClick={() => setActiveGraphNode('thread')}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 ${
                        activeGraphNode === 'thread'
                          ? 'bg-amber-600 border-amber-400 text-white shadow-lg scale-105'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Award size={11} />
                      Fil Polyester 40
                    </button>

                    <button 
                      onClick={() => setActiveGraphNode('fabric')}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 ${
                        activeGraphNode === 'fabric'
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-105'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Compass size={11} />
                      Tissu Popeline
                    </button>
                  </div>

                </div>

                {/* Node descriptor panel */}
                <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">{tkgNodeDetails[activeGraphNode].type}</span>
                    <h4 className="font-bold text-white text-sm">{tkgNodeDetails[activeGraphNode].label}</h4>
                    <p className="text-slate-400 text-[11px] font-sans leading-relaxed">{tkgNodeDetails[activeGraphNode].desc}</p>
                  </div>
                  <div className="w-[1px] bg-slate-800 shrink-0 self-stretch" />
                  <div className="w-1/3 text-[10px] font-mono text-slate-500 self-center leading-normal">
                    <span className="font-black text-slate-400 block uppercase mb-1">Impact TKG :</span>
                    {tkgNodeDetails[activeGraphNode].details}
                  </div>
                </div>
              </div>

              {/* TKG DISCOVERY STREAM CARD */}
              <div className="space-y-3">
                <h4 className="text-white font-bold text-xs flex items-center gap-1">
                  <Brain size={14} className="text-emerald-400" />
                  Flux de découvertes sémantiques continues (IKE Mining Engine)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 space-y-2 relative">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">Confiance : 97 %</span>
                      <span className="text-slate-500 font-bold">Observée 482 fois</span>
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-white">Texte &lt; 4 mm ➔ Pull Comp</h5>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Application adaptative de +0.18 mm de surépaisseur sur les cordonnets satin étroits.
                      </p>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono pt-1.5 border-t border-slate-850 text-slate-500">
                      <span>Catégorie: Logos</span>
                      <span className="text-cyan-400 font-bold">+2.4 % Ribbon</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">Confiance : 99 %</span>
                      <span className="text-slate-500 font-bold">Observée 310 fois</span>
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-white">Texte &lt; 4 mm ➔ Tatami Interdit</h5>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Le Tatami provoque une perforation et une coupure sur le tissu. Satin exclusif.
                      </p>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono pt-1.5 border-t border-slate-850 text-slate-500">
                      <span>Catégorie: Lettres</span>
                      <span className="text-amber-400 font-bold">Zéro compression</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">Confiance : 95 %</span>
                      <span className="text-slate-500 font-bold">Observée 198 fois</span>
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-white">Texte &lt; 4 mm ➔ Travel Optimisé</h5>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Routage contour en continu pour éliminer les trims et maximiser la rapidité.
                      </p>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono pt-1.5 border-t border-slate-850 text-slate-500">
                      <span>Catégorie: Trajets</span>
                      <span className="text-emerald-400 font-bold">-15 % Temps machine</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHESSBOARD SELECTION */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
              <BookOpen className="text-violet-400 w-4 h-4" />
              Sélection du Motif de la Galerie DST
            </h3>
            <p className="text-[10px] text-slate-500">
              Sélectionnez un motif industriel réel pour lancer la comparaison et observer l'alignement.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {galleryItems.map((item) => {
                const isSelected = selectedGalleryId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedGalleryId(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[75px] ${
                      isSelected 
                        ? 'border-violet-500 bg-violet-500/10 shadow-md ring-1 ring-violet-500/30' 
                        : 'border-slate-850 bg-slate-950 hover:bg-slate-900/40'
                    }`}
                  >
                    <div>
                      <span className="text-[8px] font-mono font-bold text-slate-500 block uppercase">{item.category}</span>
                      <span className="text-xs font-black text-white block mt-1 truncate">{item.name}</span>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400 block mt-1">{item.dstFile}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Comparative Radar & Diagnostic Panel */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* COMPARATIVE ALIGNMENT SPEEDOMETERS (Math vs ISS) */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="pb-2 border-b border-slate-900">
              <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                <TrendingUp size={16} className="text-violet-400" />
                Index de Performance & Correspondance (TPI)
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Comparaison de l'intégrité de calcul pur et de l'alignement avec les pratiques industrielles.
              </p>
            </div>

            {/* DUAL SPEEDOMETER CONTAINER */}
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-900/50">
              
              {/* Speedometer 1: Mathematical Confidence */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative flex items-center justify-center w-28 h-28">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="#111827" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="#a855f7"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={289}
                      strokeDashoffset={289 - (289 * comparisonMetrics.confidenceMath) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xl font-black font-mono text-white">{comparisonMetrics.confidenceMath}%</span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold mt-0.5">Confidence</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-400 font-bold block">Qualité Mathématique</span>
                  <p className="text-[8px] text-slate-500 leading-tight">Fidélité géométrique d'ATCP aux vecteurs natifs.</p>
                </div>
              </div>

              {/* Speedometer 2: Industrial Similarity Score (ISS) */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative flex items-center justify-center w-28 h-28">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="#111827" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke={comparisonMetrics.closeness >= 95 ? '#10b981' : comparisonMetrics.closeness >= 85 ? '#06b6d4' : '#f59e0b'}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={289}
                      strokeDashoffset={289 - (289 * comparisonMetrics.closeness) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xl font-black font-mono text-white">{comparisonMetrics.closeness}%</span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold mt-0.5">ISS</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold block">ISS (Similarity Score)</span>
                  <p className="text-[8px] text-slate-500 leading-tight">Alignement physique avec le savoir-faire des pros.</p>
                </div>
              </div>

            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-400 text-[10px]">
                <span>Type d'Apprentissage :</span>
                <span className="text-slate-200 font-bold">Learning by Comparison</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[10px]">
                <span>Règles IKE Appliquées :</span>
                <span className="text-violet-400 font-bold">{activeRulesCount} active(s)</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-normal font-sans text-center pt-1.5 italic">
                💡 Activez des règles IKE (Étape 4) pour accroître l'Industrial Similarity Score (ISS).
              </p>
            </div>
          </div>

          {/* COMPILER MODULE ROBUSTNESS (Radar Chart or Math vs Industry Table) */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <div>
                <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                  <Activity size={16} className="text-cyan-400" />
                  Robustesse par Engine du Compilateur
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Analyse d'écart : Modélisation mathématique brute vs Standard Professionnel.
                </p>
              </div>

              {/* View Toggle */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex shrink-0">
                <button
                  onClick={() => setSelectedEngineView('table')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                    selectedEngineView === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Scores Table
                </button>
                <button
                  onClick={() => setSelectedEngineView('radar')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                    selectedEngineView === 'radar' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Radar Map
                </button>
              </div>
            </div>

            {selectedEngineView === 'radar' ? (
              <div className="h-[230px] w-full flex items-center justify-center font-mono text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                    <Radar name="ATCP" dataKey="ATCP" stroke="#38bdf8" fill="#0284c7" fillOpacity={0.4} />
                    <Radar name="Industrial Pro" dataKey="Pro" stroke="#f1f5f9" fill="#ffffff" fillOpacity={0.1} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="space-y-2.5">
                {[
                  { name: 'Geometry Engine', math: 99.1, ind: 98.4, desc: 'Fidélité vectorielle et splines' },
                  { name: 'Ribbon Engine', math: 98.2, ind: comparisonMetrics.scores.ribbon, desc: 'Axe médian et rubans satin' },
                  { name: 'Tatami Engine', math: 97.4, ind: comparisonMetrics.scores.tatami, desc: 'Sangles de remplissage adaptatives' },
                  { name: 'Satin Engine', math: 96.0, ind: comparisonMetrics.scores.satin, desc: 'Zigzags orthogonaux d\'onglet' },
                  { name: 'Travel Engine', math: 95.8, ind: comparisonMetrics.scores.travel, desc: 'Routage optimal et sauts de fil' },
                  { name: 'Physics Engine', math: 93.9, ind: comparisonMetrics.scores.physics, desc: 'Simulateur de tension matière' }
                ].map((engine) => (
                  <div key={engine.name} className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-900 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white font-sans">{engine.name}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-purple-400">Math: {engine.math}%</span>
                        <span className="text-slate-600">|</span>
                        <span className={engine.ind >= 95 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          Industrie: {engine.ind}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Double progress bar */}
                    <div className="space-y-1 mt-0.5">
                      <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden relative">
                        {/* Math progress bar */}
                        <div className="absolute top-0 left-0 h-full bg-purple-500/50" style={{ width: `${engine.math}%` }} />
                        {/* Industry progress bar */}
                        <div className="absolute top-0 left-0 h-[3px] bg-cyan-400" style={{ width: `${engine.ind}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-500 font-sans block">{engine.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TOP 10 DISCOVERED RULES LEADERBOARD */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="pb-2 border-b border-slate-900">
              <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                <Award size={16} className="text-amber-400" />
                TOP 10 des Règles Industrielles Découvertes
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Hiérarchie des comportements récurrents extraits des 3,000 DST d'atelier.
              </p>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {top10Rules.map((rule) => (
                <div key={rule.rank} className="p-2.5 bg-slate-900/30 rounded-xl border border-slate-850/60 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-500 font-black text-sm w-4">#{rule.rank}</span>
                    <div>
                      <span className="font-bold text-slate-200 block">{rule.name}</span>
                      <span className="text-[8px] text-slate-500 font-sans uppercase font-bold">{rule.category} • Observed {rule.count} times</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{rule.rate}% d'occurrence</span>
                    <span className="text-[8px] text-slate-500 uppercase">{rule.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MASTER DIGITIZER STYLE STUDY DOSSIER ("Étude d'un maître digitizer") */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950/20 p-6 rounded-2xl border border-slate-800/80 space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-850 relative z-10">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Users size={20} className="text-violet-400" />
              Dossier d'Étude Sémantique d'un Maître Digitizer (Style Profiler)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
              ATCP ne se contente pas d'apprendre des données brutes de fichiers isolés : il cartographie le style algorithmique propre à chaque maître artisan ou atelier. Sélectionnez un profil pour charger sa base de connaissances.
            </p>
          </div>

          {/* Profile Selectors */}
          <div className="flex gap-2 shrink-0 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            {digitizerProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedDigitizerProfile(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedDigitizerProfile === p.id 
                    ? 'bg-violet-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span>{p.avatar}</span>
                <span className="hidden sm:inline">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PROFILE CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
          
          {/* Left: Avatar Bio and statistics */}
          <div className="lg:col-span-4 p-5 bg-slate-950/60 rounded-xl border border-slate-850/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-violet-500/10 rounded-2xl border border-violet-500/30 flex items-center justify-center text-2xl shadow-inner">
                {activeProfile.avatar}
              </div>
              <div>
                <h4 className="font-bold text-white font-sans text-base leading-tight">{activeProfile.name}</h4>
                <span className="text-[10px] font-mono text-cyan-400 block uppercase tracking-wide">{activeProfile.specialty}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">{activeProfile.bio}</p>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-900 text-center">
              <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-900 font-mono">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Fichiers Analysés</span>
                <span className="text-lg font-black text-cyan-400">{activeProfile.analyzedFiles}+ DST</span>
              </div>
              <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-900 font-mono">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Heuristiques DNA</span>
                <span className="text-lg font-black text-violet-400">12 formulées</span>
              </div>
            </div>
          </div>

          {/* Right: Heuristic Style Details */}
          <div className="lg:col-span-8 space-y-3.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-wider block">
              Gènes d'habitudes physiques cartographiés par le TKG
            </span>

            <div className="space-y-2.5">
              {activeProfile.habits.map((habit, idx) => (
                <div key={idx} className="p-3 bg-slate-900/30 rounded-xl border border-slate-850/60 flex gap-3 text-xs leading-relaxed font-sans items-start hover:border-slate-800 transition-all">
                  <span className="w-5 h-5 rounded-full bg-violet-500/10 text-violet-400 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 border border-violet-500/20 mt-0.5">
                    0{idx+1}
                  </span>
                  <p className="text-slate-300">{habit}</p>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-emerald-950/10 rounded-xl border border-emerald-500/10 flex items-center justify-between text-xs">
              <span className="text-slate-400 leading-normal">
                💡 Vous souhaitez injecter la signature algorithmique de <strong>{activeProfile.name}</strong> directement dans notre compilateur de production ?
              </span>
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl transition-all font-mono shrink-0 flex items-center gap-1.5 ml-4">
                <ShieldCheck size={14} />
                Injecter Signature DNA
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

// Small custom helper component for rendering image/code icon
const ImageCodeIcon: React.FC = () => {
  return (
    <span className="w-3.5 h-3.5 flex items-center justify-center font-mono text-[9px] font-black border border-white/40 rounded px-1 leading-none">
      IMG
    </span>
  );
};
