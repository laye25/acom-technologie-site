import { normalizeImage } from "../utils/normalize";

export function mapCategoryFromFirestore(doc: any) {
  const data = doc.data();

  return {
    id: doc.id,
    name: data.name || "",
    coverImage: normalizeImage(
      data.cover_image || data.coverImage
    ),
    createdAt: data.created_at?.toDate?.() || null,
  };
}

export function mapCategoryToFirestore(category: any) {
  return {
    name: category.name,
    cover_image: category.coverImage || null,
    created_at: new Date(),
  };
}
