import { useMemo } from 'react';
import { GarmentResolverService, ResolvedGarmentInfo } from '../services/GarmentResolverService';

/**
 * Hook React réutilisable garantissant la résolution unique et synchrone
 * du Modèle / Vêtement à Confectionner pour un client donné.
 */
export function useClientGarment(
  clientData: any,
  merchantId: string = 'default',
  selectedProfileId?: string
): ResolvedGarmentInfo {
  return useMemo(() => {
    return GarmentResolverService.resolveClientGarment(clientData, merchantId, selectedProfileId);
  }, [clientData, merchantId, selectedProfileId]);
}
