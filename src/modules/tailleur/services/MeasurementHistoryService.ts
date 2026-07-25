/**
 * MeasurementHistoryService.ts
 * Service d'historique des prises de mesures pour les clients du SaaS Tailleur.
 * Conserve chaque profil de mesures (ex: "Mariage 2026", "Grand Boubou Tabaski", "Costume").
 * Permet le suivi temporel des évolutions morphologiques du client.
 */

export interface MeasurementProfile {
  id: string;
  clientId: string;
  clientName: string;
  profileName: string; // Ex: "Tenue Tabaski 2026", "Robe Mariage", "Costume Affaires"
  garmentId?: string;
  garmentName?: string;
  gender: 'Homme' | 'Femme';
  date: string; // ISO String
  timestamp: number;
  measurements: Record<string, number>;
  notes?: string;
  takenBy?: string; // Nom du couturier
}

export interface MeasurementComparisonItem {
  key: string;
  label: string;
  unit: string;
  oldValue: number | null;
  newValue: number | null;
  delta: number | null;
  status: 'increased' | 'decreased' | 'unchanged' | 'new';
}

export class MeasurementHistoryService {
  /**
   * Sauvegarde un nouveau profil de mesures pour un client
   */
  public static saveProfile(
    merchantId: string,
    profileData: Omit<MeasurementProfile, 'id' | 'date' | 'timestamp'>
  ): MeasurementProfile {
    const storageKey = `tailleur_measurement_history_${merchantId}`;

    const newProfile: MeasurementProfile = {
      ...profileData,
      id: `profile-${crypto.randomUUID()}`,
      date: new Date().toISOString(),
      timestamp: Date.now()
    };

    try {
      const existing = this.getProfilesForMerchant(merchantId);
      const updated = [newProfile, ...existing];
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Erreur sauvegarde historique mesures:', e);
    }

    return newProfile;
  }

  /**
   * Récupère tout l'historique des profils de mesures pour un marchand
   */
  public static getProfilesForMerchant(merchantId: string): MeasurementProfile[] {
    try {
      const storageKey = `tailleur_measurement_history_${merchantId}`;
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Récupère tous les profils de mesures d'un client spécifique
   */
  public static getProfilesForClient(merchantId: string, clientId: string): MeasurementProfile[] {
    const all = this.getProfilesForMerchant(merchantId);
    return all
      .filter((p) => p.clientId === clientId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Supprime un profil spécifique de l'historique
   */
  public static deleteProfile(merchantId: string, profileId: string): boolean {
    try {
      const storageKey = `tailleur_measurement_history_${merchantId}`;
      const all = this.getProfilesForMerchant(merchantId);
      const filtered = all.filter((p) => p.id !== profileId);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Compare deux profils de mesures et calcule les écarts (deltas en cm)
   */
  public static compareProfiles(
    oldProfile: MeasurementProfile,
    newProfile: MeasurementProfile,
    measurementLabels: Record<string, string>
  ): MeasurementComparisonItem[] {
    const allKeys = new Set([
      ...Object.keys(oldProfile.measurements || {}),
      ...Object.keys(newProfile.measurements || {})
    ]);

    const result: MeasurementComparisonItem[] = [];

    allKeys.forEach((key) => {
      const oldVal = oldProfile.measurements[key] ?? null;
      const newVal = newProfile.measurements[key] ?? null;

      let delta: number | null = null;
      let status: MeasurementComparisonItem['status'] = 'unchanged';

      if (oldVal !== null && newVal !== null) {
        delta = Math.round((newVal - oldVal) * 10) / 10;
        if (delta > 0) status = 'increased';
        else if (delta < 0) status = 'decreased';
      } else if (newVal !== null) {
        status = 'new';
      }

      result.push({
        key,
        label: measurementLabels[key] || key,
        unit: 'cm',
        oldValue: oldVal,
        newValue: newVal,
        delta,
        status
      });
    });

    return result;
  }
}
