import admin from 'firebase-admin';

export const trackUsage = async (tenantId: string, type: 'reads' | 'writes' | 'ai_generations' | 'storage_mb') => {
  try {
    const db = admin.firestore();
    const ref = db.collection('usage').doc(tenantId);
    await ref.set({
      [type]: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error(`[Billing] Failed to track usage for ${tenantId}:`, error);
  }
};
