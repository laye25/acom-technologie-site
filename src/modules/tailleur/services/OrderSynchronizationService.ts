/**
 * OrderSynchronizationService.ts
 * Chef d'orchestre de la synchronisation entre les modules Clients Couture et Commandes Couture.
 * Évite toute re-saisie en chargeant automatiquement les données du client, son modèle actif,
 * ses mesures de référence, les tissus/mercerie compatibles et les propositions tarifaires.
 */

import { ClientProfileService, ClientProfile } from './ClientProfileService';
import { GarmentLibraryService, GarmentDefinition } from './GarmentLibraryService';
import { GarmentResolverService } from './GarmentResolverService';
import { MeasurementProfileService, MeasurementCompletenessResult } from './MeasurementProfileService';
import { GarmentProfileService, GarmentSewingSpecs, GarmentPricingProposal } from './GarmentProfileService';
import { StockConsumptionService, WorkshopFabricItem, WorkshopMercerieItem } from './StockConsumptionService';
import { OrderHistoryService, ClientOrderSummary } from './OrderHistoryService';

export interface PreparedOrderContext {
  client: ClientProfile;
  garment: GarmentDefinition;
  measurements: Record<string, number | string>;
  completeness: MeasurementCompletenessResult;
  pricingProposal: GarmentPricingProposal;
  sewingSpecs: GarmentSewingSpecs;
  compatibleFabrics: WorkshopFabricItem[];
  recommendedMercerie: { item: WorkshopMercerieItem; recommendedQty: number }[];
  clientOrderHistory: ClientOrderSummary[];
  orderHistory: ClientOrderSummary[];
  requiredMeasurementKeys: string[];
  missingMandatoryKeys: string[];
  isComplete: boolean;
  canBypassMeasurementStep: boolean; // True if measurements are 100% complete
  defaultStatusPrompt: string;
}

export class OrderSynchronizationService {
  /**
   * Prépare et pré-remplit entièrement le contexte d'une nouvelle commande à partir du client sélectionné
   */
  public static prepareOrderFromClient(
    merchantId: string,
    clientId: string,
    overrideGarmentId?: string
  ): PreparedOrderContext | null {
    const client = ClientProfileService.getClientById(merchantId, clientId);
    if (!client) return null;

    // Résoudre le vêtement / modèle actif
    const resolvedInfo = GarmentResolverService.resolveGarment(
      client,
      merchantId
    );
    const garment = resolvedInfo.definition;

    // Mesures du client
    const measurements = client.measurements || {};

    // Analyse de la complétude
    const completeness = MeasurementProfileService.checkCompleteness(garment, measurements);

    // Tarification et spécifications de couture
    const pricingProposal = GarmentProfileService.getSuggestedPricing(garment);
    const sewingSpecs = GarmentProfileService.getSewingSpecs(garment);

    // Tissus et Mercerie du stock atelier
    const compatibleFabrics = StockConsumptionService.getCompatibleFabrics(merchantId, garment);
    const recommendedMercerie = StockConsumptionService.getRecommendedMercerieItems(merchantId, garment);

    // Historique des commandes passées
    const clientOrderHistory = OrderHistoryService.getOrdersForClient(merchantId, clientId);

    // Si les mesures sont 100% complètes pour ce modèle, proposer la création directe
    const canBypassMeasurementStep = completeness.isComplete;
    const defaultStatusPrompt = canBypassMeasurementStep
      ? "Mesures de référence 100% complètes. Voulez-vous valider directement la commande ?"
      : `Il manque ${completeness.missingMandatoryKeys.length} mesure(s) obligatoire(s) pour le modèle ${garment.name}.`;

    return {
      client,
      garment,
      measurements,
      completeness,
      pricingProposal,
      sewingSpecs,
      compatibleFabrics,
      recommendedMercerie,
      clientOrderHistory,
      orderHistory: clientOrderHistory,
      requiredMeasurementKeys: garment.mandatoryMeasurements || [],
      missingMandatoryKeys: completeness.missingMandatoryKeys,
      isComplete: completeness.isComplete,
      canBypassMeasurementStep,
      defaultStatusPrompt
    };
  }

  /**
   * Enregistre la commande et applique les règles de synchronisation des mesures avec le profil client
   */
  public static syncOrderToClient(
    merchantId: string,
    orderData: any,
    options: {
      updateClientGlobalMeasurements: boolean; // Si true -> met à jour la fiche client permanente
      selectedFabricId?: string;
      metersUsed?: number;
      mercerieItemsUsed?: { mercerieId: string; quantityUsed: number }[];
    }
  ): any {
    const storageKey = `tailleur_orders_${merchantId}`;
    let allOrders: any[] = [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) allOrders = JSON.parse(saved);
    } catch (e) {
      allOrders = [];
    }

    const now = new Date().toISOString();
    let finalOrder: any;

    const rawId = orderData.id || `ord-${crypto.randomUUID()}`;
    const cleanUuid = rawId.replace(/^ord-/i, '');
    const trackingId = orderData.tracking_id || orderData.public_tracking_id || cleanUuid;

    if (orderData.id) {
      finalOrder = {
        ...orderData,
        id: rawId,
        order_id: rawId,
        client_id: orderData.clientId || orderData.client_id || '',
        tracking_id: trackingId,
        public_tracking_id: trackingId,
        tracking_token: trackingId,
        tracking_status: 'published',
        is_published: true,
        published: true,
        is_tracking_enabled: true,
        createdAt: orderData.createdAt || orderData.created_at || now,
        created_at: orderData.created_at || orderData.createdAt || now,
        syncStatus: 'pending',
        updatedAt: now
      };
      allOrders = allOrders.map((o) => (o.id === finalOrder.id ? finalOrder : o));
    } else {
      finalOrder = {
        ...orderData,
        id: rawId,
        order_id: rawId,
        client_id: orderData.clientId || orderData.client_id || '',
        tracking_id: trackingId,
        public_tracking_id: trackingId,
        tracking_token: trackingId,
        tracking_status: 'published',
        is_published: true,
        published: true,
        is_tracking_enabled: true,
        createdAt: orderData.createdAt || orderData.created_at || now,
        created_at: orderData.created_at || orderData.createdAt || now,
        updatedAt: now,
        syncStatus: 'pending'
      };
      allOrders.unshift(finalOrder);
    }

    console.log("📝 [Vérification 1 & 2 - OrderSynchronizationService]", {
      "Commande ID": finalOrder.id,
      "Tracking ID généré": cleanUuid,
      "Tracking ID enregistré": finalOrder.tracking_id,
      "Tracking ID envoyé": trackingId,
      "Statut Suivi": finalOrder.tracking_status,
      "Publié": finalOrder.published
    });

    // Sauvegarde des commandes
    localStorage.setItem(storageKey, JSON.stringify(allOrders));

    // 1. Synchronisation des mesures sur la fiche client permanente si demandé
    if (options.updateClientGlobalMeasurements && finalOrder.clientId && finalOrder.clientMeasurements) {
      ClientProfileService.updateClientMeasurements(
        merchantId,
        finalOrder.clientId,
        finalOrder.clientMeasurements,
        {
          garmentId: finalOrder.garmentId,
          garmentName: finalOrder.model || finalOrder.garmentName,
          profileName: `Commande #${finalOrder.id.slice(0, 8)} (${new Date().toLocaleDateString('fr-FR')})`
        }
      );
    }

    // 2. Traitement du stock (Tissu & Mercerie)
    StockConsumptionService.processStockDeduction(
      merchantId,
      options.selectedFabricId && options.metersUsed ? { fabricId: options.selectedFabricId, metersUsed: options.metersUsed } : undefined,
      options.mercerieItemsUsed
    );

    return finalOrder;
  }
}
