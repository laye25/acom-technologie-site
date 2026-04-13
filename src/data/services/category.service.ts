import { categoryRepository } from "../repositories/category.repository";
import { mapCategoryFromFirestore } from "../mappers/category.mapper";

export async function getCategories() {
  const categories = await categoryRepository.getAll();
  // The repository returns raw data, we still use mappers for model consistency if needed
  // but the repository could also handle mapping internally.
  return categories; 
}
