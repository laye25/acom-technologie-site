import { db } from '../db/db';
import { MerchantQuote, MerchantSale, Merchant } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from './dbService';

export const billingService = {
  async convertQuoteToInvoice(quote: MerchantQuote, merchant: Merchant) {
    if (quote.status === 'invoiced') {
      throw new Error('Ce devis a déjà été converti en facture.');
    }

    const sale: Partial<MerchantSale> = {
      id: uuidv4(),
      merchantId: merchant.id,
      items: quote.items.map(item => ({
        productId: item.productId || 'custom',
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        sizes: item.sizes,
        colors: item.colors
      })),
      totalAmount: quote.totalAmount,
      paymentMethod: 'cash', // Default to cash, user can change later if needed
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      processedBy: quote.processedBy,
      createdAt: new Date()
    };

    await dbService.merchantSales.save(sale as MerchantSale);
    await db.quotes.update(quote.id, { status: 'invoiced', updatedAt: new Date() });

    return sale;
  },

  async recordPayment(saleId: string, amount: number, method: 'cash' | 'card' | 'mobile_money' | 'transfer') {
    const sale = await db.sales.get(saleId);
    if (!sale) throw new Error('Vente introuvable.');

    const newPayment = {
      id: uuidv4(),
      amount,
      method,
      date: new Date()
    };

    const updatedPayments = [...(sale.payments || []), newPayment];
    const totalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
    const balance = sale.totalAmount - totalPaid;

    await db.sales.update(saleId, {
      payments: updatedPayments,
      paidAmount: totalPaid,
      balance: balance,
      updatedAt: new Date()
    });

    return { totalPaid, balance };
  },

  getSaleStatus(sale: MerchantSale) {
    if (!sale.paidAmount || sale.paidAmount === 0) return 'unpaid';
    if (sale.paidAmount >= sale.totalAmount) return 'paid';
    return 'partial';
  },

  async createQuote(quote: Partial<MerchantQuote>) {
    const newQuote = {
      ...quote,
      id: quote.id || uuidv4(),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.quotes.add(newQuote);
    return newQuote;
  }
};

export const trackUsage = async (tenantId: string, feature: string) => {
  console.log(`[Usage Tracking] Tenant: ${tenantId}, Feature: ${feature}`);
  // In a real app, this would update a Firestore counter or similar
  // Since this might run in both client and server, we should be careful with DB access
  try {
    const usageId = `${tenantId}_${feature}_${new Date().toISOString().slice(0, 7)}`;
    // If we're on the server, we might want to use Firebase
    // If on the client, Dexie. 
    // For now, we just log to avoid breaking the build.
  } catch (error) {
    console.error("Usage tracking error:", error);
  }
};
