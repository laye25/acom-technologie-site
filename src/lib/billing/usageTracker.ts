import { doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export type UsageType = 'reads' | 'writes' | 'ai_generations' | 'storage_mb';

export async function trackUsage(tenantId: string, type: UsageType, amount: number = 1) {
  if (!tenantId) return;

  const usageRef = doc(db, 'usage', tenantId);
  
  try {
    // Optimistic update
    await updateDoc(usageRef, {
      [type]: increment(amount),
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    // If document doesn't exist, create it
    if (error.code === 'not-found') {
      await setDoc(usageRef, {
        tenantId,
        reads: 0,
        writes: 0,
        ai_generations: 0,
        storage_mb: 0,
        [type]: amount,
        lastUpdated: new Date().toISOString()
      });
    } else {
      console.error('Error tracking usage:', error);
    }
  }
}
