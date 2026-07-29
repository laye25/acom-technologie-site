import { Merchant, MerchantPlan, SaasAccessStatus, SaasSubscription } from '../types';
import { SAAS_ROUTES, getSaasRouteConfig, logSaasNavigation } from '../utils/saasRoutes';
import { dbService } from './dbService';
import { ContextEngine } from '../ai-demo/Intelligence/ContextEngine';
import toast from 'react-hot-toast';

export interface SaasCatalogItem {
  type: string;
  label: string;
  description: string;
  dashboardRoute: string;
  aliases: string[];
  minPlan: MerchantPlan;
}

export const SAAS_CATALOG: Record<string, SaasCatalogItem> = {
  stock: {
    type: 'stock',
    label: 'Gestion de Stock (Commerce / Boutique)',
    description: 'Gestion complète des stocks, ventes comptoir POS, caisse, inventaire et réapprovisionnements.',
    dashboardRoute: '/merchant-dashboard',
    aliases: ['boutique', 'commerce'],
    minPlan: 'FREE'
  },
  pressing: {
    type: 'pressing',
    label: 'Gestion Pressing & Laverie',
    description: 'Fiches de réception client, suivi de nettoyage au kilo/pièce, tickets d\'encaissement et livraisons.',
    dashboardRoute: '/pressing-dashboard',
    aliases: ['laverie', 'blanchisserie'],
    minPlan: 'FREE'
  },
  couture: {
    type: 'couture',
    label: 'Gestion Couture & Sur-Mesure (Tailleur)',
    description: 'Carnet de mesures clients, gestion d\'atelier, broderie AEE, mercerie et commandes de sur-mesure.',
    dashboardRoute: '/tailor-dashboard',
    aliases: ['tailleur', 'broderie'],
    minPlan: 'BASIC'
  },
  medical: {
    type: 'medical',
    label: 'Gestion Médicale & Santé',
    description: 'Gestion des dossiers patients, agenda de consultations, ordonnances et suivi des actes médicaux.',
    dashboardRoute: '/medical-dashboard',
    aliases: ['sante', 'clinique'],
    minPlan: 'BASIC'
  },
  school: {
    type: 'school',
    label: 'Gestion Scolaire & Éducation',
    description: 'Gestion des élèves, inscriptions, portail parents & enseignants, bulletins et suivi des frais scolaires.',
    dashboardRoute: '/school-dashboard',
    aliases: ['scolaire', 'ecole'],
    minPlan: 'STANDARD'
  },
  transport: {
    type: 'transport',
    label: 'Gestion Transport & Flotte',
    description: 'Suivi des véhicules, maintenance, courses, réservations et gestion des chauffeurs.',
    dashboardRoute: '/transport-dashboard',
    aliases: ['flotte'],
    minPlan: 'STANDARD'
  },
  rh: {
    type: 'rh',
    label: 'Gestion RH & Recrutement',
    description: 'Gestion des candidats, entretiens, fiches de paie, présences et dossiers du personnel.',
    dashboardRoute: '/hr-dashboard',
    aliases: ['recrutement'],
    minPlan: 'STANDARD'
  },
  btp: {
    type: 'btp',
    label: 'Gestion Chantier & BTP',
    description: 'Suivi des chantiers BTP, approvisionnement matériel, devis d\'ingénierie et sous-traitants.',
    dashboardRoute: '/construction-dashboard',
    aliases: ['chantier', 'entreprise'],
    minPlan: 'PREMIUM'
  }
};

class SaasSubscriptionService {
  /**
   * Returns maximum allowed active SaaS count for a given subscription plan
   */
  public getMaxAllowedSaasForPlan(plan?: MerchantPlan): number {
    switch (plan) {
      case 'FREE':
        return 1;
      case 'BASIC':
        return 2;
      case 'STANDARD':
        return 5;
      case 'PREMIUM':
      case 'LOCAL':
        return 99;
      default:
        return 1;
    }
  }

  /**
   * Resolves full list of SaaS subscription statuses for a merchant
   */
  public getMerchantSaasSubscriptions(merchant: Merchant): Record<string, SaasSubscription> {
    const subs: Record<string, SaasSubscription> = {};
    const primaryType = getSaasRouteConfig(merchant.type).type;

    // Existing allowedSaas array or fallback
    const allowedList = new Set<string>(
      merchant.allowedSaas && merchant.allowedSaas.length > 0 
        ? merchant.allowedSaas.map(t => getSaasRouteConfig(t).type)
        : [primaryType]
    );

    // Populate catalog items
    Object.keys(SAAS_CATALOG).forEach((saasKey) => {
      if (merchant.saasSubscriptions && merchant.saasSubscriptions[saasKey]) {
        subs[saasKey] = { ...merchant.saasSubscriptions[saasKey] };
      } else if (allowedList.has(saasKey) || saasKey === primaryType) {
        subs[saasKey] = {
          saasType: saasKey,
          status: 'active',
          plan: merchant.plan || 'FREE',
          addedAt: merchant.createdAt || new Date().toISOString()
        };
      } else {
        subs[saasKey] = {
          saasType: saasKey,
          status: 'subscription_required',
          plan: merchant.plan || 'FREE',
          addedAt: null
        };
      }
    });

    return subs;
  }

  /**
   * Get list of currently active SaaS types for a merchant
   */
  public getActiveSaasTypes(merchant: Merchant): string[] {
    const subs = this.getMerchantSaasSubscriptions(merchant);
    return Object.keys(subs).filter(key => subs[key].status === 'active');
  }

  /**
   * Switch the active SaaS module for a merchant
   */
  public async switchActiveSaas(merchant: Merchant, targetSaasType: string, userName?: string): Promise<Merchant> {
    const config = getSaasRouteConfig(targetSaasType);
    const normalizedTarget = config.type;

    const subs = this.getMerchantSaasSubscriptions(merchant);
    const targetSub = subs[normalizedTarget];

    if (!targetSub || targetSub.status !== 'active') {
      throw new Error(`Accès refusé : Le SaaS "${config.label}" n'est pas actif pour votre compte.`);
    }

    const updatedMerchant: Merchant = {
      ...merchant,
      type: normalizedTarget,
      updatedAt: new Date()
    };

    await dbService.merchants.save(updatedMerchant);

    // Update global AI context
    ContextEngine.updateContext({
      activeSaaS: normalizedTarget as any,
      merchantId: merchant.id,
      merchantName: merchant.name
    });

    logSaasNavigation(
      userName || merchant.name || 'Utilisateur',
      normalizedTarget,
      merchant.name,
      `${config.dashboardRoute}?merchantId=${merchant.id}&type=${normalizedTarget}`
    );

    return updatedMerchant;
  }

  /**
   * Request adding a new SaaS module to merchant's profile.
   * Checks subscription plan limits and rights.
   */
  public async addSaasToMerchant(
    merchant: Merchant, 
    rawSaasType: string
  ): Promise<{ success: boolean; requiresUpgrade: boolean; updatedMerchant?: Merchant; message: string }> {
    const config = getSaasRouteConfig(rawSaasType);
    const saasType = config.type;

    const currentSubs = this.getMerchantSaasSubscriptions(merchant);
    const existingSub = currentSubs[saasType];

    if (existingSub && existingSub.status === 'active') {
      return {
        success: true,
        requiresUpgrade: false,
        updatedMerchant: merchant,
        message: `Le SaaS "${config.label}" est déjà actif.`
      };
    }

    // Check plan capacity
    const activeCount = Object.values(currentSubs).filter(s => s.status === 'active').length;
    const maxAllowed = this.getMaxAllowedSaasForPlan(merchant.plan);

    if (activeCount >= maxAllowed) {
      return {
        success: false,
        requiresUpgrade: true,
        message: `Votre forfait actuel (${merchant.plan || 'FREE'}) autorise un maximum de ${maxAllowed} SaaS actif(s). Veuillez passer au plan supérieur pour débloquer "${config.label}".`
      };
    }

    // Check minimum required plan for specific enterprise SaaS modules
    const catalogItem = SAAS_CATALOG[saasType];
    if (catalogItem) {
      const planHierarchy: Record<MerchantPlan, number> = {
        FREE: 1,
        BASIC: 2,
        STANDARD: 3,
        PREMIUM: 4,
        LOCAL: 5
      };
      const merchantPlanRank = planHierarchy[merchant.plan || 'FREE'] || 1;
      const minPlanRank = planHierarchy[catalogItem.minPlan] || 1;

      if (merchantPlanRank < minPlanRank) {
        return {
          success: false,
          requiresUpgrade: true,
          message: `Le SaaS "${catalogItem.label}" nécessite au minimum le forfait ${catalogItem.minPlan}.`
        };
      }
    }

    // Activate the SaaS
    const updatedSubs = {
      ...currentSubs,
      [saasType]: {
        saasType,
        status: 'active' as SaasAccessStatus,
        plan: merchant.plan || 'FREE',
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    const updatedAllowedSaas = Array.from(
      new Set([...(merchant.allowedSaas || [merchant.type || 'stock']), saasType])
    );

    const updatedMerchant: Merchant = {
      ...merchant,
      allowedSaas: updatedAllowedSaas,
      saasSubscriptions: updatedSubs,
      updatedAt: new Date()
    };

    await dbService.merchants.save(updatedMerchant);

    return {
      success: true,
      requiresUpgrade: false,
      updatedMerchant,
      message: `Accès au SaaS "${config.label}" activé avec succès !`
    };
  }

  /**
   * Suspend access to a SaaS module without deleting any data.
   */
  public async suspendSaasAccess(merchant: Merchant, saasType: string): Promise<Merchant> {
    const config = getSaasRouteConfig(saasType);
    const normType = config.type;
    const currentSubs = this.getMerchantSaasSubscriptions(merchant);

    if (!currentSubs[normType] || currentSubs[normType].status !== 'active') {
      throw new Error(`Le SaaS "${config.label}" n'est pas actif.`);
    }

    const updatedSubs = {
      ...currentSubs,
      [normType]: {
        ...currentSubs[normType],
        status: 'suspended' as SaasAccessStatus,
        updatedAt: new Date().toISOString()
      }
    };

    const remainingActive = Object.keys(updatedSubs).filter(k => updatedSubs[k].status === 'active');
    
    // Fallback active SaaS if the suspended one was current
    let newType = merchant.type;
    if (merchant.type === normType) {
      newType = remainingActive.length > 0 ? remainingActive[0] : 'stock';
    }

    const updatedAllowedSaas = (merchant.allowedSaas || []).filter(t => getSaasRouteConfig(t).type !== normType);

    const updatedMerchant: Merchant = {
      ...merchant,
      type: newType,
      allowedSaas: updatedAllowedSaas,
      saasSubscriptions: updatedSubs,
      updatedAt: new Date()
    };

    await dbService.merchants.save(updatedMerchant);
    return updatedMerchant;
  }

  /**
   * Reactivate a previously suspended or removed SaaS module.
   */
  public async reactivateSaasAccess(merchant: Merchant, saasType: string): Promise<Merchant> {
    const config = getSaasRouteConfig(saasType);
    const normType = config.type;
    const currentSubs = this.getMerchantSaasSubscriptions(merchant);

    const updatedSubs = {
      ...currentSubs,
      [normType]: {
        saasType: normType,
        status: 'active' as SaasAccessStatus,
        plan: merchant.plan || 'FREE',
        addedAt: currentSubs[normType]?.addedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    const updatedAllowedSaas = Array.from(
      new Set([...(merchant.allowedSaas || []), normType])
    );

    const updatedMerchant: Merchant = {
      ...merchant,
      allowedSaas: updatedAllowedSaas,
      saasSubscriptions: updatedSubs,
      updatedAt: new Date()
    };

    await dbService.merchants.save(updatedMerchant);
    return updatedMerchant;
  }

  /**
   * Remove/withdraw access to a SaaS module.
   * NOTE: Retirer l'accès ≠ supprimer les données! Historical business data remains preserved.
   */
  public async removeSaasAccess(merchant: Merchant, saasType: string): Promise<Merchant> {
    const config = getSaasRouteConfig(saasType);
    const normType = config.type;
    const currentSubs = this.getMerchantSaasSubscriptions(merchant);

    const updatedSubs = {
      ...currentSubs,
      [normType]: {
        saasType: normType,
        status: 'removed' as SaasAccessStatus,
        plan: merchant.plan || 'FREE',
        addedAt: currentSubs[normType]?.addedAt || null,
        updatedAt: new Date().toISOString()
      }
    };

    const remainingActive = Object.keys(updatedSubs).filter(k => updatedSubs[k].status === 'active');
    let newType = merchant.type;
    if (merchant.type === normType) {
      newType = remainingActive.length > 0 ? remainingActive[0] : 'stock';
    }

    const updatedAllowedSaas = (merchant.allowedSaas || []).filter(t => getSaasRouteConfig(t).type !== normType);

    const updatedMerchant: Merchant = {
      ...merchant,
      type: newType,
      allowedSaas: updatedAllowedSaas,
      saasSubscriptions: updatedSubs,
      updatedAt: new Date()
    };

    await dbService.merchants.save(updatedMerchant);
    return updatedMerchant;
  }
}

export const saasSubscriptionService = new SaasSubscriptionService();
