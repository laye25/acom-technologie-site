import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreData } from './useFirestoreData';
import { firestoreService } from '../services/firestoreService';
import { serverTimestamp } from 'firebase/firestore';

export interface UserPresence {
  id: string;
  designId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  cursorX: number;
  cursorY: number;
  lastActive: any;
}

export function usePresence(designId: string | null) {
  const { user } = useAuth();
  const [myPresenceId, setMyPresenceId] = useState<string | null>(null);

  // Subscribe to other users' presence
  const { data: othersPresence } = useFirestoreData<UserPresence>({
    tableName: `designs/${designId}/presence` as any,
    skip: !designId,
    realtime: true
  });

  // Filter out my own presence from the list
  const activeOthers = othersPresence.filter(p => p.userId !== user?.uid);

  // Update my own presence
  const updateMyPresence = useCallback(async (x: number, y: number) => {
    if (!designId || !user) return;

    const presenceData = {
      designId,
      userId: user.uid,
      userName: user.displayName || 'Utilisateur',
      userPhoto: user.photoURL || '',
      cursorX: x,
      cursorY: y,
      lastActive: serverTimestamp()
    };

    try {
      if (myPresenceId) {
        await firestoreService.upsert(`designs/${designId}/presence`, myPresenceId, presenceData);
      } else {
        // Try to find if I already have a presence doc for this design
        const existing = othersPresence.find(p => p.userId === user.uid);
        if (existing) {
          setMyPresenceId(existing.id);
          await firestoreService.upsert(`designs/${designId}/presence`, existing.id, presenceData);
        } else {
          const newId = await firestoreService.add(`designs/${designId}/presence`, presenceData);
          setMyPresenceId(newId);
        }
      }
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  }, [designId, user, myPresenceId, othersPresence]);

  // Clean up presence on unmount
  useEffect(() => {
    return () => {
      if (myPresenceId && designId) {
        firestoreService.delete(`designs/${designId}/presence`, myPresenceId).catch(console.error);
      }
    };
  }, [myPresenceId, designId]);

  // Periodic heartbeat to keep presence alive (optional, but good for cleanup of stale docs)
  useEffect(() => {
    if (!designId || !user || !myPresenceId) return;

    const interval = setInterval(() => {
      firestoreService.upsert(`designs/${designId}/presence`, myPresenceId, {
        lastActive: serverTimestamp()
      }).catch(console.error);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [designId, user, myPresenceId]);

  return {
    others: activeOthers,
    updateMyPresence
  };
}
