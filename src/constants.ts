import { Service, BlogPost } from './types';

export const SERVICES: Service[] = [
  // Acom SaaS (Digital)
  {
    id: 'web-dev-basic',
    name: 'Site Web Vitrine',
    description: 'Un site web moderne et responsive pour présenter votre activité.',
    price: 150000,
    category: 'digital',
    subCategory: 'Web & Plateformes',
    pillar: 'saas',
    image: 'https://picsum.photos/seed/web/800/600',
    features: ['Design Responsive', 'Optimisation SEO', 'Formulaire de Contact', 'Hébergement 1 an']
  },
  {
    id: 'ecommerce-platform',
    name: 'Plateforme E-commerce',
    description: 'Vendez vos produits en ligne avec une solution complète et sécurisée.',
    price: 450000,
    category: 'digital',
    subCategory: 'Web & Plateformes',
    pillar: 'saas',
    image: 'https://picsum.photos/seed/ecommerce/800/600',
    features: ['Gestion de Stock', 'Paiement Mobile Money', 'Dashboard Admin', 'Notifications SMS']
  },
  {
    id: 'mobile-app',
    name: 'Application Mobile',
    description: 'Développement d\'applications iOS et Android sur mesure.',
    price: 800000,
    category: 'digital',
    subCategory: 'Développement Logiciel',
    pillar: 'saas',
    image: 'https://picsum.photos/seed/mobile/800/600',
    features: ['Interface Intuitive', 'Notifications Push', 'Mode Hors-ligne', 'Publication Stores']
  },
  {
    id: 'software-management',
    name: 'Logiciel de Gestion',
    description: 'Conception de logiciels sur mesure pour la gestion de votre entreprise (Stock, RH, Facturation).',
    price: 500000,
    category: 'digital',
    subCategory: 'Développement Logiciel',
    pillar: 'saas',
    image: 'https://picsum.photos/seed/software/800/600',
    features: ['Base de données sécurisée', 'Rapports automatisés', 'Multi-utilisateurs', 'Support technique']
  },
  
  // Acom Studio (Marketing & Design)
  {
    id: 'social-media-pack',
    name: 'Pack Réseaux Sociaux',
    description: 'Gestion professionnelle de vos pages Facebook et Instagram.',
    price: 75000,
    category: 'marketing',
    pillar: 'studio',
    image: 'https://picsum.photos/seed/social/800/600',
    features: ['3 posts par semaine', 'Gestion des commentaires', 'Publicité ciblée', 'Rapport mensuel']
  },
  {
    id: 'seo-optimization',
    name: 'Référencement SEO',
    description: 'Améliorez votre visibilité sur Google et attirez plus de clients.',
    price: 120000,
    category: 'marketing',
    pillar: 'studio',
    image: 'https://picsum.photos/seed/seo/800/600',
    features: ['Audit technique', 'Recherche mots-clés', 'Optimisation on-page', 'Backlinks']
  },
  {
    id: 'video-pub',
    name: 'Vidéo Publicitaire',
    description: 'Création de spots publicitaires dynamiques pour vos réseaux sociaux et la TV.',
    price: 150000,
    category: 'marketing',
    pillar: 'studio',
    image: 'https://picsum.photos/seed/video/800/600',
    features: ['Montage pro', 'Motion design', 'Voix off', 'Format Story/Reels']
  },

  // Acom Studio (Design & Print)
  {
    id: 'business-cards',
    name: 'Cartes de Visite',
    description: 'Impression de cartes de visite professionnelles haute qualité.',
    price: 15000,
    category: 'design',
    subCategory: 'Impression & Marquage',
    pillar: 'studio',
    image: 'https://picsum.photos/seed/cards/800/600',
    features: ['Papier 350g', 'Recto/Verso', 'Finition Mate ou Brillante', 'Livraison incluse'],
    isPrintProduct: true,
    hasTemplate: true,
    templateId: 'business-card-modern',
    quantityTiers: [
      { quantity: 100, price: 15000 },
      { quantity: 250, price: 25000 },
      { quantity: 500, price: 40000 },
      { quantity: 1000, price: 70000 }
    ],
    printOptions: [
      {
        id: 'finish',
        label: 'Finition',
        options: [
          { label: 'Mate', priceModifier: 0 },
          { label: 'Brillante', priceModifier: 0 },
          { label: 'Vernis Sélectif', priceModifier: 5000 }
        ]
      },
      {
        id: 'corners',
        label: 'Coins',
        options: [
          { label: 'Carrés', priceModifier: 0 },
          { label: 'Arrondis', priceModifier: 2000 }
        ]
      }
    ]
  },
  {
    id: 'flyers-a5',
    name: 'Flyers A5',
    description: 'Idéal pour vos promotions et événements locaux.',
    price: 35000,
    category: 'design',
    subCategory: 'Impression & Marquage',
    pillar: 'studio',
    image: 'https://picsum.photos/seed/flyer/800/600',
    features: ['Format A5', 'Papier 135g', 'Couleurs éclatantes', 'Distribution facile'],
    isPrintProduct: true,
    hasTemplate: true,
    templateId: 'flyer-promo-1',
    quantityTiers: [
      { quantity: 500, price: 35000 },
      { quantity: 1000, price: 55000 },
      { quantity: 2500, price: 110000 },
      { quantity: 5000, price: 180000 }
    ]
  },
  {
    id: 'brand-identity',
    name: 'Identité Visuelle',
    description: 'Création de logo et charte graphique complète pour votre marque.',
    price: 100000,
    category: 'design',
    subCategory: 'Impression & Marquage',
    pillar: 'studio',
    image: 'https://picsum.photos/seed/brand/800/600',
    features: ['3 concepts de logo', 'Cartes de visite', 'Brochure et flyer', 'Charte graphique']
  },
  {
    id: 'serigraphie-dtf-flocage',
    name: 'Sérigraphie, DTF & Flocage',
    description: 'Impression de haute qualité et personnalisation textile (T-shirts, sacs, objets publicitaires) via sérigraphie, DTF ou flocage.',
    price: 5000,
    category: 'design',
    subCategory: 'Impression & Marquage',
    pillar: 'studio',
    image: 'https://picsum.photos/seed/print-shop/800/600',
    features: ['Couleurs éclatantes', 'Rendu photo (DTF)', 'Texture velours (Flocage)', 'Tous supports', 'Prix dégressifs']
  },
  {
    id: 'tirage-numerique',
    name: 'Tirage Numérique',
    description: 'Impression numérique grand format sur bâche, vinyle adhésif et micro-perforé (one way).',
    price: 15000,
    category: 'design',
    subCategory: 'Impression & Marquage',
    pillar: 'studio',
    image: 'https://picsum.photos/seed/digital-print/800/600',
    features: ['Bâche publicitaire', 'Vinyle adhésif', 'Micro-perforé (One Way)', 'Haute résolution', 'Résistant aux UV']
  },
  {
    id: 'enseigne',
    name: 'Création d\'Enseignes',
    description: 'Conception et installation d\'enseignes lumineuses et panneaux publicitaires.',
    price: 200000,
    category: 'design',
    subCategory: 'Signalétique',
    pillar: 'studio',
    image: 'https://picsum.photos/seed/sign/800/600',
    features: ['Enseignes LED', 'Lettres boîtiers', 'Panneaux 4x3', 'Installation incluse']
  },

  // Événementiel
  {
    id: 'evenementiel',
    name: 'Événementiel',
    description: 'Organisation et couverture médiatique de vos événements professionnels et privés.',
    price: 250000,
    category: 'event',
    pillar: 'studio',
    image: 'https://picsum.photos/seed/event/800/600',
    features: ['Planification complète', 'Sonorisation & Lumière', 'Hôtesses d\'accueil', 'Gestion logistique']
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'digital-transformation-2024',
    title: 'La Transformation Digitale au Sénégal : Enjeux et Opportunités',
    excerpt: 'Comment les entreprises sénégalaises peuvent tirer profit des nouvelles technologies pour booster leur croissance.',
    content: `
      <p>La transformation digitale n'est plus une option, mais une nécessité pour les entreprises qui souhaitent rester compétitives dans l'économie moderne. Au Sénégal, ce mouvement s'accélère, porté par une jeunesse dynamique et une connectivité en constante amélioration.</p>
      
      <h2>Pourquoi passer au digital ?</h2>
      <p>Le passage au numérique permet d'optimiser les processus internes, d'améliorer la relation client et d'ouvrir de nouveaux marchés. Que ce soit à travers un site e-commerce ou une application de gestion, les bénéfices sont tangibles.</p>
      
      <h2>Les défis à relever</h2>
      <p>Malgré l'enthousiasme, des défis sous-jacents subsistent : la cybersécurité, la formation des équipes et l'accès au financement pour les startups technologiques.</p>
      
      <h2>Conclusion</h2>
      <p>Acom Technologie accompagne les PME dans cette transition en proposant des solutions sur mesure, adaptées au contexte local.</p>
    `,
    author: 'Abdoulaye Ndiaye',
    date: '10 Mars 2024',
    image: 'https://picsum.photos/seed/blog1/800/600',
    category: 'Technologie',
    readTime: '5 min'
  },
  {
    id: 'importance-visual-identity',
    title: 'L\'Importance d\'une Identité Visuelle Forte pour votre Marque',
    excerpt: 'Pourquoi votre logo et votre charte graphique sont les premiers ambassadeurs de votre entreprise.',
    content: `
      <p>Votre identité visuelle est bien plus qu'un simple dessin. C'est la première impression que vous laissez à vos clients potentiels.</p>
      
      <h2>La psychologie des couleurs</h2>
      <p>Le choix des couleurs n'est pas anodin. Le bleu inspire la confiance, le rouge l'énergie, et le vert la croissance. Il est crucial d'aligner ces choix avec vos valeurs.</p>
      
      <h2>La cohérence sur tous les supports</h2>
      <p>De votre carte de visite à votre site web, votre image doit être cohérente. Une charte graphique bien définie assure cette uniformité.</p>
    `,
    author: 'Fatou Sow',
    date: '5 Mars 2024',
    image: 'https://picsum.photos/seed/blog2/800/600',
    category: 'Design',
    readTime: '4 min'
  },
  {
    id: 'seo-tips-for-local-business',
    title: '5 Conseils SEO pour booster votre visibilité locale',
    excerpt: 'Apprenez comment apparaître dans les premiers résultats de recherche Google au Sénégal.',
    content: `
      <p>Le SEO local est essentiel pour les commerces de proximité. Voici comment optimiser votre présence en ligne.</p>
      
      <h2>1. Google My Business</h2>
      <p>C'est l'outil indispensable. Assurez-vous que vos informations sont à jour et encouragez les avis clients.</p>
      
      <h2>2. Mots-clés locaux</h2>
      <p>Utilisez des mots-clés incluant votre ville ou quartier (ex: "Développeur web Dakar").</p>
    `,
    author: 'Moussa Diop',
    date: '1 Mars 2024',
    image: 'https://picsum.photos/seed/blog3/800/600',
    category: 'Marketing',
    readTime: '6 min'
  }
];

export const PORTFOLIO_ITEMS = [
  { id: 'p1', title: 'ShopDirect E-commerce', category: 'Web Development', image: 'https://picsum.photos/seed/p1/800/600', order: 0 },
  { id: 'p2', title: 'App de Livraison', category: 'Mobile App', image: 'https://picsum.photos/seed/p2/800/600', order: 1 },
  { id: 'p3', title: 'Identité Visuelle Acom', category: 'Branding', image: 'https://picsum.photos/seed/p3/800/600', order: 2 },
  { id: 'p4', title: 'Campagne Marketing', category: 'Digital Marketing', image: 'https://picsum.photos/seed/p4/800/600', order: 3 },
  { id: 'p5', title: 'SaaS Immobilier', category: 'Software', image: 'https://picsum.photos/seed/p5/800/600', order: 4 },
  { id: 'p6', title: 'Magazine Digital', category: 'Design', image: 'https://picsum.photos/seed/p6/800/600', order: 5 },
];

export const DEFAULT_SETTINGS = {
  heroSlides: [
    {
      id: '1',
      title: 'Solutions Digitales Innovantes',
      subtitle: 'Nous transformons vos idées en réalité numérique avec passion et expertise.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80',
      color: 'from-indigo-600 to-blue-700',
      badge: 'Acom Studio',
      icon: 'Rocket'
    },
    {
      id: '2',
      title: 'Design & Identité Visuelle',
      subtitle: 'Créez une image de marque forte qui marque les esprits et dure dans le temps.',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80',
      color: 'from-purple-600 to-pink-600',
      badge: 'Design Créatif',
      icon: 'Palette'
    },
    {
      id: '3',
      title: 'Marketing & Stratégie',
      subtitle: 'Boostez votre visibilité et atteignez vos objectifs de croissance.',
      image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80',
      color: 'from-emerald-600 to-teal-700',
      badge: 'Croissance Accélérée',
      icon: 'TrendingUp'
    }
  ],
  footer: {
    description: 'Acom Technologie est votre partenaire de confiance pour tous vos besoins en développement digital, marketing et design.',
    address: 'Dakar, Sénégal',
    phone: '+221 77 123 45 67',
    email: 'contact@acomtechnologie.com',
    socialLinks: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com'
    }
  },
  theme: {
    primaryColor: '#4f46e5',
    secondaryColor: '#10b981'
  }
};
