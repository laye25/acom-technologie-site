import { doc, increment, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export type UsageType = 'reads' | 'writes' | 'ai_generations' | 'storage_mb';

export async function trackUsage(tenantId: string, type: UsageType, amount: number = 1) {
  if (!tenantId) return;

  const usageRef = doc(db, 'usage', tenantId);
  
  try {
    // Use setDoc with merge: true for atomic-like upsert
    // Note: increment works with setDoc merge: true
    await setDoc(usageRef, {
      [type]: increment(amount),
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error: any) {
    console.error('Error tracking usage:', error);
  }
}
