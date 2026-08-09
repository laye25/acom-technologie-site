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
    this.registerAdditionalPressingPages();
    this.registerStockPage();
    this.registerCommercePOSPage();
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

  private registerAdditionalPressingPages(): void {
    const dashboardDefinition: SaaSPageDefinition = {
      pageId: 'dashboard',
      saasId: 'pressing',
      name: 'Aperçu & Tableau de Bord',
      purpose: 'Suivi global en temps réel des indicateurs clés, du chiffre d\'affaires, de la synchronisation et de l\'activité opérationnelle',
      zones: [
        {
          id: 'quick_access_zone',
          name: 'Accès Rapides & Navigation',
          description: 'Bandeau de raccourcis transversaux vers la Démo IA, AcomZone, la version Bureau, la documentation et la déconnexion',
          elements: [
            {
              acomId: 'dashboard.quick_access.bar',
              semanticId: 'dashboard.quick_access_strip',
              label: 'Bandeau Accès Rapides',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Barre de raccourcis vers les outils transversaux de la plateforme'
            },
            {
              acomId: 'dashboard.quick_access.ai_demo_btn',
              semanticId: 'dashboard.ai_demo_button',
              label: 'Bouton Acom IA Démo',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Lance le simulateur interactif et le système de formation guidée Acom IA'
            },
            {
              acomId: 'dashboard.quick_access.acomzone_btn',
              semanticId: 'dashboard.acomzone_button',
              label: 'Bouton AcomZone',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Accède à l\'espace d\'interconnexion et de synchronisation réseau AcomZone'
            },
            {
              acomId: 'dashboard.quick_access.desktop_btn',
              semanticId: 'dashboard.desktop_button',
              label: 'Bouton Version Bureau',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Téléchargement et configuration de l\'application native pour ordinateur'
            },
            {
              acomId: 'dashboard.quick_access.docs_btn',
              semanticId: 'dashboard.docs_button',
              label: 'Bouton Documentation',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Consultation des manuels d\'utilisation et guides méthodologiques'
            },
            {
              acomId: 'dashboard.quick_access.logout_btn',
              semanticId: 'dashboard.logout_button',
              label: 'Bouton Déconnexion',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Fermeture sécurisée de la session de travail active'
            }
          ]
        },
        {
          id: 'briefing_zone',
          name: 'Briefing Matinal & IA Assistive',
          description: 'Résumé proactif des priorités, alertes de gestion et recommandations générées pour votre journée',
          elements: [
            {
              acomId: 'dashboard.briefing.card',
              semanticId: 'dashboard.briefing_card',
              label: 'Carte Briefing Matinal',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Synthèse matinale des indicateurs prioritaires et des tâches urgentes'
            },
            {
              acomId: 'dashboard.briefing.message',
              semanticId: 'dashboard.briefing_text',
              label: 'Message & Recommandation IA',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Conseil personnalisé d\'optimisation commerciale et d\'alerte de rentabilité'
            },
            {
              acomId: 'dashboard.briefing.action_btn',
              semanticId: 'dashboard.briefing_action',
              label: 'Action Prioritaire du Jour',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Lien direct pour exécuter ou consulter la tâche recommandée'
            }
          ]
        },
        {
          id: 'sync_engine_zone',
          name: 'État du Moteur de Synchronisation',
          description: 'Contrôle du mode de fonctionnement (Local/Hybride), sauvegarde de la base SQLite et synchronisation Cloud',
          elements: [
            {
              acomId: 'dashboard.sync.card',
              semanticId: 'dashboard.sync_container',
              label: 'Bandeau Moteur de Synchronisation',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Panneau de surveillance du stockage local-first et de la liaison cloud'
            },
            {
              acomId: 'dashboard.sync.status',
              semanticId: 'dashboard.sync_status_title',
              label: 'Statut du Moteur',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Affiche si l\'application est en Mode Hybride (Local + Cloud) ou en Mode Local hors ligne'
            },
            {
              acomId: 'dashboard.sync.export_btn',
              semanticId: 'dashboard.export_sqlite_btn',
              label: 'Exporter (.sqlite3)',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Exportation physique de la base de données locale SQLite pour archivage ou utilisation Bureau'
            },
            {
              acomId: 'dashboard.sync.restore_btn',
              semanticId: 'dashboard.restore_sqlite_btn',
              label: 'Restaurer',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Restauration complète des données à partir d\'un fichier .sqlite3 existant'
            },
            {
              acomId: 'dashboard.sync.force_sync_btn',
              semanticId: 'dashboard.force_sync_btn',
              label: 'Forcer la Synchronisation',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Déclenche immédiatement l\'envoi de toutes les écritures locales vers le Cloud'
            }
          ]
        },
        {
          id: 'stats_period_zone',
          name: 'Période des Statistiques de Vente',
          description: 'Sélecteur temporel permettant de recalculer l\'ensemble des métriques pour un mois spécifique',
          elements: [
            {
              acomId: 'dashboard.stats.period_select',
              semanticId: 'dashboard.period_picker',
              label: 'Période des statistiques de vente',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Sélecteur mensuel pour filtrer dynamiquement les données du tableau de bord'
            }
          ]
        },
        {
          id: 'financial_kpis_zone',
          name: 'Indicateurs Financiers Clés',
          description: 'Cartes de synthèse du Chiffre d\'Affaires Pressing, Ventes Boutique, Dépenses et Bénéfice Net',
          elements: [
            {
              acomId: 'dashboard.stats.pressing_revenue_card',
              semanticId: 'dashboard.kpi_pressing_revenue',
              label: 'Recettes Pressing',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Chiffre d\'affaires total issu des prestations de pressing et fiches de dépôts'
            },
            {
              acomId: 'dashboard.stats.product_sales_card',
              semanticId: 'dashboard.kpi_product_sales',
              label: 'Ventes Produits',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Revenu généré par les ventes directes de détergents et produits au comptoir'
            },
            {
              acomId: 'dashboard.stats.expenses_card',
              semanticId: 'dashboard.kpi_expenses',
              label: 'Dépenses Opérationnelles',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Total des charges et décaissements enregistrés sur la période'
            },
            {
              acomId: 'dashboard.stats.net_profit_card',
              semanticId: 'dashboard.kpi_net_profit',
              label: 'Bénéfice Net',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Marge bénéficiaire nette réelle (Recettes totales déduites des coûts et dépenses)'
            }
          ]
        },
        {
          id: 'performance_chart_zone',
          name: 'Performance Financière & Tendances',
          description: 'Graphique interactif de l\'évolution comparative des recettes et des dépenses sur 7 jours',
          elements: [
            {
              acomId: 'dashboard.charts.performance_card',
              semanticId: 'dashboard.performance_chart',
              label: 'Graphique Performance Financière',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Courbes superposées des encaissements et des dépenses sur la dernière semaine'
            }
          ]
        },
        {
          id: 'accounting_activity_zone',
          name: 'Résumé Comptable & Activité Récente',
          description: 'Bilan comptable mensuel condensé et flux chronologique des opérations récentes',
          elements: [
            {
              acomId: 'dashboard.accounting.summary_card',
              semanticId: 'dashboard.accounting_summary',
              label: 'Résumé Comptable',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Rapprochement synthétique Revenus, Dépenses et Marge Nette'
            },
            {
              acomId: 'dashboard.activity.recent_feed',
              semanticId: 'dashboard.recent_activity_feed',
              label: 'Activité Récente',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Journal des 5 dernières transactions et événements enregistrés'
            }
          ]
        },
        {
          id: 'recap_operations_zone',
          name: 'Récapitulatif Général & Suivi Opérationnel',
          description: 'Bilan hybride détaillé, liste des dépôts clients en cours et journal des ventes au comptoir',
          elements: [
            {
              acomId: 'dashboard.recap.general_card',
              semanticId: 'dashboard.general_recap_card',
              label: 'Bilan Récapitulatif Général',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Tableau de bord consolidé distinguant prestations pressing et ventes de produits'
            },
            {
              acomId: 'dashboard.recap.pressing_column',
              semanticId: 'dashboard.recap_pressing_details',
              label: 'Colonne Prestations Pressing',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Détail des montants facturés, encaissés, reste à payer et marge nette sur le pressing'
            },
            {
              acomId: 'dashboard.recap.products_column',
              semanticId: 'dashboard.recap_products_details',
              label: 'Colonne Vente de Produits',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Détail des ventes de détergents, encaissement direct et marge commerciale'
            },
            {
              acomId: 'dashboard.recap.total_column',
              semanticId: 'dashboard.recap_total_details',
              label: 'Colonne Recettes Globales',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Total cumulé encaissé et marge nette consolidée après déduction des charges'
            },
            {
              acomId: 'dashboard.pressing.tickets_table',
              semanticId: 'dashboard.pressing_tickets_table',
              label: 'Suivi des Prestations Pressing',
              type: 'table',
              supportedOperations: ['read'],
              description: 'Registre des dernières fiches de réception client avec statut de traitement et de paiement'
            },
            {
              acomId: 'dashboard.products.sales_table',
              semanticId: 'dashboard.products_sales_table',
              label: 'Vente de Produits Directe',
              type: 'table',
              supportedOperations: ['read'],
              description: 'Registre des dernières ventes de produits et détergents enregistrées au comptoir'
            }
          ]
        }
      ]
    };

    this.registerPage(dashboardDefinition);
    this.registerPage({ ...dashboardDefinition, pageId: 'apercu' });
    this.registerPage({ ...dashboardDefinition, pageId: 'pressing_dashboard' });

    this.registerPage({
      pageId: 'pressing_delivery',
      saasId: 'pressing',
      name: 'Livraisons & Retraits',
      purpose: 'Suivi et enregistrement des retraits de vêtements prêts et livraisons clients',
      zones: []
    });

    this.registerPage({
      pageId: 'pressing_stock',
      saasId: 'pressing',
      name: 'Vente & Stock',
      purpose: 'Gestion des produits de pressing, détergents et ventes directes au comptoir',
      zones: [
        {
          id: 'sales_catalogue',
          name: 'Catalogue & Recherche de Produits',
          description: 'Recherche, filtrage par rayon et sélection des produits en rayon ou détergents',
          elements: [
            {
              acomId: 'pressing.sales.tab_sales',
              semanticId: 'sales.tabs.sales',
              label: 'Onglet Encaisser Vente',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'pressing.sales.search_input',
              semanticId: 'sales.search',
              label: 'Recherche produit / détergent',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'pressing.sales.rayon_select',
              semanticId: 'sales.filters.rayon',
              label: 'Filtre Rayon / Catégorie',
              type: 'select',
              supportedOperations: ['read', 'select']
            },
            {
              acomId: 'pressing.sales.status_select',
              semanticId: 'sales.filters.status',
              label: 'Filtre Niveau de Stock',
              type: 'select',
              supportedOperations: ['read', 'select']
            },
            {
              acomId: 'pressing.sales.product_card',
              semanticId: 'sales.product.card',
              label: 'Fiche Produit',
              type: 'display',
              supportedOperations: ['read']
            },
            {
              acomId: 'pressing.sales.sell_btn',
              semanticId: 'sales.product.sellBtn',
              label: 'Vendre cet article',
              type: 'button',
              supportedOperations: ['click']
            }
          ]
        },
        {
          id: 'sales_cart',
          name: 'Panier de Vente Directe & Client',
          description: 'Ajustement des quantités, saisie client, remises et calcul du net à payer',
          elements: [
            {
              acomId: 'pressing.sales.cart_panel',
              semanticId: 'sales.cart.panel',
              label: 'Panier de vente directe',
              type: 'display',
              supportedOperations: ['read']
            },
            {
              acomId: 'pressing.sales.cart_quantity',
              semanticId: 'sales.cart.quantity',
              label: 'Quantité d\'article',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'pressing.sales.customer_name',
              semanticId: 'sales.customer.name',
              label: 'Nom du client',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'pressing.sales.customer_phone',
              semanticId: 'sales.customer.phone',
              label: 'Contact téléphonique',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'pressing.sales.discount_type',
              semanticId: 'sales.discount.type',
              label: 'Type de remise',
              type: 'select',
              supportedOperations: ['read', 'select']
            },
            {
              acomId: 'pressing.sales.discount_value',
              semanticId: 'sales.discount.value',
              label: 'Valeur de la remise',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'pressing.sales.total_net',
              semanticId: 'sales.cart.totalNet',
              label: 'Total Net Encaissé',
              type: 'display',
              supportedOperations: ['read']
            },
            {
              acomId: 'pressing.sales.submit_checkout',
              semanticId: 'sales.submit.checkout',
              label: 'Encaisser la vente',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'pressing.sales.submit_quote',
              semanticId: 'sales.submit.quote',
              label: 'Établir Devis',
              type: 'button',
              supportedOperations: ['click']
            }
          ]
        },
        {
          id: 'sales_receipt_and_actions',
          name: 'Reçu & Actions Post-Vente',
          description: 'Simulation du ticket thermique, impressions, envoi WhatsApp et nouveau client',
          elements: [
            {
              acomId: 'pressing.sales.ticket_box',
              semanticId: 'sales.ticket.box',
              label: 'Ticket de Caisse Simulateur',
              type: 'display',
              supportedOperations: ['read']
            },
            {
              acomId: 'pressing.sales.post_creation_panel',
              semanticId: 'sales.ticket.actionsPanel',
              label: 'Panneau d\'actions post-vente',
              type: 'display',
              supportedOperations: ['read']
            },
            {
              acomId: 'pressing.sales.print_options',
              semanticId: 'sales.ticket.printOptions',
              label: 'Options d\'impression',
              type: 'display',
              supportedOperations: ['read']
            },
            {
              acomId: 'pressing.sales.print_roll_80',
              semanticId: 'sales.ticket.printRoll80',
              label: 'Impression Roll 80mm',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'pressing.sales.print_roll_58',
              semanticId: 'sales.ticket.printRoll58',
              label: 'Impression Roll 58mm',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'pressing.sales.print_a4',
              semanticId: 'sales.ticket.printA4',
              label: 'Impression Format A4',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'pressing.sales.download_pdf',
              semanticId: 'sales.ticket.downloadPdf',
              label: 'Télécharger PDF',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'pressing.sales.whatsapp_client',
              semanticId: 'sales.ticket.whatsappClient',
              label: 'WhatsApp Client',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'pressing.sales.new_customer_btn',
              semanticId: 'sales.ticket.newCustomerBtn',
              label: 'Commencer un nouveau client',
              type: 'button',
              supportedOperations: ['click']
            }
          ]
        }
      ]
    });

    this.registerPage({
      pageId: 'pressing_tarifs',
      saasId: 'pressing',
      name: 'Paramètres Tarifs',
      purpose: 'Configuration des grilles tarifaires des vêtements, au kg et prestations optionnelles de pressing',
      zones: [
        {
          id: 'articles_pricing',
          name: 'Tarifs par Article (Vêtements)',
          description: 'Tarifs unitaires et coûts internes appliqués lors du dépôt de vêtements individuels.',
          elements: [
            {
              acomId: 'btn-add-article',
              semanticId: 'pricing.articles.addBtn',
              label: 'AJOUTER UN NOUVEL ARTICLE',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'input-article-name',
              semanticId: 'pricing.articles.name',
              label: 'NOM DU VÊTEMENT',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'input-article-price',
              semanticId: 'pricing.articles.price',
              label: 'PRIX DE VENTE UNITAIRE',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'select-article-unit',
              semanticId: 'pricing.articles.unit',
              label: 'UNITÉ DE TARIFICATION',
              type: 'select',
              supportedOperations: ['read', 'select']
            },
            {
              acomId: 'input-article-cost',
              semanticId: 'pricing.articles.cost',
              label: 'COÛT INTRANT (FCFA)',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'btn-submit-article',
              semanticId: 'pricing.articles.submitBtn',
              label: 'AJOUTER (Article)',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'btn-cancel-article',
              semanticId: 'pricing.articles.cancelBtn',
              label: 'ANNULER (Article)',
              type: 'button',
              supportedOperations: ['click']
            }
          ]
        },
        {
          id: 'kg_pricing',
          name: 'Tarifs au Kilogramme (Kg)',
          description: 'Recommandé pour les sacs de linge en vrac, lavés standard et blanchisseries.',
          elements: [
            {
              acomId: 'btn-add-kg-format',
              semanticId: 'pricing.kg.addBtn',
              label: 'AJOUTER UN FORMAT KG',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'input-kg-name',
              semanticId: 'pricing.kg.name',
              label: 'NOM DU FORMAT',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'input-kg-price',
              semanticId: 'pricing.kg.price',
              label: 'PRIX PAR KILOGRAMME',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'select-kg-unit',
              semanticId: 'pricing.kg.unit',
              label: 'UNITÉ / TARIF DE RÉFÉRENCE',
              type: 'select',
              supportedOperations: ['read', 'select']
            },
            {
              acomId: 'input-kg-cost',
              semanticId: 'pricing.kg.cost',
              label: 'COÛT PAR KILO (FCFA/KG)',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'btn-submit-kg',
              semanticId: 'pricing.kg.submitBtn',
              label: 'AJOUTER (Kg)',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'btn-cancel-kg',
              semanticId: 'pricing.kg.cancelBtn',
              label: 'ANNULER (Kg)',
              type: 'button',
              supportedOperations: ['click']
            }
          ]
        },
        {
          id: 'supplements_pricing',
          name: 'Tarifs des Prestations Optionnelles (Suppléments)',
          description: 'Services complémentaires applicables en supplément de la prestation de base d\'un dépôt.',
          elements: [
            {
              acomId: 'btn-add-supplement',
              semanticId: 'pricing.supplements.addBtn',
              label: 'AJOUTER UNE PRESTATION OPTIONNELLE',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'input-supplement-name',
              semanticId: 'pricing.supplements.name',
              label: 'NOM DE LA PRESTATION',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'input-supplement-description',
              semanticId: 'pricing.supplements.description',
              label: 'DESCRIPTION / DÉTAILS',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'input-supplement-price',
              semanticId: 'pricing.supplements.price',
              label: 'PRIX / TARIF',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'select-supplement-unit',
              semanticId: 'pricing.supplements.unit',
              label: 'PARAMÈTRE DE TARIFICATION',
              type: 'select',
              supportedOperations: ['read', 'select']
            },
            {
              acomId: 'input-supplement-cost',
              semanticId: 'pricing.supplements.cost',
              label: 'COÛT INTRANT (FCFA)',
              type: 'input',
              supportedOperations: ['read', 'write']
            },
            {
              acomId: 'btn-submit-supplement',
              semanticId: 'pricing.supplements.submitBtn',
              label: 'AJOUTER (Supplément)',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'btn-cancel-supplement',
              semanticId: 'pricing.supplements.cancelBtn',
              label: 'ANNULER (Supplément)',
              type: 'button',
              supportedOperations: ['click']
            }
          ]
        },
        {
          id: 'save_and_confirm',
          name: 'Enregistrement & Confirmation',
          description: 'Sauvegarde globale des tarifs et confirmation',
          elements: [
            {
              acomId: 'btn-save-pricing',
              semanticId: 'pricing.saveBtn',
              label: 'ENREGISTRER LES TARIFS',
              type: 'button',
              supportedOperations: ['click']
            },
            {
              acomId: 'pricing-saved-confirmation',
              semanticId: 'pricing.confirmationBanner',
              label: 'Confirmation d\'enregistrement',
              type: 'display',
              supportedOperations: ['read']
            }
          ]
        }
      ]
    });

    this.registerPage({
      pageId: 'pressing_closure',
      saasId: 'pressing',
      name: 'Clôture de Caisse & Rapport Journalier',
      purpose: 'Supervision journalière, rapprochement financier, comptage physique des espèces et clôture de caisse',
      zones: [
        {
          id: 'closure_header_zone',
          name: 'Entête & Clôture du Jour',
          description: 'Titre de supervision et formulaire de rapprochement financier journalier',
          elements: [
            {
              acomId: 'pressing.cash_closure.header',
              semanticId: 'closure.header',
              label: 'Entête Clôture de Caisse & Rapport Journalier',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Titre et sous-titre de la supervision journalière'
            },
            {
              acomId: 'pressing.cash_closure.form_card',
              semanticId: 'closure.form.card',
              label: 'Carte Clôturer la caisse d\'aujourd\'hui',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Formulaire principal de saisie et de rapprochement de caisse'
            },
            {
              acomId: 'pressing.cash_closure.date',
              semanticId: 'closure.form.date',
              label: 'Date de Clôture',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Date de la journée à clôturer'
            }
          ]
        },
        {
          id: 'daily_revenue_breakdown',
          name: 'Ventilation des Recettes & Dépenses',
          description: 'Cartes des flux : recettes pressing, ventes produits et dépenses du jour',
          elements: [
            {
              acomId: 'pressing.cash_closure.press_value',
              semanticId: 'closure.revenue.pressing',
              label: 'Recettes Pressing (+)',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Montant total calculé des dépôts et soldes pressing du jour'
            },
            {
              acomId: 'pressing.cash_closure.product_sales',
              semanticId: 'closure.revenue.products',
              label: 'Ventes Produits (+)',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Montant total des ventes directes de boutique et détergents'
            },
            {
              acomId: 'pressing.cash_closure.expenses',
              semanticId: 'closure.expenses.daily',
              label: 'Dépenses du Jour (-)',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Total des dépenses enregistrées avec justificatifs pour la journée'
            },
            {
              acomId: 'pressing.cash_closure.expected_revenue',
              semanticId: 'closure.revenue.theoretical',
              label: 'Chiffre d\'Affaires Théorique Attendu',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Calcul : Recettes Pressing + Produits boutique - Dépenses du jour'
            }
          ]
        },
        {
          id: 'cash_count_and_reconciliation',
          name: 'Comptage Espèces & Validation',
          description: 'Saisie du caissier, comptage réel, observations et validation irréversible',
          elements: [
            {
              acomId: 'pressing.cash_closure.cashier',
              semanticId: 'closure.form.cashierName',
              label: 'Nom du Caissier / Opérateur',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Nom de l\'opérateur responsable de la clôture'
            },
            {
              acomId: 'pressing.cash_closure.real_cash',
              semanticId: 'closure.form.actualCash',
              label: 'Espèces Réelles Comptées (+ FCFA)',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Montant physique réel compté dans la caisse'
            },
            {
              acomId: 'pressing.cash_closure.observations',
              semanticId: 'closure.form.notes',
              label: 'Observations / Justifications',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Commentaires et justificatifs en cas d\'écart de caisse'
            },
            {
              acomId: 'pressing.cash_closure.validate',
              semanticId: 'closure.form.submitBtn',
              label: 'Valider & Verrouiller la Caisse',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Bouton d\'action pour clôturer définitivement et expédier les rapports'
            }
          ]
        },
        {
          id: 'closure_history_zone',
          name: 'Historique des Clôtures Journalières',
          description: 'Consultation et partage des clôtures archivées',
          elements: [
            {
              acomId: 'pressing.cash_closure.history',
              semanticId: 'closure.history.list',
              label: 'Historique des Clôtures Journalières',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Liste des clôtures journalières précédemment enregistrées'
            }
          ]
        }
      ]
    });

    // 5. Comptabilité & Dépenses
    const accountingDefinition: SaaSPageDefinition = {
      pageId: 'accounting',
      saasId: 'pressing',
      name: 'Comptabilité & Dépenses',
      purpose: 'Gestion des flux financiers, dépenses générales de l\'atelier et suivi gérant',
      zones: [
        {
          id: 'expenses_header_zone',
          name: 'Entête & Action Nouvelle Dépense',
          description: 'Ouverture du formulaire de saisie de dépense manuelle',
          elements: [
            {
              acomId: 'accounting.btn.new_expense',
              semanticId: 'accounting.new_expense_btn',
              label: 'Bouton Nouvelle Dépense',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Ouvre le modal de création d\'une nouvelle dépense manuelle'
            }
          ]
        },
        {
          id: 'expense_form_zone',
          name: 'Formulaire Nouvelle Dépense Manuelle',
          description: 'Saisie des informations de la dépense, catégorie, justificatif et notification',
          elements: [
            {
              acomId: 'accounting.expense.form_card',
              semanticId: 'accounting.modal_card',
              label: 'Formulaire Nouvelle Dépense',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Conteneur modal du formulaire de dépense'
            },
            {
              acomId: 'accounting.expense.title',
              semanticId: 'accounting.title',
              label: 'Description / Intitulé',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Désignation ou intitulé de la dépense (ex: Facture Senelec, Loyer)'
            },
            {
              acomId: 'accounting.expense.amount',
              semanticId: 'accounting.amount',
              label: 'Montant (FCFA)',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Montant en FCFA de la charge ou dépense'
            },
            {
              acomId: 'accounting.expense.date',
              semanticId: 'accounting.date',
              label: 'Date de Dépense',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Date d\'émission ou de règlement de la dépense'
            },
            {
              acomId: 'accounting.expense.category_grid',
              semanticId: 'accounting.category',
              label: 'Catégorie Comptable',
              type: 'display',
              supportedOperations: ['read', 'select'],
              description: 'Sélection de la catégorie analytique de la charge'
            },
            {
              acomId: 'accounting.expense.payment_methods',
              semanticId: 'accounting.payment_method',
              label: 'Mode de Paiement',
              type: 'display',
              supportedOperations: ['read', 'select'],
              description: 'Mode de règlement utilisé (espèces, mobile money, carte, virement, chèque)'
            },
            {
              acomId: 'accounting.expense.reference',
              semanticId: 'accounting.reference',
              label: 'Référence / Justificatif',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Numéro de reçu, chèque ou référence de transaction bancaire'
            },
            {
              acomId: 'accounting.expense.description',
              semanticId: 'accounting.description',
              label: 'Description / Justification',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Commentaires ou justification détaillée de la dépense'
            },
            {
              acomId: 'accounting.expense.submit_btn',
              semanticId: 'accounting.submit_btn',
              label: 'Enregistrer la dépense & Notifier',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Validation, enregistrement local et notification au gérant'
            },
            {
              acomId: 'alert-confirm-btn',
              semanticId: 'alert.confirm_btn',
              label: 'Bouton Confirmation Alerte (D\'ACCORD)',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Validation de l\'alerte de confirmation du suivi gérant'
            }
          ]
        },
        {
          id: 'accounting_kpis_zone',
          name: 'Indicateurs Financiers & Charges',
          description: 'Cartes de synthèse des charges totales et dépenses générales',
          elements: [
            {
              acomId: 'accounting.kpi_cards',
              semanticId: 'accounting.kpis',
              label: 'Grille des Indicateurs',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Bloc des compteurs financiers'
            },
            {
              acomId: 'accounting.kpi.charges_totales',
              semanticId: 'accounting.kpi.total_charges',
              label: 'Charges Totales',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Somme cumulée de toutes les sorties d\'argent'
            },
            {
              acomId: 'accounting.kpi.depenses_generales',
              semanticId: 'accounting.kpi.general_expenses',
              label: 'Dépenses Générales',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Total des dépenses de fonctionnement de l\'atelier'
            }
          ]
        },
        {
          id: 'accounting_flux_zone',
          name: 'Flux de Trésorerie & Tableau des Dépenses',
          description: 'Filtres de flux et registre détaillé des dépenses enregistrées',
          elements: [
            {
              acomId: 'accounting.filters_row',
              semanticId: 'accounting.filters',
              label: 'Filtres Flux de Trésorerie',
              type: 'display',
              supportedOperations: ['read', 'click'],
              description: 'Filtres par type de flux financier (tous, générales, transport, maintenance)'
            },
            {
              acomId: 'accounting.outflows_table',
              semanticId: 'accounting.table',
              label: 'Tableau des Sorties Financières',
              type: 'table',
              supportedOperations: ['read'],
              description: 'Liste chronologique et détaillée des décaissements et dépenses'
            }
          ]
        }
      ]
    };

    this.registerPage(accountingDefinition);
    this.registerPage({ ...accountingDefinition, pageId: 'pressing_accounting' });
    this.registerPage({ ...accountingDefinition, pageId: 'pressing_compta' });
    this.registerPage({ ...accountingDefinition, pageId: 'comptabilite' });

    // 6. Rapports Financiers
    const reportsDefinition: SaaSPageDefinition = {
      pageId: 'reports',
      saasId: 'pressing',
      name: 'Rapports Financiers',
      purpose: 'Suivre les performances financières de votre activité, comparer les revenus et les dépenses et analyser la rentabilité',
      zones: [
        {
          id: 'reports_header_zone',
          name: 'Entête & Exports du Rapport',
          description: 'Présentation de la page et boutons d\'export CSV et PDF',
          elements: [
            {
              acomId: 'reports.header',
              semanticId: 'reports.header_title',
              label: 'Entête Rapports Financiers',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Titre de la page : Rapports Financiers — Analyse de performance et rentabilité'
            },
            {
              acomId: 'reports.export_csv_btn',
              semanticId: 'reports.export_csv',
              label: 'Bouton Exporter CSV',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Exportation des transactions financières en format CSV'
            },
            {
              acomId: 'reports.export_pdf_btn',
              semanticId: 'reports.export_pdf',
              label: 'Bouton Rapport PDF',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Génération du rapport financier consolidé au format PDF'
            }
          ]
        },
        {
          id: 'reports_period_zone',
          name: 'Période d\'Analyse',
          description: 'Sélecteur de mois et intervalle d\'analyse pour le calcul des statistiques',
          elements: [
            {
              acomId: 'reports.period_selector',
              semanticId: 'reports.period_selector_box',
              label: 'Période des statistiques de vente',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Zone de sélection de la période d\'analyse'
            },
            {
              acomId: 'reports.period_input',
              semanticId: 'reports.period_month_input',
              label: 'Sélecteur de mois',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Champ de saisie du mois d\'analyse (ex: 2026-08)'
            }
          ]
        },
        {
          id: 'reports_kpis_zone',
          name: 'Indicateurs Clés de Performance (KPI)',
          description: '8 cartes d\'indicateurs de ventes, encaissements, coûts, marge, dépenses et résultat',
          elements: [
            {
              acomId: 'reports.kpis_grid',
              semanticId: 'reports.kpis_container',
              label: 'Grille des Indicateurs Financiers',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Vue d\'ensemble synthétique des huit indicateurs financiers'
            },
            {
              acomId: 'reports.kpi.ventes_totales',
              semanticId: 'reports.kpi.total_sales',
              label: 'Ventes Totales',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Montant total des ventes enregistrées sur la période sélectionnée'
            },
            {
              acomId: 'reports.kpi.total_encaisse',
              semanticId: 'reports.kpi.total_collected',
              label: 'Total Encaissé',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Sommes effectivement encaissées sur la période sélectionnée'
            },
            {
              acomId: 'reports.kpi.reste_recouvrer',
              semanticId: 'reports.kpi.pending_balance',
              label: 'Reste à Recouvrer',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Montants qui restent encore à encaisser'
            },
            {
              acomId: 'reports.kpi.cout_achat',
              semanticId: 'reports.kpi.cogs',
              label: 'Coût d\'Achat',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Coûts associés aux produits ou éléments nécessaires à l\'activité'
            },
            {
              acomId: 'reports.kpi.marge_brute',
              semanticId: 'reports.kpi.gross_margin',
              label: 'Marge Brute',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Marge brute après prise en compte du coût d\'achat par rapport aux ventes'
            },
            {
              acomId: 'reports.kpi.total_depenses',
              semanticId: 'reports.kpi.total_expenses',
              label: 'Total Dépenses',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Total des dépenses enregistrées sur la période sélectionnée'
            },
            {
              acomId: 'reports.kpi.flux_tresorerie',
              semanticId: 'reports.kpi.cash_flow',
              label: 'Flux de Trésorerie',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Mouvement financier net résultant des entrées et sorties'
            },
            {
              acomId: 'reports.kpi.benefice_net',
              semanticId: 'reports.kpi.net_profit',
              label: 'Bénéfice Net',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Résultat financier calculé pour la période sélectionnée'
            }
          ]
        },
        {
          id: 'reports_charts_zone',
          name: 'Graphiques & Analyse des Dépenses',
          description: 'Visualisation de l\'évolution mensuelle et ventilation de la part des dépenses',
          elements: [
            {
              acomId: 'reports.chart.evolution_mensuelle',
              semanticId: 'reports.monthly_chart',
              label: 'Évolution Mensuelle',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Graphique de l\'évolution temporelle comparée des revenus et des dépenses'
            },
            {
              acomId: 'reports.chart.part_depenses',
              semanticId: 'reports.expense_breakdown',
              label: 'Part des Dépenses',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Répartition des dépenses par catégorie'
            },
            {
              acomId: 'reports.suggestion.optimisation',
              semanticId: 'reports.optimization_tip',
              label: 'Optimisation Suggérée',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Suggestion d\'optimisation basée sur les dépenses observées'
            }
          ]
        }
      ]
    };

    this.registerPage(reportsDefinition);
    this.registerPage({ ...reportsDefinition, pageId: 'pressing_reports' });
    this.registerPage({ ...reportsDefinition, pageId: 'financial_reports' });
    this.registerPage({ ...reportsDefinition, pageId: 'pressing_financial_reports' });
    this.registerPage({ ...reportsDefinition, pageId: 'rapports' });

    // 7. Réglages & Configuration Système
    const settingsDefinition: SaaSPageDefinition = {
      pageId: 'settings',
      saasId: 'pressing',
      name: 'Réglages',
      purpose: 'Configurer les solutions SaaS, la gestion des données locales, le suivi gérant, l\'accès bureau et l\'identité commerciale de votre entreprise',
      zones: [
        {
          id: 'settings_saas_zone',
          name: 'Solutions SaaS & Abonnements',
          description: 'Gestion des solutions métiers activées et des accès de votre compte',
          elements: [
            {
              acomId: 'settings.saas.card',
              semanticId: 'settings.saas_container',
              label: 'Solutions SaaS & Abonnements',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Section permettant de gérer les solutions SaaS et les accès associés à votre activité'
            },
            {
              acomId: 'settings.saas.manage_btn',
              semanticId: 'settings.manage_saas_btn',
              label: 'Gérer mes SaaS & Accès',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Bouton pour consulter ou gérer les solutions disponibles'
            }
          ]
        },
        {
          id: 'settings_data_zone',
          name: 'Gestion des Données Locales',
          description: 'Contrôle du stockage local-first, état de synchronisation Cloud, sécurité et maintenance du cache',
          elements: [
            {
              acomId: 'settings.data.local_first_card',
              semanticId: 'settings.local_first_info',
              label: 'Mode Local-First (Optimisé)',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Mode Local-First permettant de travailler avec les données locales de l\'application'
            },
            {
              acomId: 'settings.data.sync_status',
              semanticId: 'settings.sync_status_box',
              label: 'État de la Synchronisation',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Indication si les données locales sont synchronisées ou non avec le Cloud'
            },
            {
              acomId: 'settings.data.security_status',
              semanticId: 'settings.security_status_badge',
              label: 'Sécurité des Données Locales',
              type: 'display',
              supportedOperations: ['read'],
              description: 'État de sécurité des données affiché par l\'application'
            },
            {
              acomId: 'settings.data.export_btn',
              semanticId: 'settings.export_local_data_btn',
              label: 'Exporter la Base Locale',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Exportation des données locales pour conserver une copie de sauvegarde'
            },
            {
              acomId: 'settings.data.clear_cache_btn',
              semanticId: 'settings.clear_cache_btn',
              label: 'Vider le Cache (Attention)',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Opération sensible pour réinitialiser le cache local en cas de besoin'
            }
          ]
        },
        {
          id: 'settings_manager_zone',
          name: 'Suivi Gérant (Temps Réel)',
          description: 'Configuration des alertes et canaux de notification WhatsApp et e-mail',
          elements: [
            {
              acomId: 'settings.manager.whatsapp_input',
              semanticId: 'settings.manager_whatsapp_field',
              label: 'WhatsApp Gérant (avec indicatif)',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Numéro WhatsApp du gérant avec son indicatif international pour l\'envoi des notifications'
            },
            {
              acomId: 'settings.manager.email_input',
              semanticId: 'settings.manager_email_field',
              label: 'E-mail Gérant (Destinataire)',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Adresse e-mail qui doit recevoir les notifications destinées au gérant'
            },
            {
              acomId: 'settings.manager.notify_cash_closure_toggle',
              semanticId: 'settings.notify_cash_closure_checkbox',
              label: 'Alerte Clôture de Caisse',
              type: 'input',
              supportedOperations: ['read', 'write', 'click'],
              description: 'Option permettant l\'envoi automatique d\'une notification au gérant lors d\'une clôture de caisse'
            },
            {
              acomId: 'settings.manager.notify_pos_sale_toggle',
              semanticId: 'settings.notify_pos_sale_checkbox',
              label: 'Alerte Vente Caisse POS',
              type: 'input',
              supportedOperations: ['read', 'write', 'click'],
              description: 'Option permettant l\'envoi automatique d\'une notification lors d\'une vente effectuée sur la caisse POS'
            },
            {
              acomId: 'settings.manager.save_alerts_btn',
              semanticId: 'settings.save_manager_alerts_btn',
              label: 'Sauvegarder les alertes',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Bouton pour enregistrer les paramètres de notifications gérant'
            }
          ]
        },
        {
          id: 'settings_desktop_zone',
          name: 'Version Bureau & Desktop',
          description: 'Installation et accès direct à l\'application sur PC, Mac ou Linux',
          elements: [
            {
              acomId: 'settings.desktop.card',
              semanticId: 'settings.desktop_app_card',
              label: 'Version Bureau & Desktop',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Section permettant d\'installer Acom sur votre ordinateur pour un accès plus rapide'
            },
            {
              acomId: 'settings.desktop.download_btn',
              semanticId: 'settings.download_desktop_app_btn',
              label: 'Obtenir l\'App Desktop',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Bouton pour installer l\'application sur votre ordinateur'
            }
          ]
        },
        {
          id: 'settings_business_zone',
          name: 'Réglages Business',
          description: 'Configuration de l\'identité commerciale, coordonnées et informations officielles de l\'entreprise',
          elements: [
            {
              acomId: 'settings.business.saas_type',
              semanticId: 'settings.business_saas_type_box',
              label: 'Type de SaaS',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Type de SaaS configuré pour votre activité'
            },
            {
              acomId: 'settings.business.plan',
              semanticId: 'settings.business_plan_box',
              label: 'Forfait Actuel',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Forfait actuellement associé à votre compte'
            },
            {
              acomId: 'settings.business.license_type_select',
              semanticId: 'settings.business_license_select',
              label: 'Type de Licence',
              type: 'select',
              supportedOperations: ['read', 'write'],
              description: 'Type de licence actuellement utilisé par l\'entreprise'
            },
            {
              acomId: 'settings.business.name_input',
              semanticId: 'settings.business_name_field',
              label: 'Nom de l\'Établissement',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Nom de l\'établissement ou de l\'organisation'
            },
            {
              acomId: 'settings.business.logo_upload_label',
              semanticId: 'settings.business_logo_upload',
              label: 'Logo de l\'Entreprise',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Modification du logo utilisé par votre entreprise dans l\'application et les devis/factures'
            },
            {
              acomId: 'settings.business.phone_input',
              semanticId: 'settings.business_phone_field',
              label: 'Téléphone Professionnel',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Numéro de téléphone professionnel de l\'entreprise'
            },
            {
              acomId: 'settings.business.email_input',
              semanticId: 'settings.business_email_field',
              label: 'E-mail de Contact',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Adresse e-mail officielle de contact de l\'entreprise'
            },
            {
              acomId: 'settings.business.address_input',
              semanticId: 'settings.business_address_field',
              label: 'Adresse Physique',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Adresse physique de l\'établissement'
            },
            {
              acomId: 'settings.business.description_input',
              semanticId: 'settings.business_description_field',
              label: 'Description / Slogan',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Courte description ou slogan de l\'entreprise'
            },
            {
              acomId: 'settings.business.save_btn',
              semanticId: 'settings.business_save_button',
              label: 'Enregistrer les Modifications',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Enregistrement de tous les paramètres et coordonnées de l\'entreprise'
            }
          ]
        }
      ]
    };

    this.registerPage(settingsDefinition);
    this.registerPage({ ...settingsDefinition, pageId: 'pressing_settings' });
    this.registerPage({ ...settingsDefinition, pageId: 'reglages' });
    this.registerPage({ ...settingsDefinition, pageId: 'pressing_reglages' });
    this.registerPage({ ...settingsDefinition, pageId: 'merchant_settings' });
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

  private registerCommercePOSPage(): void {
    const posDefinition: SaaSPageDefinition = {
      pageId: 'pos',
      saasId: 'stock',
      name: 'Caisse POS — Management Commerce',
      purpose: 'Enregistrement rapide des ventes, gestion des encaissements au comptoir, modes de paiement et notifications multi-canaux',
      zones: [
        {
          id: 'pos_search_zone',
          name: 'Recherche & Scan Code-barres',
          description: 'Recherche rapide par nom ou SKU et déclenchement du scanner caméra',
          elements: [
            {
              acomId: 'pos.search_input',
              semanticId: 'pos.search',
              label: 'Recherche produit / SKU',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Champ de recherche et scanner direct de code-barres'
            },
            {
              acomId: 'pos.scanner_btn',
              semanticId: 'pos.scannerBtn',
              label: 'Bouton Scanner Caméra',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Ouvre le lecteur de code-barres vidéo'
            }
          ]
        },
        {
          id: 'pos_filter_zone',
          name: 'Filtres & Tri Catalogue',
          description: 'Segmentation par catégorie d\'établissement, niveau de stock et critère de tri',
          elements: [
            {
              acomId: 'pos.categories_zone',
              semanticId: 'pos.categories',
              label: 'Catégories Établissement',
              type: 'display',
              supportedOperations: ['read', 'select'],
              description: 'Boutons de filtre par catégorie d\'articles'
            },
            {
              acomId: 'pos.stock_filter_zone',
              semanticId: 'pos.stockFilter',
              label: 'Filtre de Disponibilité Stock',
              type: 'display',
              supportedOperations: ['read', 'select'],
              description: 'Filtre selon les états : Tout, En Stock, Alerte Stock, Rupture'
            },
            {
              acomId: 'pos.sort_select',
              semanticId: 'pos.sortBy',
              label: 'Sélecteur de Tri',
              type: 'select',
              supportedOperations: ['select', 'read'],
              description: 'Tri alphabétique, par prix ou par niveau de stock'
            }
          ]
        },
        {
          id: 'pos_catalog_zone',
          name: 'Grille des Produits & Ajout',
          description: 'Affichage des fiches articles avec visuel, prix, taille, couleur et bouton d\'ajout',
          elements: [
            {
              acomId: 'pos.product_card',
              semanticId: 'pos.productCard',
              label: 'Fiche Produit',
              type: 'button',
              supportedOperations: ['click', 'read'],
              description: 'Carte produit avec déclenchement d\'ajout au panier'
            },
            {
              acomId: 'pos.add_to_cart_btn',
              semanticId: 'pos.addToCartBtn',
              label: 'Bouton Ajout Rapide (+)',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Bouton flottant pour incrémenter le produit dans le panier'
            }
          ]
        },
        {
          id: 'pos_cart_zone',
          name: 'Panier d\'Encaissement',
          description: 'Détail des articles du panier, contrôle des quantités et sous-totaux',
          elements: [
            {
              acomId: 'pos.cart_panel',
              semanticId: 'pos.cartPanel',
              label: 'Panier de Vente',
              type: 'display',
              supportedOperations: ['read', 'click'],
              description: 'Conteneur du panier et régulateur des quantités'
            }
          ]
        },
        {
          id: 'pos_client_zone',
          name: 'Informations Client',
          description: 'Coordonnées du client pour personnalisation et envoi de reçu',
          elements: [
            {
              acomId: 'pos.customer_name',
              semanticId: 'client.name',
              label: 'Nom du client',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Nom ou raison sociale du client'
            },
            {
              acomId: 'pos.customer_phone',
              semanticId: 'client.phone',
              label: 'Téléphone client',
              type: 'input',
              supportedOperations: ['read', 'write'],
              description: 'Numéro de téléphone pour envoi WhatsApp du reçu'
            }
          ]
        },
        {
          id: 'pos_payment_zone',
          name: 'Modes de Paiement & Acompte',
          description: 'Sélection du mode de règlement (Espèces, Carte, Mobile) et gestion des acomptes',
          elements: [
            {
              acomId: 'pos.payment_methods_zone',
              semanticId: 'pos.paymentMethods',
              label: 'Sélecteur de Mode de Paiement',
              type: 'display',
              supportedOperations: ['click', 'select'],
              description: 'Boutons de choix du mode de paiement'
            },
            {
              acomId: 'pos.partial_payment_toggle',
              semanticId: 'pos.partialPaymentToggle',
              label: 'Option Paiement Partiel (Acompte)',
              type: 'button',
              supportedOperations: ['click', 'write'],
              description: 'Interrupteur et saisie du montant de l\'acompte versé'
            }
          ]
        },
        {
          id: 'pos_tracking_zone',
          name: 'Options de Suivi & Notifications',
          description: 'Canaux d\'expédition automatique du reçu et notifications de gestion',
          elements: [
            {
              acomId: 'pos.whatsapp_manager_toggle',
              semanticId: 'pos.whatsappManager',
              label: 'Suivi WhatsApp Manager',
              type: 'button',
              supportedOperations: ['click', 'write'],
              description: 'Alerte instantanée sur le WhatsApp de la direction'
            },
            {
              acomId: 'pos.whatsapp_client_toggle',
              semanticId: 'pos.whatsappClient',
              label: 'Suivi WhatsApp Client',
              type: 'button',
              supportedOperations: ['click', 'write'],
              description: 'Envoi du reçu interactif sur le WhatsApp du client'
            },
            {
              acomId: 'pos.messaging_zone',
              semanticId: 'pos.emailManager',
              label: 'Suivi Email Manager',
              type: 'button',
              supportedOperations: ['click', 'write'],
              description: 'Transmission du rapport de caisse par courrier électronique'
            }
          ]
        },
        {
          id: 'pos_validation_zone',
          name: 'Validation & Total à Payer',
          description: 'Vérification du montant total TTC et bouton d\'exécution de la vente',
          elements: [
            {
              acomId: 'pos.total_amount_zone',
              semanticId: 'pos.totalAmount',
              label: 'Total à payer',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Montant total calculé dans la devise active'
            },
            {
              acomId: 'pos.submit_checkout_btn',
              semanticId: 'pos.submitCheckout',
              label: 'Bouton Valider la Vente',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Valide l\'encaissement, déstocke les produits et émet l\'événement métier'
            }
          ]
        },
        {
          id: 'pos_receipt_zone',
          name: 'Reçu, Impression & Clôture',
          description: 'Boîte de dialogue de succès, formats d\'impression et réinitialisation pour nouveau client',
          elements: [
            {
              acomId: 'pos.sale_success_modal',
              semanticId: 'pos.saleSuccessModal',
              label: 'Dialogue Vente Réussie & Impression',
              type: 'display',
              supportedOperations: ['read', 'click'],
              description: 'Fenêtre modale d\'impression du ticket thermique et de la facture A4'
            },
            {
              acomId: 'pos.modal_tracking_details',
              semanticId: 'pos.trackingDetails',
              label: 'Détails de Suivi & WhatsApp',
              type: 'display',
              supportedOperations: ['read'],
              description: 'Panneau récapitulatif du lien WhatsApp et de la traçabilité'
            },
            {
              acomId: 'pos.new_client_btn',
              semanticId: 'pos.newClientBtn',
              label: 'Bouton Nouveau Client',
              type: 'button',
              supportedOperations: ['click'],
              description: 'Ferme la fenêtre de confirmation et réinitialise la caisse'
            }
          ]
        }
      ]
    };

    // Register alias pageIds for flexible matching
    this.registerPage(posDefinition);
    this.registerPage({ ...posDefinition, pageId: 'caisse' });
    this.registerPage({ ...posDefinition, pageId: 'caisse_pos' });
    this.registerPage({ ...posDefinition, pageId: 'merchant_pos' });
    this.registerPage({ ...posDefinition, pageId: 'commerce_pos' });
  }
}

export const SaaSPageRegistry = new SaaSPageRegistryService();
