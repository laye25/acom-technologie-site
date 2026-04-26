export type ServiceCategory = string;

export interface Service {
  id: string;
  name: string;
  shortDescription?: string;
  description: string;
  price: number;
  cost?: number; // Estimated cost to calculate margin
  category: ServiceCategory;
  subCategory?: string;
  image: string;
  additionalImages?: string[];
  features: string[];
  promotion?: {
    discountPercentage: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  pillar?: 'saas' | 'studio';
  // New fields for SaaS Printing Model
  isPrintProduct?: boolean;
  hasTemplate?: boolean;
  templateId?: string;
  printOptions?: {
    id: string;
    label: string;
    options: { label: string; priceModifier: number }[];
  }[];
  quantityTiers?: {
    quantity: number;
    price: number;
  }[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';

export interface PaymentRecord {
  id: string;
  amount: number;
  method: 'stripe' | 'orange_money' | 'wave' | 'cash';
  type: 'deposit' | 'balance' | 'full';
  paidAt: any;
  transactionId?: string;
}

export interface Order {
  id: string;
  userId: string;
  user_id?: string;
  status: OrderStatus;
  originalPrice?: number;
  totalPrice: number;
  designId?: string;
  createdAt: any;
  updatedAt: any;
  created_at?: any;
  updated_at?: any;
  serviceId: string;
  serviceName?: string;
  serviceImage?: string;
  clientName?: string;
  clientEmail?: string;
  discountPercentage?: number;
  couponDiscount?: number;
  promotionStartDate?: string;
  promotionEndDate?: string;
  pillar?: 'saas' | 'studio';
  details: Record<string, any>;
  customOptions?: Record<string, any>;
  files: string[];
  quoteUrl?: string;
  unreadByAdmin?: boolean;
  unreadByClient?: boolean;
  clientAccepted?: boolean;
  acceptedAt?: any;
  printPdfUrl?: string;
  trackingNumber?: string;
  supplierStatus?: 'pending' | 'in_production' | 'shipped' | 'delivered';
  partnerId?: string;
  supplierId?: string;
  partnerEarnings?: number; // The amount Acom owes the partner for this order
  isPartnerPaid?: boolean; // Whether Acom has paid the partner for this order
  partnerPaidAt?: any;
  partnerInvoiceUrl?: string; // URL of the stamped invoice uploaded by partner
  partnerInvoiceStatus?: 'pending' | 'rejected' | 'paid';
  productionDeadline?: any; // New: Expected delivery date from partner
  deadlineAlertSent?: boolean; // Flag to avoid duplicate alerts
  paid?: boolean;
  depositPaid?: boolean;
  depositAmount?: number;
  depositPaidAt?: any;
  balancePaid?: boolean;
  balanceAmount?: number;
  balancePaidAt?: any;
  paymentId?: string;
  paymentMethod?: 'stripe' | 'orange_money' | 'wave' | 'cash';
  paidAt?: any;
  payments?: PaymentRecord[];
  aiDraft?: {
    title: string;
    objectives: string[];
    specifications: string[];
    complexity: string;
    duration: string;
    phases: string[];
    recommendations: string[];
  };
  adminAnalysis?: {
    summary: string;
    risks: string[];
    upsell: string[];
    advice: string[];
    priority: string;
  };
  deliverables?: {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'to_validate' | 'validated' | 'rejected';
    fileUrl?: string;
    comment?: string;
    submittedAt?: any;
    validatedAt?: any;
  }[];
}

export interface Message {
  id: string;
  orderId?: string;
  order_id?: string;
  senderId: string;
  sender_id?: string;
  senderName?: string;
  receiverId?: string;
  text: string;
  createdAt?: any;
  created_at?: any;
  timestamp?: string;
  chatId?: string;
  fileUrl?: string;
  isAdmin?: boolean;
  read?: boolean;
}

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'client' | 'admin' | 'manager' | 'printer' | 'designer';
  partnerStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  partnerDetails?: {
    managerName: string;
    companyName: string;
    companyFiliations: string;
    phone: string;
    address: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    workshopPhotos?: string[];
    termsAccepted: boolean;
    signatureInfo?: {
      ip?: string;
      userAgent: string;
      signedAt: any;
      version: string;
    };
    appliedAt: any;
    commissionPercentage?: number; // Custom commission for this partner (e.g., 85 for 85%)
  };
  merchantId?: string;
  phoneNumber?: string;
  address?: string;
  jobTitle?: string;
  company?: string;
  website?: string;
  phone?: string;
  logoUrl?: string;
  lastWeeklyRecapSent?: any; // Timestamp of the last Monday recap sent
  createdAt: any;
  created_at?: any;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'circle' | 'path' | 'ellipse' | 'group';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fontWeight?: string;
  textDecoration?: string;
  align?: string;
  lineHeight?: number;
  letterSpacing?: number;
  fill?: string;
  fillLinearGradientColorStops?: (number | string)[];
  opacity?: number;
  rotation?: number;
  src?: string;
  radius?: number;
  locked?: boolean;
  hidden?: boolean;
  stroke?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  data?: string; // For SVG paths
  points?: number[]; // For lines/polygons
  isLocked?: boolean;
  radiusX?: number;
  radiusY?: number;
  cornerRadius?: number;
  scaleX?: number;
  scaleY?: number;
  fillLinearGradientStartPoint?: { x: number; y: number };
  fillLinearGradientEndPoint?: { x: number; y: number };
  filters?: {
    brightness?: number;
    contrast?: number;
    blur?: number;
    grayscale?: boolean;
    sepia?: boolean;
  };
  fabricData?: any;
}

export interface Design {
  id: string;
  name: string;
  ownerId: string;
  user_id?: string;
  elements?: CanvasElement[]; // Made optional as it might be in blocks
  bgColor: string;
  preview?: string;
  thumbnail?: string;
  technicalSheet?: string;
  isTemplate?: boolean;
  pagesCount?: number;
  width?: number;
  height?: number;
  createdAt: any;
  updatedAt: any;
  created_at?: any;
  updated_at?: any;
}

export interface DesignBlock {
  id: string;
  designId: string;
  pageIndex: number;
  type: 'text' | 'image' | 'shape' | 'path' | 'circle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  content: any; // Specific properties for the block type
  zIndex: number;
  lockedBy?: string | null;
  lockedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface Asset {
  id: string;
  userId: string;
  name: string;
  url: string;
  type: 'image' | 'logo' | 'icon';
  createdAt: any;
  updatedAt?: any;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  elements: CanvasElement[];
  bgColor: string;
  preview?: string;
  isOfficial?: boolean;
  createdBy: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  image: string;
  category: string;
  readTime: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  order?: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: any;
  description?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order_status' | 'new_message' | 'payment';
  orderId?: string;
  read: boolean;
  createdAt: any;
  created_at?: any;
}

export interface HeroSlide {
  title: string;
  subtitle: string;
  image: string;
  color: string;
  badge?: string;
  iconName: string;
}

export interface FooterSettings {
  description: string;
  address: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  aboutUrl?: string;
  faqUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
  copyrightText?: string;
  socialLinks?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface PageSection {
  title: string;
  content: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export interface AboutContent {
  heroTitle: string;
  heroSubtitle: string;
  missionTitle: string;
  missionDescription: string;
  missionPoints: string[];
  stats: { label: string; value: string }[];
}

export interface StatItem {
  label: string;
  value: string;
  iconName: string;
}

export interface WhyUsPoint {
  title: string;
  description: string;
  iconName: string;
}

export interface WhyUsSection {
  title: string;
  image: string;
  points: WhyUsPoint[];
}

export interface CTASection {
  title: string;
  subtitle: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
}

export interface ExpertiseUniverse {
  title: string;
  image: string;
  description: string;
  features: string[];
  linkText: string;
  linkUrl: string;
  baseColor?: string;
}

export interface ExpertiseSection {
  titlePart1: string;
  titlePart2: string; // The part marked in purple
  subtitle: string;
  universes: ExpertiseUniverse[];
}

export interface PortfolioSection {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
}

export interface ContactSection {
  title: string;
  titleAccent: string;
  description: string;
  phoneLabel: string;
  emailLabel: string;
  addressLabel: string;
  successTitle: string;
  successMessage: string;
  submitButtonText: string;
  whatsappText: string;
}

export interface SaaSSolutionContent {
  title: string;
  description: string;
  iconName: string;
  color: string;
  image: string;
  link: string;
}

export interface SaaSPageContent {
  bannerImage: string;
  heroTitle1: string;
  heroTitle2: string;
  heroDescription: string;
  solutions: SaaSSolutionContent[];
}

export interface SiteSettings {
  brandName?: string;
  logoUrl?: string;
  desktopLogo?: string;
  desktopDownloadUrl?: string;
  heroSlides: HeroSlide[];
  footer: FooterSettings;
  primaryColor?: string;
  taxRate?: number;
  cashThreshold?: number;
  defaultPartnerCommission?: number; // New: Global default commission rate (e.g., 80)
  aboutContent?: AboutContent;
  faqContent?: FAQItem[];
  termsContent?: PageSection[];
  privacyContent?: PageSection[];
  statsSection?: StatItem[];
  whyUsSection?: WhyUsSection;
  ctaSection?: CTASection;
  expertiseSection?: ExpertiseSection;
  portfolioSection?: PortfolioSection;
  contactSection?: ContactSection;
  saasContent?: SaaSPageContent;
}

// SaaS Merchant Types
export type MerchantPlan = 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'LOCAL';

export interface Merchant {
  id: string;
  ownerId: string;
  name: string;
  type?: string; // e.g., 'boutique', 'entreprise', 'chantier', 'transport', 'rh', 'scolaire', 'medical'
  plan?: MerchantPlan;
  licenseType?: 'local' | 'cloud';
  subscriptionStatus?: 'active' | 'expired' | 'none';
  status?: 'active' | 'suspended';
  description?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency: string;
  createdAt: any;
  updatedAt: any;
}

export interface Category {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
}

export interface MerchantProduct {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  minStockLevel?: number;
  supplierId?: string;
  category: string;
  image?: string;
  createdAt: any;
  updatedAt: any;
}

export interface MerchantSaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface MerchantQuoteItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface MerchantQuote {
  id: string;
  merchantId: string;
  items: MerchantQuoteItem[];
  totalAmount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  validUntil: any;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'invoiced';
  notes?: string;
  createdAt: any;
  created_at?: any;
  processedBy: string; // userId
}

export interface MerchantSalePayment {
  id: string;
  amount: number;
  method: 'cash' | 'card' | 'mobile_money' | 'transfer';
  date: any;
}

export interface MerchantSale {
  id: string;
  merchantId: string;
  items: MerchantSaleItem[];
  totalAmount: number;
  paidAmount: number;
  balance: number;
  payments: MerchantSalePayment[];
  paymentMethod: 'cash' | 'card' | 'mobile_money' | 'split';
  customerName?: string;
  customerPhone?: string;
  createdAt: any;
  created_at?: any;
  processedBy: string; // userId
  updatedAt?: any;
}

export interface MerchantExpense {
  id: string;
  merchantId: string;
  title: string;
  amount: number;
  category: string;
  date: any;
  description?: string;
  createdAt: any;
  created_at?: any;
  updatedAt?: any;
}

export interface MerchantSupplier {
  id: string;
  merchantId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  category?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ProductionPartner {
  id: string;
  merchantId: string;
  name: string;
  specialties: string[];
  capacity: number; // Max orders per day
  reputationScore: number;
  location: string;
  contactPhone: string;
  contactEmail: string;
  totalOrders: number;
  onTimeDeliveries: number;
  createdAt: any;
  updatedAt: any;
}

export interface PartnerRating {
  id: string;
  orderId: string;
  partnerId: string;
  score: number; // 1-5
  comment?: string;
  createdAt: any;
}

export interface StockMovement {
  id: string;
  merchantId: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment' | 'sale' | 'return';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceId?: string; // ID of the sale or purchase order
  performedBy: string;
  createdAt: any;
}

// --- Specialized SaaS Types ---

// 1. Services
export interface ServiceIntervention {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: any;
  technicianId?: string;
  customerId?: string;
  location?: string;
  notes?: string;
  createdAt: any;
}

// 2. Construction (BTP)
export interface ConstructionProject {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  startDate: any;
  endDate?: any;
  budget: number;
  location: string;
  managerId: string;
  createdAt: any;
}

// 3. Transport & Fleet
export interface TransportVehicle {
  id: string;
  merchantId: string;
  plateNumber: string;
  model: string;
  type: 'truck' | 'car' | 'van' | 'bus';
  status: 'available' | 'on_trip' | 'maintenance' | 'out_of_service';
  lastMaintenance?: any;
  mileage: number;
  createdAt: any;
}

// 4. HR
export interface HREmployee {
  id: string;
  merchantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  hiredAt: any;
  status: 'active' | 'on_leave' | 'terminated';
  createdAt: any;
}

// 5. School
export interface SchoolStudent {
  id: string;
  merchantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: any;
  grade: string;
  classId: string;
  status: 'active' | 'graduated' | 'dropped_out';
  createdAt: any;
}

// 6. Medical
export interface MedicalPatient {
  id: string;
  merchantId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: any;
  gender: 'M' | 'F' | 'O';
  bloodType?: string;
  allergies?: string[];
  phone: string;
  email?: string;
  address?: string;
  createdAt: any;
}

export interface MedicalAppointment {
  id: string;
  merchantId: string;
  patientId: string;
  doctorId: string;
  scheduledAt: any;
  status: 'scheduled' | 'checked_in' | 'in_consultation' | 'completed' | 'cancelled';
  reason?: string;
  notes?: string;
  createdAt: any;
}
