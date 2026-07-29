// src/ai-demo/SaaSGateway/CapabilityRegistry.ts
// Extensible Registry exposing authorized real SaaS business functions to Acom IA

import { SaaSActionDefinition, SaaSContext, SaaSActionResult } from '../types';
import { db } from '../../db/db';
import { EventBus } from '../BusinessEvents/EventBus';
import { format } from 'date-fns';

class CapabilityRegistryService {
  private actions: Map<string, SaaSActionDefinition> = new Map();

  constructor() {
    this.registerGoldenReferencePressing();
    this.registerStockCapabilities();
  }

  public registerAction(action: SaaSActionDefinition): void {
    this.actions.set(action.id, action);
  }

  public getAction(actionId: string): SaaSActionDefinition | undefined {
    return this.actions.get(actionId);
  }

  public getAllActions(saasFilter?: string): SaaSActionDefinition[] {
    const list = Array.from(this.actions.values());
    if (saasFilter) {
      return list.filter(a => a.saas === saasFilter);
    }
    return list;
  }

  // =========================================================
  // GOLDEN REFERENCE: PRESSING SAAS CAPABILITIES
  // =========================================================
  private registerGoldenReferencePressing(): void {
    
    // 1. Search Customer (READ)
    this.registerAction({
      id: 'pressing.searchCustomer',
      saas: 'pressing',
      name: 'Rechercher un client Pressing',
      description: 'Recherche les coordonnées et l\'historique d\'un client par nom ou téléphone',
      riskLevel: 'read',
      requiredPermissions: [],
      parameters: [
        { name: 'query', type: 'string', description: 'Nom ou numéro de téléphone du client', required: true }
      ],
      execute: async (params, context): Promise<SaaSActionResult> => {
        const query = (params.query || '').trim().toLowerCase();
        
        // Search in Dexie users table
        const matchingUsers = await db.users
          .filter(u => 
            u.role === 'client' && 
            ((u.name || '').toLowerCase().includes(query) || (u.phone || '').includes(query))
          )
          .toArray();

        // Also search in localStorage pressing tickets
        const savedTicketsRaw = localStorage.getItem(`pressing_tickets_${context.merchantId}`);
        const savedTickets: any[] = savedTicketsRaw ? JSON.parse(savedTicketsRaw) : [];
        const matchingTickets = savedTickets.filter(t => 
          (t.clientName || '').toLowerCase().includes(query) || 
          (t.clientPhone || '').includes(query)
        );

        const count = matchingUsers.length + matchingTickets.length;

        return {
          success: true,
          actionId: 'pressing.searchCustomer',
          messageFr: `Recherche effectuée : ${count} résultat(s) trouvé(s) pour "${params.query}".`,
          messageWolof: `Wut nañu client bi : ${count} résultat gis nañu ko ci touru "${params.query}".`,
          data: { users: matchingUsers, tickets: matchingTickets }
        };
      }
    });

    // 2. Create Customer (NORMAL)
    this.registerAction({
      id: 'pressing.createCustomer',
      saas: 'pressing',
      name: 'Créer un client Pressing',
      description: 'Enregistre un nouveau client avec son nom, son téléphone et son e-mail facultatif',
      riskLevel: 'normal',
      requiredPermissions: [],
      parameters: [
        { name: 'clientName', type: 'string', description: 'Nom complet du client', required: true },
        { name: 'clientPhone', type: 'string', description: 'Téléphone du client', required: true },
        { name: 'clientEmail', type: 'string', description: 'E-mail du client', required: false }
      ],
      execute: async (params, context): Promise<SaaSActionResult> => {
        const { clientName, clientPhone, clientEmail = '' } = params;

        const newUserId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const newCustomer = {
          id: newUserId,
          merchantId: context.merchantId,
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          role: 'client',
          updatedAt: new Date().toISOString()
        };

        await db.users.add(newCustomer);

        EventBus.emit({
          type: 'CUSTOMER_CREATED',
          saas: 'pressing',
          merchantId: context.merchantId,
          payload: newCustomer,
          triggeredBy: 'ai_assistant'
        });

        return {
          success: true,
          actionId: 'pressing.createCustomer',
          messageFr: `Client ${clientName} (${clientPhone}) créé avec succès.`,
          messageWolof: `Bind nañu client ${clientName} (${clientPhone}) ci d'accord.`,
          data: newCustomer,
          emittedEvent: 'CUSTOMER_CREATED'
        };
      }
    });

    // 3. Create Receipt / Deposit Ticket (NORMAL)
    this.registerAction({
      id: 'pressing.createReceipt',
      saas: 'pressing',
      name: 'Créer un dépôt Pressing',
      description: 'Génère une fiche de dépôt avec les articles ou le poids du linge, l\'acompte versé et la date de retrait',
      riskLevel: 'normal',
      requiredPermissions: [],
      parameters: [
        { name: 'clientName', type: 'string', description: 'Nom du client', required: true },
        { name: 'clientPhone', type: 'string', description: 'Téléphone du client', required: false },
        { name: 'clientEmail', type: 'string', description: 'E-mail du client', required: false },
        { name: 'articles', type: 'object', description: 'Détail des articles ex: { chemise: 3, pantalon: 1 }', required: false },
        { name: 'billingType', type: 'string', description: 'article ou poids', required: false, defaultValue: 'article' },
        { name: 'weightKg', type: 'number', description: 'Poids en Kg si facturation au poids', required: false, defaultValue: 0 },
        { name: 'amountPaid', type: 'number', description: 'Acompte versé en FCFA', required: false, defaultValue: 0 },
        { name: 'totalAmount', type: 'number', description: 'Montant total estimé', required: false, defaultValue: 3000 }
      ],
      execute: async (params, context): Promise<SaaSActionResult> => {
        const clientName = (params.clientName || 'Client Passage').trim();
        const clientPhone = (params.clientPhone || '').trim();
        const clientEmail = (params.clientEmail || '').trim();

        // 1. Auto-create/register customer in db.users if not present
        if (clientName && clientName !== 'Client Passage') {
          const existingUsers = await db.users
            .filter(u => u.role === 'client' && (u.name || '').toLowerCase() === clientName.toLowerCase())
            .toArray();

          if (existingUsers.length === 0) {
            const newUserId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const newCustomer = {
              id: newUserId,
              merchantId: context.merchantId,
              name: clientName,
              email: clientEmail,
              phone: clientPhone,
              role: 'client',
              updatedAt: new Date().toISOString()
            };
            await db.users.add(newCustomer);
            EventBus.emit({
              type: 'CUSTOMER_CREATED',
              saas: 'pressing',
              merchantId: context.merchantId,
              payload: newCustomer,
              triggeredBy: 'ai_assistant'
            });
          }
        }

        // 2. Parse articles & compute total dynamically
        let articlesMap: Record<string, number> = { chemise: 3 };
        if (typeof params.articles === 'object' && params.articles !== null) {
          articlesMap = params.articles;
        } else if (typeof params.articles === 'string') {
          const match = params.articles.match(/(\d+)\s*([a-zA-Z]+)/);
          if (match) {
            articlesMap = { [match[2].toLowerCase()]: parseInt(match[1], 10) };
          }
        }

        // Saved tariffs lookup or standard default rates
        const savedTarifsRaw = localStorage.getItem(`pressing_tarifs_${context.merchantId}`);
        const savedTarifs = savedTarifsRaw ? JSON.parse(savedTarifsRaw) : null;
        const articlePrices: Record<string, number> = savedTarifs?.articles || {
          chemise: 1000,
          pantalon: 1500,
          veste: 1500,
          costume: 3000,
          robe: 2000,
          blouson: 2000,
          manteau: 2500,
          pull: 1200
        };

        let calculatedTotal = 0;
        Object.entries(articlesMap).forEach(([art, qty]) => {
          const key = art.toLowerCase().replace(/s$/, '');
          const unitPrice = articlePrices[key] || articlePrices[art] || 1000;
          calculatedTotal += unitPrice * Number(qty);
        });

        const total = Number(params.totalAmount) || calculatedTotal || 3000;
        const amountPaid = Number(params.amountPaid) || 0;
        const paymentStatus = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

        const d = new Date();
        d.setDate(d.getDate() + 3);
        const expectedDeliveryDate = format(d, 'yyyy-MM-dd');

        const savedTicketsRaw = localStorage.getItem(`pressing_tickets_${context.merchantId}`);
        const existingTickets: any[] = savedTicketsRaw ? JSON.parse(savedTicketsRaw) : [];

        const nextNumber = existingTickets.length + 1;
        const ticketNumber = `PR-2026-${String(nextNumber).padStart(4, '0')}`;

        const newTicket = {
          id: `t_${Date.now()}`,
          ticketNumber,
          clientName,
          clientPhone,
          clientEmail,
          depositDate: format(new Date(), 'yyyy-MM-dd'),
          expectedDeliveryDate,
          billingType: params.billingType || 'article',
          articles: articlesMap,
          weightService: 'standard',
          weightKg: params.weightKg || 0,
          supplements: {},
          supplementTarifs: {},
          discount: 0,
          discountType: 'amount',
          discountValue: 0,
          subtotal: total,
          supplementTotal: 0,
          total,
          status: 'deposed',
          paymentStatus,
          paymentMethod: 'cash',
          amountPaid,
          amountPaidAtDeposit: amountPaid,
          notes: 'Créé via Mode Vocal Acom IA'
        };

        const updated = [newTicket, ...existingTickets];
        localStorage.setItem(`pressing_tickets_${context.merchantId}`, JSON.stringify(updated));

        // Add to system sales table
        await db.sales.add({
          id: newTicket.id,
          merchantId: context.merchantId,
          items: [],
          totalAmount: total,
          paidAmount: amountPaid,
          balance: Math.max(0, total - amountPaid),
          payments: [{
            id: `p_${Date.now()}`,
            amount: amountPaid,
            method: 'cash',
            date: new Date().toISOString()
          }],
          paymentMethod: 'cash',
          customerName: clientName,
          customerPhone: clientPhone,
          processedBy: 'ai_assistant',
          createdAt: new Date().toISOString()
        });

        EventBus.emit({
          type: 'RECEIPT_CREATED',
          saas: 'pressing',
          merchantId: context.merchantId,
          payload: newTicket,
          triggeredBy: 'ai_assistant'
        });

        // Trigger window custom event for real-time UI refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pressing_receipt_updated', { detail: newTicket }));
        }

        const articlesSummary = Object.entries(articlesMap)
          .map(([k, v]) => `${v} ${k}${v > 1 ? 's' : ''}`)
          .join(', ');

        return {
          success: true,
          actionId: 'pressing.createReceipt',
          messageFr: `La réception d'${clientName} a été enregistrée avec ${articlesSummary} et un acompte de ${amountPaid.toLocaleString()} FCFA. Le ticket ${ticketNumber} a été créé.`,
          messageWolof: `Bingo! Defal nañu ticket ${ticketNumber} ci touru ${clientName} ak acompte ${amountPaid.toLocaleString()} FCFA.`,
          data: newTicket,
          emittedEvent: 'RECEIPT_CREATED'
        };
      }
    });

    // 4. Record Payment (NORMAL or SENSIBLE depending on amount)
    this.registerAction({
      id: 'pressing.recordPayment',
      saas: 'pressing',
      name: 'Enregistrer un règlement Pressing',
      description: 'Enregistre un paiement d\'acompte ou de solde sur un ticket client existant',
      riskLevel: 'normal',
      requiredPermissions: [],
      parameters: [
        { name: 'ticketNumber', type: 'string', description: 'Numéro du ticket (ex: PR-2026-0001)', required: false },
        { name: 'clientName', type: 'string', description: 'Nom du client si numéro de ticket non spécifié', required: false },
        { name: 'amount', type: 'number', description: 'Montant encaissé en FCFA', required: true }
      ],
      execute: async (params, context): Promise<SaaSActionResult> => {
        const savedTicketsRaw = localStorage.getItem(`pressing_tickets_${context.merchantId}`);
        const tickets: any[] = savedTicketsRaw ? JSON.parse(savedTicketsRaw) : [];

        let ticket = tickets.find(t => 
          (params.ticketNumber && t.ticketNumber === params.ticketNumber) ||
          (params.clientName && (t.clientName || '').toLowerCase().includes((params.clientName || '').toLowerCase()))
        );

        if (!ticket && tickets.length > 0) {
          ticket = tickets[0]; // fallback to most recent ticket
        }

        if (!ticket) {
          return {
            success: false,
            actionId: 'pressing.recordPayment',
            messageFr: 'Aucun ticket correspondant trouvé.',
            messageWolof: 'Gisouñu benn ticket bu ànd ak lolu.',
            error: 'TICKET_NOT_FOUND'
          };
        }

        const paymentAmount = Number(params.amount) || 0;
        const previousPaid = Number(ticket.amountPaid) || 0;
        const newTotalPaid = previousPaid + paymentAmount;
        const newPaymentStatus = newTotalPaid >= ticket.total ? 'paid' : 'partial';

        ticket.amountPaid = newTotalPaid;
        ticket.paymentStatus = newPaymentStatus;

        localStorage.setItem(`pressing_tickets_${context.merchantId}`, JSON.stringify(tickets));

        EventBus.emit({
          type: 'PAYMENT_RECORDED',
          saas: 'pressing',
          merchantId: context.merchantId,
          payload: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, amount: paymentAmount, totalPaid: newTotalPaid },
          triggeredBy: 'ai_assistant'
        });

        return {
          success: true,
          actionId: 'pressing.recordPayment',
          messageFr: `Règlement de ${paymentAmount.toLocaleString()} FCFA enregistré pour le ticket ${ticket.ticketNumber} (${ticket.clientName}). Total réglé: ${newTotalPaid.toLocaleString()} FCFA.`,
          messageWolof: `Jëjal nañu ${paymentAmount.toLocaleString()} FCFA ci ticket ${ticket.ticketNumber} (${ticket.clientName}).`,
          data: ticket,
          emittedEvent: 'PAYMENT_RECORDED'
        };
      }
    });

    // 5. Close Cash Register (SENSIBLE)
    this.registerAction({
      id: 'pressing.closeCashRegister',
      saas: 'pressing',
      name: 'Clôturer la caisse Pressing',
      description: 'Valide la clôture de caisse quotidienne et génère le rapport pour le gérant',
      riskLevel: 'sensible',
      requiredPermissions: ['gerant', 'admin'],
      parameters: [
        { name: 'actualCashCounted', type: 'number', description: 'Montant réel en espèces compté dans le tiroir', required: true },
        { name: 'cashierName', type: 'string', description: 'Nom du caissier', required: false, defaultValue: 'Caissier Principal' }
      ],
      execute: async (params, context): Promise<SaaSActionResult> => {
        const savedClosuresRaw = localStorage.getItem(`pressing_closures_${context.merchantId}`);
        const closures: any[] = savedClosuresRaw ? JSON.parse(savedClosuresRaw) : [];

        const actualCash = Number(params.actualCashCounted) || 0;

        const newClosure = {
          id: `closure_${Date.now()}`,
          date: format(new Date(), 'yyyy-MM-dd'),
          timestamp: new Date().toISOString(),
          cashierName: params.cashierName || context.user.userName || 'Caissier',
          totalPressingRevenue: actualCash,
          totalDetergentRevenue: 0,
          totalExpenses: 0,
          totalTheoreticalRevenue: actualCash,
          actualCashCounted: actualCash,
          discrepancy: 0,
          notes: 'Clôture effectuée via Acom IA Démo',
          status: 'closed',
          sentToManager: true
        };

        closures.unshift(newClosure);
        localStorage.setItem(`pressing_closures_${context.merchantId}`, JSON.stringify(closures));

        EventBus.emit({
          type: 'CASH_REGISTER_CLOSED',
          saas: 'pressing',
          merchantId: context.merchantId,
          payload: newClosure,
          triggeredBy: 'ai_assistant'
        });

        return {
          success: true,
          actionId: 'pressing.closeCashRegister',
          messageFr: `Caisse clôturée avec succès pour la date du ${newClosure.date}. Espèces comptées : ${actualCash.toLocaleString()} FCFA.`,
          messageWolof: `Tëj nañu caisse bi ci d'accord. Xaliss bi compté nañu ko: ${actualCash.toLocaleString()} FCFA.`,
          data: newClosure,
          emittedEvent: 'CASH_REGISTER_CLOSED'
        };
      }
    });

  }

  // =========================================================
  // STOCK SAAS CAPABILITIES (FOR CROSS-SAAS TESTING)
  // =========================================================
  private registerStockCapabilities(): void {
    this.registerAction({
      id: 'stock.createProduct',
      saas: 'stock',
      name: 'Créer un produit en stock',
      description: 'Ajoute un nouvel article au catalogue stock',
      riskLevel: 'normal',
      requiredPermissions: [],
      parameters: [
        { name: 'name', type: 'string', description: 'Nom du produit', required: true },
        { name: 'quantity', type: 'number', description: 'Quantité en stock', required: false, defaultValue: 10 },
        { name: 'price', type: 'number', description: 'Prix de vente FCFA', required: false, defaultValue: 2000 }
      ],
      execute: async (params, context): Promise<SaaSActionResult> => {
        const newProduct = {
          id: `prod_${Date.now()}`,
          merchantId: context.merchantId,
          name: params.name,
          price: Number(params.price) || 2000,
          costPrice: 1000,
          stockQuantity: Number(params.quantity) || 10,
          category: 'Acom IA',
          sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
          updatedAt: new Date().toISOString()
        };

        await db.products.add(newProduct as any);

        EventBus.emit({
          type: 'PRODUCT_CREATED',
          saas: 'stock',
          merchantId: context.merchantId,
          payload: newProduct,
          triggeredBy: 'ai_assistant'
        });

        return {
          success: true,
          actionId: 'stock.createProduct',
          messageFr: `Produit "${params.name}" créé avec un stock de ${params.quantity || 10} et un prix de ${params.price || 2000} FCFA.`,
          messageWolof: `Yokko nañu produit bu béss: "${params.name}", stock: ${params.quantity || 10}, prix: ${params.price || 2000} FCFA.`,
          data: newProduct,
          emittedEvent: 'PRODUCT_CREATED'
        };
      }
    });
  }
}

export const CapabilityRegistry = new CapabilityRegistryService();
