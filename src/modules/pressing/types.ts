export interface PressingTicket {
  id: string;
  ticketNumber: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  depositDate: string;
  expectedDeliveryDate?: string;
  billingType: 'article' | 'poids';
  articles: { [key: string]: number };
  weightService: string;
  weightKg: number;
  supplements: {
    [key: string]: boolean;
  };
  supplementTarifs: {
    [key: string]: number;
  };
  discount: number;
  discountType?: 'amount' | 'percent';
  discountValue?: number;
  subtotal: number;
  supplementTotal: number;
  total: number;
  totalCost?: number;
  status: 'quotation' | 'deposed' | 'in_progress' | 'ready' | 'delivered';
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  amountPaid?: number;
  amountPaidAtDeposit?: number;
  balanceCollectedAmount?: number;
  paymentMethod?: string;
  balanceCollectedMethod?: string;
  balanceCollectedDate?: string;
  notes?: string;
  sentNotifications?: any[];
}

export interface PressingTarifs {
  articles: {
    [key: string]: number;
  };
  poids: {
    [key: string]: number;
  };
  supplements?: {
    [key: string]: number;
  };
  supplements_labels?: {
    [key: string]: string;
  };
  articles_costs?: {
    [key: string]: number;
  };
  poids_costs?: {
    [key: string]: number;
  };
  supplements_costs?: {
    [key: string]: number;
  };
  articles_images?: {
    [key: string]: string;
  };
}

export interface PressingClosure {
  id: string;
  date: string;
  timestamp: string;
  cashierName: string;
  totalPressingRevenue: number;
  totalDetergentRevenue: number;
  totalExpenses: number;
  totalTheoreticalRevenue: number;
  actualCashCounted: number;
  discrepancy: number;
  notes: string;
  status: 'open' | 'closed';
  sentToManager: boolean;
}

export interface DetergentSale {
  id: string;
  saleNumber: string;
  customerName: string;
  customerPhone: string;
  date: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    costPrice: number;
    total: number;
  }[];
  discount: number;
  discountType: 'amount' | 'percent';
  discountValue: number;
  subtotal: number;
  total: number;
  totalCost: number;
}

export interface DetergentProduct {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStock: number;
  category: string;
  description: string;
  sku?: string;
  imageUrl?: string;
}

export interface DetergentQuote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    costPrice: number;
    quantity: number;
    total: number;
  }[];
  discount: number;
  discountType: 'amount' | 'percent';
  discountValue: number;
  subtotal: number;
  total: number;
  totalCost: number;
  notes?: string;
  sentNotifications?: any[];
}

export const DEFAULT_DETERGENTS: DetergentProduct[] = [
  {
    id: "det_1",
    name: "Ariel Liquide Concentré",
    price: 3500,
    costPrice: 2000,
    stock: 50,
    minStock: 5,
    category: "liquid",
    description: "Détergent liquide de haute qualité pour linge blanc et de couleur."
  },
  {
    id: "det_2",
    name: "Soupline Souffle de Fraîcheur",
    price: 2800,
    costPrice: 1500,
    stock: 40,
    minStock: 4,
    category: "softener",
    description: "Adoucissant concentré offrant une douceur incomparable."
  }
];


