export interface Product {
  id: string;
  name: string;
  categoryId: string;
  coverImage: string;
  price?: number;
  createdAt?: Date;
}
