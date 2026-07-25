/**
 * ClientProfileService.ts
 * Service centralisé pour la gestion et la synchronisation du profil Client Couture.
 * Constitue la source de vérité unique pour les données d'identification client,
 * le modèle de vêtement préféré et le profil de mesures actif.
 */

import { MeasurementHistoryService, MeasurementProfile } from './MeasurementHistoryService';

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  gender: 'M' | 'F' | 'Homme' | 'Femme';
  preferredGarment?: string;
  garmentId?: string;
  garmentName?: string;
  category?: string;
  measurements?: Record<string, number | string>;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  syncStatus?: 'pending' | 'synced' | 'error';
}

export class ClientProfileService {
  /**
   * Clé localStorage pour les clients
   */
  private static getStorageKey(merchantId: string): string {
    return `tailleur_clients_${merchantId}`;
  }

  /**
   * Récupère tous les clients actifs pour un atelier
   */
  public static getAllClients(merchantId: string): ClientProfile[] {
    try {
      const saved = localStorage.getItem(this.getStorageKey(merchantId));
      if (!saved) return [];
      const list: ClientProfile[] = JSON.parse(saved);
      return list.filter((c) => !c.isDeleted);
    } catch (e) {
      console.error('Erreur chargement clients:', e);
      return [];
    }
  }

  /**
   * Récupère un client par son ID
   */
  public static getClientById(merchantId: string, clientId: string): ClientProfile | null {
    const clients = this.getAllClients(merchantId);
    return clients.find((c) => c.id === clientId) || null;
  }

  /**
   * Sauvegarde ou met à jour un profil client
   */
  public static saveClient(merchantId: string, clientData: Partial<ClientProfile>): ClientProfile {
    const storageKey = this.getStorageKey(merchantId);
    let allClients: ClientProfile[] = [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) allClients = JSON.parse(saved);
    } catch (e) {
      allClients = [];
    }

    const now = new Date().toISOString();
    let updatedClient: ClientProfile;

    if (clientData.id) {
      const index = allClients.findIndex((c) => c.id === clientData.id);
      if (index >= 0) {
        updatedClient = {
          ...allClients[index],
          ...clientData,
          updatedAt: now,
          syncStatus: 'pending'
        };
        allClients[index] = updatedClient;
      } else {
        updatedClient = {
          id: clientData.id,
          firstName: clientData.firstName || '',
          lastName: clientData.lastName || '',
          gender: clientData.gender || 'M',
          measurements: clientData.measurements || {},
          ...clientData,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending'
        } as ClientProfile;
        allClients.unshift(updatedClient);
      }
    } else {
      const newId = `cli-${crypto.randomUUID()}`;
      updatedClient = {
        id: newId,
        firstName: clientData.firstName || '',
        lastName: clientData.lastName || '',
        gender: clientData.gender || 'M',
        measurements: clientData.measurements || {},
        ...clientData,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending'
      } as ClientProfile;
      allClients.unshift(updatedClient);
    }

    localStorage.setItem(storageKey, JSON.stringify(allClients));
    return updatedClient;
  }

  /**
   * Met à jour les mesures de référence du client et consigne un historique
   */
  public static updateClientMeasurements(
    merchantId: string,
    clientId: string,
    newMeasurements: Record<string, number | string>,
    garmentInfo?: { garmentId?: string; garmentName?: string; profileName?: string }
  ): ClientProfile | null {
    const client = this.getClientById(merchantId, clientId);
    if (!client) return null;

    const mergedMeasurements = {
      ...(client.measurements || {}),
      ...newMeasurements
    };

    const updatedClient = this.saveClient(merchantId, {
      id: clientId,
      measurements: mergedMeasurements,
      garmentId: garmentInfo?.garmentId || client.garmentId,
      garmentName: garmentInfo?.garmentName || client.garmentName || client.preferredGarment,
      preferredGarment: garmentInfo?.garmentName || client.preferredGarment
    });

    // Consigner la mise à jour dans MeasurementHistoryService
    try {
      const numericMeasurements: Record<string, number> = {};
      Object.entries(mergedMeasurements).forEach(([k, v]) => {
        const num = Number(v);
        if (!isNaN(num) && num > 0) {
          numericMeasurements[k] = num;
        }
      });

      MeasurementHistoryService.saveProfile(merchantId, {
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`.trim(),
        profileName: garmentInfo?.profileName || `Mise à jour Fiche Client (${new Date().toLocaleDateString('fr-FR')})`,
        garmentId: garmentInfo?.garmentId || client.garmentId,
        garmentName: garmentInfo?.garmentName || client.preferredGarment,
        gender: (client.gender === 'F' || client.gender === 'Femme') ? 'Femme' : 'Homme',
        measurements: numericMeasurements,
        notes: `Mesures de référence synchronisées avec la fiche client.`
      });
    } catch (e) {
      console.error('Erreur consignation historique mesures client:', e);
    }

    return updatedClient;
  }

  /**
   * Met à jour le modèle préféré / vêtement actif du client
   */
  public static updateClientPreferredGarment(
    merchantId: string,
    clientId: string,
    garment: { id: string; name: string; category?: string }
  ): ClientProfile | null {
    return this.saveClient(merchantId, {
      id: clientId,
      garmentId: garment.id,
      garmentName: garment.name,
      preferredGarment: garment.name,
      category: garment.category
    });
  }
}
