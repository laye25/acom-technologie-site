import { normalizeImage } from "../utils/normalize";

export function mapVariantFromFirestore(doc: any) {
  const data = doc.data();

  return {
    id: doc.id,
    productId: data.product_id || data.productId || "",
    name: data.name || "Variante sans nom",
    size: data.size || "",
    price: Number(data.price) || 0,
    templateId: data.template_id || data.templateId || "",
    previewImage: normalizeImage(data.preview_image || data.previewImage),
    minQuantity: data.min_quantity || data.minQuantity || 1,
    maxQuantity: data.max_quantity || data.maxQuantity || 1000,
    templateSvg: data.template_svg || data.templateSvg || "",
    format: data.format || "landscape",
  };
}

export function mapVariantToFirestore(variant: any) {
  return {
    product_id: variant.productId,
    name: variant.name,
    size: variant.size,
    price: variant.price,
    template_id: variant.templateId,
    preview_image: variant.previewImage || null,
    min_quantity: variant.minQuantity,
    max_quantity: variant.maxQuantity,
    template_svg: variant.templateSvg,
    format: variant.format,
  };
}
