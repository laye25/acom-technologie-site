import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { mapVariantFromFirestore } from "../mappers/variant.mapper";

export async function getVariantsByProduct(productId: string) {
  const q = query(
    collection(db, "variants"),
    where("product_id", "==", productId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapVariantFromFirestore);
}
