import { useCallback } from 'react';

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
  const activeOthers: UserPresence[] = [];

  const updateMyPresence = useCallback(async (x: number, y: number) => {
    // Disabled to prevent massive writes
  }, []);

  return {
    others: activeOthers,
    updateMyPresence
  };
}
