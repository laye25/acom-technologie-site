import { 
  Sparkles, Star, LayoutGrid, FolderOpen, Contact2, Megaphone, Building2 
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  sub: string;
  icon: any;
  color: string;
  coverImage?: string;
}

export interface Variant {
  id: string;
  productId: string;
  name: string;
  size: string;
  color: string;
  shape: string;
  format: 'portrait' | 'landscape';
  finish: string;
  templateId: string;
  previewImage: string;
  price: number;
  minQuantity: number;
  maxQuantity: number;
  templateSvg: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  coverImage: string;
  userId?: string;
  variants: Variant[];
}

export const INITIAL_CATEGORIES: Category[] = [
  { 
    id: 'print', 
    name: 'Papeterie & Bureautique', 
    sub: 'Cartes, papier en-tête, enveloppes...', 
    icon: Contact2, 
    color: 'text-orange-500',
    coverImage: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'marketing', 
    name: 'Marketing & Publicité', 
    sub: 'Flyers, dépliants, affiches...', 
    icon: Megaphone, 
    color: 'text-red-500',
    coverImage: 'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'goodies', 
    name: 'Signalétique & Goodies', 
    sub: 'Roll-ups, mugs, étiquettes...', 
    icon: Building2, 
    color: 'text-emerald-500',
    coverImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800'
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  // Papeterie & Bureautique
  {
    id: 'business-card',
    name: 'Carte de Visite',
    categoryId: 'print',
    description: 'Impression de cartes de visite professionnelles de haute qualité.',
    coverImage: 'https://picsum.photos/seed/card1/600/400',
    variants: [
      {
        id: 'bc-corporate',
        productId: 'business-card',
        name: 'Design Corporate',
        size: '85x55 mm',
        color: 'Bleu / Blanc',
        shape: 'Rectangulaire',
        format: 'landscape',
        finish: 'Mat',
        templateId: 'acom-bc-corporate',
        previewImage: 'https://picsum.photos/seed/bc1/400/250',
        price: 25,
        minQuantity: 100,
        maxQuantity: 1000,
        templateSvg: '<svg>...</svg>'
      },
      {
        id: 'bc-modern',
        productId: 'business-card',
        name: 'Design Moderne',
        size: '90x50 mm',
        color: 'Noir / Or',
        shape: 'Rectangulaire',
        format: 'landscape',
        finish: 'Brillant',
        templateId: 'acom-bc-modern',
        previewImage: 'https://picsum.photos/seed/bc2/400/250',
        price: 30,
        minQuantity: 100,
        maxQuantity: 1000,
        templateSvg: '<svg>...</svg>'
      },
      {
        id: 'bc-creative',
        productId: 'business-card',
        name: 'Design Créatif',
        size: '85x55 mm',
        color: 'Multicolore',
        shape: 'Coins arrondis',
        format: 'portrait',
        finish: 'Soft Touch',
        templateId: 'acom-bc-creative',
        previewImage: 'https://picsum.photos/seed/bc3/400/250',
        price: 35,
        minQuantity: 100,
        maxQuantity: 1000,
        templateSvg: '<svg>...</svg>'
      },
    ]
  },
  {
    id: 'letterhead',
    name: 'Papier En-tête A4',
    categoryId: 'print',
    description: 'Papier à lettres personnalisé pour votre entreprise.',
    coverImage: 'https://picsum.photos/seed/letter/600/400',
    variants: [
      {
        id: 'lh-classic',
        productId: 'letterhead',
        name: 'Classique',
        size: 'A4',
        color: 'Blanc',
        shape: 'Standard',
        format: 'portrait',
        finish: '90g Offset',
        templateId: 'acom-letterhead-clean',
        previewImage: 'https://picsum.photos/seed/lh1/400/560',
        price: 45,
        minQuantity: 100,
        maxQuantity: 1000,
        templateSvg: '<svg>...</svg>'
      }
    ]
  },
  // Marketing & Publicité
  {
    id: 'flyer-a5',
    name: 'Flyer A5',
    categoryId: 'marketing',
    description: 'Flyers publicitaires pour vos événements et promotions.',
    coverImage: 'https://picsum.photos/seed/flyer/600/400',
    variants: [
      {
        id: 'fl-event',
        productId: 'flyer-a5',
        name: 'Événementiel',
        size: 'A5',
        color: 'Vif',
        shape: 'Standard',
        format: 'portrait',
        finish: '135g Brillant',
        templateId: 'acom-flyer-vibrant',
        previewImage: 'https://picsum.photos/seed/fl1/400/560',
        price: 55,
        minQuantity: 100,
        maxQuantity: 1000,
        templateSvg: '<svg>...</svg>'
      }
    ]
  }
];
