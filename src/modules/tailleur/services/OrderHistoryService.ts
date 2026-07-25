/**
 * OrderHistoryService.ts
 * Service d'historique des commandes pour un client donné.
 * Fournit la liste des créations passées, les dates de confection, les tissus et les statuts de paiement.
 */

export interface ClientOrderSummary {
  id: string;
  clientId: string;
  clientName: string;
  model: string;
  garmentId?: string;
  garmentName?: string;
  category?: string;
  tissuUsed?: string;
  price: number;
  advance: number;
  rest: number;
  status: 'mesures' | 'coupe' | 'retouche' | 'pret' | 'livre' | string;
  createdAt: string;
  deliveryDate?: string;
  measurements?: Record<string, number | string>;
  notes?: string;
}

export class OrderHistoryService {
  /**
   * Clé localStorage pour les commandes
   */
  private static getStorageKey(merchantId: string): string {
    return `tailleur_orders_${merchantId}`;
  }

  /**
   * Récupère toutes les commandes enregistrées
   */
  public static getAllOrders(merchantId: string): ClientOrderSummary[] {
    try {
      const saved = localStorage.getItem(this.getStorageKey(merchantId));
      if (!saved) return [];
      const orders = JSON.parse(saved);
      return orders.map((o: any) => ({
        ...o,
        price: Number(o.price || 0),
        advance: Number(o.advance || 0),
        rest: Math.max(0, Number(o.price || 0) - Number(o.advance || 0))
      }));
    } catch (e) {
      console.error('Erreur chargement des commandes:', e);
      return [];
    }
  }

  /**
   * Récupère toutes les commandes d'un client spécifique
   */
  public static getOrdersForClient(merchantId: string, clientId: string): ClientOrderSummary[] {
    const all = this.getAllOrders(merchantId);
    return all
      .filter((o) => o.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Récupère les résumés financiers d'un client (Total Commandé, Total Payé, Solde Restant)
   */
  public static getClientFinancialSummary(merchantId: string, clientId: string) {
    const orders = this.getOrdersForClient(merchantId, clientId);
    const totalOrdered = orders.reduce((sum, o) => sum + o.price, 0);
    const totalPaid = orders.reduce((sum, o) => sum + o.advance, 0);
    const totalBalance = Math.max(0, totalOrdered - totalPaid);

    return {
      orderCount: orders.length,
      totalOrdered,
      totalPaid,
      totalBalance,
      lastOrderDate: orders.length > 0 ? orders[0].createdAt : null
    };
  }
}
