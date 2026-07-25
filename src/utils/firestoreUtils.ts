/**
 * firestoreUtils.ts
 * Utility function to sanitize objects before sending them to Firebase Firestore.
 * Removes all `undefined` values recursively to prevent Firestore runtime errors.
 */

export function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) return null as unknown as T;
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data.toISOString() as unknown as T;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      clean[key] = sanitizeFirestoreData(value);
    }
  }
  return clean as T;
}
