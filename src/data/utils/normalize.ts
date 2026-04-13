import { DEFAULT_IMAGE } from "../constants/image";

export function normalizeImage(url?: string) {
  return url || DEFAULT_IMAGE;
}
