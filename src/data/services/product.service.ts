import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { mapProductFromFirestore } from "../mappers/product.mapper";

export async function getProductsByCategory(categoryId: string) {
  const q = query(
    collection(db, "studio_acom_products"),
    where("category_id", "==", categoryId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapProductFromFirestore);
}
