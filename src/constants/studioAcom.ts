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

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_PRODUCTS: Product[] = [];
