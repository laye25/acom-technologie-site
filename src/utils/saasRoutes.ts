export interface SaasRouteConfig {
  type: string;
  aliases: string[];
  label: string;
  dashboardRoute: string;
  clientViewTitle: string;
}

export const SAAS_ROUTES: Record<string, SaasRouteConfig> = {
  stock: {
    type: 'stock',
    aliases: ['stock', 'boutique', 'commerce'],
    label: 'Gestion de Stock (Commerce / Boutique)',
    dashboardRoute: '/merchant-dashboard',
    clientViewTitle: 'Interface Client - Boutique & Commerce'
  },
  pressing: {
    type: 'pressing',
    aliases: ['pressing', 'laverie', 'blanchisserie'],
    label: 'Gestion Pressing',
    dashboardRoute: '/pressing-dashboard',
    clientViewTitle: 'Interface Client - Pressing & Laverie'
  },
  couture: {
    type: 'couture',
    aliases: ['couture', 'tailleur'],
    label: 'Gestion Couture',
    dashboardRoute: '/tailor-dashboard',
    clientViewTitle: 'Interface Client - Couture & Sur-Mesure'
  },
  broderie: {
    type: 'broderie',
    aliases: ['broderie', 'creative_studio', 'embroidery', 'studio'],
    label: 'Acom Creative Studio',
    dashboardRoute: '/tailor-dashboard',
    clientViewTitle: 'Interface Client - Acom Creative Studio'
  },
  medical: {
    type: 'medical',
    aliases: ['medical', 'sante', 'clinique'],
    label: 'Gestion Médicale',
    dashboardRoute: '/medical-dashboard',
    clientViewTitle: 'Interface Client - Soins & Santé'
  },
  school: {
    type: 'school',
    aliases: ['school', 'scolaire', 'ecole'],
    label: 'Gestion Scolaire',
    dashboardRoute: '/school-dashboard',
    clientViewTitle: 'Interface Client - Enseignement & École'
  },
  transport: {
    type: 'transport',
    aliases: ['transport', 'flotte'],
    label: 'Gestion Transport',
    dashboardRoute: '/transport-dashboard',
    clientViewTitle: 'Interface Client - Transport & Trajets'
  },
  rh: {
    type: 'rh',
    aliases: ['rh', 'recrutement'],
    label: 'Gestion RH',
    dashboardRoute: '/hr-dashboard',
    clientViewTitle: 'Interface Client - Recrutement & RH'
  },
  btp: {
    type: 'btp',
    aliases: ['btp', 'chantier', 'entreprise'],
    label: 'Gestion Chantier (BTP)',
    dashboardRoute: '/construction-dashboard',
    clientViewTitle: 'Interface Client - Approvisionnement Chantier BTP'
  }
};

/**
 * Returns the SaaS configuration for a given type string
 */
export function getSaasRouteConfig(rawType?: string): SaasRouteConfig {
  if (!rawType) return SAAS_ROUTES.stock;
  const normalized = rawType.toLowerCase().trim();
  
  for (const config of Object.values(SAAS_ROUTES)) {
    if (config.type === normalized || config.aliases.includes(normalized)) {
      return config;
    }
  }
  return SAAS_ROUTES.stock;
}

/**
 * Checks if a given raw SaaS type matches a target category or alias.
 */
export function isSaasType(rawType: string | undefined, targetCategory: string): boolean {
  if (!rawType && (targetCategory === 'stock' || targetCategory === 'boutique')) return true;
  if (!rawType) return false;
  const currentConfig = getSaasRouteConfig(rawType);
  const targetConfig = getSaasRouteConfig(targetCategory);
  return currentConfig.type === targetConfig.type;
}

/**
 * Returns a clean, standardized display label for any raw SaaS type.
 */
export function getSaasDisplayName(rawType?: string): string {
  if (isSaasType(rawType, 'couture')) return 'Ateliers de Couture';
  if (isSaasType(rawType, 'broderie')) return 'Acom Creative Studio';
  if (isSaasType(rawType, 'pressing')) return 'Management Pressing';
  if (isSaasType(rawType, 'medical')) return 'Clinique & Médical';
  if (isSaasType(rawType, 'school')) return 'Management Scolaire';
  if (isSaasType(rawType, 'transport')) return 'Management Flotte';
  if (isSaasType(rawType, 'rh')) return 'Management RH';
  if (isSaasType(rawType, 'btp') || isSaasType(rawType, 'chantier')) return 'Management BTP / Chantier';
  if (isSaasType(rawType, 'entreprise')) return 'Management Entreprise';
  return 'Management Commerce';
}

/**
 * Returns the exact route for a given SaaS and optional Merchant ID.
 */
export function getSaasClientRoute(rawType?: string, merchantId?: string): string {
  const config = getSaasRouteConfig(rawType);
  const baseRoute = config.dashboardRoute;
  if (merchantId) {
    return `${baseRoute}?merchantId=${encodeURIComponent(merchantId)}&type=${encodeURIComponent(config.type)}`;
  }
  return `${baseRoute}?type=${encodeURIComponent(config.type)}`;
}

/**
 * Diagnostic logger as requested by user specifications
 */
export function logSaasNavigation(
  userName: string,
  saasType: string,
  merchantName: string,
  selectedRoute: string
) {
  const config = getSaasRouteConfig(saasType);
  console.log(`[ACOMZONE]
Utilisateur : ${userName || 'Administrateur'}
--------------------
SaaS actif : ${config.label}
--------------------
Merchant : ${merchantName || 'Établissement'}
--------------------
Route sélectionnée : ${selectedRoute}
--------------------
Navigation réussie.`);
}
