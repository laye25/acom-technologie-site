// src/ai-demo/Intelligence/SaaSPageRegistry.ts
// Structured knowledge registry mapping SaaS apps -> active pages -> functional zones -> semantic elements & capabilities

export interface SaaSPageElement {
  acomId: string; // e.g. "pressing.receipt.client_name"
  semanticId: string; // "client.fullName"
  label: string; // "Nom complet"
  type: 'input' | 'select' | 'button' | 'table' | 'display';
  supportedOperations: ('read' | 'write' | 'click' | 'select')[];
  description?: string;
}

export interface SaaSPageZone {
  id: string; // e.g. "client_info"
  name: string; // "Informations Client"
  description: string;
  elements: SaaSPageElement[];
}

export interface SaaSPageDefinition {
  pageId: string; // e.g. "pressing_receipt"
  saasId: string; // "pressing"
  name: string; // "Fiche de Réception Client"
  purpose: string; // "Enregistrement et suivi des dépôts, factures clients et paiements"
  zones: SaaSPageZone[];
}

class SaaSPageRegistryService {
  private pages: Map<string, SaaSPageDefinition> = new Map();

  constructor() {
    this.registerGoldenReferencePressingPage();
    this.registerStockPage();
  }

  public registerPage(page: SaaSPageDefinition): void {
    this.pages.set(page.pageId, page);
  }

  public getPage(pageId: string): SaaSPageDefinition | undefined {
    return this.pages.get(pageId);
  }

  public getPageBySaaS(saasId: string): SaaSPageDefinition[] {
    return Array.from(this.pages.values()).filter(p => p.saasId === saasId);
  }

  /**
   * Golden Reference: Pressing - Fiche de Réception Client
   */
  private registerGoldenReferencePressingPage(): void {
    this.registerPage({
      pageId: 'pressing_receipt',
      saasId: 'pressing',
      name: 'Fiche de Réception Client',
      purpose: 'Enregistrement des dépôts, factures uniques et paiements d\'acompte/solde',
      zones: [
        {
          id: 'client_info',
          name: 'Informations Client',
          description: 'Saisie et recherche des coordonnées du client',
          elements: [
            {
              acomId: 'pressing.receipt.client_name',
              semanticId: 'client.fullName',
              label: 'Nom complet du client',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Nom et prénom du client effectuant le dépôt'
            },
            {
              acomId: 'pressing.receipt.client_phone',
              semanticId: 'client.phone',
              label: 'Téléphone / WhatsApp',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Numéro de téléphone principal du client'
            },
            {
              acomId: 'pressing.receipt.client_email',
              semanticId: 'client.email',
              label: 'E-mail client',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Adresse e-mail facultative du client'
            },
            {
              acomId: 'pressing.receipt.search_customer_btn',
              semanticId: 'client.searchBtn',
              label: 'Bouton Nouveau / Chercher Client',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Ouvre la recherche ou la création rapide de client'
            }
          ]
        },
        {
          id: 'order_info',
          name: 'Informations Commande & Dates',
          description: 'Dates de dépôt et date de retrait prévue',
          elements: [
            {
              acomId: 'pressing.receipt.deposit_date',
              semanticId: 'order.depositDate',
              label: 'Date de dépôt',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'pressing.receipt.pickup_date',
              semanticId: 'order.pickupDate',
              label: 'Date de retrait prévue',
              type: 'input',
              supportedOperations: ['read', 'write']
            }
          ]
        },
        {
          id: 'prestations',
          name: 'Prestations & Articles',
          description: 'Choix de la facturation par article ou par kilo et quantité',
          elements: [
            {
              acomId: 'pressing.receipt.billing_type_article',
              semanticId: 'order.billingType.article',
              label: 'Facturation par article',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'pressing.receipt.billing_type_weight',
              semanticId: 'order.billingType.weight',
              label: 'Facturation au kilo',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'pressing.receipt.articles_grid',
              semanticId: 'order.articlesGrid',
              label: 'Grille des vêtements',
              type: 'display',
              supportedOperations: ['read', 'select']
            }
          ]
        },
        {
          id: 'payment_zone',
          name: 'Paiement & Acompte',
          description: 'Saisie de l\'acompte et calcul du reste à encaisser',
          elements: [
            {
              acomId: 'pressing.receipt.advance_amount',
              semanticId: 'payment.amountPaid',
              label: 'Montant versé / Acompte (FCFA)',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'pressing.receipt.submit_btn',
              semanticId: 'receipt.submitBtn',
              label: 'Bouton Enregistrer le Ticket',
              type: 'button',
              supportedOperations: ['click']
            }
          ]
        },
        {
          id: 'ticket_preview',
          name: 'Aperçu Réel du Ticket de Caisse',
          description: 'Visualisation dynamique en temps réel du ticket thermique à imprimer',
          elements: [
            {
              acomId: 'pressing.receipt.ticket_preview_box',
              semanticId: 'receipt.preview',
              label: 'Bloc d\'aperçu ticket',
              type: 'display',
              supportedOperations: ['read']
            }
          ]
        }
      ]
    });
  }

  private registerStockPage(): void {
    this.registerPage({
      pageId: 'stock_manager',
      saasId: 'stock',
      name: 'Gestionnaire de Stock & Produits',
      purpose: 'Suivi de l\'inventaire, création d\'articles et mouvements de stock',
      zones: [
        {
          id: 'product_form',
          name: 'Formulaire Création Produit',
          description: 'Nouveau produit dans le catalogue',
          elements: [
            {
              acomId: 'stock.product.name',
              semanticId: 'product.name',
              label: 'Nom du produit',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'stock.product.price',
              semanticId: 'product.price',
              label: 'Prix de vente FCFA',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'stock.product.quantity',
              semanticId: 'product.quantity',
              label: 'Quantité en stock',
              type: 'input',
              supportedOperations: ['read', 'write']
            }
          ]
        }
      ]
    });
  }
}

export const SaaSPageRegistry = new SaaSPageRegistryService();
