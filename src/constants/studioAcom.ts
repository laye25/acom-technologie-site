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

export const INITIAL_PRODUCTS: Product[] = [];
