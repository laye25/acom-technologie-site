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
    id: 'goodies',
    name: 'Goodies',
    sub: "Cadeaux d'affaires, stylos, t-shirts, mugs et objets personnalisés.",
    icon: Sparkles,
    color: 'text-amber-500',
    coverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80'
  },
  {
    id: 'marketing_pub',
    name: 'Marketing & Publicité',
    sub: 'Flyers, dépliants, affiches, rollups et supports promotionnels.',
    icon: Megaphone,
    color: 'text-blue-500',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80'
  },
  {
    id: 'papeterie_bureau',
    name: 'Papeterie & Bureautique',
    sub: 'Cartes de visite, papier en-tête, enveloppes, tampons et blocs-notes.',
    icon: FolderOpen,
    color: 'text-emerald-500',
    coverImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80'
  },
  {
    id: 'signaletique',
    name: 'Signalétique',
    sub: 'Enseignes lumineuses, bâches grand format, panneaux de chantier et marquage véhicule.',
    icon: Building2,
    color: 'text-rose-500',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80'
  }
];

export const INITIAL_PRODUCTS: Product[] = [];
