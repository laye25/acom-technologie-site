import { normalizeImage } from "../utils/normalize";

export function mapProductFromFirestore(doc: any) {
  const data = doc.data();

  return {
    id: doc.id,
    name: data.name || "",
    categoryId: data.category_id || "",
    coverImage: normalizeImage(
      data.cover_image || data.coverImage
    ),
    price: data.price || 0,
    createdAt: data.created_at?.toDate?.() || null,
  };
}

export function mapProductToFirestore(product: any) {
  return {
    name: product.name,
    category_id: product.categoryId,
    cover_image: product.coverImage || null,
    price: product.price || 0,
    created_at: new Date(),
  };
}
