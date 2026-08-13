// src/ai-demo/Tutorial/TutorialEngine.ts
// Observational Event-Driven Tutorial Engine

import { TutorialScenario, TutorialStep } from '../types';
import { EventBus } from '../BusinessEvents/EventBus';
import { LanguageEngine } from '../Assistant/LanguageEngine';
import { SaaSPageRegistry } from '../Intelligence/SaaSPageRegistry';
import { ContextEngine } from '../Intelligence/ContextEngine';

export const PRESSING_TARIFS_TUTORIAL: TutorialScenario = {
  id: 'pressing_tutorial_tarifs',
  title: 'Formation Paramétrage des Tarifs Pressing',
  description: 'Tutoriel guidé pas-à-pas pour configurer vos grilles tarifaires par article, au kilogramme et prestations optionnelles.',
  saasModule: 'pressing',
  estimatedDurationSec: 210,
  steps: [
    {
      stepNumber: 1,
      title: '1. Accéder au Paramétrage des Tarifs',
      description: 'Vous êtes dans le paramétrage des tarifs. Cette page permet de définir les tarifs par article, au kilogramme et les prestations optionnelles.',
      targetAcomId: 'nav-pressing_tarifs',
      actionToPerform: 'click',
      speechFr: 'Vous êtes maintenant dans le paramétrage des tarifs. Cette page permet de définir vos tarifs par article, au kilogramme et les prestations optionnelles.',
      speechWolof: 'Yanga ci paramétrage des tarifs. Fi mën nga fi régler prix yi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 2,
      title: '2. Tarifs par Article — Ajouter un article',
      description: 'Section Tarifs par Article (Vêtements). Cliquez sur AJOUTER UN NOUVEL ARTICLE pour ouvrir le formulaire.',
      targetAcomId: 'btn-add-article',
      actionToPerform: 'click',
      speechFr: 'Dans la section Tarifs par Article, cliquez sur le bouton AJOUTER UN NOUVEL ARTICLE.',
      speechWolof: 'Bëssal ci bouton AJOUTER UN NOUVEL ARTICLE bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Nom du vêtement',
      description: 'Saisissez le nom du vêtement (ex: Costume 3 pièces).',
      targetAcomId: 'input-article-name',
      actionToPerform: 'type',
      inputValue: 'Costume 3 pièces',
      speechFr: 'Saisissez le nom du vêtement, par exemple Costume 3 pièces.',
      speechWolof: 'Bindal touru yêre bi, par exemple Costume 3 pièces.',
      stepCategory: 'required'
    },
    {
      stepNumber: 4,
      title: '4. Prix de vente unitaire (FCFA)',
      description: 'Indiquez le prix de vente unitaire appliqué au client lors du dépôt.',
      targetAcomId: 'input-article-price',
      actionToPerform: 'type',
      inputValue: '3500',
      speechFr: 'Indiquez le prix de vente unitaire en FCFA.',
      speechWolof: 'Bindal prix de vente bi ci FCFA.',
      stepCategory: 'required'
    },
    {
      stepNumber: 5,
      title: '5. Unité de tarification',
      description: 'Sélectionnez l\'unité de comptage (Unité par pièce, Paire, Ensemble).',
      targetAcomId: 'select-article-unit',
      actionToPerform: 'click',
      speechFr: 'Sélectionnez l\'unité de tarification appropriée.',
      speechWolof: 'Tannal unité de tarification bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 6,
      title: '6. Coût intrant (FCFA)',
      description: 'Indiquez le coût de revient ou coût intrant estimé pour traiter cet article.',
      targetAcomId: 'input-article-cost',
      actionToPerform: 'type',
      inputValue: '500',
      speechFr: 'Indiquez le coût intrant estimé en FCFA pour cet article.',
      speechWolof: 'Bindal coût intrant bi ci FCFA.',
      stepCategory: 'required'
    },
    {
      stepNumber: 7,
      title: '7. Valider l\'ajout de l\'article',
      description: 'Cliquez sur Ajouter pour enregistrer cet article dans la grille.',
      targetAcomId: 'btn-submit-article',
      actionToPerform: 'click',
      speechFr: 'Cliquez sur le bouton Ajouter pour valider l\'article.',
      speechWolof: 'Bëssal Ajouter ngir enregistrer yêre bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: '8. Tarifs au Kilogramme — Ajouter un format Kg',
      description: 'Dans la section Tarifs au Kilogramme (Kg), cliquez sur AJOUTER UN FORMAT KG.',
      targetAcomId: 'btn-add-kg-format',
      actionToPerform: 'click',
      speechFr: 'Passons aux tarifs au kilo. Cliquez sur AJOUTER UN FORMAT KG.',
      speechWolof: 'Légui ci tarifs au kilo, bëssal AJOUTER UN FORMAT KG.',
      stepCategory: 'required'
    },
    {
      stepNumber: 9,
      title: '9. Nom du format',
      description: 'Renseignez l\'intitulé de la formule kilo (ex: Express Linge Vrac).',
      targetAcomId: 'input-kg-name',
      actionToPerform: 'type',
      inputValue: 'Express Linge Vrac',
      speechFr: 'Renseignez le nom du format, par exemple Express Linge Vrac.',
      speechWolof: 'Bindal touru format bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 10,
      title: '10. Prix par kilogramme (FCFA/Kg)',
      description: 'Saisissez le tarif facturé au client par kilogramme.',
      targetAcomId: 'input-kg-price',
      actionToPerform: 'type',
      inputValue: '1500',
      speechFr: 'Saisissez le prix par kilogramme en FCFA par Kg.',
      speechWolof: 'Bindal prix bi par kilogramme.',
      stepCategory: 'required'
    },
    {
      stepNumber: 11,
      title: '11. Unité / Tarif de référence',
      description: 'Sélectionnez la référence (Par Kilogramme, Sac de 5 Kg, etc.).',
      targetAcomId: 'select-kg-unit',
      actionToPerform: 'click',
      speechFr: 'Choisissez l\'unité ou le tarif de référence.',
      speechWolof: 'Tannal référence bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 12,
      title: '12. Coût par kilo (FCFA/Kg)',
      description: 'Indiquez le coût intrant par kilogramme.',
      targetAcomId: 'input-kg-cost',
      actionToPerform: 'type',
      inputValue: '300',
      speechFr: 'Renseignez le coût intrant par kilo en FCFA par Kg.',
      speechWolof: 'Bindal coût bi par kilo.',
      stepCategory: 'required'
    },
    {
      stepNumber: 13,
      title: '13. Valider le format Kg',
      description: 'Cliquez sur Ajouter pour insérer cette formule au kilogramme.',
      targetAcomId: 'btn-submit-kg',
      actionToPerform: 'click',
      speechFr: 'Cliquez sur Ajouter pour valider ce forfait kilo.',
      speechWolof: 'Bëssal Ajouter ngir yook forfait bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 14,
      title: '14. Prestations Optionnelles — Ajouter une prestation',
      description: 'Dans la section Prestations Optionnelles (Suppléments), cliquez sur AJOUTER UNE PRESTATION OPTIONNELLE.',
      targetAcomId: 'btn-add-supplement',
      actionToPerform: 'click',
      speechFr: 'Dans la section des suppléments, cliquez sur AJOUTER UNE PRESTATION OPTIONNELLE.',
      speechWolof: 'Ci prestations optionnelles yi, bëssal AJOUTER UNE PRESTATION OPTIONNELLE.',
      stepCategory: 'required'
    },
    {
      stepNumber: 15,
      title: '15. Nom de la prestation',
      description: 'Saisissez l\'intitulé de la prestation optionnelle (ex: Parfumage Royal).',
      targetAcomId: 'input-supplement-name',
      actionToPerform: 'type',
      inputValue: 'Parfumage Royal',
      speechFr: 'Saisissez le nom de la prestation optionnelle, par exemple Parfumage Royal.',
      speechWolof: 'Bindal touru prestation bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 16,
      title: '16. Description / Détails',
      description: 'Fournissez une description explicative du service.',
      targetAcomId: 'input-supplement-description',
      actionToPerform: 'type',
      inputValue: 'Essence naturelle de fleur d\'oranger',
      speechFr: 'Fournissez une description claire du service.',
      speechWolof: 'Bindal description bu lér bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 17,
      title: '17. Prix / Tarif (FCFA)',
      description: 'Saisissez le tarif du supplément en FCFA.',
      targetAcomId: 'input-supplement-price',
      actionToPerform: 'type',
      inputValue: '500',
      speechFr: 'Indiquez le prix du supplément en FCFA.',
      speechWolof: 'Bindal prix bu supplément bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 18,
      title: '18. Paramètre de tarification',
      description: 'Choisissez le mode d\'application (Par Article, Par Dépôt, Forfait Fixe, Au Kilo).',
      targetAcomId: 'select-supplement-unit',
      actionToPerform: 'click',
      speechFr: 'Sélectionnez le paramètre de tarification du supplément.',
      speechWolof: 'Tannal paramètre bu tarification bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 19,
      title: '19. Coût intrant (FCFA)',
      description: 'Indiquez le coût de revient ou intrant de cette prestation optionnelle.',
      targetAcomId: 'input-supplement-cost',
      actionToPerform: 'type',
      inputValue: '100',
      speechFr: 'Saisissez le coût intrant en FCFA pour cette prestation.',
      speechWolof: 'Bindal coût intrant bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 20,
      title: '20. Valider la prestation optionnelle',
      description: 'Cliquez sur Ajouter pour valider l\'enregistrement du supplément.',
      targetAcomId: 'btn-submit-supplement',
      actionToPerform: 'click',
      speechFr: 'Cliquez sur le bouton Ajouter pour enregistrer la prestation optionnelle.',
      speechWolof: 'Bëssal Ajouter ngir enregistrer supplément bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 21,
      title: '21. Enregistrer les Tarifs',
      description: 'Cliquez sur ENREGISTRER LES TARIFS pour sauvegarder définitivement l\'ensemble de vos grilles.',
      targetAcomId: 'btn-save-pricing',
      actionToPerform: 'click',
      expectedEvent: 'PRICING_CONFIG_SAVED',
      speechFr: 'Cliquez sur ENREGISTRER LES TARIFS en haut à droite pour sauvegarder définitivement.',
      speechWolof: 'Bëssal ENREGISTRER LES TARIFS ngir tëj réglage yi.',
      stepCategory: 'final'
    },
    {
      stepNumber: 22,
      title: '22. Confirmation de Sauvegarde',
      description: 'Vos grilles tarifaires et prestations optionnelles sont maintenant sauvegardées et actives.',
      targetAcomId: 'pricing-saved-confirmation',
      actionToPerform: 'observe',
      speechFr: 'Vos grilles tarifaires et prestations optionnelles sont sauvegardées avec succès.',
      speechWolof: 'Am nga tarif yu mucc ayib. Légui mën nga léen jëfandikoo.',
      stepCategory: 'info'
    }
  ]
};

export const PRESSING_STOCK_SALES_TUTORIAL: TutorialScenario = {
  id: 'pressing_tutorial_stock_sales',
  title: 'Vente Directe & Gestion du Stock Pressing',
  description: 'Tutoriel guidé interactif pour encaisser une vente de détergent ou produit nettoyant et gérer le stock.',
  saasModule: 'pressing',
  estimatedDurationSec: 180,
  steps: [
    {
      stepNumber: 1,
      title: '1. Onglet Encaisser Vente',
      description: 'Vérifiez que vous êtes bien sur le point de vente directe (Encaisser Vente) pour servir les clients.',
      targetAcomId: 'pressing.sales.tab_sales',
      actionToPerform: 'click',
      speechFr: 'Bienvenue sur la gestion du stock et vente directe. Assurez-vous d\'être sur l\'onglet Encaisser Vente.',
      speechWolof: 'Dalal ak jamm ci vente ak stock. Séétal ndax yangi ci onglet Encaisser Vente bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 2,
      title: '2. Recherche de Produit',
      description: 'Utilisez la barre de recherche pour retrouver rapidement un produit par son nom, son usage ou son code-barres.',
      targetAcomId: 'pressing.sales.search_input',
      actionToPerform: 'type',
      inputValue: 'Lessive',
      speechFr: 'Recherchez un produit ou détergent dans le catalogue en saisissant son nom ou sa référence.',
      speechWolof: 'Wëral produit bi ci barre de recherche bi, bindal tour bi wala usage bi.',
      stepCategory: 'optional',
      isOptional: true
    },
    {
      stepNumber: 3,
      title: '3. Filtrage par Rayon (Catégorie)',
      description: 'Filtrez les articles selon leur rayon spécifique : Lessives, Assouplissants, Détachants ou Emballages.',
      targetAcomId: 'pressing.sales.rayon_select',
      actionToPerform: 'click',
      speechFr: 'Vous pouvez filtrer par rayon pour cibler rapidement les lessives, assouplissants ou détachants.',
      speechWolof: 'Mën nga filtrer par rayon ngir gënë gaaw.',
      stepCategory: 'optional',
      isOptional: true
    },
    {
      stepNumber: 4,
      title: '4. Fiche Produit & Stock Disponible',
      description: 'Observez la fiche produit avec son image, son prix unitaire en FCFA et le niveau de stock en temps réel.',
      targetAcomId: 'pressing.sales.product_card',
      actionToPerform: 'observe',
      speechFr: 'Chaque carte présente le produit, son prix de vente et les unités disponibles en stock.',
      speechWolof: 'Fiche produit bi daf lay wone prix bi ak limu unité yi des ci stock bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: '5. Ajouter au Panier',
      description: 'Cliquez sur « Vendre cet article » pour ajouter une unité du produit dans le panier de vente directe.',
      targetAcomId: 'pressing.sales.sell_btn',
      actionToPerform: 'click',
      speechFr: 'Cliquez sur le bouton Vendre cet article pour placer le détergent dans votre panier.',
      speechWolof: 'Bëssal ci bouton Vendre cet article bi ngir dugal ko ci panier bi.',
      stepCategory: 'required',
      expectedEvent: 'PRODUCT_ADDED_TO_CART'
    },
    {
      stepNumber: 6,
      title: '6. Panier de Vente Directe',
      description: 'Le panneau latéral droit affiche les produits sélectionnés pour la commande en cours.',
      targetAcomId: 'pressing.sales.cart_panel',
      actionToPerform: 'observe',
      speechFr: 'Le panier de vente directe à droite centralise l\'ensemble des articles de la commande.',
      speechWolof: 'Panier bi ci droite mo lay wone lépp lu client bi jënd.',
      stepCategory: 'info'
    },
    {
      stepNumber: 7,
      title: '7. Ajustement de la Quantité',
      description: 'Ajustez la quantité désirée à l\'aide des touches plus et moins.',
      targetAcomId: 'pressing.sales.cart_quantity',
      actionToPerform: 'click',
      speechFr: 'Ajustez le nombre d\'unités souhaité avec les boutons plus et moins.',
      speechWolof: 'Yokkal wala nga wàññi quantité bi ak bouton plus ak moins.',
      stepCategory: 'optional',
      isOptional: true
    },
    {
      stepNumber: 8,
      title: '8. Nom du Client (Facultatif)',
      description: 'Renseignez le nom du client de passage ou de votre client fidèle.',
      targetAcomId: 'pressing.sales.customer_name',
      actionToPerform: 'type',
      inputValue: 'Mamadou Diop',
      speechFr: 'Indiquez le nom du client ou laissez Client de Passage par défaut.',
      speechWolof: 'Bindal touru client bi so ko bëggé.',
      stepCategory: 'optional',
      isOptional: true
    },
    {
      stepNumber: 9,
      title: '9. Contact Téléphone (Facultatif)',
      description: 'Saisissez le numéro de téléphone pour le reçu numérique et l\'envoi WhatsApp.',
      targetAcomId: 'pressing.sales.customer_phone',
      actionToPerform: 'type',
      inputValue: '77 123 45 67',
      speechFr: 'Renseignez le numéro de contact du client pour le reçu WhatsApp.',
      speechWolof: 'Bindal numéro téléphone client bi ngir envoi WhatsApp bi.',
      stepCategory: 'optional',
      isOptional: true
    },
    {
      stepNumber: 10,
      title: '10. Type & Valeur de Remise (Facultatif)',
      description: 'Appliquez une remise forfaitaire en FCFA ou un pourcentage de réduction sur la vente.',
      targetAcomId: 'pressing.sales.discount_value',
      actionToPerform: 'type',
      inputValue: '500',
      speechFr: 'Si accordée, saisissez la remise commerciale sur cette vente.',
      speechWolof: 'Mën nga yokk remise bu fekké am na réduction.',
      stepCategory: 'optional',
      isOptional: true
    },
    {
      stepNumber: 11,
      title: '11. Contrôle du Total Net Encaissé',
      description: 'Vérifiez le montant brut, la remise déduite et le net total à payer en caisse.',
      targetAcomId: 'pressing.sales.total_net',
      actionToPerform: 'observe',
      speechFr: 'Contrôlez le montant total net à encaisser avant de valider la transaction.',
      speechWolof: 'Saytul montant total net bi laata ngay validé encaisssement bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 12,
      title: '12. Encaisser la Vente',
      description: 'Cliquez sur « 🛒 Encaisser » pour enregistrer la vente, déstocker les articles et générer le ticket.',
      targetAcomId: 'pressing.sales.submit_checkout',
      actionToPerform: 'click',
      speechFr: 'Cliquez sur Encaisser pour enregistrer définitivement la vente et mettre à jour le stock.',
      speechWolof: 'Bëssal ci bouton Encaisser bi ngir validé vente bi ak déstockage bi.',
      stepCategory: 'final',
      expectedEvent: 'SALE_RECORDED'
    },
    {
      stepNumber: 13,
      title: '13. Confirmation de l\'Encaissement',
      description: 'La popup de confirmation Acom s\'affiche. Cliquez sur D\'ACCORD pour accéder au ticket.',
      targetAcomId: 'alert-confirm-btn',
      actionToPerform: 'click',
      speechFr: 'L\'encaissement est validé. Cliquez sur D\'ACCORD sur le message de confirmation.',
      speechWolof: 'Encaissement bi validé na. Bëssal ci D\'ACCORD ci alerte bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 14,
      title: '14. Ticket de Caisse Simulateur',
      description: 'Le ticket de caisse détaillé apparaît avec le numéro d\'enregistrement, les articles vendus et le mode de règlement.',
      targetAcomId: 'pressing.sales.ticket_box',
      actionToPerform: 'observe',
      speechFr: 'Voici le reçu de caisse prêt avec le détail de la transaction.',
      speechWolof: 'Gis nga ticket bu caisse bi ak yëpp yi client bi jënd.',
      stepCategory: 'info'
    },
    {
      stepNumber: 15,
      title: '15. Options d\'Impression Thermique & A4',
      description: 'Imprimez immédiatement le ticket sur imprimante thermique Roll 80mm, Roll 58mm ou en page A4 standard.',
      targetAcomId: 'pressing.sales.print_options',
      actionToPerform: 'click',
      speechFr: 'Choisissez le format d\'impression désiré : rouleau 80 millimètres, 58 millimètres ou A4.',
      speechWolof: 'Mën nga imprimer ticket bi ci imprimante thermique 80mm, 58mm wala A4.',
      stepCategory: 'optional',
      isOptional: true
    },
    {
      stepNumber: 16,
      title: '16. Téléchargement PDF & WhatsApp Client',
      description: 'Téléchargez le ticket au format PDF ou envoyez-le directement sur le WhatsApp du client.',
      targetAcomId: 'pressing.sales.whatsapp_client',
      actionToPerform: 'click',
      speechFr: 'Vous pouvez aussi transmettre le reçu directement sur le WhatsApp du client ou télécharger son PDF.',
      speechWolof: 'Mën nga yónné reçu bi ci WhatsApp client bi wala nga téléchargé ko en PDF.',
      stepCategory: 'optional',
      isOptional: true
    },
    {
      stepNumber: 17,
      title: '17. Nouveau Client',
      description: 'Cliquez sur « COMMENCER UN NOUVEAU CLIENT » pour réinitialiser le panier et servir le prochain client.',
      targetAcomId: 'pressing.sales.new_customer_btn',
      actionToPerform: 'click',
      speechFr: 'Cliquez sur COMMENCER UN NOUVEAU CLIENT pour vider le panier et accueillir la prochaine commande.',
      speechWolof: 'Bëssal ci COMMENCER UN NOUVEAU CLIENT ngir préparer keneen client.',
      stepCategory: 'next_cycle'
    }
  ]
};

export const PRESSING_GOLDEN_TUTORIAL: TutorialScenario = {
  id: 'pressing_tutorial_golden',
  title: 'Démonstration Interactive Pressing Acom',
  description: 'Tutoriel guidé pas-à-pas pour maîtriser la création complète d\'un ticket de dépôt pressing.',
  saasModule: 'pressing',
  estimatedDurationSec: 240,
  steps: [
    {
      stepNumber: 1,
      title: '1. Client — Nom complet',
      description: 'L\'opérateur saisit le nom du client (ex: "Ibou") ou recherche un client enregistré.',
      targetAcomId: 'pressing.receipt.client_name',
      actionToPerform: 'type',
      inputValue: 'Ibou',
      speechFr: 'Première étape : Saisissez le nom complet du client dans la fiche de dépôt.',
      speechWolof: 'Bennel paas : Bindal touru client bi ci fiche bu dépôt bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 2,
      title: '2. Client — Téléphone / WhatsApp',
      description: 'Renseignez le numéro de contact du client pour l\'envoi automatique des notifications SMS et WhatsApp.',
      targetAcomId: 'pressing.receipt.client_phone',
      actionToPerform: 'type',
      inputValue: '+221770000000',
      speechFr: 'Deuxième étape : Indiquez le numéro de téléphone pour le suivi WhatsApp et SMS.',
      speechWolof: 'Ñarel paas : Bindal numéro téléphone client bi ngir SMS bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Client — Email (Facultatif)',
      description: 'Facultatif : Indiquez l\'adresse e-mail si le client désire recevoir son reçu par courrier électronique.',
      targetAcomId: 'pressing.receipt.client_email',
      actionToPerform: 'type',
      speechFr: 'Troisième étape (facultative) : Saisissez l\'adresse e-mail pour la facture numérique, ou passez cette étape.',
      speechWolof: 'Ñattel paas : Bindal e-mail client bi so ko bëggé.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 4,
      title: '4. Commande — Date de Retrait Prévue',
      description: 'Définissez la date estimée de livraison ou de retrait du linge par le client.',
      targetAcomId: 'pressing.receipt.pickup_date',
      actionToPerform: 'type',
      speechFr: 'Quatrième étape : Contrôlez ou modifiez la date de retrait fixée pour le client.',
      speechWolof: 'Ñentel paas : Setal date bi client bi wara ñëw jëli yêre yi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 5,
      title: '5. Commande — Observations & État du Linge (Facultatif)',
      description: 'Facultatif : Notez les éventuelles taches, trous, boutons manquants ou consignes spécifiques de lavage.',
      targetAcomId: 'pressing.receipt.notes',
      actionToPerform: 'type',
      inputValue: 'Col sale, tâche sur la manche droite',
      speechFr: 'Cinquième étape (facultative) : Notez les remarques particulières sur l\'état des habits.',
      speechWolof: 'Juróomél paas : Mën nga bind remarque yi ci yêre yi.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 6,
      title: '6. Tarification — Mode de Facturation',
      description: 'Sélectionnez la tarification à l\'article unitaire ou la tarification globale au poids (Kg).',
      targetAcomId: 'pressing.receipt.billing_type_article',
      actionToPerform: 'click',
      speechFr: 'Sixième étape : Choisissez le mode de calcul : par article unitaire ou au poids.',
      speechWolof: 'Juróom-bennél paas : Tannal par article wala par kilo.',
      stepCategory: 'required'
    },
    {
      stepNumber: 7,
      title: '7. Articles — Sélection & Quantités',
      description: 'Définissez les vêtements apportés (Chemises, Costumes, Robes) et ajustez le nombre d\'articles.',
      targetAcomId: 'pressing.receipt.articles_grid',
      actionToPerform: 'click',
      speechFr: 'Septième étape : Sélectionnez les vêtements déposés et ajustez leurs quantités.',
      speechWolof: 'Juróom-ñaarél paas : Tannal yêre yi te sêt lim bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: '8. Options — Prestations Optionnelles (Facultatif)',
      description: 'Facultatif : Activez les options supplémentaires comme le parfumage, l\'emballage premium ou le détachage spécial.',
      targetAcomId: 'pressing.receipt.supplements',
      actionToPerform: 'click',
      speechFr: 'Huitième étape (facultative) : Proposez des services supplémentaires comme le parfumage ou le détachage.',
      speechWolof: 'Juróom-ñattél paas : Mën nga yokk prestation optionnelle.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 9,
      title: '9. Remise — Type de Remise (Facultatif)',
      description: 'Facultatif : Choisissez entre une remise forfaitaire en FCFA ou un pourcentage de réduction.',
      targetAcomId: 'pressing.receipt.discount_type',
      actionToPerform: 'click',
      speechFr: 'Neuvième étape (facultative) : Choisissez le type de remise si le client bénéficie d\'une réduction.',
      speechWolof: 'Juróom-ñentél paas : Tannal type de remise bu fekké am na réduction.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 10,
      title: '10. Remise — Valeur de Remise (Facultatif)',
      description: 'Facultatif : Saisissez la valeur de la réduction accordée au client.',
      targetAcomId: 'pressing.receipt.discount_value',
      actionToPerform: 'type',
      speechFr: 'Dixième étape (facultative) : Saisissez le montant ou le pourcentage de remise.',
      speechWolof: 'Fukkel paas : Bindal valeur bu remise bi.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 11,
      title: '11. Règlement — Statut de Paiement',
      description: 'Indiquez si la commande est payée d\'avance, partielle (avec acompte) ou impayée (à la livraison).',
      targetAcomId: 'pressing.receipt.payment_status',
      actionToPerform: 'click',
      speechFr: 'Onzième étape : Choisissez le statut de paiement : Payé d\'avance, Acompte versé ou Impayé.',
      speechWolof: 'Fukk ak bennél paas : Tannal statut bu paiement bi.',
      stepCategory: 'conditional'
    },
    {
      stepNumber: 12,
      title: '12. Règlement — Montant Perçu / Acompte',
      description: 'Saisissez la somme réellement perçue par la caisse lors du dépôt.',
      targetAcomId: 'pressing.receipt.advance_amount',
      actionToPerform: 'type',
      speechFr: 'Douzième étape : Saisissez le montant de l\'acompte ou du paiement reçu en caisse.',
      speechWolof: 'Fukk ak ñaarél paas : Bindal montant bi nga jël ci caisse bi.',
      stepCategory: 'conditional'
    },
    {
      stepNumber: 13,
      title: '13. Règlement — Moyen de Règlement',
      description: 'Sélectionnez le canal de paiement utilisé : Espèces, Wave / Orange Money ou Carte bancaire.',
      targetAcomId: 'pressing.receipt.payment_method',
      actionToPerform: 'click',
      speechFr: 'Treizième étape : Indiquez le mode de règlement : Espèces, Wave ou Orange Money.',
      speechWolof: 'Fukk ak ñattél paas : Tannal mode de règlement bi.',
      stepCategory: 'conditional'
    },
    {
      stepNumber: 14,
      title: '14. Contrôle — Reste à Encaisser',
      description: 'Contrôlez le solde restant dû par le client pour la livraison finale.',
      targetAcomId: 'pressing.receipt.remaining_amount',
      actionToPerform: 'observe',
      speechFr: 'Quatorzième étape : Vérifiez le reste à encaisser calculé automatiquement par le système.',
      speechWolof: 'Fukk ak ñentél paas : Setal reste à encaisser bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 15,
      title: '15. Contrôle — Aperçu Réel du Ticket',
      description: 'Vérifiez la mise en page et les détails sur l\'aperçu thermique du ticket de caisse.',
      targetAcomId: 'pressing.receipt.ticket_preview_box',
      actionToPerform: 'observe',
      speechFr: 'Quinzième étape : Contrôlez l\'aperçu direct du ticket avant enregistrement.',
      speechWolof: 'Fukk ak juróomél paas : Setal ticket bu caisse bi bala nga koy valider.',
      stepCategory: 'control'
    },
    {
      stepNumber: 16,
      title: '16. Finalisation — Enregistrer le Ticket',
      description: 'Validez la création pour générer le numéro de ticket unique, émettre l\'événement métier et afficher le panneau post-création.',
      targetAcomId: 'pressing.receipt.submit_btn',
      actionToPerform: 'click',
      speechFr: 'Seizième étape : Cliquez sur Enregistrer le Ticket pour valider la commande.',
      speechWolof: 'Mujjél paas : Bëssal Enregistrer le Ticket ngir tëj commande bi.',
      expectedEvent: 'RECEIPT_CREATED',
      stepCategory: 'final'
    },
    {
      stepNumber: 17,
      title: '17. Post-Création — Confirmation & Possibilités',
      description: 'Votre ticket a été enregistré avec succès. Plusieurs options sont maintenant disponibles pour l\'imprimer, le télécharger ou le transmettre au client. Je vais vous présenter ces possibilités facultatives.',
      targetAcomId: 'pressing.receipt.post_creation_panel',
      actionToPerform: 'observe',
      speechFr: 'Votre ticket a été enregistré avec succès. Plusieurs options sont maintenant disponibles pour l\'imprimer, le télécharger ou le transmettre au client.',
      speechWolof: 'Am nga ticket bu mucc ayib. Légui mën nga ko imprimer, télécharger wala yónnee client bi.',
      isOptional: true,
      stepCategory: 'info'
    },
    {
      stepNumber: 18,
      title: '18. Impression — Roll (80)',
      description: 'Roll 80 permet d\'utiliser le format de ticket prévu pour une imprimante thermique 80 mm. Choisissez cette option lorsque votre matériel utilise ce format.',
      targetAcomId: 'pressing.receipt.print_roll_80',
      actionToPerform: 'observe',
      speechFr: 'Roll 80 permet d\'utiliser le format de ticket prévu pour une imprimante thermique 80 mm. Choisissez cette option lorsque votre matériel utilise ce format.',
      speechWolof: 'Roll 80 dafay maye nga imprimé ci format thermique 80 mm.',
      isOptional: true,
      stepCategory: 'option'
    },
    {
      stepNumber: 19,
      title: '19. Impression — Roll (58)',
      description: 'Roll 58 permet d\'utiliser un format de ticket adapté aux imprimantes thermiques 58 mm. Utilisez-le si votre imprimante fonctionne avec ce format.',
      targetAcomId: 'pressing.receipt.print_roll_58',
      actionToPerform: 'observe',
      speechFr: 'Roll 58 permet d\'utiliser un format de ticket adapté aux imprimantes thermiques 58 mm. Utilisez-le si votre imprimante fonctionne avec ce format.',
      speechWolof: 'Roll 58 dafay maye nga imprimé ci format 58 mm.',
      isOptional: true,
      stepCategory: 'option'
    },
    {
      stepNumber: 20,
      title: '20. Impression — Format A4',
      description: 'Format A4 permet d\'utiliser une présentation adaptée à une feuille standard A4, notamment lorsque vous souhaitez disposer d\'un document grand format.',
      targetAcomId: 'pressing.receipt.print_a4',
      actionToPerform: 'observe',
      speechFr: 'Format A4 permet d\'utiliser une présentation adaptée à une feuille standard A4, notamment lorsque vous souhaitez disposer d\'un document grand format.',
      speechWolof: 'Format A4 dafay maye nga jël version A4 bu am lépp.',
      isOptional: true,
      stepCategory: 'option'
    },
    {
      stepNumber: 21,
      title: '21. Document — Télécharger PDF',
      description: 'Télécharger PDF permet d\'enregistrer une copie numérique du document sur votre appareil. Vous pourrez ensuite la conserver, l\'imprimer ou la transmettre selon vos besoins.',
      targetAcomId: 'pressing.receipt.download_pdf',
      actionToPerform: 'observe',
      speechFr: 'Télécharger PDF permet d\'enregistrer une copie numérique du document sur votre appareil.',
      speechWolof: 'Télécharger PDF dafay denc fichier PDF bi ci sa appareil.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 22,
      title: '22. Transmission — WhatsApp Client',
      description: 'WhatsApp Client permet de transmettre le ticket directement au client via WhatsApp lorsque son numéro est disponible. Cette action est facultative.',
      targetAcomId: 'pressing.receipt.whatsapp_client',
      actionToPerform: 'observe',
      speechFr: 'WhatsApp Client permet de transmettre le ticket directement au client via WhatsApp lorsque son numéro est disponible.',
      speechWolof: 'WhatsApp Client dafay yónnee ticket bi ci WhatsApp bu client bi.',
      isOptional: true,
      stepCategory: 'conditional'
    },
    {
      stepNumber: 23,
      title: '23. Suivi — Suivi Temps Réel du Gérant',
      description: 'Le logiciel assure automatiquement le suivi du gérant lors de la création du dépôt. L\'e-mail est envoyé en arrière-plan sans intervention de l\'opérateur. Les actions manuelles disponibles dans cette zone servent principalement de solutions de secours.',
      targetAcomId: 'pressing.receipt.manager_tracking',
      actionToPerform: 'observe',
      speechFr: 'Le logiciel assure automatiquement le suivi du gérant en arrière-plan. Les boutons E-mail Gérant et WhatsApp Gérant restent disponibles comme solutions de secours.',
      speechWolof: 'Suivi gérant bi dafay dém en arrière-plan automatiquement. Bouton yi ay secours lañu.',
      isOptional: true,
      stepCategory: 'info'
    },
    {
      stepNumber: 24,
      title: '24. Secours Gérant — E-mail Gérant',
      description: 'L\'e-mail au gérant est normalement envoyé automatiquement. Cette action manuelle reste disponible lorsqu\'une retransmission est nécessaire ou lorsque l\'envoi automatique n\'a pas abouti.',
      targetAcomId: 'pressing.receipt.email_manager',
      actionToPerform: 'observe',
      speechFr: 'L\'e-mail au gérant est envoyé automatiquement. Cette action manuelle reste disponible en cas de secours.',
      speechWolof: 'E-mail gérant ay secours la bu besoin amé.',
      isOptional: true,
      stepCategory: 'fallback'
    },
    {
      stepNumber: 25,
      title: '25. Secours Gérant — WhatsApp Gérant',
      description: 'Si nécessaire, WhatsApp Gérant permet d\'ouvrir WhatsApp afin de transmettre manuellement la facture au gérant lorsqu\'une notification automatique n\'a pas abouti.',
      targetAcomId: 'pressing.receipt.whatsapp_manager',
      actionToPerform: 'observe',
      speechFr: 'WhatsApp Gérant permet d\'ouvrir WhatsApp afin de transmettre manuellement la facture au gérant si besoin.',
      speechWolof: 'WhatsApp Gérant ay option de secours la ngir yónnee facture bi ci gérant bi.',
      isOptional: true,
      stepCategory: 'fallback'
    },
    {
      stepNumber: 26,
      title: '26. Nouveau Cycle — Commencer un Nouveau Client',
      description: 'La réception actuelle est terminée. Lorsque vous êtes prêt à traiter le prochain dépôt, utilisez Commencer un nouveau client pour réinitialiser la réception et démarrer une nouvelle opération.',
      targetAcomId: 'pressing.receipt.new_client',
      actionToPerform: 'observe',
      speechFr: 'Lorsque vous avez terminé avec ce ticket, utilisez Commencer un nouveau client pour réinitialiser la réception et démarrer une nouvelle opération.',
      speechWolof: 'So paré ak ticket bi, bëssal Commencer un Nouveau Client ngir tambali yeneen client.',
      isOptional: true,
      stepCategory: 'next_cycle'
    }
  ]
};

export const PRESSING_CLOSURE_TUTORIAL: TutorialScenario = {
  id: 'pressing_tutorial_closure',
  title: 'Clôture de Caisse & Rapport Journalier',
  description: 'Supervision journalière, rapprochement financier, comptage d\'espèces, justification et validation définitive de caisse.',
  saasModule: 'pressing',
  estimatedDurationSec: 210,
  steps: [
    {
      stepNumber: 1,
      title: '1. Onglet « Clôture de Caisse »',
      description: 'Vous êtes dans le module Clôture de Caisse. Cette section permet de vérifier les mouvements de la journée et de procéder à la clôture de la caisse.',
      targetAcomId: 'nav-pressing_closure',
      actionToPerform: 'observe',
      speechFr: 'Vous êtes dans le module Clôture de Caisse. Cette section permet de vérifier les mouvements de la journée et de procéder à la clôture de la caisse.',
      speechWolof: 'Nekk nga ci module Clôture de Caisse. Wàll wii da lay may nga seet yëngu-yëngu bis bi ak clôturer caisse bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Titre de la Page',
      description: 'Cette page permet d\'effectuer la clôture quotidienne de la caisse et de consulter l\'historique des clôtures précédentes.',
      targetAcomId: 'pressing.cash_closure.header',
      actionToPerform: 'observe',
      speechFr: 'Cette page permet d\'effectuer la clôture quotidienne de la caisse et de consulter l\'historique des clôtures précédentes.',
      speechWolof: 'Xët wii dafa lay may nga def clôture quotidienne bu caisse bi ak seet historique bu clôtures yu passe.',
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. Clôturer la caisse d\'aujourd\'hui',
      description: 'Cette zone est dédiée à la clôture de la caisse du jour. Avant de valider, vérifiez les montants et les informations affichées.',
      targetAcomId: 'pressing.cash_closure.form_card',
      actionToPerform: 'observe',
      speechFr: 'Cette zone est dédiée à la clôture de la caisse du jour. Avant de valider, vérifiez les montants et les informations affichées.',
      speechWolof: 'Zone wii dafa jagleel clôture caisse bu tey bi. Bala nga koy valider, seetal montant yi ak xibaar yi feeñ.',
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. Date de Clôture',
      description: 'La date permet d\'identifier la journée de caisse concernée par cette clôture. Vérifiez qu\'elle correspond bien à la journée que vous souhaitez clôturer.',
      targetAcomId: 'pressing.cash_closure.date',
      actionToPerform: 'observe',
      speechFr: 'La date permet d\'identifier la journée de caisse concernée par cette clôture. Vérifiez qu\'elle correspond bien à la journée que vous souhaitez clôturer.',
      speechWolof: 'Date bi da lay may nga xam bisu caisse bi ñuy clôturer. Seetal baxam méngook bis bi nga bëgg a clôturer.',
      stepCategory: 'control'
    },
    {
      stepNumber: 5,
      title: '5. Recettes Versées',
      description: 'Cette zone présente le montant des recettes versées pour la journée. Utilisez cette information pour contrôler les recettes avant la clôture.',
      targetAcomId: 'pressing.cash_closure.press_value',
      actionToPerform: 'observe',
      speechFr: 'Cette zone présente le montant des recettes versées pour la journée. Utilisez cette information pour contrôler les recettes avant la clôture.',
      speechWolof: 'Zone wii da lay wone montant recettes yi duggu ci bis bi. Jëfandikol xibaar wii ngir contrôler recettes yi bala clôture bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 6,
      title: '6. Dépenses du Jour',
      description: 'Cette zone présente le montant des dépenses enregistrées pour la journée. Vérifiez que les dépenses correspondent bien aux opérations effectuées.',
      targetAcomId: 'pressing.cash_closure.expenses',
      actionToPerform: 'observe',
      speechFr: 'Cette zone présente le montant des dépenses enregistrées pour la journée. Vérifiez que les dépenses correspondent bien aux opérations effectuées.',
      speechWolof: 'Zone wii da lay wone montant dépenses yi nga denc ci bis bi. Seetal baxam dépenses yi méngook opérations yi am.',
      stepCategory: 'control'
    },
    {
      stepNumber: 7,
      title: '7. Écart / Différence',
      description: 'L\'écart permet de comparer les montants attendus avec les montants réellement constatés. Un écart doit être vérifié avant de clôturer définitivement la caisse.',
      targetAcomId: 'pressing.cash_closure.expected_revenue',
      actionToPerform: 'observe',
      speechFr: 'L\'écart permet de comparer les montants attendus avec les montants réellement constatés. Un écart doit être vérifié avant de clôturer définitivement la caisse.',
      speechWolof: 'Écart bi da lay may nga compare montant yi ñu foogoon ak montant yi nekk ci caisse bi. War nga seet écart bi bala nga clôturer caisse bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 8,
      title: '8. Nom du Caissier / Opérateur',
      description: 'Indiquez ici le nom du caissier ou de l\'opérateur responsable de la caisse.',
      targetAcomId: 'pressing.cash_closure.cashier',
      actionToPerform: 'type',
      inputValue: 'Kouamé Marc',
      speechFr: 'Indiquez ici le nom du caissier ou de l\'opérateur responsable de la caisse.',
      speechWolof: 'Bindal fi turu caissier bi wala opérateur bi yor caisse bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 9,
      title: '9. Espèces Comptées (FCFA)',
      description: 'Renseignez ici le montant des espèces réellement comptées dans la caisse. Cette valeur permet de comparer l\'argent physique avec les montants enregistrés dans le système.',
      targetAcomId: 'pressing.cash_closure.real_cash',
      actionToPerform: 'type',
      inputValue: '10500',
      speechFr: 'Renseignez ici le montant des espèces réellement comptées dans la caisse. Cette valeur permet de comparer l\'argent physique avec les montants enregistrés dans le système.',
      speechWolof: 'Bindal fi xalis wu dëggu wu nekk ci caisse bi. Valeur wii da lay may nga compare xalis bi ak xibaar yi nekk ci système bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 10,
      title: '10. Alertes de Stock',
      description: 'Cette zone affiche les éventuelles alertes liées au stock. Consultez-les avant la clôture afin de prendre en compte les anomalies ou points de rupture signalés par le système.',
      targetAcomId: 'pressing.cash_closure.stock_alerts',
      actionToPerform: 'observe',
      speechFr: 'Cette zone affiche les éventuelles alertes liées au stock. Consultez-les avant la clôture afin de prendre en compte les anomalies ou points de rupture signalés par le système.',
      speechWolof: 'Zone wii da lay wone alertes yu am ci stock bi. Seetal leen bala clôture bi ngir xam anomalies wala manque de stock.',
      stepCategory: 'info'
    },
    {
      stepNumber: 11,
      title: '11. Observations / Justifications',
      description: 'Cette zone permet d\'ajouter une observation ou une justification concernant la clôture, notamment lorsqu\'un écart ou une situation particulière doit être expliqué.',
      targetAcomId: 'pressing.cash_closure.observations',
      actionToPerform: 'type',
      inputValue: 'Écart de caisse justifié par la petite monnaie',
      speechFr: 'Cette zone permet d\'ajouter une observation ou une justification concernant la clôture, notamment lorsqu\'un écart ou une situation particulière doit être expliqué.',
      speechWolof: 'Zone wii da lay may nga yokk observation wala justification ci clôture bi, rawatina soom écart wala situation particulière.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 12,
      title: '12. Valider la Clôture du Jour',
      description: 'Après avoir vérifié les informations, renseigné les champs nécessaires et contrôlé les éventuels écarts, utilisez ce bouton pour valider la clôture du jour.',
      targetAcomId: 'pressing.cash_closure.validate',
      actionToPerform: 'click',
      speechFr: 'Après avoir vérifié les informations, renseigné les champs nécessaires et contrôlé les éventuels écarts, utilisez ce bouton pour valider la clôture du jour.',
      speechWolof: 'Soo seetee xibaar yi pare, bind champ yi ak contrôler écart yi, jëfandikol bouton bi ngir valider clôture bu bis bi.',
      expectedEvent: 'CASH_REGISTER_CLOSED',
      stepCategory: 'final'
    },
    {
      stepNumber: 13,
      title: '13. Historique des Clôtures',
      description: 'Cette zone permet de consulter les clôtures enregistrées précédemment. Elle sert à retrouver l\'historique des journées déjà clôturées.',
      targetAcomId: 'pressing.cash_closure.history',
      actionToPerform: 'observe',
      speechFr: 'Cette zone permet de consulter les clôtures enregistrées précédemment. Elle sert à retrouver l\'historique des journées déjà clôturées.',
      speechWolof: 'Zone wii da lay may nga seet clôtures yi passed. Dafa lay may nga feccat historique bis yi ñu clôturer pare.',
      isOptional: true,
      stepCategory: 'info'
    },
    {
      stepNumber: 14,
      title: '14. État de l\'Historique',
      description: 'Pour le moment, aucune clôture n\'est enregistrée pour cette caisse. L\'historique se remplira au fur et à mesure des clôtures validées.',
      targetAcomId: 'pressing.cash_closure.history_empty',
      actionToPerform: 'observe',
      speechFr: 'Pour le moment, aucune clôture n\'est enregistrée pour cette caisse. L\'historique se remplira au fur et à mesure des clôtures validées.',
      speechWolof: 'Léegi, amul benn clôture bu nekk ci caisse bi. Historique bi dina fess fu mu yàgg yàgg ci clôtures yi ñuy valider.',
      isOptional: true,
      stepCategory: 'info'
    },
    {
      stepNumber: 15,
      title: '15. Conclusion',
      description: 'Vous avez maintenant parcouru les principales fonctions de la clôture de caisse : contrôle de la journée, recettes, dépenses, écarts, espèces comptées, observations et validation. Vous pouvez également consulter l\'historique des clôtures enregistrées.',
      targetAcomId: 'pressing.cash_closure.container',
      actionToPerform: 'observe',
      speechFr: 'Vous avez maintenant parcouru les principales fonctions de la clôture de caisse : contrôle de la journée, recettes, dépenses, écarts, espèces comptées, observations et validation. Vous pouvez également consulter l\'historique des clôtures enregistrées.',
      speechWolof: 'Léegi nga xam fonctions bu clôture de caisse: contrôle bis bi, recettes, dépenses, écarts, espèces comptées, observations ak validation. Mën nga seet tamit historique clôtures yi.',
      stepCategory: 'final'
    }
  ]
};

/**
 * Golden Reference: Pressing - Comptabilité / Nouvelle Dépense
 */
export const PRESSING_ACCOUNTING_TUTORIAL: TutorialScenario = {
  id: 'pressing_tutorial_accounting',
  title: 'Comptabilité / Nouvelle Dépense',
  description: 'Présentation complète de la page Comptabilité et du formulaire Nouvelle dépense manuelle.',
  saasModule: 'pressing',
  estimatedDurationSec: 240,
  steps: [
    {
      stepNumber: 1,
      title: '1. Titre « Comptabilité »',
      description: 'Bienvenue dans la section Comptabilité. Cette page permet de suivre les flux financiers et les dépenses générales de l’atelier.',
      targetAcomId: 'accounting.title',
      actionToPerform: 'observe',
      speechFr: 'Bienvenue dans la section Comptabilité. Cette page permet de suivre les flux financiers et les dépenses générales de l’atelier.',
      speechWolof: 'Dalal ak jamm ci wàllu Comptabilité. Xët wii dafa laay may nga top xaliss bi ak dépenses générales yu atelier bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Description de la Page',
      description: 'Cette section est dédiée au suivi des flux financiers et à la gestion des dépenses générales de l’atelier.',
      targetAcomId: 'accounting.subtitle',
      actionToPerform: 'observe',
      speechFr: 'Cette section est dédiée au suivi des flux financiers et à la gestion des dépenses générales de l’atelier.',
      speechWolof: 'Wàll wii dafa jagleel top flux financiers ak saytu dépenses générales yu atelier bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. Bouton « Nouvelle dépense »',
      description: 'Pour enregistrer une nouvelle dépense, utilisez le bouton Nouvelle dépense. Il permet d’ouvrir le formulaire de saisie d’une dépense.',
      targetAcomId: 'accounting.btn.new_expense',
      actionToPerform: 'observe',
      speechFr: 'Pour enregistrer une nouvelle dépense, utilisez le bouton Nouvelle dépense. Il permet d’ouvrir le formulaire de saisie d’une dépense.',
      speechWolof: 'Ngir bind dépense bu bees, jëfandikol bouton Nouvelle dépense. Dafa lay ubbi formulaire ngir nga bind ko.',
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. Charges Totales',
      description: 'La carte Charges totales permet de visualiser le montant total des charges enregistrées.',
      targetAcomId: 'accounting.kpi.charges_totales',
      actionToPerform: 'observe',
      speechFr: 'La carte Charges totales permet de visualiser le montant total des charges enregistrées.',
      speechWolof: 'Carte Charges totales dafa lay wone montant total bu charges yépp yi nga bind.',
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: '5. Dépenses Générales',
      description: 'Cette carte présente le montant des dépenses générales enregistrées dans le système.',
      targetAcomId: 'accounting.kpi.depenses_generales',
      actionToPerform: 'observe',
      speechFr: 'Cette carte présente le montant des dépenses générales enregistrées dans le système.',
      speechWolof: 'Carte wii dafa lay wone montant dépenses générales yi nekk ci système bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: '6. Filtres',
      description: 'Ces boutons permettent de filtrer les informations affichées afin de consulter soit l’ensemble du flux de trésorerie, soit uniquement les dépenses générales.',
      targetAcomId: 'accounting.filters_row',
      actionToPerform: 'observe',
      speechFr: 'Ces boutons permettent de filtrer les informations affichées afin de consulter soit l’ensemble du flux de trésorerie, soit uniquement les dépenses générales.',
      speechWolof: 'Boutons yi dañu lay may nga filtre xibaar yi ngir seet lepp ci trésorerie bi wala dépenses générales rekk.',
      stepCategory: 'info'
    },
    {
      stepNumber: 7,
      title: '7. Tableau Comptable',
      description: 'Le tableau présente les dépenses enregistrées. Chaque ligne peut regrouper la désignation, la catégorie, la date d’émission et le montant de la dépense.',
      targetAcomId: 'accounting.outflows_table',
      actionToPerform: 'observe',
      speechFr: 'Le tableau présente les dépenses enregistrées. Chaque ligne peut regrouper la désignation, la catégorie, la date d’émission et le montant de la dépense.',
      speechWolof: 'Tableau bi dafa lay wone dépenses yi. Bii rëdd nekk dafa am désignation, catégorie, date d’émission ak montant.',
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: '8. État Vide',
      description: 'Lorsqu’aucune dépense ne correspond au filtre sélectionné, le tableau affiche qu’aucune charge n’est enregistrée pour ce filtre.',
      targetAcomId: 'accounting.empty_state',
      actionToPerform: 'observe',
      speechFr: 'Lorsqu’aucune dépense ne correspond au filtre sélectionné, le tableau affiche qu’aucune charge n’est enregistrée pour ce filtre.',
      speechWolof: 'Su feccante amul benn dépense bu méngook filtre bi, tableau bi da lay wone ni amul benn charge.',
      stepCategory: 'info'
    },
    {
      stepNumber: 9,
      title: '9. Ouverture du Formulaire',
      description: 'Nous allons maintenant voir comment enregistrer une nouvelle dépense. Cliquez sur Nouvelle dépense pour ouvrir le formulaire.',
      targetAcomId: 'accounting.btn.new_expense',
      actionToPerform: 'click',
      speechFr: 'Nous allons maintenant voir comment enregistrer une nouvelle dépense. Cliquez sur Nouvelle dépense pour ouvrir le formulaire.',
      speechWolof: 'Léegi ñu seet nan lañuy binde dépense bu bees. Bëssal ci Nouvelle dépense ngir ubbi formulaire bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 10,
      title: '10. Titre du Modal',
      description: 'Voici le formulaire Nouvelle dépense manuelle. Il permet d’enregistrer une dépense directement dans la comptabilité de l’application.',
      targetAcomId: 'accounting.expense.form_title',
      actionToPerform: 'observe',
      speechFr: 'Voici le formulaire Nouvelle dépense manuelle. Il permet d’enregistrer une dépense directement dans la comptabilité de l’application.',
      speechWolof: 'Fi mooy formulaire Nouvelle dépense manuelle. Dafa lay may nga bind dépense direct ci comptabilité application bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 11,
      title: '11. Sous-titre',
      description: 'Ce formulaire est destiné au suivi et à la justification des dépenses enregistrées dans la comptabilité.',
      targetAcomId: 'accounting.expense.form_subtitle',
      actionToPerform: 'observe',
      speechFr: 'Ce formulaire est destiné au suivi et à la justification des dépenses enregistrées dans la comptabilité.',
      speechWolof: 'Formulaire wii dafa jagleel top ak justification dépenses yi nga denc ci comptabilité bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 12,
      title: '12. Désignation / Intitulé',
      description: 'Commencez par renseigner la désignation ou l’intitulé de la dépense. Vous pouvez indiquer par exemple le nom d’une facture, d’un fournisseur ou d’un service.',
      targetAcomId: 'accounting.expense.title',
      actionToPerform: 'type',
      inputValue: 'Facture Senelec Janvier',
      speechFr: 'Commencez par renseigner la désignation ou l’intitulé de la dépense. Vous pouvez indiquer par exemple le nom d’une facture, d’un fournisseur ou d’un service.',
      speechWolof: 'Tambalil ci bind désignation bi wala turu dépense bi. Misaal: turu facture, fournisseur wala service.',
      stepCategory: 'required'
    },
    {
      stepNumber: 13,
      title: '13. Montant',
      description: 'Indiquez ensuite le montant de la dépense en francs CFA.',
      targetAcomId: 'accounting.expense.amount',
      actionToPerform: 'type',
      inputValue: '42500',
      speechFr: 'Indiquez ensuite le montant de la dépense en francs CFA.',
      speechWolof: 'Tekkal fi montant dépense bi ci francs CFA.',
      stepCategory: 'required'
    },
    {
      stepNumber: 14,
      title: '14. Date de Dépense',
      description: 'Sélectionnez maintenant la date à laquelle la dépense a été effectuée.',
      targetAcomId: 'accounting.expense.date',
      actionToPerform: 'observe',
      speechFr: 'Sélectionnez maintenant la date à laquelle la dépense a été effectuée.',
      speechWolof: 'Tànnal léegi date bi dépense bi amé.',
      stepCategory: 'required'
    },
    {
      stepNumber: 15,
      title: '15. Catégorie Comptable',
      description: 'La catégorie comptable permet de classer correctement la dépense. Sélectionnez la catégorie correspondant à la nature de votre dépense.',
      targetAcomId: 'accounting.expense.category_grid',
      actionToPerform: 'observe',
      speechFr: 'La catégorie comptable permet de classer correctement la dépense. Sélectionnez la catégorie correspondant à la nature de votre dépense.',
      speechWolof: 'Catégorie comptable bi dafa lay may nga seddale dépense bi ci yoon. Tànnal catégorie bi méngook dépense bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 16,
      title: '16. Catégories Disponibles',
      description: 'Plusieurs catégories sont disponibles, notamment Loyer, Électricité, Eau, Internet et Télécommunications, Transport et Livraison, Entretien et Réparations, Machines et Équipements, Fournitures administratives, Marketing et Communication, Taxes et Frais administratifs, Prestations externes et Autres dépenses.',
      targetAcomId: 'accounting.expense.category_grid',
      actionToPerform: 'observe',
      speechFr: 'Plusieurs catégories sont disponibles, notamment Loyer, Électricité, Eau, Internet et Télécommunications, Transport et Livraison, Entretien et Réparations, Machines et Équipements, Fournitures administratives, Marketing et Communication, Taxes et Frais administratifs, Prestations externes et Autres dépenses.',
      speechWolof: 'Am na ay catégories yu bari: Loyer, Électricité, Eau, Internet, Transport, Entretien, Machines, Fournitures, Marketing, Taxes, Prestations externes ak Autres dépenses.',
      stepCategory: 'info'
    },
    {
      stepNumber: 17,
      title: '17. Mode de Paiement',
      description: 'Cette section permet d’indiquer comment la dépense a été réglée. Sélectionnez le mode de paiement correspondant à l’opération.',
      targetAcomId: 'accounting.expense.payment_methods',
      actionToPerform: 'observe',
      speechFr: 'Cette section permet d’indiquer comment la dépense a été réglée. Sélectionnez le mode de paiement correspondant à l’opération.',
      speechWolof: 'Wàll wii da lay wone ni nga fayé dépense bi. Tànnal mode de paiement bi méngook opération bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 18,
      title: '18. Options de Paiement',
      description: 'Plusieurs modes de paiement sont disponibles : espèces, Mobile Money, carte bancaire, virement bancaire ou chèque bancaire. Choisissez celui qui correspond au règlement effectué.',
      targetAcomId: 'accounting.expense.payment_methods',
      actionToPerform: 'observe',
      speechFr: 'Plusieurs modes de paiement sont disponibles : espèces, Mobile Money, carte bancaire, virement bancaire ou chèque bancaire. Choisissez celui qui correspond au règlement effectué.',
      speechWolof: 'Am na espèces, Mobile Money, carte bancaire, virement bancaire wala chèque. Tànnal bi nga jëfandikoo.',
      stepCategory: 'info'
    },
    {
      stepNumber: 19,
      title: '19. Référence / Justificatif',
      description: 'Ce champ est facultatif. Il permet d’ajouter une référence ou une information permettant d’identifier le justificatif associé à la dépense.',
      targetAcomId: 'accounting.expense.reference',
      actionToPerform: 'type',
      inputValue: 'REC-2026-08',
      isOptional: true,
      speechFr: 'Ce champ est facultatif. Il permet d’ajouter une référence ou une information permettant d’identifier le justificatif associé à la dépense.',
      speechWolof: 'Champ bi du obligatoire. Dafa lay may nga yokk référence wala numéro reçu bu méngook dépense bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 20,
      title: '20. Description / Justification',
      description: 'Vous pouvez utiliser cette zone pour ajouter des détails, des commentaires ou une justification concernant la dépense.',
      targetAcomId: 'accounting.expense.description',
      actionToPerform: 'type',
      inputValue: 'Règlement consommation compteur atelier',
      isOptional: true,
      speechFr: 'Vous pouvez utiliser cette zone pour ajouter des détails, des commentaires ou une justification concernant la dépense.',
      speechWolof: 'Mën nga jëfandikoo zone wii ngir yokk ay leral, commentaires wala justification ci dépense bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 21,
      title: '21. Bouton Annuler',
      description: 'Le bouton Annuler permet de fermer le formulaire sans enregistrer la dépense.',
      targetAcomId: 'accounting.expense.cancel_btn',
      actionToPerform: 'observe',
      speechFr: 'Le bouton Annuler permet de fermer le formulaire sans enregistrer la dépense.',
      speechWolof: 'Bouton Annuler dafa lay may nga ubbi te tëj formulaire bi té do denc dépense bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 22,
      title: '22. Enregistrer la dépense',
      description: 'Lorsque toutes les informations nécessaires sont renseignées, utilisez ce bouton pour enregistrer la dépense et déclencher l’action de notification prévue par l’application.',
      targetAcomId: 'accounting.expense.submit_btn',
      actionToPerform: 'click',
      expectedEvent: 'EXPENSE_CREATED',
      speechFr: 'Lorsque toutes les informations nécessaires sont renseignées, utilisez ce bouton pour enregistrer la dépense et déclencher l’action de notification prévue par l’application.',
      speechWolof: 'Soo paree ci bind xibaar yépp, jëfandikol bouton bi ngir denc dépense bi ak yëgle gérant bi.',
      stepCategory: 'final'
    },
    {
      stepNumber: 23,
      title: '23. Conclusion du Formulaire',
      description: 'Vous avez maintenant parcouru les principales étapes de création d’une dépense manuelle : désignation, montant, date, catégorie comptable, mode de paiement, référence et justification. Une fois les informations renseignées, vous pouvez enregistrer la dépense.',
      targetAcomId: 'accounting.expense.form_card',
      actionToPerform: 'observe',
      speechFr: 'Vous avez maintenant parcouru les principales étapes de création d’une dépense manuelle : désignation, montant, date, catégorie comptable, mode de paiement, référence et justification. Une fois les informations renseignées, vous pouvez enregistrer la dépense.',
      speechWolof: 'Léegi nga xam yoon bi yépp ngir bind dépense manuelle: désignation, montant, date, catégorie, mode de paiement, référence ak justification. Soo paree mën nga denc dépense bi.',
      stepCategory: 'control'
    }
  ]
};

/**
 * Scenario 6: Pressing - Rapports Financiers & Rentabilité
 * Parcours complet d'analyse financière : période, indicateurs clés, graphiques et exports
 */
export const PRESSING_FINANCIAL_REPORTS_TUTORIAL: TutorialScenario = {
  id: 'pressing_reports_tutorial',
  title: 'Acom IA — Rapports Financiers & Performance',
  description: 'Parcours pédagogique guidé pour analyser la rentabilité, comprendre les indicateurs et exploiter les graphiques financiers',
  saasModule: 'pressing',
  estimatedDurationSec: 240,
  steps: [
    {
      stepNumber: 1,
      title: '1. Rapports Financiers — Analyse & Rentabilité',
      description: 'Cette page permet de suivre les performances financières de votre activité, de comparer les revenus et les dépenses et d\'analyser la rentabilité.',
      targetAcomId: 'reports.header',
      actionToPerform: 'observe',
      speechFr: 'Cette page permet de suivre les performances financières de votre activité, de comparer les revenus et les dépenses et d\'analyser la rentabilité.',
      speechWolof: 'Xët wii dafay tax nga mën a topp doxalin ak njariñu liggéey bi, méngale dugg ak génn xaalis te xam sa bénéfice.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Période des Statistiques de Vente',
      description: 'Commencez par sélectionner la période que vous souhaitez analyser. Les indicateurs et les graphiques sont calculés selon cette période.',
      targetAcomId: 'reports.period_selector',
      actionToPerform: 'observe',
      speechFr: 'Commencez par sélectionner la période que vous souhaitez analyser. Les indicateurs et les graphiques sont calculés selon cette période.',
      speechWolof: 'Tambalil ci tànn jamono wala weer bi nga bëgg saytu. Lépp luy lim ak graphique ci jamono jooju lay sukkandiku.',
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Ventes Totales',
      description: 'Les ventes totales représentent le montant total des ventes enregistrées sur la période sélectionnée.',
      targetAcomId: 'reports.kpi.ventes_totales',
      actionToPerform: 'observe',
      speechFr: 'Les ventes totales représentent le montant total des ventes enregistrées sur la période sélectionnée.',
      speechWolof: 'Ventes totales dafay wone mbooleem jaay yi nga bind ci jamono bi nga tànn.',
      stepCategory: 'control'
    },
    {
      stepNumber: 4,
      title: '4. Total Encaissé',
      description: 'Le total encaissé correspond aux sommes effectivement encaissées sur la période sélectionnée.',
      targetAcomId: 'reports.kpi.total_encaisse',
      actionToPerform: 'observe',
      speechFr: 'Le total encaissé correspond aux sommes effectivement encaissées sur la période sélectionnée.',
      speechWolof: 'Total encaissé mooy xaalis bi dugg bu leer ci kaye bi ci jamono jooju.',
      stepCategory: 'control'
    },
    {
      stepNumber: 5,
      title: '5. Reste à Recouvrer',
      description: 'Le reste à recouvrer indique les montants qui restent encore à encaisser.',
      targetAcomId: 'reports.kpi.reste_recouvrer',
      actionToPerform: 'observe',
      speechFr: 'Le reste à recouvrer indique les montants qui restent encore à encaisser.',
      speechWolof: 'Reste à recouvrer dafay wone li des ci xaalis bu ñu wara encaisser.',
      stepCategory: 'control'
    },
    {
      stepNumber: 6,
      title: '6. Coût d\'Achat',
      description: 'Le coût d\'achat représente les coûts associés aux produits ou éléments nécessaires à l\'activité sur la période analysée.',
      targetAcomId: 'reports.kpi.cout_achat',
      actionToPerform: 'observe',
      speechFr: 'Le coût d\'achat représente les coûts associés aux produits ou éléments nécessaires à l\'activité sur la période analysée.',
      speechWolof: 'Coût d\'achat mooy li nga jëndee produit yi ak li nga soxla ngir liggéey bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 7,
      title: '7. Marge Brute',
      description: 'La marge brute permet de voir ce qui reste après prise en compte du coût d\'achat par rapport aux ventes.',
      targetAcomId: 'reports.kpi.marge_brute',
      actionToPerform: 'observe',
      speechFr: 'La marge brute permet de voir ce qui reste après prise en compte du coût d\'achat par rapport aux ventes.',
      speechWolof: 'Marge brute dafay wone li des soo dencé coût d\'achat bi ci li nga jaay.',
      stepCategory: 'control'
    },
    {
      stepNumber: 8,
      title: '8. Total Dépenses',
      description: 'Le total des dépenses présente les dépenses enregistrées sur la période sélectionnée.',
      targetAcomId: 'reports.kpi.total_depenses',
      actionToPerform: 'observe',
      speechFr: 'Le total des dépenses présente les dépenses enregistrées sur la période sélectionnée.',
      speechWolof: 'Total dépenses dafay wone mbooleem génn xaalis yi amoon ci jamono jooju.',
      stepCategory: 'control'
    },
    {
      stepNumber: 9,
      title: '9. Flux de Trésorerie',
      description: 'Le flux de trésorerie permet de suivre le mouvement financier résultant des entrées et sorties enregistrées sur la période.',
      targetAcomId: 'reports.kpi.flux_tresorerie',
      actionToPerform: 'observe',
      speechFr: 'Le flux de trésorerie permet de suivre le mouvement financier résultant des entrées et sorties enregistrées sur la période.',
      speechWolof: 'Flux de trésorerie dafay wone doxalinu xaalis bi diggante li dugg ak li génn.',
      stepCategory: 'control'
    },
    {
      stepNumber: 10,
      title: '10. Bénéfice',
      description: 'Le bénéfice présente le résultat financier calculé par l\'application pour la période sélectionnée.',
      targetAcomId: 'reports.kpi.benefice_net',
      actionToPerform: 'observe',
      speechFr: 'Le bénéfice présente le résultat financier calculé par l\'application pour la période sélectionnée.',
      speechWolof: 'Bénéfice bi mooy li nga gaañe ci wallu xaalis ci jamono bi nga tànn.',
      stepCategory: 'control'
    },
    {
      stepNumber: 11,
      title: '11. Vue d\'Ensemble des Indicateurs',
      description: 'Ces indicateurs donnent une vue synthétique de la performance financière de la période. Examinez-les avant d\'interpréter les graphiques.',
      targetAcomId: 'reports.kpis_grid',
      actionToPerform: 'observe',
      speechFr: 'Ces indicateurs donnent une vue synthétique de la performance financière de la période. Examinez-les avant d\'interpréter les graphiques.',
      speechWolof: 'Li yépp dafay joxe gisiit gu yaatu ci performance financière bi laata ngay jéem a xam graphique yi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 12,
      title: '12. Évolution Mensuelle',
      description: 'Ce graphique permet de visualiser l\'évolution des revenus et des dépenses au cours de la période.',
      targetAcomId: 'reports.chart.evolution_mensuelle',
      actionToPerform: 'observe',
      speechFr: 'Ce graphique permet de visualiser l\'évolution des revenus et des dépenses au cours de la période.',
      speechWolof: 'Graphique bi dafay tax nga gis ni revenus ak dépenses yi di wéye ci weer yi weesu.',
      stepCategory: 'control'
    },
    {
      stepNumber: 13,
      title: '13. Part des Dépenses',
      description: 'Cette section montre la répartition des dépenses par catégorie afin d\'identifier les principaux postes de coûts.',
      targetAcomId: 'reports.chart.part_depenses',
      actionToPerform: 'observe',
      speechFr: 'Cette section montre la répartition des dépenses par catégorie afin d\'identifier les principaux postes de coûts.',
      speechWolof: 'Wàll wii dafay wone seddalé dépense yi ci catégorie yu bari ngir xam fiy ëpp luy génn.',
      stepCategory: 'control'
    },
    {
      stepNumber: 14,
      title: '14. Optimisation Suggérée',
      description: 'Cette zone présente une suggestion d\'optimisation basée sur les données financières observées.',
      targetAcomId: 'reports.suggestion.optimisation',
      actionToPerform: 'observe',
      speechFr: 'Cette zone présente une suggestion d\'optimisation basée sur les données financières observées.',
      speechWolof: 'Fi dafay joxe xalaat ak digle ngir wàññi dépense yi ci li ñu gis ci lim yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 15,
      title: '15. Exporter CSV',
      description: 'Vous pouvez exporter les données financières au format CSV pour les analyser ou les conserver dans un autre outil.',
      targetAcomId: 'reports.export_csv_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Vous pouvez exporter les données financières au format CSV pour les analyser ou les conserver dans un autre outil.',
      speechWolof: 'Mën nga génne données financières yi ci format CSV ngir saytu ko wala denc ko feneen.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 16,
      title: '16. Rapport PDF',
      description: 'Vous pouvez également générer le rapport financier au format PDF.',
      targetAcomId: 'reports.export_pdf_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Vous pouvez également générer le rapport financier au format PDF.',
      speechWolof: 'Mën nga itam génne rapport financier bi ci format PDF bu am solo.',
      stepCategory: 'optional'
    }
  ]
};

export const PRESSING_SETTINGS_TUTORIAL: TutorialScenario = {
  id: 'pressing_settings_tutorial',
  title: 'Acom IA — Réglages & Configuration Système',
  description: 'Parcours pédagogique guidé pour configurer les solutions SaaS, le mode local-first, le suivi gérant et l\'identité business',
  saasModule: 'pressing',
  estimatedDurationSec: 360,
  steps: [
    {
      stepNumber: 1,
      title: '1. Solutions SaaS & Abonnements',
      description: 'Cette section permet de gérer les solutions SaaS et les accès associés à votre activité.',
      targetAcomId: 'settings.saas.card',
      actionToPerform: 'observe',
      speechFr: 'Cette section permet de gérer les solutions SaaS et les accès associés à votre activité.',
      speechWolof: 'Wàll wii dafay tax nga mën a doxal solution SaaS yi ak accès yi ñu tëral ci sa liggéey.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Gérer mes SaaS & Accès',
      description: 'Cliquez sur Gérer mes SaaS & accès pour consulter ou gérer les solutions disponibles.',
      targetAcomId: 'settings.saas.manage_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Cliquez sur Gérer mes SaaS & accès pour consulter ou gérer les solutions disponibles.',
      speechWolof: 'Cuubal ci Gérer mes SaaS & accès ngir xool wala doxal solution yi am ci sa liggéey.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 3,
      title: '3. Mode Local-First (Optimisé)',
      description: 'Le mode Local-First permet de travailler avec les données locales de l\'application. Vérifiez ici l\'état actuel du stockage et de la synchronisation.',
      targetAcomId: 'settings.data.local_first_card',
      actionToPerform: 'observe',
      speechFr: 'Le mode Local-First permet de travailler avec les données locales de l\'application. Vérifiez ici l\'état actuel du stockage et de la synchronisation.',
      speechWolof: 'Mode Local-First dafay tax nga mën a liggéeye données yi ci masin bi ci anam bu gaaw te am kaaraange.',
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. État de la Synchronisation',
      description: 'Attention : l\'état de synchronisation affiché ici indique si les données locales sont ou non synchronisées avec le Cloud.',
      targetAcomId: 'settings.data.sync_status',
      actionToPerform: 'observe',
      speechFr: 'Attention : l\'état de synchronisation affiché ici indique si les données locales sont ou non synchronisées avec le Cloud.',
      speechWolof: 'Moytul : fi lañuy wone ndax données locales yi ñu ngi leen di synchroniser ak Cloud bi wala déet.',
      stepCategory: 'control'
    },
    {
      stepNumber: 5,
      title: '5. Sécurité des Données Locales',
      description: 'Vérifiez l\'état de sécurité des données affiché par l\'application avant d\'effectuer une opération sur la base locale.',
      targetAcomId: 'settings.data.security_status',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez l\'état de sécurité des données affiché par l\'application avant d\'effectuer une opération sur la base locale.',
      speechWolof: 'Saytul kaaraangey données yi laata ngay def jëf ci base locale bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 6,
      title: '6. Exporter la Base Locale',
      description: 'Cette action permet d\'exporter les données locales afin de conserver une copie de sauvegarde.',
      targetAcomId: 'settings.data.export_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Cette action permet d\'exporter les données locales afin de conserver une copie de sauvegarde.',
      speechWolof: 'Jëf jii dafay tax nga mën a génne données locales yi ngir denc kaye sauvegarde ci sa masin.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 7,
      title: '7. Vider le Cache (Attention)',
      description: 'Attention : vider le cache est une opération sensible. Utilisez cette action uniquement lorsque cela est nécessaire, par exemple pour résoudre certains problèmes liés aux données temporaires.',
      targetAcomId: 'settings.data.clear_cache_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Attention : vider le cache est une opération sensible. Utilisez cette action uniquement lorsque cela est nécessaire, par exemple pour résoudre certains problèmes liés aux données temporaires.',
      speechWolof: 'Moytul : fomp cache bi jëf bu am risquë la. Def ko rekk bu fekkee dafa am jafe-jafe ci données yi.',
      stepCategory: 'warning'
    },
    {
      stepNumber: 8,
      title: '8. WhatsApp Gérant (avec indicatif)',
      description: 'Renseignez le numéro WhatsApp du gérant avec son indicatif international afin de permettre l\'envoi des notifications.',
      targetAcomId: 'settings.manager.whatsapp_input',
      actionToPerform: 'type',
      speechFr: 'Renseignez le numéro WhatsApp du gérant avec son indicatif international afin de permettre l\'envoi des notifications.',
      speechWolof: 'Bindal numéro WhatsApp u njiit bi ak indicatif bi ngir mën a jot xibaar yi ci waxtu wu nekk.',
      stepCategory: 'required'
    },
    {
      stepNumber: 9,
      title: '9. E-mail Gérant (Destinataire)',
      description: 'Renseignez l\'adresse e-mail qui doit recevoir les notifications destinées au gérant.',
      targetAcomId: 'settings.manager.email_input',
      actionToPerform: 'type',
      speechFr: 'Renseignez l\'adresse e-mail qui doit recevoir les notifications destinées au gérant.',
      speechWolof: 'Bindal adresse e-mail bi nga bëgg mu di jot xibaar yi ñuy yónnee gérant bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 10,
      title: '10. Alerte — Clôture de Caisse',
      description: 'Activez cette option pour permettre l\'envoi automatique d\'une notification au gérant lors d\'une clôture de caisse.',
      targetAcomId: 'settings.manager.notify_cash_closure_toggle',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Activez cette option pour permettre l\'envoi automatique d\'une notification au gérant lors d\'une clôture de caisse.',
      speechWolof: 'Taalal li ngir mu yónnee xibaar ci boppam bu ñu tëjee caisse bi ci kaye bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 11,
      title: '11. Alerte — Vente Caisse POS',
      description: 'Cette option permet de contrôler l\'envoi automatique d\'une notification lors d\'une vente effectuée sur la caisse POS.',
      targetAcomId: 'settings.manager.notify_pos_sale_toggle',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Cette option permet de contrôler l\'envoi automatique d\'une notification lors d\'une vente effectuée sur la caisse POS.',
      speechWolof: 'Opsiŋ wii dafay tax ngay kontrolé yónnee xibaar bu jaay amee ci caisse POS bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 12,
      title: '12. Sauvegarder les Alertes',
      description: 'Après avoir configuré les notifications, cliquez sur Sauvegarder les alertes pour enregistrer vos paramètres.',
      targetAcomId: 'settings.manager.save_alerts_btn',
      actionToPerform: 'click',
      speechFr: 'Après avoir configuré les notifications, cliquez sur Sauvegarder les alertes pour enregistrer vos paramètres.',
      speechWolof: 'Soo noppee ci paramétrer xibaar yi, cuubal ci Sauvegarder les alertes ngir denc ko.',
      stepCategory: 'final',
      expectedEvent: 'SETTINGS_UPDATED'
    },
    {
      stepNumber: 13,
      title: '13. Version Bureau & Desktop',
      description: 'Cette section permet d\'installer Acom sur votre ordinateur afin de disposer d\'un accès plus rapide à l\'application.',
      targetAcomId: 'settings.desktop.card',
      actionToPerform: 'observe',
      speechFr: 'Cette section permet d\'installer Acom sur votre ordinateur afin de disposer d\'un accès plus rapide à l\'application.',
      speechWolof: 'Wàll wii dafay tax nga mën a defal Acom ci sa ordinatëer ngir dugg bu gëna gaaw.',
      stepCategory: 'info'
    },
    {
      stepNumber: 14,
      title: '14. Obtenir l\'App Desktop',
      description: 'Cliquez sur Obtenir l\'App Desktop si vous souhaitez installer l\'application sur votre ordinateur.',
      targetAcomId: 'settings.desktop.download_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Cliquez sur Obtenir l\'App Desktop si vous souhaitez installer l\'application sur votre ordinateur.',
      speechWolof: 'Cuubal ci Obtenir l\'App Desktop soo bëggee installer application bi ci sa masin.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 15,
      title: '15. Type de SaaS',
      description: 'Vérifiez le type de SaaS configuré pour votre activité.',
      targetAcomId: 'settings.business.saas_type',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez le type de SaaS configuré pour votre activité.',
      speechWolof: 'Saytul xeetu SaaS bi ñu tëral ngir sa liggéey.',
      stepCategory: 'control'
    },
    {
      stepNumber: 16,
      title: '16. Forfait Actuel',
      description: 'Vérifiez le forfait actuellement associé à votre compte.',
      targetAcomId: 'settings.business.plan',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez le forfait actuellement associé à votre compte.',
      speechWolof: 'Saytul forfait bi nga am leegi ci sa konte.',
      stepCategory: 'control'
    },
    {
      stepNumber: 17,
      title: '17. Type de Licence',
      description: 'Vérifiez le type de licence actuellement utilisé par l\'entreprise.',
      targetAcomId: 'settings.business.license_type_select',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez le type de licence actuellement utilisé par l\'entreprise.',
      speechWolof: 'Saytul xeetu licence bi entreprise bi di jëfandikoo.',
      stepCategory: 'control'
    },
    {
      stepNumber: 18,
      title: '18. Nom de l\'Établissement',
      description: 'Vérifiez ou renseignez le nom de votre établissement.',
      targetAcomId: 'settings.business.name_input',
      actionToPerform: 'type',
      speechFr: 'Vérifiez ou renseignez le nom de votre établissement.',
      speechWolof: 'Saytul wala nga bind turu sa entreprise wala sa boutique.',
      stepCategory: 'required'
    },
    {
      stepNumber: 19,
      title: '19. Logo de l\'Entreprise',
      description: 'Cette section permet de modifier le logo utilisé par votre entreprise dans l\'application et les documents associés.',
      targetAcomId: 'settings.business.logo_upload_label',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Cette section permet de modifier le logo utilisé par votre entreprise dans l\'application et les documents associés.',
      speechWolof: 'Fi mën nga soppi logo bi ngay jëfandikoo ci application bi ak kaayitu factures yi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 20,
      title: '20. Téléphone Professionnel',
      description: 'Vérifiez ou renseignez le numéro de téléphone professionnel de l\'entreprise.',
      targetAcomId: 'settings.business.phone_input',
      actionToPerform: 'type',
      speechFr: 'Vérifiez ou renseignez le numéro de téléphone professionnel de l\'entreprise.',
      speechWolof: 'Saytul wala nga bind numéro téléphone liggéeyukaay bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 21,
      title: '21. E-mail de Contact',
      description: 'Vérifiez ou renseignez l\'adresse e-mail officielle de contact de l\'entreprise.',
      targetAcomId: 'settings.business.email_input',
      actionToPerform: 'type',
      speechFr: 'Vérifiez ou renseignez l\'adresse e-mail officielle de contact de l\'entreprise.',
      speechWolof: 'Saytul wala nga bind adresse email bu officiel ngir jot jokkoo yi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 22,
      title: '22. Adresse Physique',
      description: 'Renseignez l\'adresse physique de votre établissement.',
      targetAcomId: 'settings.business.address_input',
      actionToPerform: 'type',
      speechFr: 'Renseignez l\'adresse physique de votre établissement.',
      speechWolof: 'Bindal fi fukk ak barab bi sa boutique wala sa liggéeyukaay nekk.',
      stepCategory: 'required'
    },
    {
      stepNumber: 23,
      title: '23. Description / Slogan',
      description: 'Vous pouvez renseigner ici une courte description ou le slogan de votre entreprise.',
      targetAcomId: 'settings.business.description_input',
      actionToPerform: 'type',
      isOptional: true,
      speechFr: 'Vous pouvez renseigner ici une courte description ou le slogan de votre entreprise.',
      speechWolof: 'Mën nga bind fi waxiin bu gàtt wala slogan bu wone sa liggéey.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 24,
      title: '24. Enregistrer les Modifications',
      description: 'Après avoir terminé vos modifications, utilisez le bouton de sauvegarde pour enregistrer les paramètres de votre entreprise.',
      targetAcomId: 'settings.business.save_btn',
      actionToPerform: 'click',
      speechFr: 'Après avoir terminé vos modifications, utilisez le bouton de sauvegarde pour enregistrer les paramètres de votre entreprise.',
      speechWolof: 'Soo noppee ci soppi yëpp, cuubal ci bouton bi ngir denc réglages yu yees yi.',
      stepCategory: 'final',
      expectedEvent: 'SETTINGS_UPDATED'
    }
  ]
};

export const COMMERCE_OVERVIEW_TUTORIAL: TutorialScenario = {
  id: 'commerce_overview_tutorial',
  title: 'Tutoriel Complet — Page « Aperçu & Tableau de Bord Général »',
  description: 'Présentation guidée interactive complète de la page Aperçu de haut en bas (50 étapes).',
  saasModule: 'commerce',
  estimatedDurationSec: 420,
  steps: [
    {
      stepNumber: 1,
      title: '1. Logo et Identité Acom',
      description: 'Présentation de l\'identité Acom et accueil sur la page Aperçu du module Management Commerce.',
      targetAcomId: 'header.logo_and_title',
      actionToPerform: 'observe',
      speechFr: 'Bienvenue dans Acom. Vous êtes sur la page Aperçu du module Management Commerce. Cette page constitue votre tableau de bord général et votre premier point d\'accès aux principales fonctions du logiciel.',
      speechWolof: 'Dalal ak jàmm ci Acom. Yàggi nekk ci xët u Aperçu ci wàllu Management Commerce. Xët wii mooy sa kaye liggéey bu yaatu ngir xam ni jumtukaay yi di doxee.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Nom du Logiciel / Module',
      description: 'Le module Management Commerce centralise le stock, les ventes, les flux financiers et les alertes.',
      targetAcomId: 'header.module_name',
      actionToPerform: 'observe',
      speechFr: 'Cette interface est dédiée au Management Commerce. Elle centralise les informations nécessaires au suivi de votre activité, notamment le stock, les ventes, les flux financiers et les alertes.',
      speechWolof: 'Xët wii ñeeltina Management Commerce. Dafa dajale xibaar yëpp yu am solo ngir saytu sa stock, sa jaay-jaay, xaalis bi di duggu ak di génne, ak artu yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. Plan Premium',
      description: 'Indication de la formule de votre compte.',
      targetAcomId: 'header.plan_badge',
      actionToPerform: 'observe',
      speechFr: 'Ce badge indique la formule actuellement utilisée pour votre compte.',
      speechWolof: 'Badge bi dafay wone formule bi nga am ci sa compte.',
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. Mode d\'Affichage',
      description: 'Inversion du thème entre le mode sombre et le mode clair.',
      targetAcomId: 'header.theme_toggle',
      actionToPerform: 'observe',
      speechFr: 'Ce contrôle permet de choisir le mode d\'affichage de l\'application, entre le mode sombre et le mode clair.',
      speechWolof: 'Jumtukaay bi dafay tax nga mën a soppi melokaanu xët bi, ndax nga bëgg ko mu lëndëm wala mu leer.',
      stepCategory: 'control'
    },
    {
      stepNumber: 5,
      title: '5. Notifications',
      description: 'Accès aux notifications et messages système de votre compte.',
      targetAcomId: 'header.notifications',
      actionToPerform: 'observe',
      speechFr: 'Cette zone permet d\'accéder aux notifications disponibles pour votre compte.',
      speechWolof: 'Wàll wii dafay tax nga mën a xool yéeneer yi ak notification yi nga am ci sa compte.',
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: '6. Profil Utilisateur',
      description: 'Profil utilisateur et rôle au sein du système.',
      targetAcomId: 'header.user_profile',
      actionToPerform: 'observe',
      speechFr: 'Ici, vous retrouvez votre profil utilisateur ainsi que votre rôle dans l\'application.',
      speechWolof: 'Fi nga koy gise sa profil nit ak sa taxawaay ci application bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 7,
      title: '7. Licence Locale Active',
      description: 'Statut de validité de votre licence d\'utilisation locale.',
      targetAcomId: 'header.licence_status',
      actionToPerform: 'observe',
      speechFr: 'Cette information indique l\'état de votre licence locale. Ici, la licence est indiquée comme active.',
      speechWolof: 'Xibaar wii dafay wone ne sa licence locale mu ngi dox bu baax.',
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: '8. Nombre de Magasins Actifs',
      description: 'Nombre d\'unités opérationnelles associées à cet environnement.',
      targetAcomId: 'header.stores_count',
      actionToPerform: 'observe',
      speechFr: 'Cette zone indique le nombre d\'unités ou de magasins actuellement actifs dans votre environnement.',
      speechWolof: 'Wàll wii dafay wone limu boutique wala bérab yu dox ci sa mbootay.',
      stepCategory: 'info'
    },
    {
      stepNumber: 9,
      title: '9. Sélecteur de SaaS Actif',
      description: 'Changement dynamique du logiciel métier SaaS.',
      targetAcomId: 'header.active_saas',
      actionToPerform: 'observe',
      speechFr: 'Cette zone indique le module SaaS actuellement actif. Ici, le module utilisé est Management Commerce.',
      speechWolof: 'Wàll wii dafay wone module SaaS bi nga nekk léegi. Fi, mooy Management Commerce.',
      stepCategory: 'control'
    },
    {
      stepNumber: 10,
      title: '10. Date d\'Écriture Disque',
      description: 'Date de dernière écriture locale des transactions sur le disque dur.',
      targetAcomId: 'header.disk_write',
      actionToPerform: 'observe',
      speechFr: 'Cette zone présente l\'information d\'écriture ou de synchronisation du disque telle qu\'elle est affichée par l\'application.',
      speechWolof: 'Wàll wii dafay wone xibaaru bind ci disque bi ak dates yi application bi di bind.',
      stepCategory: 'info'
    },
    {
      stepNumber: 11,
      title: '11. Barre des Accès Rapides',
      description: 'Accès rapide vers les modules transversaux et utilitaires de la plateforme.',
      targetAcomId: 'dashboard.quick_access.bar',
      actionToPerform: 'observe',
      speechFr: 'Cette zone regroupe plusieurs accès rapides vers des fonctions complémentaires du logiciel.',
      speechWolof: 'Wàll wii dafa dajale yoon yu gaaw yëpp ngir dem ci yeneen jumtukaay.',
      stepCategory: 'info'
    },
    {
      stepNumber: 12,
      title: '12. Bouton Acom IA Démo',
      description: 'Accès au simulateur interactif pour tester les parcours guidés.',
      targetAcomId: 'dashboard.quick_access.ai_demo_btn',
      actionToPerform: 'observe',
      speechFr: 'Acom IA Démo permet d\'accéder à l\'assistant interactif qui accompagne l\'utilisateur dans la découverte et l\'utilisation du logiciel.',
      speechWolof: 'Acom IA Démo dafay tax nga mën a duggu ci assistant bi di la gunge ci njàngu logiciel bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 13,
      title: '13. Bouton AcomZone',
      description: 'Espace de marché et d\'intégration de l\'écosystème Acom.',
      targetAcomId: 'dashboard.quick_access.acomzone_btn',
      actionToPerform: 'observe',
      speechFr: 'AcomZone donne accès à la marketplace et aux services proposés dans cet environnement.',
      speechWolof: 'AcomZone dafay ubbil yoon ci marketplace bi ak service yi nekk ci mbootay bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 14,
      title: '14. Application Desktop Native',
      description: 'Mode d\'installation bureau pour une rapidité optimale sans navigateur.',
      targetAcomId: 'dashboard.quick_access.desktop_btn',
      actionToPerform: 'observe',
      speechFr: 'App Desktop permet d\'accéder à l\'application locale.',
      speechWolof: 'App Desktop dafay tax nga mën a yebbu application bi ci sa ordinatær local.',
      stepCategory: 'control'
    },
    {
      stepNumber: 15,
      title: '15. Documentation Technique',
      description: 'Consultez les guides utilisateurs et manuels d\'exploitation.',
      targetAcomId: 'dashboard.quick_access.docs_btn',
      actionToPerform: 'observe',
      speechFr: 'La documentation regroupe les guides et les tutoriels destinés à accompagner l\'utilisateur.',
      speechWolof: 'Documentation bi dafa dajale téerey njàngale ak téerey xam-xam ngir dimbali nit bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 16,
      title: '16. Déconnexion de Session',
      description: 'Permet de clôturer la session courante en toute sécurité.',
      targetAcomId: 'dashboard.quick_access.logout_btn',
      actionToPerform: 'observe',
      speechFr: 'Ce bouton permet de quitter la session actuellement ouverte.',
      speechWolof: 'Bouton bi dafay tax nga mën a génne ci sa session ci kaaraange.',
      stepCategory: 'control'
    },
    {
      stepNumber: 17,
      title: '17. Navigation Principale',
      description: 'Barre d\'onglets principale donnant accès aux sous-modules fonctionnels.',
      targetAcomId: 'merchant.navbar',
      actionToPerform: 'observe',
      speechFr: 'Cette barre constitue la navigation principale du logiciel. Elle permet d\'accéder aux différents domaines fonctionnels de votre environnement.',
      speechWolof: 'Bandeau wii mooy yoonu navigation bu gëna am solo. Dfay tax nga mën a dem ci wàll yëpp.',
      stepCategory: 'info'
    },
    {
      stepNumber: 18,
      title: '18. Onglet Aperçu (Actif)',
      description: 'Page d\'accueil synthétique offrant la vue globale d\'activité.',
      targetAcomId: 'nav-apercu',
      actionToPerform: 'observe',
      speechFr: 'Vous êtes actuellement dans l\'onglet Aperçu. C\'est ici que vous retrouvez la vision générale de votre activité.',
      speechWolof: 'Yàggi nekk ci onglet Aperçu. Fi nga koy gise méttaayu sa liggéey ci am mbooloo.',
      stepCategory: 'info'
    },
    {
      stepNumber: 19,
      title: '19. Onglet Caisse POS',
      description: 'Module d\'encaissement tactile et de vente directe au comptoir.',
      targetAcomId: 'nav-caisse',
      actionToPerform: 'observe',
      speechFr: 'L\'onglet Caisse POS est dédié aux opérations de caisse et de vente au point de vente.',
      speechWolof: 'Onglet Caisse POS mooy bérab bi ñu jagleel jaay-jaay yi ak lekku xaalis bi ci comptoir bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 20,
      title: '20. Onglet Stock',
      description: 'Gestion des articles, inventaires, catégories et seuils de réapprovisionnement.',
      targetAcomId: 'nav-stock',
      actionToPerform: 'observe',
      speechFr: 'L\'onglet Stock permet de suivre et de gérer les articles et les niveaux de stock.',
      speechWolof: 'Onglet Stock dafay tax nga mën a saytu lepp lu am ci produit yi ak limu stock bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 21,
      title: '21. Onglet Fournisseurs',
      description: 'Gestion de l\'annuaire des fournisseurs et des commandes d\'achat.',
      targetAcomId: 'nav-fournisseurs',
      actionToPerform: 'observe',
      speechFr: 'L\'onglet Fournisseurs permet de gérer les partenaires et les informations liées aux approvisionnements.',
      speechWolof: 'Onglet Fournisseurs dafay saytu partenariat yi ak lepp lu jëm ci jëndu marchandises.',
      stepCategory: 'info'
    },
    {
      stepNumber: 22,
      title: '22. Onglet Facture / Devis',
      description: 'Édition, suivi et impression des factures proforma, devis et traites.',
      targetAcomId: 'nav-facturation',
      actionToPerform: 'observe',
      speechFr: 'Cette section permet de gérer les documents commerciaux, notamment les factures et les devis.',
      speechWolof: 'Wàll wii dafay saytu kayitu commerçant yi, rawatina factures yi ak devis yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 23,
      title: '23. Onglet Audit & Traçabilité',
      description: 'Consultation de l\'historique d\'événements et des journaux d\'opérations.',
      targetAcomId: 'nav-audit',
      actionToPerform: 'observe',
      speechFr: 'L\'Audit permet de consulter la traçabilité des opérations enregistrées dans le système.',
      speechWolof: 'Audit bi dafay wone séedde ak yoonu jëf yëpp yi ñu bind ci masin bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 24,
      title: '24. Onglet Comptabilité',
      description: 'Saisie des dépenses, gestion des charges et journaux de caisse.',
      targetAcomId: 'nav-compta',
      actionToPerform: 'observe',
      speechFr: 'La section Compta regroupe les informations liées aux flux financiers et aux dépenses générales.',
      speechWolof: 'Wàllu Compta dafa dajale xibaar yi jëm ci xaalis ak dépense yëpp.',
      stepCategory: 'info'
    },
    {
      stepNumber: 25,
      title: '25. Onglet Clôture de Caisse',
      description: 'Formulaire de fin de journée, rapport journalier et justification d\'écarts.',
      targetAcomId: 'nav-pressing_closure',
      actionToPerform: 'observe',
      speechFr: 'Cette section permet de gérer la clôture de caisse et le suivi des opérations correspondantes.',
      speechWolof: 'Wàll wii dafay saytu tëju caisse bi ak séeddeu xaalis bu bés bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 26,
      title: '26. Onglet Rapports Financiers',
      description: 'Bilans statistiques, bilans de période et exports de résultats.',
      targetAcomId: 'nav-reports',
      actionToPerform: 'observe',
      speechFr: 'La section Rapports permet d\'accéder aux informations et synthèses disponibles sous forme de rapports.',
      speechWolof: 'Wàllu Rapports dafay ubbil yoon ci mboolooxu xibaar yi ci kayitu bilan.',
      stepCategory: 'info'
    },
    {
      stepNumber: 27,
      title: '27. Onglet Réglages & Paramètres',
      description: 'Configuration du profil de l\'entreprise, imprimantes et paramètres généraux.',
      targetAcomId: 'nav-settings',
      actionToPerform: 'observe',
      speechFr: 'Les Réglages permettent d\'accéder aux paramètres de l\'application.',
      speechWolof: 'Réglages yi dafay tax nga mën a soppi paramètre yëpp yu application bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 28,
      title: '28. Briefing Matinal Intelligent',
      description: 'Recommandations quotidiennes générées pour orienter les actions du jour.',
      targetAcomId: 'dashboard.briefing.card',
      actionToPerform: 'observe',
      speechFr: 'Cette zone constitue le briefing de la journée. Elle peut présenter un message ou une information destinée à vous accompagner au début de votre activité.',
      speechWolof: 'Wàll wii mooy briefing u bés bi. Dfay wone xibaar ak digal ngir tambali bés bi ci ndam.',
      stepCategory: 'info'
    },
    {
      stepNumber: 29,
      title: '29. Moteur de Synchronisation',
      description: 'Statut du moteur de données garantissant un fonctionnement continu hors connexion.',
      targetAcomId: 'dashboard.sync.card',
      actionToPerform: 'observe',
      speechFr: 'Cette zone permet de connaître l\'état du moteur de synchronisation des données.',
      speechWolof: 'Wàll wii dafay wone méttaayu moteur de synchronisation bi ci diggante local ak cloud.',
      stepCategory: 'control'
    },
    {
      stepNumber: 30,
      title: '30. Commandes de Synchronisation',
      description: 'Commandes manuelles pour forcer la synchronisation, exporter ou restaurer la base locale.',
      targetAcomId: 'dashboard.sync.actions_zone',
      actionToPerform: 'observe',
      speechFr: 'Ces commandes permettent d\'effectuer les différentes opérations de gestion de la synchronisation.',
      speechWolof: 'Commande yii dafay tax nga mën a denc, délloosi wala forcer synchronisation bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 31,
      title: '31. Valeur Totale du Stock',
      description: 'Évaluation marchande globale des articles détenus en réserve et en rayon.',
      targetAcomId: 'dashboard.stats.total_stock_value',
      actionToPerform: 'observe',
      speechFr: 'Cette carte présente la valeur totale du stock selon les données actuellement affichées.',
      speechWolof: 'Kàrt wii dafay wone njortu njagum stock bi yëpp léegi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 32,
      title: '32. Bénéfice Potentiel du Stock',
      description: 'Estimation de la marge brute réalisable sur la totalité du stock disponible.',
      targetAcomId: 'dashboard.stats.total_stock_profit',
      actionToPerform: 'observe',
      speechFr: 'Cette carte présente le bénéfice total associé au stock selon les données affichées.',
      speechWolof: 'Kàrt wii dafay wone bénéfice bi nga mën a gaañe ci stock bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 33,
      title: '33. Période d\'Analyse des Ventes',
      description: 'Choix de la fenêtre temporelle de calcul pour l\'ensemble des cartes de performance.',
      targetAcomId: 'dashboard.stats.period_select',
      actionToPerform: 'observe',
      speechFr: 'Ce sélecteur permet de choisir la période utilisée pour les statistiques de vente présentées dans le tableau de bord.',
      speechWolof: 'Sélecteur bi dafay tax nga mën a tann weer wi nga bëgg xool stat yi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 34,
      title: '34. Chiffre d\'Affaires Réalisé',
      description: 'Montant cumulé des encaissements enregistrés sur la période sélectionnée.',
      targetAcomId: 'dashboard.stats.revenue_card',
      actionToPerform: 'observe',
      speechFr: 'Le chiffre d\'affaires présente le montant des ventes réalisé pour la période sélectionnée.',
      speechWolof: 'Chiffre d\'affaires bi dafay wone limu xaalis bi nga gaañe ci jaay-jaay yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 35,
      title: '35. Flux de Trésorerie',
      description: 'Bilan net entre les entrées de caisse et les sorties de la période.',
      targetAcomId: 'dashboard.stats.cashflow_card',
      actionToPerform: 'observe',
      speechFr: 'Le flux de trésorerie permet de suivre les entrées et les sorties financières enregistrées sur la période.',
      speechWolof: 'Flux de trésorerie bi dafay wone xaalis bi dugge ak bi génne ci waxtu wi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 36,
      title: '36. Dépenses Cumulées',
      description: 'Somme des décaissements et charges opérationnelles comptabilisées.',
      targetAcomId: 'dashboard.stats.expenses_card',
      actionToPerform: 'observe',
      speechFr: 'Cette carte présente les dépenses enregistrées pour la période sélectionnée.',
      speechWolof: 'Kàrt wii dafay wone dépense yëpp yi nga bind ci weer wi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 37,
      title: '37. Bénéfice Net Consolidé',
      description: 'Résultat net d\'exploitation égal au chiffre d\'affaires moins les charges.',
      targetAcomId: 'dashboard.stats.net_profit_card',
      actionToPerform: 'observe',
      speechFr: 'Le bénéfice net présente le résultat net calculé à partir des données disponibles pour la période.',
      speechWolof: 'Bénéfice net bi mooy li nga ci gaañe dëgg-dëgg mu waññiku dépense yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 38,
      title: '38. Volume des Transactions',
      description: 'Nombre de tickets de caisse ou ventes validées durant la période.',
      targetAcomId: 'dashboard.stats.sales_volume_card',
      actionToPerform: 'observe',
      speechFr: 'Cette carte présente le volume des ventes enregistré sur la période sélectionnée.',
      speechWolof: 'Kàrt wii dafay wone limu transaction yi nga def ci weer wi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 39,
      title: '39. Panier Moyen Client',
      description: 'Dépense moyenne effectuée par client sur chaque transaction.',
      targetAcomId: 'dashboard.stats.average_basket_card',
      actionToPerform: 'observe',
      speechFr: 'Le panier moyen indique la valeur moyenne d\'une transaction selon les données disponibles.',
      speechWolof: 'Panier moyen bi dafay wone cér bi client bu nekk di fay ci am vente.',
      stepCategory: 'info'
    },
    {
      stepNumber: 40,
      title: '40. Marge Brute de Vente',
      description: 'Bénéfice direct réalisé sur la revente des marchandises.',
      targetAcomId: 'dashboard.stats.sales_profit_card',
      actionToPerform: 'observe',
      speechFr: 'Cette carte présente le bénéfice associé aux ventes sur la période sélectionnée.',
      speechWolof: 'Kàrt wii dafay wone marge brute bi nga am ci jaay-jaay yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 41,
      title: '41. Alertes de Stock Faible',
      description: 'Compteur d\'articles ayant atteint ou franchi le seuil d\'alerte.',
      targetAcomId: 'dashboard.stats.stock_alerts_card',
      actionToPerform: 'observe',
      speechFr: 'Cette carte permet d\'identifier rapidement les éventuelles alertes liées au stock.',
      speechWolof: 'Kàrt wii dafay tax nga mën a ràññee gaaw alertes yi nekk ci stock bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 42,
      title: '42. Graphique de Performance Financière',
      description: 'Courbes comparatives quotidiennes des ventes et des charges d\'exploitation.',
      targetAcomId: 'dashboard.charts.performance_card',
      actionToPerform: 'observe',
      speechFr: 'Cette zone présente l\'évolution de la performance financière sur la période affichée. Elle permet de visualiser les tendances des données disponibles.',
      speechWolof: 'Graphique bi dafay wone ni xaalis bi di soppikoo bés bu nekk ci ay jaay ak ay dépense.',
      stepCategory: 'info'
    },
    {
      stepNumber: 43,
      title: '43. Synthèse Comptable',
      description: 'Tableau récapitulatif des agrégats financiers et ratios de gestion.',
      targetAcomId: 'dashboard.accounting.summary_card',
      actionToPerform: 'observe',
      speechFr: 'Le résumé comptable rassemble les principaux indicateurs financiers dans une présentation synthétique.',
      speechWolof: 'Résumé comptable bi dafa dajale revenus yi, dépenses yi ak marge nette bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 44,
      title: '44. Journal des Activités Récentes',
      description: 'Fil d\'actualité des dernières opérations saisies dans le système.',
      targetAcomId: 'dashboard.activity.recent_feed',
      actionToPerform: 'observe',
      speechFr: 'Cette section présente les dernières activités enregistrées dans l\'application. Elle permet de suivre rapidement les opérations récentes.',
      speechWolof: 'Wàll wii dafay wone jëf yu mujj yi ñu def ci application bi ci waxtu wu nekk.',
      stepCategory: 'info'
    },
    {
      stepNumber: 45,
      title: '45. Bilan des Flux Financiers',
      description: 'Consolidation récapitulative des mouvements de fonds du commerce.',
      targetAcomId: 'dashboard.recap.general_card',
      actionToPerform: 'observe',
      speechFr: 'Cette section permet de consulter les derniers mouvements financiers enregistrés dans l\'application.',
      speechWolof: 'Wàll wii dafay tax nga mën a xool bilan des mouvements financiers yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 46,
      title: '46. Surveillance des Articles en Rupture',
      description: 'Liste détaillée des références nécessitant un réapprovisionnement urgent.',
      targetAcomId: 'dashboard.stock.low_stock_table',
      actionToPerform: 'observe',
      speechFr: 'Cette zone permet de surveiller les articles qui sont en rupture de stock ou qui nécessitent une attention particulière.',
      speechWolof: 'Wàll wii dafay saytu produit yi mën a jeex wala yi am manque ci stock bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 47,
      title: '47. Widget Floating Assistant Acom IA',
      description: 'Bouton d\'appel permanent de l\'assistant intelligent disponible 24/7 en Français et Wolof.',
      targetAcomId: 'dashboard.assistant_floating_btn',
      actionToPerform: 'observe',
      speechFr: 'L\'assistant Acom IA reste accessible depuis l\'interface afin de vous accompagner lorsque vous avez besoin d\'aide ou d\'informations.',
      speechWolof: 'Assistant Acom IA bi mu ngi nekk ci wàllu sufe ngir dimbali la waxtu wu nekk.',
      stepCategory: 'control'
    },
    {
      stepNumber: 48,
      title: '48. Centre de Notification & Système',
      description: 'Rappels système, alertes de licence et notifications utilisateur.',
      targetAcomId: 'header.notifications',
      actionToPerform: 'observe',
      speechFr: 'Cette zone regroupe les indications système et les informations relatives à votre environnement de travail.',
      speechWolof: 'Fi nga koy gise xibaaru système bi ak xibaar yu yees yi nekk ci sa mbootay.',
      stepCategory: 'info'
    },
    {
      stepNumber: 49,
      title: '49. Pied de Page Général',
      description: 'Informations de copyright, liens de support technique et mentions légales.',
      targetAcomId: 'dashboard.footer',
      actionToPerform: 'observe',
      speechFr: 'Nous arrivons à la fin de la page. Le pied de page contient les informations générales et les accès complémentaires du logiciel.',
      speechWolof: 'Yegsi nañu ci sufe xët bi. Pied de page bi dafa am xibaar yi gëna yaatu ak support technique bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 50,
      title: '50. Synthèse & Conclusion du Premier Contact',
      description: 'Bravo ! Vous maîtrisez désormais l\'ensemble de l\'organisation générale du tableau de bord Aperçu.',
      targetAcomId: 'header.logo_and_title',
      actionToPerform: 'observe',
      speechFr: 'Vous venez de parcourir l\'ensemble de la page Aperçu de Management Commerce. Vous avez découvert l\'organisation générale d\'Acom, les informations de votre environnement, les accès rapides, la navigation principale, le briefing, la synchronisation, les indicateurs de stock et de vente, les statistiques financières, les activités récentes, les flux financiers et les alertes de stock. Cette page constitue votre point de départ pour naviguer dans le reste du logiciel. Vous savez maintenant où retrouver les principales informations et les différents modules de gestion.',
      speechWolof: 'Jéxal nañu njàngale xët u Aperçu bi ci Management Commerce. Xam nga léegi ni Acom tege, yoonu navigation bi, briefing bi, synchronisation bi, stat yi, dépense yi ak alertes yi yëpp. Xët wii mooy sa tambalikaay ngir dox ci lepp lu am ci logiciel bi.',
      stepCategory: 'final'
    }
  ]
};

export const COUTURE_OVERVIEW_TUTORIAL: TutorialScenario = {
  id: 'couture_tutorial_dashboard',
  title: 'Présentation Complète — Ateliers de Couture & Confection',
  description: 'Tutoriel guidé interactif pour analyser l\'environnement de travail, les fiches mesures, les acomptes, les commandes en atelier et la santé financière.',
  saasModule: 'tailleur',
  estimatedDurationSec: 420,
  steps: [
    {
      stepNumber: 1,
      title: '1. Identité « Acom Creative Studio » / Logo et Titre',
      description: 'Logo et identité générale de votre atelier de création textile et de confection sur mesure.',
      targetAcomId: 'header.logo_and_title',
      actionToPerform: 'observe',
      speechFr: "Bienvenue dans Acom Creative Studio pour les Ateliers de Couture. Cette zone présente le logo et l'identité de votre atelier de création textile et de confection sur mesure.",
      speechWolof: "Dalal jàmm ci Acom Creative Studio ngir Ateliers de Couture. Fi mooy wone logo ak tàmbli yu sa atelier de couture ak ñaw sur mesure.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Nom du Logiciel / SaaS Actif « Ateliers de Couture »',
      description: 'Environnement métier dédié au pilotage des prises de mesures et des commandes de confection.',
      targetAcomId: 'header.module_name',
      actionToPerform: 'observe',
      speechFr: "Vous êtes actuellement connecté au logiciel Ateliers de Couture, conçu pour piloter les prises de mesures, le suivi des commandes clients, la gestion des coupons de tissus et l'activité de vos artisans.",
      speechWolof: "Yaa ngi léegi ci logiciel Ateliers de Couture, ngir saytu natt yi, commande yu ñaw yi, kuponu sër yi ak liggéeyu tayër yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. Formule / Plan de l\'Atelier',
      description: 'Formule d\'abonnement active déterminant les fonctionnalités et capacités de votre atelier.',
      targetAcomId: 'header.plan_badge',
      actionToPerform: 'observe',
      speechFr: "Ce badge indique votre formule d'abonnement active, déterminant vos capacités d'enregistrement de fiches mesures, de gestion des stocks tissus et d'accès aux modules avancés.",
      speechWolof: "Badge bi dafay wone formule bi nga abonné, muy tax nga xam li nga mën a def ci commande mesures ak stock sër.",
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. Mode d\'Affichage (Thème Clair / Sombre)',
      description: 'Bascule entre le mode clair et le mode sombre pour un confort visuel optimal en atelier.',
      targetAcomId: 'header.theme_toggle',
      actionToPerform: 'observe',
      speechFr: "Ce bouton permet d'alterner entre le mode clair et le mode sombre pour un confort visuel optimal lors de vos sessions de travail en atelier.",
      speechWolof: "Bouton bi dafay tax nga soppi leer gi ak lëndëm gi ngir gëna yombal sa xool ci atelier bi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 5,
      title: '5. Notifications Atelier',
      description: 'Alertes en temps réel sur les échéances d\'essayage, livraisons prêtes et réapprovisionnements.',
      targetAcomId: 'header.notifications',
      actionToPerform: 'observe',
      speechFr: "La cloche de notifications vous informe en direct des échéances d'essayage, des commandes prêtes pour livraison et des alertes sur vos coupons de tissus.",
      speechWolof: "Kloche bi dafay yëgle waxtu essayage yi, commande yu paré ngir livraison ak artu yu sër yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: '6. Profil Gestionnaire Atelier',
      description: 'Informations du compte utilisateur connecté et accès aux paramètres de sécurité.',
      targetAcomId: 'header.user_profile',
      actionToPerform: 'observe',
      speechFr: "Cette section affiche l'identité du maître tailleur ou gestionnaire connecté, avec un accès direct aux paramètres de compte et de sécurité.",
      speechWolof: "Fi dafay wone kiy géré atelier bi, ak yoon wu gaaw ngir dem ci compte bi ak kaaraange gi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 7,
      title: '7. Licence Locale Active',
      description: 'Garantie de fonctionnement autonome et continu de l\'atelier même hors connexion Internet.',
      targetAcomId: 'header.licence_status',
      actionToPerform: 'observe',
      speechFr: "Votre licence locale garantit un fonctionnement continu et autonome de votre atelier, même en cas de coupure totale d'Internet.",
      speechWolof: "Licence locale bi dafay wone ni sa atelier mën na liggéey ci anam bu mat sax soo amul connexion Internet.",
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: '8. Ateliers Actifs',
      description: 'Nombre d\'ateliers, points de prise de mesures ou boutiques rattachés.',
      targetAcomId: 'header.stores_count',
      actionToPerform: 'observe',
      speechFr: "Cet indicateur affiche le nombre d'ateliers, de points de prise de mesures ou de boutiques de prêt-à-porter rattachés à votre compte.",
      speechWolof: "Fi dafay wone limu atelier, bérabu natt wala boutique yu prêt-à-porter yi nga yor.",
      stepCategory: 'info'
    },
    {
      stepNumber: 9,
      title: '9. Sélecteur de SaaS Actif',
      description: 'Bascule instantanée vers les autres logiciels de la suite Acom.',
      targetAcomId: 'header.active_saas',
      actionToPerform: 'observe',
      speechFr: "Le sélecteur de SaaS vous permet de basculer instantanément vers les autres univers de la suite Acom selon vos activités complémentaires.",
      speechWolof: "Sélecteur bi dafay tax nga mën a wacc ci yeneen logiciel Acom soo amee yeneen liggéey.",
      stepCategory: 'control'
    },
    {
      stepNumber: 10,
      title: '10. Date d\'Écriture Disque Sécurisée',
      description: 'Horodatage de la dernière écriture sécurisée dans la base de données locale.',
      targetAcomId: 'header.disk_write',
      actionToPerform: 'observe',
      speechFr: "Cette métrique confirme l'écriture immédiate et sécurisée de chaque fiche de mesure et commande couture dans la base de données locale de votre ordinateur.",
      speechWolof: "Fi dafay wone ni lepp lu nga bind ci natt ak commande dafay dencu dërët ci masin bi ci anam bu kaaraange.",
      stepCategory: 'info'
    },
    {
      stepNumber: 11,
      title: '11. Bandeau Accès Rapides',
      description: 'Raccourcis transversaux vers les outils clés de la plateforme.',
      targetAcomId: 'dashboard.quick_access.bar',
      actionToPerform: 'observe',
      speechFr: "Le bandeau d'accès rapides rassemble les raccourcis essentiels vers les outils transversaux de votre atelier.",
      speechWolof: "Bandeau bi dafa dajale yoon yu gaaw yëpp ngir dugg ci jumtukaay yu am solo yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 12,
      title: '12. Bouton Acom IA Démo',
      description: 'Lancement du simulateur interactif et de la formation guidée en atelier.',
      targetAcomId: 'dashboard.quick_access.ai_demo_btn',
      actionToPerform: 'observe',
      speechFr: "Le bouton Acom IA Démo lance votre assistant et simulateur de formation pour maîtriser l'ensemble des fonctionnalités couture en situation réelle.",
      speechWolof: "Bouton Acom IA Démo dafay ubbil la ndimbalu formation bi ngir jàng ni ñuy doxale atelier couture bi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 13,
      title: '13. Bouton AcomZone',
      description: 'Partage de modèles, synchronisation collaborative multisite et interconnexion.',
      targetAcomId: 'dashboard.quick_access.acomzone_btn',
      actionToPerform: 'observe',
      speechFr: "AcomZone facilite le partage de modèles de tenues, de fiches techniques et la synchronisation multisite entre vos différents ateliers de confection.",
      speechWolof: "AcomZone dafay tax nga mën a séddoo model yu bees yi ak a lëkkaloo ak yeneen atelier.",
      stepCategory: 'control'
    },
    {
      stepNumber: 14,
      title: '14. Application Desktop Native',
      description: 'Téléchargement de la version installable hors ligne pour ordinateur.',
      targetAcomId: 'dashboard.quick_access.desktop_btn',
      actionToPerform: 'observe',
      speechFr: "Téléchargez et utilisez la version Bureau pour une rapidité maximale à la prise de mesures et un fonctionnement 100 % hors ligne garanti.",
      speechWolof: "Jëlël version Bureau bi ngir liggéey bu gëna gaaw te mën a dox ci kow masin bi te du laaj connexion.",
      stepCategory: 'control'
    },
    {
      stepNumber: 15,
      title: '15. Documentation Technique & Guides',
      description: 'Manuels d\'utilisation, barèmes de coupe et guides pratiques pour tailleurs.',
      targetAcomId: 'dashboard.quick_access.docs_btn',
      actionToPerform: 'observe',
      speechFr: "Consultez les guides pratiques, barèmes de mesures et manuels d'utilisation pour exploiter au mieux votre logiciel couture.",
      speechWolof: "Xoolal téerey njàngale yi ak dosiye yi ngir gëna xam ni ñuy doxale logiciel bi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 16,
      title: '16. Déconnexion de Session',
      description: 'Clôture sécurisée de la session de travail active.',
      targetAcomId: 'dashboard.quick_access.logout_btn',
      actionToPerform: 'observe',
      speechFr: "Ce bouton clôture votre session de travail en sécurisant l'intégrité de toutes les mesures et encaissements enregistrés.",
      speechWolof: "Bouton bi dafay tëj sa session ci kaaraange te denc lepp loo bindoon.",
      stepCategory: 'control'
    },
    {
      stepNumber: 17,
      title: '17. Navigation Principale Couture',
      description: 'Barre de navigation transversale organisant l\'ensemble des modules de l\'atelier.',
      targetAcomId: 'merchant.navbar',
      actionToPerform: 'observe',
      speechFr: "La barre de navigation principale structure l'ensemble des modules opérationnels de votre atelier de couture et de confection.",
      speechWolof: "Barre de navigation bi mooy wone yoon yëpp yu am ci atelier couture bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 18,
      title: '18. Onglet Aperçu (Actif)',
      description: 'Tableau de bord central consolidant les indicateurs clés et l\'activité en temps réel.',
      targetAcomId: 'nav-dashboard',
      actionToPerform: 'observe',
      speechFr: "L'onglet Aperçu est le tableau de bord central. Il offre une vue globale en temps réel sur la santé financière, les commandes en cours et la synchronisation de l'atelier.",
      speechWolof: "Onglet Aperçu mooy tableau de bord bi. Dafay wone ci saas bi méttaayu xaalis bi, commande yi ñuy ñaw ak synchronisation bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 19,
      title: '19. Onglet Clients Couture',
      description: 'Répertoire des clients, carnet d\'adresses et préférences de coupe.',
      targetAcomId: 'nav-tailleur_clients',
      actionToPerform: 'observe',
      speechFr: "Le module Clients Couture gère le répertoire de vos clients, leur historique de modèles commandés et leurs préférences de styles.",
      speechWolof: "Module Clients Couture dafay denc turu client yi, model yi ñu bëgg ak yére yi ñu mas a ñawlo.",
      stepCategory: 'control'
    },
    {
      stepNumber: 20,
      title: '20. Onglet Commandes Mesures',
      description: 'Saisie des mensurations corporelles, attribution des fiches et étapes de confection.',
      targetAcomId: 'nav-tailleur_orders',
      actionToPerform: 'observe',
      speechFr: "Le module Commandes Mesures est le cœur de votre atelier. Il permet de saisir les mensurations complètes (épaules, poitrine, tour de taille, longueur) et de suivre les étapes : coupe, couture, essayage et livraison.",
      speechWolof: "Module Commandes Mesures mooy xolu atelier bi. Fi ngay binde natt yëpp (mbagg, dënn, ndigg, gudday) ak saytu ni ñaw bi di jëme kanam ba keroog ñuy livrer.",
      stepCategory: 'control'
    },
    {
      stepNumber: 21,
      title: '21. Onglet Tissus & Wax',
      description: 'Inventaire des coupons de tissus, métrages de wax, bazins, soies et approvisionnements.',
      targetAcomId: 'nav-tailleur_tissus',
      actionToPerform: 'observe',
      speechFr: "Le module Tissus & Wax suit vos métrages de tissus, coupons de wax, bazins, soies et fournitures apportées par les clients ou issues de votre stock.",
      speechWolof: "Module Tissus & Wax dafay saytu metr yu sër yi, kuponu wax, bazin, soye ak sër yi client yi indi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 22,
      title: '22. Onglet Boutique Prêt-à-Porter',
      description: 'Catalogue et vente directe des créations finies et tenues exposées en showroom.',
      targetAcomId: 'nav-tailleur_boutique',
      actionToPerform: 'observe',
      speechFr: "La Boutique Prêt-à-Porter permet de vendre directement les créations, tenues confectionnées d'avance et accessoires exposés dans votre showroom.",
      speechWolof: "Boutique Prêt-à-Porter dafay tax nga mën a jaay yére yi nga ñaw ba noppi ak accessoire yi nekk ci sa showroom.",
      stepCategory: 'control'
    },
    {
      stepNumber: 23,
      title: '23. Onglet Inspirations & Moodboards',
      description: 'Galerie visuelle de modèles, catalogues de tendances et albums pour conseiller vos clients.',
      targetAcomId: 'nav-tailleur_gallery',
      actionToPerform: 'observe',
      speechFr: "Le catalogue d'inspirations regroupe vos catalogues de modèles, moodboards visuels et albums de créations pour conseiller vos clients lors du choix de leurs tenues.",
      speechWolof: "Wàllu Inspirations dafa dajale photo model yu rafet yi ak galeri créations ngir wone ko client yi bu ñuy tànn model.",
      stepCategory: 'control'
    },
    {
      stepNumber: 24,
      title: '24. Onglet Artisans & Équipe',
      description: 'Gestion de l\'équipe de confection, attribution des coupes et suivi de productivité.',
      targetAcomId: 'nav-tailleur_artisans',
      actionToPerform: 'observe',
      speechFr: "Le module Artisans & Équipe attribue les fiches de confection à vos coupeurs et couturiers, et suit la productivité de chaque membre de l'atelier.",
      speechWolof: "Module Artisans & Équipe dafay jox liggéey bi coupeur yi ak tailleur yi tey saytu liggéey bu nekk.",
      stepCategory: 'control'
    },
    {
      stepNumber: 25,
      title: '25. Onglet Mercerie & Coût de Revient',
      description: 'Calcul précis du prix de revient : fils, doublures, boutons, fermetures et temps passé.',
      targetAcomId: 'nav-tailleur_mercerie',
      actionToPerform: 'observe',
      speechFr: "Ce module calcule le coût de revient précis de chaque modèle en intégrant les fils, fermetures, boutons, doublures et temps de main d'œuvre pour fixer des tarifs rentables.",
      speechWolof: "Module bi dafay natt njagum ñaw bi ci wénji, bouton, doublure ak waxtu liggéey ngir am bénéfice bu baax.",
      stepCategory: 'control'
    },
    {
      stepNumber: 26,
      title: '26. Onglet Clôture de Caisse',
      description: 'Arrêté quotidien de caisse, réconciliation des acomptes et solde des tenues livrées.',
      targetAcomId: 'nav-tailleur_closure',
      actionToPerform: 'observe',
      speechFr: "La Clôture de Caisse permet d'arrêter les comptes de la journée, de contrôler les acomptes encaissés, les soldes reçus à la livraison et les décaissements.",
      speechWolof: "Clôture de Caisse dafay tëj caisse u bés bi, saytu acompte yi dugge, reliquat yi ñu fay bu ñuy jël yére ak dépense yi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 27,
      title: '27. Onglet Comptabilité Atelier',
      description: 'Consolidation financière des recettes de confection, ventes de prêt-à-porter et dépenses.',
      targetAcomId: 'nav-accounting',
      actionToPerform: 'observe',
      speechFr: "Le module Compta consolide le chiffre d'affaires couture, les recettes de prêt-à-porter, les charges d'atelier et calcule votre rentabilité nette.",
      speechWolof: "Module Compta dafay dajale xaalis bi dugge ci ñaw ak jaay, dépense yu atelier bi te wone sa bénéfice net.",
      stepCategory: 'control'
    },
    {
      stepNumber: 28,
      title: '28. Onglet Rapports & Statistiques',
      description: 'Analyses des modèles les plus demandés, des périodes d\'affluence et des bénéfices.',
      targetAcomId: 'nav-reports',
      actionToPerform: 'observe',
      speechFr: "Les Rapports fournissent des graphiques détaillés sur les modèles les plus demandés, la saisonnalité des commandes et les performances financières.",
      speechWolof: "Rapports yi dafay joxe graphique yu lér ci model yi gëna dox, waxtu fête yi ak li atelier bi di gaañe.",
      stepCategory: 'control'
    },
    {
      stepNumber: 29,
      title: '29. Onglet Réglages & Paramètres',
      description: 'Configuration générale de l\'atelier, barèmes de mesures, devises et reçus.',
      targetAcomId: 'nav-settings',
      actionToPerform: 'observe',
      speechFr: "Les Réglages configurent votre atelier : barèmes de mesures par défaut, devises, modèles d'impression de reçus de prise de mesures et préférences de notifications.",
      speechWolof: "Réglages yi dafay tax nga régler barème natt yi, xaalis bi nga ciy liggéeyee, ak ni reçu natt bi di génnee.",
      stepCategory: 'control'
    },
    {
      stepNumber: 30,
      title: '30. Briefing Matinal Intelligent',
      description: 'Recommandations quotidiennes pour orienter les actions prioritaires de confection.',
      targetAcomId: 'dashboard.briefing.card',
      actionToPerform: 'observe',
      speechFr: "Cette zone présente le briefing matinal intelligent généré pour votre atelier : rappels des essayages prévus aujourd'hui, livraisons urgentes et alertes prioritaires.",
      speechWolof: "Wàll wii mooy briefing u suba bi. Dafay wone essayage yu bés bi, yére yi war a livré te leegi ak li gëna am solo.",
      stepCategory: 'info'
    },
    {
      stepNumber: 31,
      title: '31. Moteur de Synchronisation',
      description: 'Statut du moteur de données assurant un fonctionnement continu hors ligne et cloud.',
      targetAcomId: 'dashboard.sync.card',
      actionToPerform: 'observe',
      speechFr: "Le moteur de synchronisation assure la conservation locale de vos fiches clients et mesures, et synchronise automatiquement les données dès qu'une connexion est établie.",
      speechWolof: "Moteur de synchronisation bi dafay denc natt yi ci masin bi te di ko yóbbu ci cloud bi bu amee connexion.",
      stepCategory: 'control'
    },
    {
      stepNumber: 32,
      title: '32. Commandes de Synchronisation',
      description: 'Actions de synchronisation manuelle, sauvegarde locale et restauration de données.',
      targetAcomId: 'dashboard.sync.actions_zone',
      actionToPerform: 'observe',
      speechFr: "Ces boutons permettent de forcer la synchronisation manuelle, d'exporter une sauvegarde complète de votre atelier ou de restaurer vos données.",
      speechWolof: "Bouton yii dafay tax nga mën a forcer synchronisation bi, denc sauvegarde bu sa atelier wala délloosi données yi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 33,
      title: '33. Indicateur Commandes Couture',
      description: 'Montant total et volume des fiches de mesures et commandes en confection.',
      targetAcomId: 'dashboard.couture.orders_card',
      actionToPerform: 'observe',
      speechFr: "Cette carte présente le volume d'affaires total et le nombre de fiches de mesures et commandes en cours de confection dans l'atelier.",
      speechWolof: "Kàrt wii dafay wone limu commande mesures yi ak fiches yi ñuy ñaw léegi ci atelier bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 34,
      title: '34. Indicateur Total Acomptes',
      description: 'Montant des acomptes perçus à la commande et nombre de pièces livrées.',
      targetAcomId: 'dashboard.couture.advances_card',
      actionToPerform: 'observe',
      speechFr: "Cette carte affiche le montant total des acomptes perçus lors de la prise de commande ainsi que le nombre de tenues déjà livrées et soldées.",
      speechWolof: "Kàrt wii dafay wone xaalis bi ñu jël ci acompte ak limu commande yi paré te livrer nañu leen.",
      stepCategory: 'info'
    },
    {
      stepNumber: 35,
      title: '35. Période d\'Analyse des Ventes',
      description: 'Sélecteur de fenêtre temporelle de calcul pour les cartes statistiques.',
      targetAcomId: 'dashboard.stats.period_select',
      actionToPerform: 'observe',
      speechFr: "Ce sélecteur ajuste la période d'analyse des statistiques de l'atelier : aujourd'hui, cette semaine, ce mois ou vue annuelle.",
      speechWolof: "Fi ngay tànne jamono bi nga bëgg xool stat yi : tey, ayibiyé, weer wi wala at mi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 36,
      title: '36. Dépenses d\'Atelier',
      description: 'Cumul des charges d\'exploitation, mercerie, tissus et entretien.',
      targetAcomId: 'dashboard.stats.expenses_card',
      actionToPerform: 'observe',
      speechFr: "Cette carte totalise les dépenses de l'atelier sur la période : achats de mercerie, coupons de tissus, maintenance des machines à coudre et charges.",
      speechWolof: "Kàrt wii dafay dajale dépense yëpp yu atelier bi : jënd wénji, sër, entretien masin yi ak leneen.",
      stepCategory: 'info'
    },
    {
      stepNumber: 37,
      title: '37. Bénéfice Net Consolidé',
      description: 'Résultat net d\'exploitation après déduction des coûts d\'atelier.',
      targetAcomId: 'dashboard.stats.net_profit_card',
      actionToPerform: 'observe',
      speechFr: "Le bénéfice net calcule le résultat net réel de l'atelier après déduction de toutes les dépenses et charges de confection.",
      speechWolof: "Bénéfice net bi mooy li nga gaañe dëgg-dëgg bu ñu waññee dépense yi yëpp ci li dugge ci ñaw bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 38,
      title: '38. Graphique de Performance Financière',
      description: 'Évolution quotidienne comparée des encaissements et des charges.',
      targetAcomId: 'dashboard.charts.performance_card',
      actionToPerform: 'observe',
      speechFr: "Ce graphique illustre l'évolution temporelle de vos encaissements couture et de vos charges d'atelier pour visualiser vos tendances d'activité.",
      speechWolof: "Graphique bi dafay wone ni xaalis bi di soppikoo bés bu nekk ci acompte, reliquat ak dépense.",
      stepCategory: 'info'
    },
    {
      stepNumber: 39,
      title: '39. Synthèse Comptable Atelier',
      description: 'Synthèse des agrégats financiers et ratios de rentabilité textile.',
      targetAcomId: 'dashboard.accounting.summary_card',
      actionToPerform: 'observe',
      speechFr: "Le résumé comptable synthétise vos recettes de confection, marges de prêt-à-porter et soldes restant à encaisser à la livraison.",
      speechWolof: "Résumé comptable bi dafa dajale li dugge ci ñaw, li des ci fay ak marge nette bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 40,
      title: '40. Journal des Activités Récentes',
      description: 'Fil d\'actualité des dernières fiches créées, essayages et livraisons.',
      targetAcomId: 'dashboard.activity.recent_feed',
      actionToPerform: 'observe',
      speechFr: "Ce fil d'actualité retrace les dernières actions enregistrées : nouvelles fiches de mesures créées, acomptes versés, tenues passées à l'essayage ou livrées.",
      speechWolof: "Fil d'activité bi dafay wone jëf yu mujj yi : commande yu bees, acompte yu ñu fay, yére yi ñu essayee wala livré.",
      stepCategory: 'info'
    },
    {
      stepNumber: 41,
      title: '41. Bilan des Flux Financiers',
      description: 'Consolidation récapitulative des mouvements de trésorerie de l\'atelier.',
      targetAcomId: 'dashboard.recap.general_card',
      actionToPerform: 'observe',
      speechFr: "Cette section récapitule les flux monétaires consolidés entre encaissements d'acomptes, règlements finaux et sorties de fonds de l'atelier.",
      speechWolof: "Wàll wii dafay tax nga mën a xool bilan bu mat ci xaalis bi dugge ak bi génne ci atelier bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 42,
      title: '42. Dernières Commandes Couture en Atelier',
      description: 'Tableau des commandes récentes : client, modèle, montant et statut d\'avancement.',
      targetAcomId: 'dashboard.couture.recent_orders_card',
      actionToPerform: 'observe',
      speechFr: "Ce tableau liste les fiches de commande les plus récentes avec le nom du client, le modèle choisi, le montant et l'état d'avancement : prise de mesures, coupe, confection, essayage ou prêt.",
      speechWolof: "Tableau bi dafay wone commande yu mujj yi : turu client bi, model bi mu bëgg, njag li ak fan la ñaw bi tollu ba keroog mu paré.",
      stepCategory: 'info'
    },
    {
      stepNumber: 43,
      title: '43. Widget Flottant Assistant Acom IA',
      description: 'Assistant intelligent disponible 24/7 en Français et Wolof pour guider vos opérations.',
      targetAcomId: 'dashboard.assistant_floating_btn',
      actionToPerform: 'observe',
      speechFr: "L'assistant Acom IA reste à votre disposition 24h sur 24 pour répondre à vos questions, générer des fiches de mesure vocales et vous guider dans vos tâches.",
      speechWolof: "Assistant Acom IA bi mu ngi nekk ci wàllu sufe ngir dimbali la waxtu wu nekk ci wax wala ci bind.",
      stepCategory: 'control'
    },
    {
      stepNumber: 44,
      title: '44. Centre de Notification & Système',
      description: 'Alertes système, rappels de rendez-vous d\'essayage et notifications.',
      targetAcomId: 'header.notifications',
      actionToPerform: 'observe',
      speechFr: "Cette zone regroupe les alertes relatives à la synchronisation, les rappels d'essayages clients et les informations d'intégrité de l'application.",
      speechWolof: "Fi nga koy gise xibaaru système bi ak rappels essayage yi am solo ci sa atelier.",
      stepCategory: 'info'
    },
    {
      stepNumber: 45,
      title: '45. Pied de Page Général',
      description: 'Mentions légales, numéro de version et support technique.',
      targetAcomId: 'dashboard.footer',
      actionToPerform: 'observe',
      speechFr: "Le pied de page contient les mentions légales, la version du logiciel et les liens d'accès direct au support technique Acom.",
      speechWolof: "Pied de page bi dafa am xibaar yi gëna yaatu ak support technique bi ngir dimbali la.",
      stepCategory: 'info'
    },
    {
      stepNumber: 46,
      title: '46. Synthèse & Conclusion du Premier Contact Couture',
      description: 'Félicitations ! Vous maîtrisez l\'organisation générale du tableau de bord Ateliers de Couture.',
      targetAcomId: 'header.logo_and_title',
      actionToPerform: 'observe',
      speechFr: "Félicitations ! Vous venez de parcourir l'ensemble de la page Aperçu du SaaS Ateliers de Couture. Vous maîtrisez désormais l'identité de votre atelier, la barre de navigation, le suivi des fiches mesures, les indicateurs d'acomptes, la santé financière et la synchronisation. Cette page constitue votre tour de contrôle pour piloter sereinement la confection sur mesure et la satisfaction de vos clients.",
      speechWolof: "Jéxal nañu njàngale xët u Aperçu bi ci Ateliers de Couture ! Xam nga léegi ni atelier bi tege, yoonu navigation bi, saytu natt yi ak commande yi, xaalis bi, stat yi ak synchronisation bi. Xët wii mooy sa tour de contrôle ngir sa atelier de couture gëna jëm kanam ci ndam.",
      stepCategory: 'final'
    }
  ]
};

export const PRESSING_DASHBOARD_TUTORIAL: TutorialScenario = {
  id: 'pressing_tutorial_dashboard',
  title: 'Formation Aperçu & Tableau de Bord',
  description: 'Tutoriel guidé interactif pour analyser les indicateurs clés, le chiffre d\'affaires, la synchronisation et le suivi des opérations.',
  saasModule: 'pressing',
  estimatedDurationSec: 360,
  steps: [
    {
      stepNumber: 1,
      title: '1. Bandeau Accès Rapides',
      description: 'Ce bandeau regroupe l\'ensemble des raccourcis essentiels pour naviguer rapidement vers les outils transversaux de votre plateforme.',
      targetAcomId: 'dashboard.quick_access.bar',
      actionToPerform: 'observe',
      speechFr: 'Ce bandeau regroupe l\'ensemble des raccourcis essentiels pour naviguer rapidement vers les outils transversaux de votre plateforme.',
      speechWolof: 'Wàll wii dafa dajale yoon yu gaaw yëpp ngir dem ci jumtukaay yu am solo yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Acom IA Démo',
      description: 'Accédez au simulateur interactif Acom IA Démo pour tester des scénarios métiers et former vos collaborateurs en toute sécurité.',
      targetAcomId: 'dashboard.quick_access.ai_demo_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Accédez au simulateur interactif Acom IA Démo pour tester des scénarios métiers et former vos collaborateurs en toute sécurité.',
      speechWolof: 'Cuubal fi ngir dugg ci simulateur Acom IA Démo ngir jangale wala jàng liggéey bi ci kaaraange.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 3,
      title: '3. AcomZone (Réseau & Partage)',
      description: 'AcomZone permet l\'interconnexion, le partage et la synchronisation collaborative multisite.',
      targetAcomId: 'dashboard.quick_access.acomzone_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'AcomZone permet l\'interconnexion, le partage et la synchronisation collaborative multisite.',
      speechWolof: 'AcomZone dafay tax nga mën a lëkkaloo ak yeneen bérab ak a séddoo données yi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 4,
      title: '4. Version Bureau',
      description: 'Téléchargez et installez la version native Desktop pour une utilisation hors ligne optimale et une rapidité accrue.',
      targetAcomId: 'dashboard.quick_access.desktop_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Téléchargez et installez la version native Desktop pour une utilisation hors ligne optimale et une rapidité accrue.',
      speechWolof: 'Mën nga fi jële version Bureau bi ngir liggéey bu gëna gaaw te mën a dox sax soo amul connexion.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 5,
      title: '5. Documentation & Guides',
      description: 'Consultez la documentation technique, les manuels d\'utilisation et les bonnes pratiques pour maîtriser toutes les fonctionnalités.',
      targetAcomId: 'dashboard.quick_access.docs_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Consultez la documentation technique, les manuels d\'utilisation et les bonnes pratiques pour maîtriser toutes les fonctionnalités.',
      speechWolof: 'Saytul téerey njàngale yi ak documentation bi ngir gëna xam ni application bi di doxee.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 6,
      title: '6. Déconnexion Sécurisée',
      description: 'Ce bouton permet de clore votre session de travail active en toute sécurité à la fin de votre journée.',
      targetAcomId: 'dashboard.quick_access.logout_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Ce bouton permet de clore votre session de travail active en toute sécurité à la fin de votre journée.',
      speechWolof: 'Bouton bi dafay tax nga tëj sa session ci anam bu am kaaraange bu liggéey bi jéxee.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 7,
      title: '7. Briefing Matinal Intelligent',
      description: 'Chaque jour, votre assistant IA analyse l\'activité pour vous présenter un résumé synthétique de vos priorités opérationnelles.',
      targetAcomId: 'dashboard.briefing.card',
      actionToPerform: 'observe',
      speechFr: 'Chaque jour, votre assistant IA analyse l\'activité pour vous présenter un résumé synthétique de vos priorités opérationnelles.',
      speechWolof: 'Bés bu nekk, sa ndimbal IA dafay saytu sa liggéey te jox la xibaar yi gëna am solo ci sa bés.',
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: '8. Message & Recommandations Proactives',
      description: 'Prenez connaissance des conseils d\'optimisation, rappels de livraisons et alertes de rentabilité suggérés par le système.',
      targetAcomId: 'dashboard.briefing.message',
      actionToPerform: 'observe',
      speechFr: 'Prenez connaissance des conseils d\'optimisation, rappels de livraisons et alertes de rentabilité suggérés par le système.',
      speechWolof: 'Jàngal digal yi ak artu yi la masin bi di jox ngir sa liggéey gëna jëm kanam.',
      stepCategory: 'info'
    },
    {
      stepNumber: 9,
      title: '9. Action Prioritaire du Jour',
      description: 'Cliquez sur l\'action recommandée pour accéder directement au module concerné et traiter la priorité immédiatement.',
      targetAcomId: 'dashboard.briefing.action_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Cliquez sur l\'action recommandée pour accéder directement au module concerné et traiter la priorité immédiatement.',
      speechWolof: 'Cuubal ci bouton jëf bi ngir dem dërët ci li gëna am solo te faje ko léegi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 10,
      title: '10. Moteur de Synchronisation',
      description: 'Ce panneau contrôle le fonctionnement Local-First et la connectivité Cloud assurant la continuité d\'activité sans interruption.',
      targetAcomId: 'dashboard.sync.card',
      actionToPerform: 'observe',
      speechFr: 'Ce panneau contrôle le fonctionnement Local-First et la connectivité Cloud assurant la continuité d\'activité sans interruption.',
      speechWolof: 'Wàll wii dafay saytu doxinu Local-First ak lëkkaloo Cloud bi ngir sa liggéey du yem mukk.',
      stepCategory: 'control'
    },
    {
      stepNumber: 11,
      title: '11. Statut du Moteur',
      description: 'Vérifiez si l\'application est en Mode Hybride (Local + Cloud) ou en Mode Local autonome hors connexion.',
      targetAcomId: 'dashboard.sync.status',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez si l\'application est en Mode Hybride ou en Mode Local autonome hors connexion.',
      speechWolof: 'Xoolal ndax application bi mu ngi ci Mode Hybride wala ci Mode Local bu doxee ci biti connexion.',
      stepCategory: 'control'
    },
    {
      stepNumber: 12,
      title: '12. Exporter la Base (.sqlite3)',
      description: 'Cette action permet d\'exporter la base de données locale SQLite pour créer une archive de sauvegarde physique ou l\'utiliser sur Desktop.',
      targetAcomId: 'dashboard.sync.export_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Cette action permet d\'exporter la base de données locale SQLite pour créer une archive de sauvegarde physique ou l\'utiliser sur Desktop.',
      speechWolof: 'Jëf jii dafay génne base de données SQLite bi ngir denc ko kaye sauvegarde wala liggéeye ko ci Desktop.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 13,
      title: '13. Restaurer la Base Locale',
      description: 'Attention : la restauration d\'une base SQLite remplace les données locales existantes par celles du fichier sélectionné.',
      targetAcomId: 'dashboard.sync.restore_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Attention : la restauration d\'une base SQLite remplace les données locales existantes par celles du fichier sélectionné.',
      speechWolof: 'Moytul : délloosi base SQLite dafay fomp données yii te def fa yees yi am ci fichier bi.',
      stepCategory: 'warning'
    },
    {
      stepNumber: 14,
      title: '14. Forcer la Synchronisation',
      description: 'Cliquez ici pour synchroniser immédiatement toutes les transactions locales en attente avec la base Cloud.',
      targetAcomId: 'dashboard.sync.force_sync_btn',
      actionToPerform: 'click',
      isOptional: true,
      speechFr: 'Cliquez ici pour synchroniser immédiatement toutes les transactions locales en attente avec la base Cloud.',
      speechWolof: 'Cuubal fi ngir yónnee léegi jëf yëpp yi des ci masin bi jëm ci Cloud bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 15,
      title: '15. Période des Statistiques de Vente',
      description: 'Sélectionnez le mois d\'analyse souhaité pour recalculer automatiquement l\'ensemble des indicateurs et graphiques du tableau de bord.',
      targetAcomId: 'dashboard.stats.period_select',
      actionToPerform: 'observe',
      speechFr: 'Sélectionnez le mois d\'analyse souhaité pour recalculer automatiquement l\'ensemble des indicateurs et graphiques du tableau de bord.',
      speechWolof: 'Tannal weer wi nga bëgg xool ngir mu soppi lim yi ak graphique yi ci kaye bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 16,
      title: '16. Recettes Pressing',
      description: 'Cette carte affiche le chiffre d\'affaires cumulé provenant des fiches de dépôt de vêtements et des prestations de pressing.',
      targetAcomId: 'dashboard.stats.pressing_revenue_card',
      actionToPerform: 'observe',
      speechFr: 'Cette carte affiche le chiffre d\'affaires cumulé provenant des fiches de dépôt de vêtements et des prestations de pressing.',
      speechWolof: 'Kàrt wii dafay wone xaalis bu bëre bi dugge ci fiches de dépôt ak liggéeyu pressing bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 17,
      title: '17. Ventes Produits (Comptoir)',
      description: 'Consultez ici le montant total des ventes directes de produits d\'entretien, détergents et accessoires au comptoir.',
      targetAcomId: 'dashboard.stats.product_sales_card',
      actionToPerform: 'observe',
      speechFr: 'Consultez ici le montant total des ventes directes de produits d\'entretien, détergents et accessoires au comptoir.',
      speechWolof: 'Xoolal fi xaalis bi génne ci jaayu produit yi ak détergent yi ci comptoir bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 18,
      title: '18. Dépenses Opérationnelles',
      description: 'Suivez le montant global des charges, achats d\'intrants et frais de fonctionnement enregistrés sur la période.',
      targetAcomId: 'dashboard.stats.expenses_card',
      actionToPerform: 'observe',
      speechFr: 'Suivez le montant global des charges, achats d\'intrants et frais de fonctionnement enregistrés sur la période.',
      speechWolof: 'Saytul limu dépense yëpp, jëndu produit ak frais yi nga génne ci weer wi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 19,
      title: '19. Bénéfice Net Réel',
      description: 'Le bénéfice net correspond à la rentabilité réelle de votre activité : Recettes totales déduites des coûts et de l\'ensemble des dépenses.',
      targetAcomId: 'dashboard.stats.net_profit_card',
      actionToPerform: 'observe',
      speechFr: 'Le bénéfice net correspond à la rentabilité réelle de votre activité : Recettes totales déduites des coûts et dépenses.',
      speechWolof: 'Bénéfice net mooy li nga ci gaañe dëgg-dëgg : xaalis bi dugge waññi ci dépense yëpp ak charge yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 20,
      title: '20. Performance Financière (7 Derniers Jours)',
      description: 'Ce graphique interactif compare jour par jour l\'évolution de vos ventes et de vos dépenses pour visualiser la dynamique de votre trésorerie.',
      targetAcomId: 'dashboard.charts.performance_card',
      actionToPerform: 'observe',
      speechFr: 'Ce graphique interactif compare jour par jour l\'évolution de vos ventes et de vos dépenses sur les sept derniers jours.',
      speechWolof: 'Graphique bi dafay nat bés bu nekk li dugge ak li génne ci juróom-ñaari fan yi pàssé.',
      stepCategory: 'info'
    },
    {
      stepNumber: 21,
      title: '21. Résumé Comptable',
      description: 'Retrouvez ici la synthèse comptable mensuelle : total des revenus, charges opérationnelles et calcul de la marge nette consolidée.',
      targetAcomId: 'dashboard.accounting.summary_card',
      actionToPerform: 'observe',
      speechFr: 'Retrouvez ici la synthèse comptable mensuelle : total des revenus, charges opérationnelles et calcul de la marge nette consolidée.',
      speechWolof: 'Fi nga koy gise résumé comptable bi : xaalis bi dugge, dépense yi ak marge nette bi ci weer wi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 22,
      title: '22. Flux d\'Activité Récente',
      description: 'Ce journal chronologique affiche en temps réel les cinq dernières opérations effectuées dans votre établissement.',
      targetAcomId: 'dashboard.activity.recent_feed',
      actionToPerform: 'observe',
      speechFr: 'Ce journal chronologique affiche en temps réel les cinq dernières opérations effectuées dans votre établissement.',
      speechWolof: 'Kaye bi dafay wone ci waxtu wu nekk juróomi jëf yu mujj yi ñu def ci sa liggéey.',
      stepCategory: 'info'
    },
    {
      stepNumber: 23,
      title: '23. Bilan Récapitulatif Général',
      description: 'Ce tableau consolidé compare distinctement l\'activité pressing et la vente de produits, avec détail des montants encaissés et restes à payer.',
      targetAcomId: 'dashboard.recap.general_card',
      actionToPerform: 'observe',
      speechFr: 'Ce tableau consolidé compare distinctement l\'activité pressing et la vente de produits, avec détail des montants encaissés et restes à payer.',
      speechWolof: 'Tableau bi dafay ràññee liggéeyu pressing bi ak jaayu produit yi, di wone li dugge ak li des.',
      stepCategory: 'info'
    },
    {
      stepNumber: 24,
      title: '24. Suivi des Prestations Pressing',
      description: 'Ce registre liste les dernières fiches de réception client avec l\'état de traitement du linge et le statut des paiements.',
      targetAcomId: 'dashboard.pressing.tickets_table',
      actionToPerform: 'observe',
      speechFr: 'Ce registre liste les dernières fiches de réception client avec l\'état de traitement du linge et le statut des paiements.',
      speechWolof: 'Registre bi dafay lim fiches de réception yu mujj yi, ak ndax yêre yi ñu ngi leen di fóot wala pare nañu.',
      stepCategory: 'info'
    },
    {
      stepNumber: 25,
      title: '25. Vente de Produits Directe',
      description: 'Consultez la liste des dernières ventes d\'articles et détergents enregistrées au comptoir avec leurs détails quantitatifs.',
      targetAcomId: 'dashboard.products.sales_table',
      actionToPerform: 'observe',
      speechFr: 'Consultez la liste des dernières ventes d\'articles et détergents enregistrées au comptoir avec leurs détails quantitatifs.',
      speechWolof: 'Xoolal fi limu jaayu produit yu mujj yi ak détergent yi ñu jaay ci comptoir bi.',
      stepCategory: 'final'
    }
  ]
};

export const COMMERCE_POS_TUTORIAL: TutorialScenario = {
  id: 'commerce_tutorial_pos',
  title: 'Formation Caisse POS Management Commerce',
  description: 'Tutoriel complet pas-à-pas pour la gestion des ventes au comptoir, encaissements, modes de paiement et notifications.',
  saasModule: 'stock',
  estimatedDurationSec: 240,
  steps: [
    {
      stepNumber: 1,
      title: '1. Accéder à la Caisse POS',
      description: 'Bienvenue dans la Caisse POS du Management Commerce. Vous pouvez enregistrer rapidement vos ventes et gérer vos encaissements.',
      targetAcomId: 'pos.search_input',
      actionToPerform: 'observe',
      speechFr: 'Bienvenue dans la Caisse POS du Management Commerce. Vous pouvez enregistrer rapidement vos ventes et gérer vos encaissements.',
      speechWolof: 'Bissimilah ci Caisse POS bi. Fi mën nga fi jaay ci anam gu gaaw.',
      stepCategory: 'required'
    },
    {
      stepNumber: 2,
      title: '2. Rechercher un produit',
      description: 'Utilisez la barre de recherche intelligente pour trouver un article par son nom ou son code SKU.',
      targetAcomId: 'pos.search_input',
      actionToPerform: 'type',
      speechFr: 'Utilisez la barre de recherche pour trouver un article par son nom ou son code SKU.',
      speechWolof: 'Tannal bar de recherche bi ngir wër produit bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Scanner un Code-barres',
      description: 'Le bouton Scanner active la caméra pour une identification instantanée du code-barres produit.',
      targetAcomId: 'pos.scanner_btn',
      actionToPerform: 'click',
      speechFr: 'Le bouton Scanner active la caméra pour lire directement le code-barres d\'un produit.',
      speechWolof: 'Bouton Scanner bi dafay ubbi caméra bi ngir scanner code-barres bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 4,
      title: '4. Filtrer par Catégorie',
      description: 'Sélectionnez une catégorie pour restreindre les articles affichés dans la caisse.',
      targetAcomId: 'pos.categories_zone',
      actionToPerform: 'click',
      speechFr: 'Les filtres par catégorie permettent de restreindre la liste aux articles souhaités.',
      speechWolof: 'Filtres catégories yi dañu lay may nga giss yêre yi nga bëgg.',
      stepCategory: 'required'
    },
    {
      stepNumber: 5,
      title: '5. Filtrer par Disponibilité Stock',
      description: 'Filtrez vos articles par niveau : Tout, En Stock, Alerte Stock ou Rupture.',
      targetAcomId: 'pos.stock_filter_zone',
      actionToPerform: 'click',
      speechFr: 'Filtrez vos articles selon leur disponibilité : En Stock, Alerte Stock ou Rupture.',
      speechWolof: 'Sétal yêre yi am ci stock ak yi jeex.',
      stepCategory: 'required'
    },
    {
      stepNumber: 6,
      title: '6. Trier les Produits',
      description: 'Triez les produits par ordre alphabétique, prix croissant ou décroissant, ou niveau de stock.',
      targetAcomId: 'pos.sort_select',
      actionToPerform: 'click',
      speechFr: 'Le sélecteur de tri permet d\'ordonner les produits par nom, prix ou niveau de stock.',
      speechWolof: 'Régleral tri bi ci tur, prix mba niveau stock.',
      stepCategory: 'required'
    },
    {
      stepNumber: 7,
      title: '7. Identifier la Fiche Produit',
      description: 'Visualisez les détails de l\'article : photo, SKU, taille, couleur, prix et niveau de stock restant.',
      targetAcomId: 'pos.product_card',
      actionToPerform: 'observe',
      speechFr: 'Cliquez sur une fiche produit pour l\'ajouter directement au panier d\'encaissement.',
      speechWolof: 'Bëssal ci produit bi ngir yóobbu ko ci panier bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: '8. Ajouter le Produit au Panier',
      description: 'Cliquez sur le bouton + de la carte pour ajouter l\'article dans le panier de vente.',
      targetAcomId: 'pos.add_to_cart_btn',
      actionToPerform: 'click',
      expectedEvent: 'POS_ITEM_ADDED',
      speechFr: 'Vous pouvez également utiliser le bouton plus pour ajouter une unité au panier.',
      speechWolof: 'Mën nga bës bouton plus bi ngir yook produit bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 9,
      title: '9. Visualiser le Panier',
      description: 'Le panier récapitule les articles commandés, les quantités et le montant total calculé.',
      targetAcomId: 'pos.cart_panel',
      actionToPerform: 'observe',
      speechFr: 'Le panier affiche la liste des articles sélectionnés, leurs quantités et les sous-totaux.',
      speechWolof: 'Panier bi dafay wonne li nga tann yepp ak prix yi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 10,
      title: '10. Gestion des Quantités',
      description: 'Incrémentez ou décrémentez les quantités, ou retirez un produit du panier.',
      targetAcomId: 'pos.cart_panel',
      actionToPerform: 'click',
      speechFr: 'Ajustez la quantité avec les boutons plus et moins, ou supprimez un article avec la corbeille.',
      speechWolof: 'Ajusteral quantité bi ak bouton plus ak moins.',
      stepCategory: 'required'
    },
    {
      stepNumber: 11,
      title: '11. Nom du Client',
      description: 'Saisissez le nom du client pour personnaliser le ticket de caisse et la facture.',
      targetAcomId: 'pos.customer_name',
      actionToPerform: 'type',
      speechFr: 'Renseignez optionnellement le nom du client pour personnaliser le ticket et le reçu.',
      speechWolof: 'Bindal touru client bi ngir ticket bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 12,
      title: '12. Téléphone du Client',
      description: 'Indiquez le numéro de téléphone pour l\'envoi direct du reçu par WhatsApp.',
      targetAcomId: 'pos.customer_phone',
      actionToPerform: 'type',
      speechFr: 'Saisissez le numéro de téléphone du client pour lui envoyer son reçu par WhatsApp.',
      speechWolof: 'Bindal numéro téléphone client bi ngir WhatsApp.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 13,
      title: '13. Mode de Paiement — Espèces',
      description: 'Choisissez ESPÈCES pour un règlement direct en numéraire.',
      targetAcomId: 'pos.payment_methods_zone',
      actionToPerform: 'click',
      speechFr: 'Sélectionnez le mode de paiement Espèces pour un règlement au comptant.',
      speechWolof: 'Tannal paiement en Espèces.',
      stepCategory: 'required'
    },
    {
      stepNumber: 14,
      title: '14. Mode de Paiement — Carte',
      description: 'Ou sélectionnez CARTE pour les paiements électroniques et cartes bancaires.',
      targetAcomId: 'pos.payment_methods_zone',
      actionToPerform: 'click',
      speechFr: 'Ou choisissez Carte bancaire pour les règlements par TPE ou carte de crédit.',
      speechWolof: 'Mba tannal Carte bancaire.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 15,
      title: '15. Mode de Paiement — Mobile',
      description: 'Ou sélectionnez MOBILE pour les paiements Wave, Orange Money et Free Money.',
      targetAcomId: 'pos.payment_methods_zone',
      actionToPerform: 'click',
      speechFr: 'Le mode Mobile Money prend en charge Wave, Orange Money et Free Money.',
      speechWolof: 'Mobile Money ngir Wave, Orange Money mba Free Money.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 16,
      title: '16. Option Paiement Partiel (Acompte)',
      description: 'Activez l\'option acompte si le client ne règle qu\'une fraction du total à la commande.',
      targetAcomId: 'pos.partial_payment_toggle',
      actionToPerform: 'click',
      speechFr: 'Activez l\'option Paiement partiel si le client verse un acompte à la commande.',
      speechWolof: 'Taalal acompte su féké dafa fay wall.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 17,
      title: '17. Montant de l\'Acompte',
      description: 'Saisissez le montant versé. Le reste dû est calculé en temps réel.',
      targetAcomId: 'pos.partial_payment_toggle',
      actionToPerform: 'type',
      speechFr: 'Indiquez le montant reçu. Le système calcule automatiquement le reste à payer.',
      speechWolof: 'Bindal acompte bi, système bi dina calculer li ci dess.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 18,
      title: '18. Suivi WhatsApp Manager',
      description: 'Activez la notification instantanée du Manager sur WhatsApp dès validation.',
      targetAcomId: 'pos.whatsapp_manager_toggle',
      actionToPerform: 'click',
      speechFr: 'Le suivi WhatsApp Manager permet d\'alerter instantanément la direction lors de chaque vente.',
      speechWolof: 'WhatsApp Manager dafay yëgle vente bi ci direction bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 19,
      title: '19. Suivi WhatsApp Client',
      description: 'Activez l\'envoi du reçu numérique interactif par message WhatsApp au client.',
      targetAcomId: 'pos.whatsapp_client_toggle',
      actionToPerform: 'click',
      speechFr: 'L\'option WhatsApp Client génère un reçu numérique interactif envoyé directement au client.',
      speechWolof: 'WhatsApp Client dafay yónné reçu bi ci client bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 20,
      title: '20. Suivi Email Manager',
      description: 'Transmet le journal de vente et le détail de transaction au gérant par courriel.',
      targetAcomId: 'pos.messaging_zone',
      actionToPerform: 'click',
      speechFr: 'Le suivi par email transmet le rapport d\'encaissement et le journal de caisse.',
      speechWolof: 'Email Manager dafay yónné rapport de caisse bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 21,
      title: '21. Vérification du Total',
      description: 'Vérifiez le montant total à régler en devise de l\'établissement.',
      targetAcomId: 'pos.total_amount_zone',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez le montant total de la commande avant d\'enregistrer l\'opération.',
      speechWolof: 'Xoolal total bi bala nga valider.',
      stepCategory: 'required'
    },
    {
      stepNumber: 22,
      title: '22. Valider la Vente',
      description: 'Enregistrez la transaction, déstockez les articles et générez les reçus.',
      targetAcomId: 'pos.submit_checkout_btn',
      actionToPerform: 'click',
      expectedEvent: 'POS_SALE_COMPLETED',
      speechFr: 'Cliquez sur Valider la vente pour déstocker les articles et enregistrer l\'encaissement.',
      speechWolof: 'Bëssal Valider la vente ngir wàcc stock bi ak jël xaalis bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 23,
      title: '23. Vente Réussie',
      description: 'Confirmation d\'enregistrement en base de données locale (Dexie) et cloud (Firestore).',
      targetAcomId: 'pos.sale_success_modal',
      actionToPerform: 'observe',
      speechFr: 'Félicitations ! La vente est validée et déstockée en base locale et cloud.',
      speechWolof: 'Vente bi passer na ci succès ci base bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 24,
      title: '24. Impression Ticket POS & Facture A4',
      description: 'Options d\'impression directe ou de téléchargement PDF au format Ticket 80mm ou Facture A4.',
      targetAcomId: 'pos.sale_success_modal',
      actionToPerform: 'click',
      speechFr: 'Vous pouvez imprimer directement le ticket thermique ou générer une facture A4 au format PDF.',
      speechWolof: 'Mën nga imprimer ticket thermique bi mba facture A4 PDF bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 25,
      title: '25. Détails de Suivi & WhatsApp',
      description: 'Consultez les statuts de synchronisation et déclenchez l\'ouverture de WhatsApp.',
      targetAcomId: 'pos.modal_tracking_details',
      actionToPerform: 'observe',
      speechFr: 'Consultez les détails du suivi électronique et le lien d\'envoi WhatsApp généré.',
      speechWolof: 'Xoolal détails du suivi ak lien WhatsApp bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 26,
      title: '26. Nouveau Client',
      description: 'Réinitialisez la caisse pour accueillir le client suivant.',
      targetAcomId: 'pos.new_client_btn',
      actionToPerform: 'click',
      speechFr: 'Cliquez sur Nouveau Client pour réinitialiser la caisse et démarrer une nouvelle transaction.',
      speechWolof: 'Bëssal Nouveau Client ngir tambali vente bu yees.',
      stepCategory: 'required'
    }
  ]
};

export const COMMERCE_STOCK_TUTORIAL: TutorialScenario = {
  id: 'commerce_stock_tutorial',
  title: 'Gestion de Stock & Inventaire — Parcours Exhaussif (Commerce)',
  description: 'Tutoriel exhaustif étape par étape couvrant 100% des éléments de la page Stock : KPIs, filtres, actions, catalogue, santé du stock et journal des mouvements.',
  saasModule: 'stock',
  estimatedDurationSec: 360,
  steps: [
    {
      stepNumber: 1,
      title: '1. Présentation — En-tête de la Page Stock',
      description: 'Découvrez l\'interface centrale de gestion des stocks, conçue pour vous offrir une visibilité instantanée sur l\'ensemble de votre inventaire.',
      targetAcomId: 'stock.page_header',
      actionToPerform: 'observe',
      speechFr: 'Première étape : Bienvenue sur la page Stock. Cet en-tête synthétise l\'état global de votre magasin.',
      speechWolof: 'Bennel paas : Dalal ak jamm ci page Stock bi. Fi nga mën a xoolé fassonu stock bi yëpp.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. KPI — Total Articles en Stock',
      description: 'Consultez le nombre total de références enregistrées ainsi que le volume cumulé d\'unités physiques disponibles.',
      targetAcomId: 'stock.kpi.total_articles',
      actionToPerform: 'observe',
      speechFr: 'Deuxième étape : Observez le nombre total d\'articles enregistrés et le volume d\'unités physiques.',
      speechWolof: 'Ñarel paas : Xoolal limu produit yi ak quantité unité yi nekk ci stock bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. KPI — Valorisation Achat (CUMP)',
      description: 'Affiche le coût d\'acquisition total de votre stock calculé selon le Coût Unitaire Moyen Pondéré (CUMP).',
      targetAcomId: 'stock.kpi.val_achat',
      actionToPerform: 'observe',
      speechFr: 'Troisième étape : Consultez la valorisation d\'achat totale de votre stock basée sur le CUMP.',
      speechWolof: 'Ñattel paas : Setal valorisation d\'achat bu CUMP bi ci sa stock.',
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. KPI — Valorisation Vente',
      description: 'Estime le chiffre d\'affaires potentiel que générera la vente intégrale de vos articles en stock.',
      targetAcomId: 'stock.kpi.val_vente',
      actionToPerform: 'observe',
      speechFr: 'Quatrième étape : Visualisez la valorisation de vente estimée si tous vos produits étaient vendus.',
      speechWolof: 'Ñentel paas : Setal valorisation de vente bu estimé bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: '5. KPI — Marge Théorique (%)',
      description: 'Indique le pourcentage moyen de marge bénéficiaire brute calculé sur la valeur brute de votre catalogue.',
      targetAcomId: 'stock.kpi.marge_theorique',
      actionToPerform: 'observe',
      speechFr: 'Cinquième étape : Observez le taux de marge théorique global généré par vos produits.',
      speechWolof: 'Juróomél paas : Xoolal taux de marge théorique bi ci sa catalogue.',
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: '6. KPI — Points d\'Alerte (Stock Bas)',
      description: 'Surveillez le nombre de références ayant atteint ou franchi leur seuil minimal de réapprovisionnement.',
      targetAcomId: 'stock.kpi.points_alerte',
      actionToPerform: 'observe',
      speechFr: 'Sixième étape : Contrôlez le nombre de produits en alerte de stock bas nécessitant un réassort.',
      speechWolof: 'Juróom-bennél paas : Setal limu article yi am alerte stock bas.',
      stepCategory: 'control'
    },
    {
      stepNumber: 7,
      title: '7. KPI — Articles Épuisés (Ruptures)',
      description: 'Affiche le nombre d\'articles tombés à zéro unité, représentant un risque direct de manque à gagner.',
      targetAcomId: 'stock.kpi.articles_epuises',
      actionToPerform: 'observe',
      speechFr: 'Septième étape : Vérifiez le nombre de ruptures totales d\'articles épuisés.',
      speechWolof: 'Juróom-ñaarél paas : Setal produit yi épuisé yëpp.',
      stepCategory: 'control'
    },
    {
      stepNumber: 8,
      title: '8. Recherche & Code-Barres SKU',
      description: 'Saisissez le désignation d\'un produit ou scannez son code-barres SKU pour le retrouver en temps réel.',
      targetAcomId: 'stock.search_input',
      actionToPerform: 'type',
      inputValue: 'Chemise',
      speechFr: 'Huitième étape : Saisissez un mot-clé ou scannez un code SKU pour filtrer les produits.',
      speechWolof: 'Juróom-ñattél paas : Bindal tour bu produit bi wala scannel code SKU bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 9,
      title: '9. Action — Scanner Caméra',
      description: 'Ouvre le lecteur optique pour scanner directement le code-barres d\'un produit physique via votre caméra.',
      targetAcomId: 'stock.btn.scanner',
      actionToPerform: 'click',
      speechFr: 'Neuvième étape : Cliquez sur le scanner pour utiliser la caméra et lire un code-barres.',
      speechWolof: 'Juróom-ñentél paas : Bëssal scanner bi ngir lire code-barres bi ci caméra.',
      stepCategory: 'required'
    },
    {
      stepNumber: 10,
      title: '10. Action — Nouveau Produit',
      description: 'Ouvre le formulaire de création d\'un nouvel article dans votre catalogue (nom, prix, SKU, stock initial).',
      targetAcomId: 'stock.btn.new_product',
      actionToPerform: 'click',
      speechFr: 'Dixième étape : Le bouton Nouveau permet d\'enregistrer une nouvelle référence dans le catalogue.',
      speechWolof: 'Fukkel paas : Bëssal Nouveau ngir yokk produit bu yess ci catalogue bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 11,
      title: '11. Action — Ajustement Manuel de Stock',
      description: 'Saisissez une correction de stock exceptionnelle suite à un vol, une perte, une casse ou une péremption.',
      targetAcomId: 'stock.btn.adjust_stock',
      actionToPerform: 'click',
      speechFr: 'Onzième étape : Utilisez Ajuster pour régulariser les écarts physiques ou déclarer une perte.',
      speechWolof: 'Fukk ak bennél paas : Bëssal Ajuster ngir régulariser quantité bi bu amé perte.',
      stepCategory: 'required'
    },
    {
      stepNumber: 12,
      title: '12. Action — Fiche de Comptage Physique',
      description: 'Générez un document d\'inventaire vierge à imprimer pour effectuer le comptage manuel dans les rayons.',
      targetAcomId: 'stock.btn.inventory_sheet',
      actionToPerform: 'click',
      speechFr: 'Douzième étape (facultative) : Cliquez sur Fiche Comptage pour imprimer la feuille d\'inventaire physique.',
      speechWolof: 'Fukk ak ñaarél paas : Mën nga imprimer fiche de comptage ngir inventaire bi.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 13,
      title: '13. Action — Réassort Bon de Commande',
      description: 'Préparez un Bon de Commande Fournisseur automatisé pour réapprovisionner les articles en rupture.',
      targetAcomId: 'stock.btn.purchase_order',
      actionToPerform: 'click',
      speechFr: 'Treizième étape (facultative) : Le bouton Réassort BC prépare une commande d\'achat fournisseur.',
      speechWolof: 'Fukk ak ñattél paas : Bëssal Réassort BC ngir préparer commande fournisseur bi.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 14,
      title: '14. Action — Exporter CSV Stock',
      description: 'Téléchargez l\'état instantané de votre inventaire complet au format tableur CSV Excel.',
      targetAcomId: 'stock.btn.export_csv',
      actionToPerform: 'click',
      speechFr: 'Quatorzième étape : Cliquez sur CSV pour exporter l\'intégralité de l\'état de stock.',
      speechWolof: 'Fukk ak ñentél paas : Bëssal CSV ngir télécharger état bu stock bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 15,
      title: '15. Filtres — Zone des Niveaux de Stock',
      description: 'Découvrez la barre de filtres rapides permettant d\'isoler la catégorie de santé des articles.',
      targetAcomId: 'stock.filters_zone',
      actionToPerform: 'observe',
      speechFr: 'Quinzième étape : Observez les filtres rapides de niveau de stock.',
      speechWolof: 'Fukk ak juróomél paas : Setal filtres rapides yi ci kanamu tableau bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 16,
      title: '16. Filtre — Tout le Stock',
      description: 'Affiche l\'intégralité du catalogue d\'articles sans aucun filtre de quantité.',
      targetAcomId: 'stock.filter.all',
      actionToPerform: 'click',
      speechFr: 'Seizième étape : Cliquez sur Tout le Stock pour voir l\'ensemble des références.',
      speechWolof: 'Fukk ak juróom-bennél paas : Bëssal Tout le Stock ngir xool produit yëpp.',
      stepCategory: 'control'
    },
    {
      stepNumber: 17,
      title: '17. Filtre — Stock Bas (Alertes)',
      description: 'Isole uniquement les produits dont la quantité est supérieure à zéro mais sous le seuil d\'alerte.',
      targetAcomId: 'stock.filter.low',
      actionToPerform: 'click',
      speechFr: 'Dix-septième étape : Le filtre Stock Bas affiche les articles proches de la rupture.',
      speechWolof: 'Fukk ak juróom-ñaarél paas : Bëssal Stock Bas ngir xool article yi néww ci stock bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 18,
      title: '18. Filtre — Épuisés (Ruptures)',
      description: 'Filtre instantanément la liste pour ne présenter que les articles strictement tombés à zéro.',
      targetAcomId: 'stock.filter.out',
      actionToPerform: 'click',
      speechFr: 'Dix-huitième étape : Le filtre Épuisés isole les produits en rupture totale.',
      speechWolof: 'Fukk ak juróom-ñattél paas : Bëssal Épuisés ngir xool produit yi jeex yëpp.',
      stepCategory: 'control'
    },
    {
      stepNumber: 19,
      title: '19. Catalogue — Tableau des Produits',
      description: 'Examinez la structure globale de votre grille d\'articles détaillant chaque référence en magasin.',
      targetAcomId: 'stock.products_table',
      actionToPerform: 'observe',
      speechFr: 'Dix-neuvième étape : Voici le tableau principal récapitulant vos articles en stock.',
      speechWolof: 'Fukk ak juróom-ñentél paas : Nii mooy tableau principal bu produit yi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 20,
      title: '20. Colonne — Article (SKU & Nom)',
      description: 'Présente le nom du produit, son code SKU, sa catégorie et sa miniature d\'illustration.',
      targetAcomId: 'stock.col.article',
      actionToPerform: 'observe',
      speechFr: 'Vingtième étape : La colonne Article présente le nom, la catégorie et le code SKU.',
      speechWolof: 'Ñar-fukkel paas : Colonne Article bi dafay wane tour bi ak SKU bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 21,
      title: '21. Colonne — Prix & Valeur',
      description: 'Indique le prix de vente unitaire hors/avec taxes ainsi que la valeur totale du lot en rayon.',
      targetAcomId: 'stock.col.prix_valeur',
      actionToPerform: 'observe',
      speechFr: 'Vingt et unième étape : Observez les tarifs de vente unitaires et la valeur globale.',
      speechWolof: 'Ñar-fukk ak bennél paas : Setal prix unitaire bi ak valeur totale bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 22,
      title: '22. Colonne — État du Stock',
      description: 'Affiche la quantité disponible sous forme de badge de couleur (Vert = OK, Orange = Bas, Rouge = Rupture).',
      targetAcomId: 'stock.col.etat_stock',
      actionToPerform: 'observe',
      speechFr: 'Vingt-deuxième étape : Le badge d\'état indique visuellement le niveau d\'urgence du stock.',
      speechWolof: 'Ñar-fukk ak ñaarél paas : Badge d\'état bi dafay wane bu fekké stock bi baax na.',
      stepCategory: 'control'
    },
    {
      stepNumber: 23,
      title: '23. Ligne — Réapprovisionnement Rapide (+)',
      description: 'Permet d\'ajouter directement des unités à un produit spécifique sans passer par un formulaire complexe.',
      targetAcomId: 'stock.btn.add_quick_qty',
      actionToPerform: 'click',
      speechFr: 'Vingt-troisième étape : Cliquez sur le bouton Plus pour un réapprovisionnement rapide d\'un article.',
      speechWolof: 'Ñar-fukk ak ñattél paas : Bëssal bouton Plus bi ngir yokk quantité bi nimu gane yombé.',
      stepCategory: 'required'
    },
    {
      stepNumber: 24,
      title: '24. Ligne — Modification d\'Article',
      description: 'Ouvre la modal de modification pour éditer le tarif, la catégorie ou la photo du produit ciblé.',
      targetAcomId: 'stock.btn.edit_product',
      actionToPerform: 'click',
      speechFr: 'Vingt-quatrième étape (facultative) : Utilisez ce bouton pour corriger la fiche d\'un produit.',
      speechWolof: 'Ñar-fukk ak ñentél paas : Bëssal Modifier ngir soppi fiche bu article bi.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 25,
      title: '25. Ligne — Suppression d\'Article',
      description: 'Permet d\'archiver ou supprimer définitivement une référence qui n\'est plus commercialisée.',
      targetAcomId: 'stock.btn.delete_product',
      actionToPerform: 'click',
      speechFr: 'Vingt-cinquième étape (facultative) : Ce bouton permet de supprimer un article du catalogue.',
      speechWolof: 'Ñar-fukk ak juróomél paas : Bëssal Supprimer bu fekké bëgg nga dindi produit bi.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 26,
      title: '26. Analytique — Carte Santé du Stock',
      description: 'Explorez le volet d\'analyse latérale synthétisant la santé financière et opérationnelle du stock.',
      targetAcomId: 'stock.kpi.sante_stock',
      actionToPerform: 'observe',
      speechFr: 'Vingt-sixième étape : Consultez la carte Santé du Stock sur le panneau latéral droit.',
      speechWolof: 'Ñar-fukk ak juróom-bennél paas : Xoolal carte Santé du Stock ci panneau latéral bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 27,
      title: '27. Santé — Taux de Disponibilité',
      description: 'Mesure le pourcentage de vos références d\'articles ayant au moins 1 unité disponible à la vente.',
      targetAcomId: 'stock.health.disponibilite',
      actionToPerform: 'observe',
      speechFr: 'Vingt-septième étape : Contrôlez le taux de disponibilité global de vos références.',
      speechWolof: 'Ñar-fukk ak juróom-ñaarél paas : Setal taux de disponibilité bu produit yi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 28,
      title: '28. Santé — Rentabilité Théorique',
      description: 'Affiche l\'estimation de marge nette pondérée dégagée par le stock actuellement conservé.',
      targetAcomId: 'stock.health.location_theorique',
      actionToPerform: 'observe',
      speechFr: 'Vingt-huitième étape : Observez le niveau de rentabilité théorique généré par le stock.',
      speechWolof: 'Ñar-fukk ak juróom-ñattél paas : Setal rentabilité théorique bu stock bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 29,
      title: '29. Santé — Taux de Rotation',
      description: 'Évalue la rapidité avec laquelle votre stock est vendu puis renouvelé sur une période donnée.',
      targetAcomId: 'stock.health.rotation',
      actionToPerform: 'observe',
      speechFr: 'Vingt-neuvième étape : Suivez le taux de rotation de votre inventaire.',
      speechWolof: 'Ñar-fukk ak juróom-ñentél paas : Xoolal taux de rotation bu stock bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 30,
      title: '30. Santé — Synthese Articles Bas',
      description: 'Rappelle le total d\'articles en alerte sous le volet Santé du Stock.',
      targetAcomId: 'stock.health.articles_bas',
      actionToPerform: 'observe',
      speechFr: 'Trentième étape : Vérifiez la synthèse des articles en alerte de niveau bas.',
      speechWolof: 'Fanweerél paas : Setal limu article yi am alerte stock bas.',
      stepCategory: 'control'
    },
    {
      stepNumber: 31,
      title: '31. Santé — Synthèse Ruptures',
      description: 'Affiche le nombre total de ruptures nettes dans le bloc d\'analyse.',
      targetAcomId: 'stock.health.ruptures',
      actionToPerform: 'observe',
      speechFr: 'Trente et unième étape : Contrôlez le nombre total de ruptures fermes.',
      speechWolof: 'Fanweer ak bennél paas : Setal limu produit yi am rupture ferme.',
      stepCategory: 'control'
    },
    {
      stepNumber: 32,
      title: '32. Volet — Flux Récents',
      description: 'Consultez les derniers mouvements de stock enregistrés en temps réel avec leur heure précise.',
      targetAcomId: 'stock.recent_flows',
      actionToPerform: 'observe',
      speechFr: 'Trente-deuxième étape : Le bloc Flux Récents affiche les derniers mouvements enregistrés.',
      speechWolof: 'Fanweer ak ñaarél paas : Bloc Flux Récents bi dafay wane mouvements yi mucc yag.',
      stepCategory: 'info'
    },
    {
      stepNumber: 33,
      title: '33. Action — Voir Tout l\'Historique',
      description: 'Bouton de raccourci permettant d\'effectuer un défilement fluide vers le Journal des Mouvements.',
      targetAcomId: 'stock.btn.view_all_history',
      actionToPerform: 'click',
      speechFr: 'Trente-troisième étape : Cliquez sur Voir tout l\'historique pour accéder au journal complet.',
      speechWolof: 'Fanweer ak ñattél paas : Bëssal Voir tout l\'historique ngir dem ci journal bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 34,
      title: '34. Journal — Section Mouvements',
      description: 'Accédez à la section inférieure dédiée à la traçabilité intégrale de toutes les opérations de stock.',
      targetAcomId: 'stock.movements_journal',
      actionToPerform: 'observe',
      speechFr: 'Trente-quatrième étape : Voici la section du Journal des Mouvements.',
      speechWolof: 'Fanweer ak ñentél paas : Nii mooy journal des mouvements de stock bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 35,
      title: '35. Journal — Exportation CSV',
      description: 'Téléchargez l\'historique chronologique complet des mouvements de stock sous format CSV Excel.',
      targetAcomId: 'stock.btn.export_journal_csv',
      actionToPerform: 'click',
      speechFr: 'Trente-cinquième étape : Exportez l\'ensemble de l\'historique des mouvements en format CSV.',
      speechWolof: 'Fanweer ak juróomél paas : Bëssal Exporter CSV Journal ngir télécharger journal bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 36,
      title: '36. Journal — Filtre Type de Flux',
      description: 'Sélectionnez le type d\'opération à analyser : Entrées, Sorties, Ventes Caisse ou Ajustements.',
      targetAcomId: 'stock.filter.movement_type',
      actionToPerform: 'type',
      inputValue: 'in',
      speechFr: 'Trente-sixième étape : Filtrez l\'historique selon le type de mouvement (Entrées, Sorties, Ventes).',
      speechWolof: 'Fanweer ak juróom-bennél paas : Tannal type bu mouvement bi (Entrée, Sortie, Vente).',
      stepCategory: 'control'
    },
    {
      stepNumber: 37,
      title: '37. Journal — Filtre par Article',
      description: 'Isolez les mouvements historiques liés spécifiquement à une seule référence produit.',
      targetAcomId: 'stock.filter.movement_article',
      actionToPerform: 'type',
      inputValue: 'all',
      speechFr: 'Trente-septième étape : Sélectionnez un article spécifique pour suivre son historique dédié.',
      speechWolof: 'Fanweer ak juróom-ñaarél paas : Tannal benn produit ngir xool historique am.',
      stepCategory: 'control'
    },
    {
      stepNumber: 38,
      title: '38. Journal — Filtre Période Temporelle',
      description: 'Choisissez la fenêtre d\'analyse : Aujourd\'hui, 7 derniers jours, 30 jours ou toutes les dates.',
      targetAcomId: 'stock.filter.movement_period',
      actionToPerform: 'type',
      inputValue: '7days',
      speechFr: 'Trente-huitième étape : Définissez la période temporelle d\'analyse des mouvements.',
      speechWolof: 'Fanweer ak juróom-ñattél paas : Tannal période bi nga bëgg a xool.',
      stepCategory: 'control'
    },
    {
      stepNumber: 39,
      title: '39. Journal — Colonne Horodatage',
      description: 'Affiche la date exacte et l\'heure précise à laquelle chaque mouvement a été validé.',
      targetAcomId: 'stock.col.journal_timestamp',
      actionToPerform: 'observe',
      speechFr: 'Trente-neuvième étape : La colonne Horodatage garantit une traçabilité temporelle absolue.',
      speechWolof: 'Fanweer ak juróom-ñentél paas : Colonne Horodatage bi dafay wane date ak heure bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 40,
      title: '40. Journal — Colonne Article Impacté',
      description: 'Indique précisément quel produit a subi une variation de stock.',
      targetAcomId: 'stock.col.journal_article',
      actionToPerform: 'observe',
      speechFr: 'Quarantième étape : Vérifiez le nom et la référence de l\'article impacté.',
      speechWolof: 'Ñar-fukkel paas : Setal tour bu article bi am variation ci stock bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 41,
      title: '41. Journal — Colonne Flux & Quantité',
      description: 'Indique le sens de la variation (+ pour les entrées en vert, - pour les sorties en rouge) et le volume.',
      targetAcomId: 'stock.col.journal_flux',
      actionToPerform: 'observe',
      speechFr: 'Quarante et unième étape : Observez la quantité modifiée et le sens de la variation.',
      speechWolof: 'Fukk ak benn ci fanweer paas : Setal quantité bi ak sens bu variation bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 42,
      title: '42. Journal — Colonne Justification / Motif',
      description: 'Précise la raison de l\'opération : Vente caisse, Réassort bon de commande, Casse ou Ajustement.',
      targetAcomId: 'stock.col.journal_reason',
      actionToPerform: 'observe',
      speechFr: 'Quarante-deuxième étape : Contrôlez le motif de la variation enregistrée par le système.',
      speechWolof: 'Fukk ak ñaar ci fanweer paas : Setal motif bu variation bi (Vente, Casse, Réassort).',
      stepCategory: 'info'
    },
    {
      stepNumber: 43,
      title: '43. Finalisation — Colonne Opérateur / Administrateur',
      description: 'Identifie l\'utilisateur ou l\'administrateur ayant exécuté ou validé l\'opération.',
      targetAcomId: 'stock.col.journal_operator',
      actionToPerform: 'observe',
      speechFr: 'Quarante-troisième étape : La colonne Opérateur identifie qui a réalisé la modification. Vous maîtrisez désormais 100% du module Stock !',
      speechWolof: 'Mujjél paas : Colonne Opérateur bi dafay wane nit ki déf modification bi. Légui xam nga 100% bu module Stock bi !',
      stepCategory: 'final'
    }
  ]
};

export const COMMERCE_PRODUCT_DETAILS_TUTORIAL: TutorialScenario = {
  id: 'commerce_product_details_tutorial',
  title: 'Détails du Produit — Configuration Technique',
  description: 'Présentation interactive et guidée de la fenêtre de création et configuration d\'un article du stock.',
  saasModule: 'stock',
  estimatedDurationSec: 150,
  steps: [
    {
      stepNumber: 1,
      title: '1. Fenêtre — Détails du Produit',
      description: 'Cette fenêtre sert à créer ou modifier la fiche technique d\'un article avant son intégration dans le stock.',
      targetAcomId: 'stock.product_modal.header',
      actionToPerform: 'observe',
      speechFr: 'Cette fenêtre sert à créer ou modifier la fiche technique d\'un article avant son intégration dans le stock.',
      speechWolof: 'Burewo bi dafay may nga créér ak configurer produit bu yess bala nga koy yokk ci stock bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Champ — Nom du Produit',
      description: 'Saisissez le nom commercial ou la désignation précise de l\'article (ex: Laptop Pro 15 ou Chemise Blanche Slim).',
      targetAcomId: 'stock.product_modal.name',
      actionToPerform: 'type',
      inputValue: 'Laptop Pro 15',
      speechFr: 'Saisissez la désignation commerciale de l\'article, par exemple Laptop Pro 15.',
      speechWolof: 'Bindal tour bu commercial bu article bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Champ — SKU / Code Interne',
      description: 'Identifiant unique de l\'article. Vous pouvez saisir une référence manuellement ou utiliser le scanner de code-barres.',
      targetAcomId: 'stock.product_modal.sku',
      actionToPerform: 'type',
      inputValue: 'LP-15-2024',
      speechFr: 'Saisissez une référence SKU unique ou cliquez sur le bouton du scanner pour lire directement un code-barres.',
      speechWolof: 'SKU / Code interne : Bindal référence bi wala bëssal scanner bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 4,
      title: '4. Zone — Image (URL ou Fichier)',
      description: 'Renseignez l\'URL d\'une photo hébergée ou cliquez sur "Ou uploader une image" pour importer un fichier depuis votre appareil.',
      targetAcomId: 'stock.product_modal.image',
      actionToPerform: 'observe',
      speechFr: 'Vous pouvez fournir une URL d\'image ou cliquer sur "Ou uploader une image" pour charger une photo depuis votre appareil.',
      speechWolof: 'Nat bu produit bi : Mën nga def URL wala nga uploader nat bi ci sa appareil.',
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: '5. Sélecteurs — Catégorie & Sous-catégorie',
      description: 'Classez votre article dans une famille existante ou choisissez "+ Ajouter une nouvelle" pour créer une catégorie sur-le-champ.',
      targetAcomId: 'stock.product_modal.category',
      actionToPerform: 'type',
      speechFr: 'Sélectionnez la catégorie et sous-catégorie de l\'article, ou créez-en une nouvelle immédiatement.',
      speechWolof: 'Catégorie ak Sous-catégorie : Tannal catégorie bi ngir organiser produit yi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 6,
      title: '6. Champ — Coût Intrant par Unité (Prix d\'Achat)',
      description: 'Saisissez le prix d\'acquisition unitaire de l\'article dans votre monnaie commerciale pour le calcul du CUMP.',
      targetAcomId: 'stock.product_modal.cost_price',
      actionToPerform: 'type',
      inputValue: '350000',
      speechFr: 'Indiquez le coût d\'achat unitaire pour permettre le calcul de la valorisation de votre stock au CUMP.',
      speechWolof: 'Coût intrant : Bindal prix d\'achat bu unitaire bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 7,
      title: '7. Champ — Prix de Vente',
      description: 'Saisissez le tarif TTC auquel le produit sera vendu au comptoir ou à la caisse.',
      targetAcomId: 'stock.product_modal.price',
      actionToPerform: 'type',
      inputValue: '450000',
      speechFr: 'Fixez le prix de vente public appliqué lors des encaissements.',
      speechWolof: 'Prix de vente : Bindal prix bi nga koy jaayé.',
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: '8. Champ — Stock Actuel (Quantité Initiale)',
      description: 'Indiquez la quantité physique initiale immédiatement disponible en rayon ou en réserve.',
      targetAcomId: 'stock.product_modal.stock',
      actionToPerform: 'type',
      inputValue: '10',
      speechFr: 'Indiquez la quantité d\'unités physiques disponibles en stock.',
      speechWolof: 'Stock actuel : Bindal limu unité yi nekk ci magasin bi légui.',
      stepCategory: 'required'
    },
    {
      stepNumber: 9,
      title: '9. Champ — Seuil d\'Alerte',
      description: 'Définissez la quantité minimale sous laquelle l\'article sera signalé en alerte de réapprovisionnement.',
      targetAcomId: 'stock.product_modal.alert_level',
      actionToPerform: 'type',
      inputValue: '5',
      speechFr: 'Définissez la limite de stock bas pour déclencher une alerte visuelle automatique.',
      speechWolof: 'Seuil d\'alerte : Defal limu alerte bi ngir xam kañ nga wara réapprovisionner.',
      stepCategory: 'required'
    },
    {
      stepNumber: 10,
      title: '10. Champ — Tailles (Optionnel)',
      description: 'Renseignez les déclinaisons de tailles associées à l\'article le cas échéant (ex: S, M, L, XL ou 38, 39, 40).',
      targetAcomId: 'stock.product_modal.sizes',
      actionToPerform: 'type',
      speechFr: 'Saisissez les différentes déclinaisons de tailles si nécessaire.',
      speechWolof: 'Tailles (optionnel) : Bindal taille yi bu amé variantes.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 11,
      title: '11. Champ — Couleur (Optionnel)',
      description: 'Spécifiez les nuances de couleurs disponibles pour cette référence (ex: Noir, Blanc, Bleu).',
      targetAcomId: 'stock.product_modal.color',
      actionToPerform: 'type',
      speechFr: 'Précisez les variantes de couleurs proposées.',
      speechWolof: 'Couleur (optionnel) : Bindal couleur yi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 12,
      title: '12. Actions — Annuler & Enregistrer',
      description: 'Le bouton "Annuler" ferme la fenêtre sans modifier le stock. "Enregistrer le produit" enregistre la fiche.',
      targetAcomId: 'stock.product_modal.actions',
      actionToPerform: 'observe',
      speechFr: 'Le bouton Annuler ferme la fenêtre sans modification, tandis qu\'Enregistrer le produit valide définitivement la fiche dans le catalogue.',
      speechWolof: 'Actions : Annuler dafay tëj burewo bi, Enregistrer dafay denc produit bi ci stock bi.',
      stepCategory: 'final'
    }
  ]
};

export const COMMERCE_STOCK_ADJUSTMENT_TUTORIAL: TutorialScenario = {
  id: 'commerce_stock_adjustment_tutorial',
  title: 'Ajustement Manuel du Stock — Correction des Écarts',
  description: 'Présentation interactive et guidée de la fenêtre d\'ajustement manuel pour régulariser les entrées, sorties, casses et pertes.',
  saasModule: 'stock',
  estimatedDurationSec: 120,
  steps: [
    {
      stepNumber: 1,
      title: '1. Fenêtre — Ajustement Manuel du Stock',
      description: 'Cette fenêtre permet de corriger manuellement le stock d\'un article lorsqu\'une entrée ou une sortie doit être enregistrée, avec un motif et une quantité associés.',
      targetAcomId: 'stock.adjustment_modal.header',
      actionToPerform: 'observe',
      speechFr: 'Cette fenêtre permet de corriger manuellement le stock d\'un article lorsqu\'une entrée ou une sortie doit être enregistrée, avec un motif et une quantité associés.',
      speechWolof: 'Burewo bi dafay may nga corriger limu stock bu produit, bu amé entrée wala sortie, ak motif ak quantité.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Sélectionner l\'article',
      description: 'Sélectionnez ici le produit dont le stock doit être ajusté.',
      targetAcomId: 'stock.adjustment_modal.product',
      actionToPerform: 'type',
      speechFr: 'Sélectionnez ici le produit dont le stock doit être ajusté.',
      speechWolof: 'Tannal fii produit bi nga bëgg ajuster stock am.',
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Type d\'opération (Entrée / Sortie)',
      description: 'Entrée (+) ajoute une quantité au stock. Sortie (-) retire une quantité du stock.',
      targetAcomId: 'stock.adjustment_modal.operation_type',
      actionToPerform: 'click',
      speechFr: 'Choisissez le type d\'opération : Entrée (+) pour ajouter une quantité au stock, ou Sortie (-) pour en retirer.',
      speechWolof: 'Tannal type d\'opération : Entrée ngir yokk stock, wala Sortie ngir wàññi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 4,
      title: '4. Quantité',
      description: 'Indiquez ici la quantité concernée par l\'ajustement.',
      targetAcomId: 'stock.adjustment_modal.quantity',
      actionToPerform: 'type',
      inputValue: '1',
      speechFr: 'Indiquez ici la quantité concernée par l\'ajustement.',
      speechWolof: 'Bindal fii quantité bi nga bëgg ajuster.',
      stepCategory: 'required'
    },
    {
      stepNumber: 5,
      title: '5. Motif prédéfini',
      description: 'Précisez la raison de l\'entrée ou de la sortie (ex: Casse / Périmé / Endommagé (Sortie), Vol / Perte constaté (Sortie), Correction d\'inventaire physique).',
      targetAcomId: 'stock.adjustment_modal.reason',
      actionToPerform: 'type',
      speechFr: 'Sélectionnez le motif prédéfini précisant la raison de l\'entrée ou de la sortie.',
      speechWolof: 'Tannal motif bi tax nga bëgg def ajustement bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 6,
      title: '6. Notes supplémentaires (Optionnel)',
      description: 'Permet d\'ajouter une précision ou un commentaire concernant le mouvement.',
      targetAcomId: 'stock.adjustment_modal.notes',
      actionToPerform: 'type',
      speechFr: 'Vous pouvez ajouter une note ou un commentaire complémentaire sur ce mouvement.',
      speechWolof: 'Mën nga def ay détails ou explications ci notes supplémentaires.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 7,
      title: '7. Nom de l\'opérateur',
      description: 'Permet d\'identifier l\'opérateur ou l\'administrateur associé à cet ajustement.',
      targetAcomId: 'stock.adjustment_modal.operator',
      actionToPerform: 'type',
      speechFr: 'Cette information permet d\'identifier l\'opérateur associé à l\'ajustement.',
      speechWolof: 'Fi dafay wone turu opérateur bi def ajustement bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: '8. Actions — Annuler & Validation',
      description: 'Le bouton Annuler ferme la fenêtre sans modifier le stock. Cliquez sur Enregistrer pour valider l\'ajustement.',
      targetAcomId: 'stock.adjustment_modal.actions',
      actionToPerform: 'observe',
      speechFr: 'Le bouton Annuler ferme la fenêtre sans modification. Le bouton Enregistrer valide définitivement l\'ajustement.',
      speechWolof: 'Bessal Enregistrer ngir denc ajustement bi, wala Annuler ngir fermer.',
      stepCategory: 'final'
    }
  ]
};

export const COMMERCE_INVENTORY_SHEET_TUTORIAL: TutorialScenario = {
  id: 'commerce_inventory_sheet_tutorial',
  title: 'Fiche de Comptage d’Inventaire Physique',
  description: 'Présentation interactive et guidée de la Fiche de Comptage d\'Inventaire Physique pour effectuer le relevé manuel dans les rayons et comparer avec le stock système.',
  saasModule: 'stock',
  estimatedDurationSec: 180,
  steps: [
    {
      stepNumber: 1,
      title: '1. Titre de la fiche — Fiche de Comptage',
      description: 'Cette fiche sert à réaliser un comptage physique du stock. Elle permet aux équipes de relever les quantités réellement présentes, puis de comparer ce comptage avec le stock enregistré dans le système afin d\'identifier les écarts.',
      targetAcomId: 'stock.inventory_sheet_modal.header',
      actionToPerform: 'observe',
      speechFr: 'Cette fiche sert à réaliser un comptage physique du stock. Elle permet aux équipes de relever les quantités réellement présentes, puis de comparer ce comptage avec le stock enregistré dans le système afin d\'identifier les écarts.',
      speechWolof: 'Fiche bi dafay mayé nga def comptage physique bu stock bi, pour xam limu produit yi téyer ci rayons yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Message d\'instruction',
      description: 'Le cadre d\'information indique d\'imprimer le document pour vos équipes. Il comporte des colonnes vides pour le comptage manuel et le relevé des écarts par rapport au système informatique.',
      targetAcomId: 'stock.inventory_sheet_modal.instruction',
      actionToPerform: 'observe',
      speechFr: 'Ce cadre indique d\'imprimer le document pour vos équipes sur le terrain. Il comporte des colonnes vides destinées au comptage physique manuel et au relevé des écarts par rapport au système informatique.',
      speechWolof: 'Message bi dafay lay xamal ni nga imprimer fiche bi jox ko sa équipes yi ngir ñu def comptage physique bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. Date d\'inventaire',
      description: 'Permet d\'inscrire la date précise à laquelle l\'inventaire physique est réalisé.',
      targetAcomId: 'stock.inventory_sheet_modal.date',
      actionToPerform: 'observe',
      speechFr: 'Cette zone permet d\'identifier la date précise à laquelle l\'inventaire physique est réalisé dans le magasin.',
      speechWolof: 'Fi dafay wone date bi nga defé inventaire physique bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. Tableau de comptage',
      description: 'Le tableau regroupe l\'ensemble des articles du stock avec leurs identifiants, catégories, stock système et colonnes de comptage.',
      targetAcomId: 'stock.inventory_sheet_modal.table',
      actionToPerform: 'observe',
      speechFr: 'Le tableau regroupe la liste des articles avec leurs références, la catégorie, le stock système, et les colonnes à remplir pour le comptage réel et l\'écart.',
      speechWolof: 'Tableau bi dafay dajale produit yëpp ak stock système bi, ngir nga bind comptage réel bi ak écart bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: '5. SKU / Code-barres',
      description: 'Affiche la référence SKU ou le code-barres unique de chaque article.',
      targetAcomId: 'stock.inventory_sheet_modal.col_sku',
      actionToPerform: 'observe',
      speechFr: 'Cette colonne affiche le code SKU ou le code-barres unique servant à l\'identification exacte de l\'article.',
      speechWolof: 'Colonne bi dafay wone code SKU wala code-barres bu produit bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: '6. Nom de l\'article',
      description: 'Désignation complète et nom commercial du produit à compter.',
      targetAcomId: 'stock.inventory_sheet_modal.col_product',
      actionToPerform: 'observe',
      speechFr: 'Cette colonne précise la désignation complète et le nom commercial du produit à inventorier.',
      speechWolof: 'Fi moy turu produit bi nga wara compté.',
      stepCategory: 'info'
    },
    {
      stepNumber: 7,
      title: '7. Catégorie',
      description: 'Famille ou catégorie de classement de l\'article dans le catalogue.',
      targetAcomId: 'stock.inventory_sheet_modal.col_category',
      actionToPerform: 'observe',
      speechFr: 'Cette colonne indique la catégorie de classement de l\'article dans la gestion du stock.',
      speechWolof: 'Fi moy catégorie bi produit bi bokk.',
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: '8. Stock Système',
      description: 'Quantité théorique actuellement enregistrée dans la base de données informatique.',
      targetAcomId: 'stock.inventory_sheet_modal.col_system_stock',
      actionToPerform: 'observe',
      speechFr: 'Cette colonne indique la quantité théorique actuellement enregistrée dans le système informatique.',
      speechWolof: 'Fi moy quantité bi nekk ci système informatique bi légui.',
      stepCategory: 'info'
    },
    {
      stepNumber: 9,
      title: '9. Comptage Réel',
      description: 'Quantité réellement constatée lors du comptage physique dans les rayons. Elle sera comparée au stock système pour déterminer l\'écart.',
      targetAcomId: 'stock.inventory_sheet_modal.col_real_count',
      actionToPerform: 'observe',
      speechFr: 'Le comptage réel correspond à la quantité réellement trouvée lors du comptage physique dans les rayons. Cette valeur sera ensuite comparée au stock enregistré dans le système afin de déterminer l\'écart.',
      speechWolof: 'Comptage réel moy quantité bi nga fekk réellement ci rayons yi. Moom lañuy comparer ak stock système.',
      stepCategory: 'required'
    },
    {
      stepNumber: 10,
      title: '10. Écart (+/-)',
      description: 'Différence calculée entre le comptage réel et le stock système (Écart = Comptage réel - Stock système).',
      targetAcomId: 'stock.inventory_sheet_modal.col_variance',
      actionToPerform: 'observe',
      speechFr: 'L\'écart représente la différence entre le comptage réel et le stock système. Par exemple, si le stock système est de 5 et le comptage réel est de 4, l\'écart est de -1. S\'il est de 7, l\'écart est de +2.',
      speechWolof: 'Écart moy différence bi nekk ci diggante comptage réel ak stock système.',
      stepCategory: 'required'
    },
    {
      stepNumber: 11,
      title: '11. Visa de l\'opérateur / inventorieur',
      description: 'Espace réservé à l\'identification et la signature de la personne ayant réalisé l\'inventaire.',
      targetAcomId: 'stock.inventory_sheet_modal.visa_operator',
      actionToPerform: 'observe',
      speechFr: 'Cette zone est destinée au nom et à la signature de l\'agent ou de l\'opérateur ayant effectué le comptage physique.',
      speechWolof: 'Fi moy pour nom ak signature bu inventorieur bi def comptage bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 12,
      title: '12. Visa de la direction',
      description: 'Espace réservé à la validation et la signature de la direction.',
      targetAcomId: 'stock.inventory_sheet_modal.visa_management',
      actionToPerform: 'observe',
      speechFr: 'Cette zone est destinée au nom et à la signature du responsable ou de la direction pour valider le document d\'inventaire.',
      speechWolof: 'Fi moy pour signature bu direction bi ngir valider inventaire bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 13,
      title: '13. Bouton Fermer',
      description: 'Ferme la fiche d\'inventaire et revient automatiquement au tableau de bord du Stock.',
      targetAcomId: 'stock.inventory_sheet_modal.close_btn',
      actionToPerform: 'observe',
      speechFr: 'Le bouton Fermer permet de quitter la fiche de comptage et de revenir automatiquement au menu principal du Stock.',
      speechWolof: 'Bessal Fermer ngir deltu ci menu Stock bi.',
      stepCategory: 'final'
    },
    {
      stepNumber: 14,
      title: '14. Bouton Fiche Imprimer',
      description: 'Permet d\'imprimer la fiche d\'inventaire physique destinée au comptage sur le terrain.',
      targetAcomId: 'stock.inventory_sheet_modal.print_btn',
      actionToPerform: 'observe',
      speechFr: 'Cette action permet d\'imprimer la fiche d\'inventaire physique destinée au comptage sur le terrain par vos équipes.',
      speechWolof: 'Bessal Fiche Imprimer ngir imprimer document bi jox ko sa équipes.',
      stepCategory: 'final'
    }
  ]
};

export const COMMERCE_REORDER_PO_TUTORIAL: TutorialScenario = {
  id: 'commerce_reorder_po_tutorial',
  title: 'Bon de Commande Fournisseur (Réassort)',
  description: 'Présentation interactive, visuelle et vocale du Bon de Commande Fournisseur pour réapprovisionner les articles en alerte ou rupture de stock.',
  saasModule: 'stock',
  estimatedDurationSec: 180,
  steps: [
    {
      stepNumber: 1,
      title: '1. Bon de Commande Fournisseur (Réassort)',
      description: 'Cette fenêtre permet de préparer un bon de commande fournisseur pour réapprovisionner les articles en alerte ou en rupture de stock.',
      targetAcomId: 'stock.reorder_modal.title',
      actionToPerform: 'observe',
      speechFr: 'Cette fenêtre permet de préparer un bon de commande fournisseur pour réapprovisionner les articles en alerte ou en rupture de stock.',
      speechWolof: 'Fenêtre bi dafay mayé nga defar bon de commande fournisseur pour réapprovisionner produit yi nek ci alerte wala rupture.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Fournisseur',
      description: 'Cette zone permet de choisir le fournisseur auprès duquel les articles seront commandés. Le fournisseur sélectionné sera associé au bon de commande généré.',
      targetAcomId: 'stock.reorder_modal.supplier',
      actionToPerform: 'observe',
      speechFr: 'Cette zone permet de choisir le fournisseur auprès duquel les articles seront commandés. Le fournisseur sélectionné sera associé au bon de commande généré.',
      speechWolof: 'Fi dafay mayé nga tann fournisseur bi nga bëgg jëndé produit yi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Message d\'information & Seuil d\'alerte',
      description: 'Ce message vous indique que les articles proposés nécessitent un réapprovisionnement. Le système tient compte de leur niveau de stock et du seuil d\'alerte pour proposer une quantité à commander.',
      targetAcomId: 'stock.reorder_modal.alert_notice',
      actionToPerform: 'observe',
      speechFr: 'Ce message vous indique que les articles proposés nécessitent un réapprovisionnement. Le système tient compte de leur niveau de stock et du seuil d\'alerte pour proposer une quantité à commander.',
      speechWolof: 'Message bi dafay xamal ni produit yi proposé da ñu soxla réassort ndax stock bi dafa wacc.',
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. Articles à Commander',
      description: 'Cette section présente les articles que le système vous propose de réapprovisionner. Vous pouvez sélectionner les articles qui doivent être inclus dans la commande fournisseur.',
      targetAcomId: 'stock.reorder_modal.section_articles',
      actionToPerform: 'observe',
      speechFr: 'Cette section présente les articles que le système vous propose de réapprovisionner. Vous pouvez sélectionner les articles qui doivent être inclus dans la commande fournisseur.',
      speechWolof: 'Section bi dafay wone produit yi système bi proposé nga réapprovisionner.',
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: '5. Sélection de l\'article (Case à cocher)',
      description: 'Cette case permet de sélectionner ou de désélectionner l\'article. Seuls les articles sélectionnés seront intégrés au bon de commande.',
      targetAcomId: 'stock.reorder_modal.checkbox',
      actionToPerform: 'observe',
      speechFr: 'Cette case permet de sélectionner ou de désélectionner l\'article. Seuls les articles sélectionnés seront intégrés au bon de commande.',
      speechWolof: 'Case bi dafay mayé nga cocher wala décocher produit bi nga bëgg bokk ci commande bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 6,
      title: '6. Informations de Stock & Seuil',
      description: 'Le système vous indique ici la situation actuelle de l\'article afin de vous aider à déterminer la quantité nécessaire pour le réapprovisionnement.',
      targetAcomId: 'stock.reorder_modal.article_row',
      actionToPerform: 'observe',
      speechFr: 'Le système vous indique ici la situation actuelle de l\'article afin de vous aider à déterminer la quantité nécessaire pour le réapprovisionnement.',
      speechWolof: 'Fi dafay wone stock actuel bi ak seuil bi ngir nga xam lim bi nga wara commander.',
      stepCategory: 'info'
    },
    {
      stepNumber: 7,
      title: '7. Quantité à Commander',
      description: 'Cette zone permet de définir la quantité à commander. La quantité proposée automatiquement peut être modifiée avant de générer le bon de commande.',
      targetAcomId: 'stock.reorder_modal.quantity_input',
      actionToPerform: 'observe',
      speechFr: 'Cette zone permet de définir la quantité à commander. La quantité proposée automatiquement peut être modifiée avant de générer le bon de commande.',
      speechWolof: 'Fi dafay mayé nga changer quantité bi nga bëgg commander bala nga générer document bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: '8. Bouton Annuler',
      description: 'Le bouton Annuler permet de fermer cette fenêtre sans générer le bon de commande.',
      targetAcomId: 'stock.reorder_modal.cancel_btn',
      actionToPerform: 'observe',
      speechFr: 'Le bouton Annuler permet de fermer cette fenêtre sans générer le bon de commande.',
      speechWolof: 'Bouton Annuler dafay tëj fenêtre bi te du générer bon de commande.',
      stepCategory: 'control'
    },
    {
      stepNumber: 9,
      title: '9. Bouton Générer le document PDF/Imprimable',
      description: 'Ce bouton permet de générer le bon de commande fournisseur sous forme de document PDF ou imprimable. Le document reprend les articles sélectionnés ainsi que les quantités à commander.',
      targetAcomId: 'stock.reorder_modal.generate_btn',
      actionToPerform: 'observe',
      speechFr: 'Ce bouton permet de générer le bon de commande fournisseur sous forme de document PDF ou imprimable. Le document reprend les articles sélectionnés ainsi que les quantités à commander.',
      speechWolof: 'Bouton bi dafay générer bon de commande bi sous forme PDF wala document buñuy imprimer.',
      stepCategory: 'final'
    },
    {
      stepNumber: 10,
      title: '10. Document généré avec succès',
      description: 'Le bon de commande fournisseur a été généré avec succès. Vous pouvez maintenant l\'imprimer ou l\'utiliser pour votre réapprovisionnement.',
      targetAcomId: 'stock.reorder_modal.generated_doc',
      actionToPerform: 'observe',
      speechFr: 'Le bon de commande fournisseur a été généré avec succès. Vous pouvez maintenant l\'imprimer ou l\'utiliser pour votre réapprovisionnement.',
      speechWolof: 'Bon de commande fournisseur bi généré na avec succès. Mën nga ko imprimer légui.',
      stepCategory: 'final'
    }
  ]
};

export const COMMERCE_CSV_EXPORT_SUCCESS_TUTORIAL: TutorialScenario = {
  id: 'commerce_csv_export_success_tutorial',
  title: 'Export CSV réussi',
  description: 'Présentation interactive, visuelle et vocale de la confirmation d\'exportation CSV du stock.',
  saasModule: 'stock',
  estimatedDurationSec: 60,
  steps: [
    {
      stepNumber: 1,
      title: '1. Fenêtre Système',
      description: 'Cette fenêtre confirme que l’exportation du fichier CSV s’est terminée correctement.',
      targetAcomId: 'stock.csv_success_modal',
      actionToPerform: 'observe',
      speechFr: 'L’exportation du fichier CSV a été effectuée avec succès. Cette confirmation vous indique que le fichier a bien été généré.',
      speechWolof: 'Exportation fichier CSV bi dafa jàll avec succès. Confirmation bi dafay xamal ni fichier bi généré na bu baax.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Icône de Succès',
      description: 'L’icône de confirmation indique que l’opération s’est terminée avec succès et qu’aucune erreur d’exportation n’a été détectée.',
      targetAcomId: 'stock.csv_success_modal.icon',
      actionToPerform: 'observe',
      speechFr: 'L’icône de confirmation indique que l’opération s’est terminée avec succès et qu’aucune erreur d’exportation n’a été détectée.',
      speechWolof: 'Icône bi dafay wone ni opération bi jàll na avec succès te amul benn erreur bu am ci exportation bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. Message de Succès',
      description: 'Le système confirme ici que le fichier CSV a été exporté avec succès. Vous pouvez donc considérer l’opération d’exportation comme terminée.',
      targetAcomId: 'stock.csv_success_modal.title',
      actionToPerform: 'observe',
      speechFr: 'Le système confirme ici que le fichier CSV a été exporté avec succès. Vous pouvez donc considérer l’opération d’exportation comme terminée.',
      speechWolof: 'Système bi dafay confirmé fi ni fichier CSV bi exporté na avec succès. Mën nga jàppé ni exportation bi jéxna.',
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. Utilité du Fichier CSV',
      description: 'Le fichier CSV permet de récupérer les données exportées dans un format exploitable avec des outils compatibles avec les fichiers tableurs.',
      targetAcomId: 'stock.csv_success_modal.message',
      actionToPerform: 'observe',
      speechFr: 'Le fichier CSV permet de récupérer les données exportées dans un format exploitable avec des outils compatibles avec les fichiers tableurs.',
      speechWolof: 'Fichier CSV bi dafay mayé nga jël données yi ci format buñu mën a exploiter ak logiciels tableurs yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: '5. Bouton D’accord',
      description: 'Le bouton D’accord permet de fermer cette confirmation et de revenir à la page Stock.',
      targetAcomId: 'stock.csv_success_modal.confirm_btn',
      actionToPerform: 'observe',
      speechFr: 'Le bouton D’accord permet de fermer cette confirmation et de revenir à la page Stock.',
      speechWolof: 'Bouton D’accord bi dafay mayé nga tëj confirmation bi te dellu ci page Stock.',
      stepCategory: 'control'
    }
  ]
};

export const COMMERCE_SUPPLIERS_TUTORIAL: TutorialScenario = {
  id: 'commerce_suppliers_tutorial',
  title: 'Partenaires logistiques',
  description: 'Présentation interactive, visuelle et 100% vocale de la gestion des fournisseurs et partenaires logistiques.',
  saasModule: 'suppliers',
  estimatedDurationSec: 120,
  steps: [
    {
      stepNumber: 1,
      title: '1. Module Actif — Fournisseurs',
      description: 'Vous êtes dans le module Fournisseurs. Cette section permet de gérer les partenaires logistiques de votre activité.',
      targetAcomId: 'supplier.navbar',
      actionToPerform: 'observe',
      speechFr: 'Vous êtes dans le module Fournisseurs. Cette section permet de gérer les partenaires logistiques de votre activité.',
      speechWolof: 'Mu ngi ci module Fournisseurs bi. Fi dafay mayé nga gérer partenaires logistiques yi ci sa liggéey.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Barre de Navigation',
      description: 'La barre de navigation vous permet de passer entre les différents modules de l\'application. Le module Fournisseurs est actuellement sélectionné.',
      targetAcomId: 'supplier.navbar',
      actionToPerform: 'observe',
      speechFr: 'La barre de navigation vous permet de passer entre les différents modules de l\'application. Le module Fournisseurs est actuellement sélectionné.',
      speechWolof: 'Barre de navigation bi dafay mayé nga changé fexe entre modules yi ci application bi. Module Fournisseurs bi moo actif léegi.',
      stepCategory: 'navigation'
    },
    {
      stepNumber: 3,
      title: '3. Titre — Partenaires logistiques',
      description: 'Cette page est consacrée à la gestion de vos partenaires logistiques et fournisseurs.',
      targetAcomId: 'supplier.title',
      actionToPerform: 'observe',
      speechFr: 'Cette page est consacrée à la gestion de vos partenaires logistiques et fournisseurs.',
      speechWolof: 'Xët wii dafa jagleel gestion u sa partenaires logistiques ak fournisseurs yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. Fournisseurs actifs',
      description: 'Un fournisseur actif est actuellement enregistré dans votre gestion des partenaires logistiques.',
      targetAcomId: 'supplier.count',
      actionToPerform: 'observe',
      speechFr: 'Un fournisseur actif est actuellement enregistré dans votre gestion des partenaires logistiques.',
      speechWolof: 'Benn fournisseur actif moo bindu fi léegi ci gestion partenaires logistiques yi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: '5. Bouton + Nouveau fournisseur',
      description: 'Le bouton Nouveau fournisseur permet d\'ajouter un nouveau partenaire logistique dans votre système. Il ouvre une fenêtre permettant de renseigner les informations du fournisseur.',
      targetAcomId: 'supplier.new_supplier_btn',
      actionToPerform: 'click',
      speechFr: 'Le bouton Nouveau fournisseur permet d\'ajouter un nouveau partenaire logistique dans votre système. Il ouvre une fenêtre permettant de renseigner les informations du fournisseur.',
      speechWolof: 'Bouton Nouveau fournisseur bi dafay mayé nga yokk partenaire logistique bu bees ci sa système bi. Dafay ubbi fenêtre ngir bind ay xibaar.',
      stepCategory: 'action'
    },
    {
      stepNumber: 6,
      title: '6. Carte Fournisseur',
      description: 'Cette carte présente un fournisseur enregistré dans le système. Elle affiche son nom ainsi que sa catégorie.',
      targetAcomId: 'supplier.card.first',
      actionToPerform: 'observe',
      speechFr: 'Cette carte présente un fournisseur enregistré dans le système. Elle affiche son nom ainsi que sa catégorie.',
      speechWolof: 'Carte bi dafay wone fournisseur bu bindu ci système bi. Dafay wone turam ak catégorie bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 7,
      title: '7. Données du Fournisseur',
      description: 'La carte détaille également la personne de contact, le numéro de téléphone et l\'adresse email pour joindre rapidement ce partenaire.',
      targetAcomId: 'supplier.card.details',
      actionToPerform: 'observe',
      speechFr: 'La carte détaille également la personne de contact, le numéro de téléphone et l\'adresse email pour joindre rapidement ce partenaire.',
      speechWolof: 'Carte bi dafay wone tamit ki ngay waxtaanal, numéro téléphone bi ak email bi ngir jokkoo ak moom.',
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: '8. Assistant Acom IA',
      description: 'Le bouton Acom IA permet d\'ouvrir l\'assistant intelligent et d\'obtenir une aide contextuelle sur la page actuellement affichée.',
      targetAcomId: 'acom_ai_widget.button',
      actionToPerform: 'click',
      speechFr: 'Le bouton Acom IA permet d\'ouvrir l\'assistant intelligent et d\'obtenir une aide contextuelle sur la page actuellement affichée.',
      speechWolof: 'Bouton Acom IA bi dafay mayé nga ubbi assistant intelligent bi ngir am ndimbal ci xët wi.',
      stepCategory: 'action'
    }
  ]
};

export const COMMERCE_NEW_SUPPLIER_MODAL_TUTORIAL: TutorialScenario = {
  id: 'commerce_new_supplier_modal_tutorial',
  title: 'Nouveau fournisseur',
  description: 'Présentation interactive, visuelle et 100% vocale de la fenêtre d\'enregistrement d\'un nouveau partenaire logistique.',
  saasModule: 'suppliers',
  estimatedDurationSec: 120,
  steps: [
    {
      stepNumber: 1,
      title: '1. Fenêtre Nouveau Fournisseur',
      description: 'Cette fenêtre permet de créer un nouveau fournisseur et d\'enregistrer ses informations dans le système.',
      targetAcomId: 'supplier.modal.container',
      actionToPerform: 'observe',
      speechFr: 'Cette fenêtre permet de créer un nouveau fournisseur et d\'enregistrer ses informations dans le système.',
      speechWolof: 'Fenêtre bi dafay mayé nga créer fournisseur bu bees te bind ay données wam ci système bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Nom de l\'entreprise',
      description: 'Ce champ permet de renseigner le nom de l\'entreprise du fournisseur.',
      targetAcomId: 'supplier.modal.name_input',
      actionToPerform: 'type',
      speechFr: 'Ce champ permet de renseigner le nom de l\'entreprise du fournisseur.',
      speechWolof: 'Champ bi dafay mayé nga bind turu entreprise fournisseur bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Personne de contact',
      description: 'Ce champ permet d\'indiquer la personne à contacter chez ce fournisseur.',
      targetAcomId: 'supplier.modal.contact_input',
      actionToPerform: 'type',
      speechFr: 'Ce champ permet d\'indiquer la personne à contacter chez ce fournisseur.',
      speechWolof: 'Champ bi dafay mayé nga xamal ki ngay waxtaanal ci biir entreprise bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 4,
      title: '4. Téléphone',
      description: 'Ce champ permet d\'enregistrer le numéro de téléphone du fournisseur ou de son contact.',
      targetAcomId: 'supplier.modal.phone_input',
      actionToPerform: 'type',
      speechFr: 'Ce champ permet d\'enregistrer le numéro de téléphone du fournisseur ou de son contact.',
      speechWolof: 'Champ bi dafay mayé nga bind numéro téléphone bu fournisseur bi wala contactam.',
      stepCategory: 'required'
    },
    {
      stepNumber: 5,
      title: '5. Email',
      description: 'Ce champ permet d\'enregistrer l\'adresse e-mail du fournisseur.',
      targetAcomId: 'supplier.modal.email_input',
      actionToPerform: 'type',
      speechFr: 'Ce champ permet d\'enregistrer l\'adresse e-mail du fournisseur.',
      speechWolof: 'Champ bi dafay mayé nga bind adresse e-mail bu fournisseur bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 6,
      title: '6. Catégorie',
      description: 'Le champ Catégorie permet de classer le fournisseur. La catégorie actuellement sélectionnée est Général.',
      targetAcomId: 'supplier.modal.category_input',
      actionToPerform: 'type',
      speechFr: 'Le champ Catégorie permet de classer le fournisseur. La catégorie actuellement sélectionnée est Général.',
      speechWolof: 'Champ Catégorie bi dafay mayé nga categoriser fournisseur bi. Catégorie bi fi nekk léegi mooy Général.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 7,
      title: '7. Bouton Annuler',
      description: 'Le bouton Annuler permet de fermer la fenêtre sans enregistrer le nouveau fournisseur.',
      targetAcomId: 'supplier.modal.cancel_btn',
      actionToPerform: 'click',
      speechFr: 'Le bouton Annuler permet de fermer la fenêtre sans enregistrer le nouveau fournisseur.',
      speechWolof: 'Bouton Annuler bi dafay mayé nga tëj fenêtre bi te do enregistrer nouveau fournisseur bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 8,
      title: '8. Bouton Enregistrer le fournisseur',
      description: 'Ce bouton permet de valider les informations saisies et d\'enregistrer le nouveau fournisseur.',
      targetAcomId: 'supplier.modal.submit_btn',
      actionToPerform: 'click',
      speechFr: 'Ce bouton permet de valider les informations saisies et d\'enregistrer le nouveau fournisseur.',
      speechWolof: 'Bouton bi dafay mayé nga valider li nga bind te enregistrer nouveau fournisseur bi.',
      stepCategory: 'action'
    }
  ]
};

export const COMMERCE_BILLING_INVOICES_TUTORIAL: TutorialScenario = {
  id: 'commerce_billing_invoices_tutorial',
  title: 'Factures Enregistrées',
  description: 'Présentation complète, visuelle et 100% vocale de l’historique des factures et encaissements.',
  saasModule: 'billing',
  estimatedDurationSec: 130,
  steps: [
    {
      stepNumber: 1,
      title: '1. Titre — Facturation & Devis',
      description: 'Bienvenue dans le module Facturation et Devis. Cette section centralise l\'ensemble de vos documents commerciaux et comptables.',
      targetAcomId: 'billing.title',
      actionToPerform: 'observe',
      speechFr: 'Bienvenue dans le module Facturation et Devis. Cette section centralise l\'ensemble de vos documents commerciaux et comptables.',
      speechWolof: 'Dalal ak jàmm ci module Facturation ak Devis. Fi mën nga fi gise leep lu jëm ci sa kayitu liggéey ak komptabilité.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Barre de Navigation',
      description: 'La barre de navigation supérieure vous permet de basculer instantanément entre la Facturation, la Caisse, le Stock et les Fournisseurs.',
      targetAcomId: 'billing.navbar',
      actionToPerform: 'observe',
      speechFr: 'La barre de navigation supérieure vous permet de basculer instantanément entre la Facturation, la Caisse, le Stock et les Fournisseurs.',
      speechWolof: 'Barre de navigation bi dafay mayé nga changé fexe entre Facturation, Caisse, Stock ak sa Fournisseurs.',
      stepCategory: 'navigation'
    },
    {
      stepNumber: 3,
      title: '3. Sélecteur d\'Onglets',
      description: 'Trois vues spécialisées sont à votre disposition : les Factures réglées, les Impayés nécessitant un recouvrement, et les Devis clients.',
      targetAcomId: 'billing.tabs_bar',
      actionToPerform: 'observe',
      speechFr: 'Trois vues spécialisées sont à votre disposition : les Factures réglées, les Impayés nécessitant un recouvrement, et les Devis clients.',
      speechWolof: 'Ñatti vues ñoo fi am : Factures yi fey nañu leen, Impayés yi ñu leen war a fay, ak Devis yi ñu waajal.',
      stepCategory: 'navigation'
    },
    {
      stepNumber: 4,
      title: '4. Onglet FACTURES',
      description: 'L\'onglet Factures affiche l\'historique exhaustif des ventes et prestations encaissées dans votre établissement.',
      targetAcomId: 'billing.tab.invoices',
      actionToPerform: 'click',
      speechFr: 'L\'onglet Factures affiche l\'historique exhaustif des ventes et prestations encaissées dans votre établissement.',
      speechWolof: 'Onglet Factures bi dafay wone leep lu ngen jaay wala liggéey bu ngen fayu ci sa établissement bi.',
      stepCategory: 'navigation'
    },
    {
      stepNumber: 5,
      title: '5. Compteur de Documents',
      description: 'Ce badge comptabilise en direct le nombre total de factures enregistrées dans votre base de données locale et cloud.',
      targetAcomId: 'billing.invoices.counter',
      actionToPerform: 'observe',
      speechFr: 'Ce badge comptabilise en direct le nombre total de factures enregistrées dans votre base de données locale et cloud.',
      speechWolof: 'Compteur bi dafay wone limu factures yi bindu ci sa base de données locale ak cloud.',
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: '6. Tableau des Factures',
      description: 'Le tableau principal récapitule chaque transaction avec sa date d\'émission, le client, le mode de règlement et le montant total.',
      targetAcomId: 'billing.invoices.table',
      actionToPerform: 'observe',
      speechFr: 'Le tableau principal récapitule chaque transaction avec sa date d\'émission, le client, le mode de règlement et le montant total.',
      speechWolof: 'Tableau bi dafay tëral transaction bu nekk ak bés bi, client bi, fason fey bi ak montant total bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 7,
      title: '7. Colonne Référence & Date',
      description: 'La colonne Référence attribue un numéro unique et chronologique à chaque document légal pour votre traçabilité comptable.',
      targetAcomId: 'billing.invoices.col_ref',
      actionToPerform: 'observe',
      speechFr: 'La colonne Référence attribue un numéro unique et chronologique à chaque document légal pour votre traçabilité comptable.',
      speechWolof: 'Colonne Référence bi dafay jox numéro unique chronologique kayit bu nekk ngir traçabilité bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: '8. Colonne Client',
      description: 'La colonne Client identifie le destinataire de la facture, qu\'il s\'agisse d\'un client au comptoir ou d\'un compte professionnel.',
      targetAcomId: 'billing.invoices.col_client',
      actionToPerform: 'observe',
      speechFr: 'La colonne Client identifie le destinataire de la facture, qu\'il s\'agisse d\'un client au comptoir ou d\'un compte professionnel.',
      speechWolof: 'Colonne Client bi dafay xamle kan moo jënd, xam client de passage wala compte professionnel.',
      stepCategory: 'info'
    },
    {
      stepNumber: 9,
      title: '9. Colonne Mode de Règlement',
      description: 'Cette colonne indique le moyen de paiement utilisé : espèces, carte bancaire, chèque ou virement électronique.',
      targetAcomId: 'billing.invoices.col_mode',
      actionToPerform: 'observe',
      speechFr: 'Cette colonne indique le moyen de paiement utilisé : espèces, carte bancaire, chèque ou virement électronique.',
      speechWolof: 'Colonne bi dafay wone fason fay bi : xaalis bu jàpp, carte bancaire, chèque wala virement.',
      stepCategory: 'info'
    },
    {
      stepNumber: 10,
      title: '10. Colonne Montant TTC',
      description: 'Le montant toutes taxes comprises reflète la somme finale réglée par le client pour cette facture.',
      targetAcomId: 'billing.invoices.col_amount',
      actionToPerform: 'observe',
      speechFr: 'Le montant toutes taxes comprises reflète la somme finale réglée par le client pour cette facture.',
      speechWolof: 'Montant TTC bi mooy xaalis bi client bi fay ci facture bi leep boole.',
      stepCategory: 'info'
    },
    {
      stepNumber: 11,
      title: '11. Colonne Actions',
      description: 'La colonne Actions vous permet de réimprimer un reçu thermique ou d\'exporter une facture normalisée au format A4.',
      targetAcomId: 'billing.invoices.col_actions',
      actionToPerform: 'observe',
      speechFr: 'La colonne Actions vous permet de réimprimer un reçu thermique ou d\'exporter une facture normalisée au format A4.',
      speechWolof: 'Colonne Actions bi dafay mayé nga génneel waat reçu thermique wala facture officielle A4.',
      stepCategory: 'action'
    },
    {
      stepNumber: 12,
      title: '12. Centre d\'Impression & Export',
      description: 'En cliquant sur l\'icône d\'impression, vous ouvrez le centre d\'édition pour choisir entre reçu de caisse thermique ou facture grand format.',
      targetAcomId: 'billing.invoices.first_row_btn_print',
      actionToPerform: 'click',
      speechFr: 'En cliquant sur l\'icône d\'impression, vous ouvrez le centre d\'édition pour choisir entre reçu de caisse thermique ou facture grand format.',
      speechWolof: 'Soo cuqee ci imprimer, dafay ubbi centre d\'impression bi ngir nga tann ticket caisse wala facture A4.',
      stepCategory: 'action'
    }
  ]
};

export const COMMERCE_BILLING_PENDING_TUTORIAL: TutorialScenario = {
  id: 'commerce_billing_pending_tutorial',
  title: 'Factures avec Impayés',
  description: 'Présentation interactive et vocale du suivi des créances et relances clients.',
  saasModule: 'billing',
  estimatedDurationSec: 90,
  steps: [
    {
      stepNumber: 1,
      title: '1. Titre — Factures avec Impayés',
      description: 'Vous êtes sur l\'onglet Impayés. Cette section surveille vos créances clients et liste les factures restant à solder.',
      targetAcomId: 'billing.pending.header',
      actionToPerform: 'observe',
      speechFr: 'Vous êtes sur l\'onglet Impayés. Cette section surveille vos créances clients et liste les factures restant à solder.',
      speechWolof: 'Mu ngi ci onglet Impayés. Fi dafay topp créances client yi ak factures yi am reste à payer.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Compteur En Attente',
      description: 'Ce compteur surveille en direct le nombre de factures comportant un solde restant dû par vos clients.',
      targetAcomId: 'billing.pending.counter',
      actionToPerform: 'observe',
      speechFr: 'Ce compteur surveille en direct le nombre de factures comportant un solde restant dû par vos clients.',
      speechWolof: 'Compteur bi dafay xamal limu factures yi am xaalis bu des buñu war a fay.',
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. Tableau des Créances',
      description: 'Le tableau détaille chaque dossier client avec le montant initial de la facture, les acomptes versés et le reste à payer.',
      targetAcomId: 'billing.pending.table',
      actionToPerform: 'observe',
      speechFr: 'Le tableau détaille chaque dossier client avec le montant initial de la facture, les acomptes versés et le reste à payer.',
      speechWolof: 'Tableau bi dafay tëral dossier bu nekk ak montant initial bi, acompte yi ñu fay ak reste bi des.',
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. Reste à Payer',
      description: 'La colonne Reste à Payer met en évidence la créance exacte à recouvrer pour chaque client.',
      targetAcomId: 'billing.pending.col_remaining',
      actionToPerform: 'observe',
      speechFr: 'La colonne Reste à Payer met en évidence la créance exacte à recouvrer pour chaque client.',
      speechWolof: 'Colonne Reste à Payer bi dafay fésal xaalis bu des bi client bi war a fay.',
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: '5. Actions de Recouvrement',
      description: 'Depuis la colonne Actions, vous pouvez réimprimer le duplicata avec mention du solde pour relancer le client.',
      targetAcomId: 'billing.pending.col_actions',
      actionToPerform: 'observe',
      speechFr: 'Depuis la colonne Actions, vous pouvez réimprimer le duplicata avec mention du solde pour relancer le client.',
      speechWolof: 'Ci colonne Actions bi, mën nga génneel waat duplicata bi ak reste bi ngir relancer client bi.',
      stepCategory: 'action'
    }
  ]
};

export const COMMERCE_BILLING_QUOTES_TUTORIAL: TutorialScenario = {
  id: 'commerce_billing_quotes_tutorial',
  title: 'Gestion des Devis',
  description: 'Présentation vocale et interactive de la création et du suivi des devis proforma.',
  saasModule: 'billing',
  estimatedDurationSec: 100,
  steps: [
    {
      stepNumber: 1,
      title: '1. Titre — Gestion des Devis',
      description: 'Bienvenue dans l\'espace Devis. Ce module vous permet d\'émettre des propositions commerciales chiffrées avant facturation.',
      targetAcomId: 'billing.quotes.header',
      actionToPerform: 'observe',
      speechFr: 'Bienvenue dans l\'espace Devis. Ce module vous permet d\'émettre des propositions commerciales chiffrées avant facturation.',
      speechWolof: 'Dalal ak jàmm ci Devis. Fi mën nga fi def proposition commerciale bu chiffré bala nga koy facturer.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Compteur de Devis',
      description: 'Ce badge indique le nombre total de devis et propositions proforma actuellement enregistrés.',
      targetAcomId: 'billing.quotes.counter',
      actionToPerform: 'observe',
      speechFr: 'Ce badge indique le nombre total de devis et propositions proforma actuellement enregistrés.',
      speechWolof: 'Badge bi dafay wone limu devis ak propositions proforma yi bindu fi léegi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. Bouton + Nouveau Devis',
      description: 'Cliquez sur Nouveau Devis pour ouvrir la fenêtre de saisie et composer une nouvelle offre commerciale.',
      targetAcomId: 'billing.quotes.btn_new',
      actionToPerform: 'click',
      speechFr: 'Cliquez sur Nouveau Devis pour ouvrir la fenêtre de saisie et composer une nouvelle offre commerciale.',
      speechWolof: 'Cuqal ci Nouveau Devis ngir ubbi formulaire bi te def offre commerciale bu bees.',
      stepCategory: 'action'
    },
    {
      stepNumber: 4,
      title: '4. Tableau des Devis',
      description: 'Le tableau récapitule vos devis en cours, leur date de création, leur client destinataire et leur statut d\'acceptation.',
      targetAcomId: 'billing.quotes.table',
      actionToPerform: 'observe',
      speechFr: 'Le tableau récapitule vos devis en cours, leur date de création, leur client destinataire et leur statut d\'acceptation.',
      speechWolof: 'Tableau bi dafay tëral devis yi am, bés bi ñu leen def, client bi ak statut bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: '5. Colonne Statut',
      description: 'La colonne Statut indique si votre proposition est en attente, acceptée par le client ou expirée.',
      targetAcomId: 'billing.quotes.col_status',
      actionToPerform: 'observe',
      speechFr: 'La colonne Statut indique si votre proposition est en attente, acceptée par le client ou expirée.',
      speechWolof: 'Colonne Statut bi dafay xamal ndax proposition bi mu ngi ci négociation, acceptée nañu ko wala dafa expiré.',
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: '6. Colonne Actions Devis',
      description: 'La colonne Actions permet d\'imprimer le devis en format A4 ou de le convertir directement en facture lors de la validation.',
      targetAcomId: 'billing.quotes.col_actions',
      actionToPerform: 'observe',
      speechFr: 'La colonne Actions permet d\'imprimer le devis en format A4 ou de le convertir directement en facture lors de la validation.',
      speechWolof: 'Colonne Actions bi dafay mayé nga imprimer devis bi en A4 wala nga convertir ko ci facture.',
      stepCategory: 'action'
    }
  ]
};

export const COMMERCE_BILLING_QUOTE_MODAL_TUTORIAL: TutorialScenario = {
  id: 'commerce_billing_quote_modal_tutorial',
  title: 'Nouveau Devis',
  description: 'Présentation vocale et étape par étape du formulaire de création d\'un nouveau devis.',
  saasModule: 'billing',
  estimatedDurationSec: 160,
  steps: [
    {
      stepNumber: 1,
      title: '1. Titre de la Modale',
      description: 'Cette fenêtre permet de créer un nouveau devis commercial. Elle regroupe les informations du client, les détails d\'expédition et les articles qui seront intégrés au devis.',
      targetAcomId: 'billing.quote_modal.title',
      actionToPerform: 'observe',
      speechFr: 'Cette fenêtre permet de créer un nouveau devis commercial. Elle regroupe les informations du client, les détails d\'expédition et les articles qui seront intégrés au devis.',
      speechWolof: 'Fenêtre bi dafay mayé nga créer nouveau devis commercial. Dafay boole informations client bi, détails d\'expédition ak articles yi ci devis bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Informations Client',
      description: 'Cette première partie permet de renseigner les informations nécessaires concernant le client du devis.',
      targetAcomId: 'billing.quote_modal.section_client',
      actionToPerform: 'observe',
      speechFr: 'Cette première partie permet de renseigner les informations nécessaires concernant le client du devis.',
      speechWolof: 'Pàcc bu njëkk bi dafay mayé nga bind informations yi la laaj ci client u devis bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. Nom / Entreprise',
      description: 'Indiquez ici le nom du client ou le nom de son entreprise. Ce champ est obligatoire pour identifier le destinataire du devis.',
      targetAcomId: 'billing.quote_modal.field_name',
      actionToPerform: 'type',
      speechFr: 'Indiquez ici le nom du client ou le nom de son entreprise. Ce champ est obligatoire pour identifier le destinataire du devis.',
      speechWolof: 'Bindal fi turu client bi wala turu entreprise bi. Champ bi dafa obligatoire ngir xam kan mooy destinataire bu devis bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 4,
      title: '4. Téléphone',
      description: 'Le champ téléphone permet d\'enregistrer le numéro de contact du client.',
      targetAcomId: 'billing.quote_modal.field_phone',
      actionToPerform: 'type',
      speechFr: 'Le champ téléphone permet d\'enregistrer le numéro de contact du client.',
      speechWolof: 'Champ téléphone bi dafay mayé nga enregistrer numéro jokkoo bu client bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 5,
      title: '5. Validité (Jours)',
      description: 'La durée de validité définit pendant combien de jours le devis reste valable. La valeur affichée ici est de trente jours.',
      targetAcomId: 'billing.quote_modal.field_validity',
      actionToPerform: 'type',
      speechFr: 'La durée de validité définit pendant combien de jours le devis reste valable. La valeur affichée ici est de trente jours.',
      speechWolof: 'Durée de validité bi dafay wax ñata fan la devis bi di wéy di baax. Li fi nekk mooy fanweeri fan.',
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: '6. Détails Expédition (Optionnel)',
      description: 'Cette zone facultative permet d\'ajouter l\'adresse complète du client ou toute information utile concernant l\'expédition.',
      targetAcomId: 'billing.quote_modal.field_address',
      actionToPerform: 'type',
      speechFr: 'Cette zone facultative permet d\'ajouter l\'adresse complète du client ou toute information utile concernant l\'expédition.',
      speechWolof: 'Zone bi facultative la, dafay mayé nga yokk adresse complète bu client bi wala leep lu am solo ci expédition bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 7,
      title: '7. Articles du Devis',
      description: 'Cette section permet d\'ajouter les produits qui composeront le devis.',
      targetAcomId: 'billing.quote_modal.section_items',
      actionToPerform: 'observe',
      speechFr: 'Cette section permet d\'ajouter les produits qui composeront le devis.',
      speechWolof: 'Section bi dafay mayé nga yokk produits yi nga xam ne ñoo fay boole ci devis bi.',
      stepCategory: 'action'
    },
    {
      stepNumber: 8,
      title: '8. + Ajouter un produit',
      description: 'Utilisez ce bouton pour sélectionner un produit existant dans votre catalogue et l\'ajouter au devis.',
      targetAcomId: 'billing.quote_modal.btn_add_product',
      actionToPerform: 'click',
      speechFr: 'Utilisez ce bouton pour sélectionner un produit existant dans votre catalogue et l\'ajouter au devis.',
      speechWolof: 'Jëfandikool bouton bi ngir tann produit bu am déjà ci sa catalogue te yokk ko ci devis bi.',
      stepCategory: 'action'
    },
    {
      stepNumber: 9,
      title: '9. + Manuel',
      description: 'Le bouton Manuel permet d\'ajouter une ligne au devis manuellement, sans sélectionner un produit existant.',
      targetAcomId: 'billing.quote_modal.btn_add_manual',
      actionToPerform: 'click',
      speechFr: 'Le bouton Manuel permet d\'ajouter une ligne au devis manuellement, sans sélectionner un produit existant.',
      speechWolof: 'Bouton Manuel bi dafay mayé nga yokk ligne ci devis bi ak sa loxo, te danga doon tann produit bu am.',
      stepCategory: 'action'
    },
    {
      stepNumber: 10,
      title: '10. Zone des Articles',
      description: 'Les articles sélectionnés apparaîtront dans cette zone. Pour le moment, aucun article n\'a encore été ajouté.',
      targetAcomId: 'billing.quote_modal.empty_items_zone',
      actionToPerform: 'observe',
      speechFr: 'Les articles sélectionnés apparaîtront dans cette zone. Pour le moment, aucun article n\'a encore été ajouté.',
      speechWolof: 'Produits yi nga tann fi lañuy fés. Ci jamono jii, amul benn article buñu fi yokk ba tey.',
      stepCategory: 'info'
    },
    {
      stepNumber: 11,
      title: '11. Bouton Annuler',
      description: 'Le bouton Annuler permet de fermer la création du devis sans l\'enregistrer.',
      targetAcomId: 'billing.quote_modal.btn_cancel',
      actionToPerform: 'click',
      speechFr: 'Le bouton Annuler permet de fermer la création du devis sans l\'enregistrer.',
      speechWolof: 'Bouton Annuler bi dafay mayé nga tëj création devis bi te doo ko enregistrer.',
      stepCategory: 'control'
    },
    {
      stepNumber: 12,
      title: '12. Enregistrer le Devis',
      description: 'Une fois les informations renseignées, utilisez ce bouton pour enregistrer le devis.',
      targetAcomId: 'billing.quote_modal.btn_submit',
      actionToPerform: 'click',
      speechFr: 'Une fois les informations renseignées, utilisez ce bouton pour enregistrer le devis.',
      speechWolof: 'Soo bindee informations yépp ba noppi, jëfandikool bouton bi ngir enregistrer devis bi.',
      stepCategory: 'action'
    },
    {
      stepNumber: 13,
      title: '13. Bouton Fermer (X)',
      description: 'La croix permet de fermer directement la fenêtre Nouveau Devis.',
      targetAcomId: 'billing.quote_modal.btn_close',
      actionToPerform: 'click',
      speechFr: 'La croix permet de fermer directement la fenêtre Nouveau Devis.',
      speechWolof: 'Croix bi dafay mayé nga tëj direct fenêtre Nouveau Devis bi.',
      stepCategory: 'control'
    }
  ]
};

export const COMMERCE_BILLING_PRINT_MODAL_TUTORIAL: TutorialScenario = {
  id: 'commerce_billing_print_modal_tutorial',
  title: 'Centre d\'Impression & Export',
  description: 'Présentation vocale des formats d\'impression : reçu thermique, facture A4 ou devis A4.',
  saasModule: 'billing',
  estimatedDurationSec: 80,
  steps: [
    {
      stepNumber: 1,
      title: '1. Centre d\'Impression',
      description: 'Bienvenue dans le centre d\'impression. Choisissez ici le support de sortie adapté à votre besoin.',
      targetAcomId: 'billing.print_modal.container',
      actionToPerform: 'observe',
      speechFr: 'Bienvenue dans le centre d\'impression. Choisissez ici le support de sortie adapté à votre besoin.',
      speechWolof: 'Dalal ak jàmm ci centre d\'impression bi. Tannal fi support bi la gënal.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Reçu Thermique (80mm)',
      description: 'Cette option édite un reçu de caisse compact au format thermique 80 millimètres pour une remise immédiate au comptoir.',
      targetAcomId: 'billing.print_modal.option_receipt',
      actionToPerform: 'click',
      speechFr: 'Cette option édite un reçu de caisse compact au format thermique 80 millimètres pour une remise immédiate au comptoir.',
      speechWolof: 'Option bi dafay génneel ticket caisse thermique 80mm bu gatt ngir jox ko client bi sur place.',
      stepCategory: 'action'
    },
    {
      stepNumber: 3,
      title: '3. Facture Complète (A4)',
      description: 'Cette option génère une facture officielle complète au format A4 avec vos coordonnées d\'entreprise et le détail fiscal.',
      targetAcomId: 'billing.print_modal.option_invoice_a4',
      actionToPerform: 'click',
      speechFr: 'Cette option génère une facture officielle complète au format A4 avec vos coordonnées d\'entreprise et le détail fiscal.',
      speechWolof: 'Option bi dafay génneel facture officielle A4 bu am coordonnées entreprise ak détail fiscal bi leep.',
      stepCategory: 'action'
    },
    {
      stepNumber: 4,
      title: '4. Fermer la Fenêtre',
      description: 'Cliquez sur Fermer pour quitter le centre d\'impression et revenir à votre liste de documents.',
      targetAcomId: 'billing.print_modal.close_btn',
      actionToPerform: 'click',
      speechFr: 'Cliquez sur Fermer pour quitter le centre d\'impression et revenir à votre liste de documents.',
      speechWolof: 'Cuqal ci Fermer ngir tëj fenêtre d\'impression bi te dellu ci sa liste.',
      stepCategory: 'control'
    }
  ]
};

export const MERCHANT_AUDIT_LOG_TUTORIAL: TutorialScenario = {
  id: 'merchant_audit_log_tutorial',
  title: 'Tutoriel Journal d\'Audit',
  description: 'Présentation guidée et traçabilité complète des flux de stock et opérations d\'audit.',
  saasModule: 'commerce',
  estimatedDurationSec: 120,
  steps: [
    {
      stepNumber: 1,
      title: '1. Présentation de la Page',
      description: 'Bienvenue dans le Journal d’Audit. Cette page permet de suivre la traçabilité des flux de stock et de consulter les opérations enregistrées dans le système.',
      targetAcomId: 'audit.title',
      actionToPerform: 'observe',
      speechFr: 'Bienvenue dans le Journal d’Audit. Cette page permet de suivre la traçabilité des flux de stock et de consulter les opérations enregistrées dans le système.',
      speechWolof: 'Dalal ak jamm ci Journal d’Audit. Xët wii dafa lay may nga top topatoo mbootu stock ak opérations yi nekk ci système bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 2,
      title: '2. Indicateur Temps Réel',
      description: 'L’indicateur Temps réel permet de savoir que les informations affichées sont suivies en temps réel. Il permet de garder une vision actualisée des mouvements enregistrés.',
      targetAcomId: 'audit.realtime',
      actionToPerform: 'observe',
      speechFr: 'L’indicateur Temps réel permet de savoir que les informations affichées sont suivies en temps réel. Il permet de garder une vision actualisée des mouvements enregistrés.',
      speechWolof: 'Indicateur Temps réel dafa lay wone ni xibaar yi dañu leen di topetoo leegi leegi ci temps réel.',
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Tableau d’Audit',
      description: 'Voici le journal des opérations. Les informations sont organisées dans un tableau afin de faciliter la lecture et le suivi des mouvements de stock.',
      targetAcomId: 'audit.table',
      actionToPerform: 'observe',
      speechFr: 'Voici le journal des opérations. Les informations sont organisées dans un tableau afin de faciliter la lecture et le suivi des mouvements de stock.',
      speechWolof: 'Bii mooy journal des opérations. Tableau bi da lay may nga mën a jàng ak top yëngu-yëngu stock bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 4,
      title: '4. Horodatage',
      description: 'La colonne Horodatage indique la date et l’heure auxquelles chaque opération a été enregistrée. Elle permet de suivre précisément la chronologie des mouvements.',
      targetAcomId: 'audit.col.timestamp',
      actionToPerform: 'observe',
      speechFr: 'La colonne Horodatage indique la date et l’heure auxquelles chaque opération a été enregistrée. Elle permet de suivre précisément la chronologie des mouvements.',
      speechWolof: 'Colonne Horodatage da lay wone date ak heure bi opération nekk amé.',
      stepCategory: 'required'
    },
    {
      stepNumber: 5,
      title: '5. Produit',
      description: 'La colonne Produit permet d’identifier l’article concerné par le mouvement enregistré.',
      targetAcomId: 'audit.col.product',
      actionToPerform: 'observe',
      speechFr: 'La colonne Produit permet d’identifier l’article concerné par le mouvement enregistré.',
      speechWolof: 'Colonne Produit da lay may nga xam marse am mouvement.',
      stepCategory: 'required'
    },
    {
      stepNumber: 6,
      title: '6. Type de Flux',
      description: 'La colonne Type de flux permet d’identifier la nature du mouvement enregistré, par exemple une entrée ou une sortie de stock.',
      targetAcomId: 'audit.col.type',
      actionToPerform: 'observe',
      speechFr: 'La colonne Type de flux permet d’identifier la nature du mouvement enregistré, par exemple une entrée ou une sortie de stock.',
      speechWolof: 'Colonne Type de flux da lay wone baxam entrée wala sortie de stock la.',
      stepCategory: 'required'
    },
    {
      stepNumber: 7,
      title: '7. Quantité',
      description: 'La colonne Quantité indique le volume d’articles concerné par le mouvement.',
      targetAcomId: 'audit.col.quantity',
      actionToPerform: 'observe',
      speechFr: 'La colonne Quantité indique le volume d’articles concerné par le mouvement.',
      speechWolof: 'Colonne Quantité da lay wone limu produits yi yëngu.',
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: '8. Delta Stock',
      description: 'Le Delta Stock permet de visualiser l’impact du mouvement sur la quantité disponible en stock.',
      targetAcomId: 'audit.col.delta',
      actionToPerform: 'observe',
      speechFr: 'Le Delta Stock permet de visualiser l’impact du mouvement sur la quantité disponible en stock.',
      speechWolof: 'Delta Stock da lay wone soppi-soppi bi am ci limu stock bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 9,
      title: '9. Motif / Raison',
      description: 'Cette colonne permet de consulter la justification ou la raison associée à l’opération lorsqu’elle est renseignée.',
      targetAcomId: 'audit.col.reason',
      actionToPerform: 'observe',
      speechFr: 'Cette colonne permet de consulter la justification ou la raison associée à l’opération lorsqu’elle est renseignée.',
      speechWolof: 'Colonne wii da lay may nga seet sebabu opération bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 10,
      title: '10. Navigation',
      description: 'Vous êtes actuellement dans la section Audit. Les autres sections permettent d’accéder aux différentes fonctions de gestion de l’application.',
      targetAcomId: 'merchant.navbar',
      actionToPerform: 'observe',
      speechFr: 'Vous êtes actuellement dans la section Audit. Les autres sections permettent d’accéder aux différentes fonctions de gestion de l’application.',
      speechWolof: 'Nekk nga ci wàllu Audit. Yeneen wàll yi dañ lay may nga dem ci fonctionnnalités application bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 11,
      title: '11. Conclusion',
      description: 'Vous savez maintenant utiliser le Journal d’Audit pour suivre les mouvements de stock, identifier les produits concernés, consulter les quantités et comprendre l’impact de chaque opération.',
      targetAcomId: 'audit.container',
      actionToPerform: 'observe',
      speechFr: 'Vous savez maintenant utiliser le Journal d’Audit pour suivre les mouvements de stock, identifier les produits concernés, consulter les quantités et comprendre l’impact de chaque opération.',
      speechWolof: 'Léegi xam nga nan lañuy jëfandikoo Journal d’Audit ngir topatoo yëngu-yëngu stock bi.',
      stepCategory: 'required'
    }
  ]
};

export interface NarrationQueueItem {
  id: string;
  text: string;
  lang?: 'fr' | 'wo';
  stepIndex?: number;
  priority?: 'normal' | 'immediate';
  targetAcomId?: string;
}

class TutorialEngineService {
  private currentScenario: TutorialScenario | null = null;
  private currentStepIndex = -1;
  private isActive = false;
  private isWaitingForTab = false;
  private isFunctionChooserVisible = false;
  private activeModal: string | null = null;
  private waitingMessage: string | null = null;
  private isAutoPresenting = false;
  private waitingSaas = 'pressing';
  private unsubscribeEventBus: (() => void) | null = null;
  private listeners: Set<() => void> = new Set();
  private billingSubTab: 'invoices' | 'pending' | 'quotes' = 'invoices';

  // Global Audio Lock and Centralized Narration Queue (Single Voice Directive)
  private tutorialVoiceLock = false;
  private tutorialVoiceQueue: NarrationQueueItem[] = [];
  private activeTutorialStep: string | null = null;
  private activeNarrationToken = 0;

  private billingData = {
    invoiceCount: 0,
    pendingCount: 0,
    quoteCount: 0,
    lastInvoiceRef: '',
    lastPaymentMode: ''
  };
  private supplierData = {
    supplierCount: 0,
    firstSupplierName: '',
    firstSupplierCategory: '',
    firstSupplierContact: '',
    firstSupplierPhone: '',
    firstSupplierEmail: ''
  };

  constructor() {
    ContextEngine.subscribe((context) => {
      if (this.isWaitingForTab && context.currentPage) {
        this.onPageSelected(context.currentPage);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  public isVoiceLocked(): boolean {
    return this.tutorialVoiceLock;
  }

  public getActiveTutorialStep(): string | null {
    return this.activeTutorialStep;
  }

  public getVoiceQueueLength(): number {
    return this.tutorialVoiceQueue.length;
  }

  /**
   * Enqueue a narration request into the centralized voice lock system.
   * Strictly enforces ONE voice at a time.
   */
  public enqueueNarration(item: NarrationQueueItem): void {
    if (!item.text || !item.text.trim()) return;

    if (item.priority === 'immediate') {
      // Abort active speech immediately and clear pending stale queue
      LanguageEngine.stopSpeech();
      this.activeNarrationToken++;
      this.tutorialVoiceQueue = [];
      this.tutorialVoiceLock = false;

      this.tutorialVoiceQueue.push(item);
      this.processVoiceQueue();
    } else {
      // Normal sequential queueing with deduplication
      if (this.activeTutorialStep === item.id || this.tutorialVoiceQueue.some(q => q.id === item.id)) {
        return;
      }
      this.tutorialVoiceQueue.push(item);
      if (!this.tutorialVoiceLock) {
        this.processVoiceQueue();
      }
    }
  }

  /**
   * Centralized sequential voice processor with real onEnd event handling.
   */
  private async processVoiceQueue(): Promise<void> {
    if (this.tutorialVoiceLock) {
      return;
    }

    if (this.tutorialVoiceQueue.length === 0) {
      this.tutorialVoiceLock = false;
      this.activeTutorialStep = null;
      return;
    }

    const item = this.tutorialVoiceQueue.shift()!;
    this.tutorialVoiceLock = true;
    this.activeTutorialStep = item.id;
    const currentToken = ++this.activeNarrationToken;

    if (item.stepIndex !== undefined && item.stepIndex >= 0) {
      this.currentStepIndex = item.stepIndex;
    }

    // Update UI (Highlight + Text)
    this.notify();

    try {
      await LanguageEngine.speak(item.text, item.lang || 'fr');
    } catch (err) {
      console.warn('[TutorialEngine] Narration error:', err);
    } finally {
      if (this.activeNarrationToken !== currentToken) {
        return;
      }

      this.tutorialVoiceLock = false;
      this.activeTutorialStep = null;
      this.notify();

      if (this.isAutoPresenting && this.isActive && this.currentScenario) {
        if (this.currentStepIndex < this.currentScenario.steps.length - 1) {
          setTimeout(() => {
            if (this.isAutoPresenting && this.isActive && this.activeNarrationToken === currentToken) {
              this.nextStepAuto();
            }
          }, 500);
        } else {
          this.isAutoPresenting = false;
          this.notify();
        }
      } else if (this.tutorialVoiceQueue.length > 0) {
        this.processVoiceQueue();
      }
    }
  }

  /**
   * Request a tutorial step via centralized voice lock & queue.
   */
  public requestTutorialStep(index: number, priority: 'immediate' | 'normal' = 'immediate'): void {
    if (!this.currentScenario) return;
    if (index < 0 || index >= this.currentScenario.steps.length) return;

    this.currentStepIndex = index;
    const step = this.currentScenario.steps[index];
    if (!step) return;

    const stepId = `${this.currentScenario.id}:step:${step.stepNumber}`;

    this.enqueueNarration({
      id: stepId,
      text: step.speechFr,
      lang: 'fr',
      stepIndex: index,
      priority,
      targetAcomId: step.targetAcomId
    });
  }

  private nextStepAuto(): void {
    if (!this.currentScenario || !this.isActive || !this.isAutoPresenting) return;
    if (this.currentStepIndex < this.currentScenario.steps.length - 1) {
      this.requestTutorialStep(this.currentStepIndex + 1, 'normal');
    }
  }

  public setSupplierContext(context: {
    supplierCount?: number;
    firstSupplierName?: string;
    firstSupplierCategory?: string;
    firstSupplierContact?: string;
    firstSupplierPhone?: string;
    firstSupplierEmail?: string;
  }): void {
    if (context.supplierCount !== undefined) this.supplierData.supplierCount = context.supplierCount;
    if (context.firstSupplierName !== undefined) this.supplierData.firstSupplierName = context.firstSupplierName;
    if (context.firstSupplierCategory !== undefined) this.supplierData.firstSupplierCategory = context.firstSupplierCategory;
    if (context.firstSupplierContact !== undefined) this.supplierData.firstSupplierContact = context.firstSupplierContact;
    if (context.firstSupplierPhone !== undefined) this.supplierData.firstSupplierPhone = context.firstSupplierPhone;
    if (context.firstSupplierEmail !== undefined) this.supplierData.firstSupplierEmail = context.firstSupplierEmail;

    // Dynamically update Suppliers tutorial step 4 (count)
    const countStep = COMMERCE_SUPPLIERS_TUTORIAL.steps.find(s => s.targetAcomId === 'supplier.count');
    if (countStep) {
      const count = this.supplierData.supplierCount;
      const textFr = count === 0
        ? "Aucun fournisseur n'est actuellement enregistré dans votre gestion des partenaires logistiques."
        : count === 1
        ? "Un fournisseur actif est actuellement enregistré dans votre gestion des partenaires logistiques."
        : `${count} fournisseurs actifs sont actuellement enregistrés dans votre gestion des partenaires logistiques.`;
      const textWo = count === 0
        ? "Amul benn fournisseur bu bindu fi léegi ci gestion partenaires logistiques yi."
        : count === 1
        ? "Benn fournisseur actif moo bindu fi léegi ci gestion partenaires logistiques yi."
        : `${count} fournisseurs actifs ñoo bindu fi léegi ci gestion partenaires logistiques yi.`;
      countStep.description = textFr;
      countStep.speechFr = textFr;
      countStep.speechWolof = textWo;
    }

    // Dynamically update Suppliers tutorial step 6 (first supplier card)
    const cardStep = COMMERCE_SUPPLIERS_TUTORIAL.steps.find(s => s.targetAcomId === 'supplier.card.first');
    if (cardStep) {
      const name = this.supplierData.firstSupplierName;
      const cat = this.supplierData.firstSupplierCategory || 'Général';
      const textFr = name
        ? `Cette carte présente le fournisseur ${name} enregistré dans le système. Elle affiche son nom ainsi que sa catégorie ${cat}.`
        : "Cette carte présente un fournisseur enregistré dans le système. Elle affiche son nom ainsi que sa catégorie.";
      const textWo = name
        ? `Carte bi dafay wone fournisseur ${name} bu bindu ci système bi. Dafay wone turam ak catégorie bi ${cat}.`
        : "Carte bi dafay wone fournisseur bu bindu ci système bi. Dafay wone turam ak catégorie bi.";
      cardStep.description = textFr;
      cardStep.speechFr = textFr;
      cardStep.speechWolof = textWo;
    }

    // Dynamically update Suppliers tutorial step 7 (contact details)
    const detailsStep = COMMERCE_SUPPLIERS_TUTORIAL.steps.find(s => s.targetAcomId === 'supplier.card.details');
    if (detailsStep) {
      const contact = this.supplierData.firstSupplierContact;
      const phone = this.supplierData.firstSupplierPhone;
      const email = this.supplierData.firstSupplierEmail;
      let textFr = "La carte détaille également la personne de contact, le numéro de téléphone et l'adresse email pour joindre rapidement ce partenaire.";
      if (contact && phone) {
        textFr = `La carte détaille le contact ${contact}, le numéro ${phone}${email ? ` et l'adresse email ${email}` : ''} pour joindre rapidement ce partenaire.`;
      }
      detailsStep.description = textFr;
      detailsStep.speechFr = textFr;
    }
  }

  public onSupplierCreated(supplierName: string): void {
    if (this.isActive && this.currentScenario?.id === 'commerce_new_supplier_modal_tutorial') {
      const msg = `Nouveau fournisseur ${supplierName} enregistré avec succès.`;
      this.enqueueNarration({
        id: `supplier_created_${Date.now()}`,
        text: msg,
        lang: 'fr',
        priority: 'normal'
      });
    }
  }

  public setBillingContext(context: {
    subTab?: 'invoices' | 'pending' | 'quotes';
    invoiceCount?: number;
    pendingCount?: number;
    quoteCount?: number;
    lastInvoiceRef?: string;
    lastPaymentMode?: string;
  }): void {
    const prevSubTab = this.billingSubTab;
    if (context.subTab) {
      this.billingSubTab = context.subTab;
    }
    if (context.invoiceCount !== undefined) this.billingData.invoiceCount = context.invoiceCount;
    if (context.pendingCount !== undefined) this.billingData.pendingCount = context.pendingCount;
    if (context.quoteCount !== undefined) this.billingData.quoteCount = context.quoteCount;
    if (context.lastInvoiceRef !== undefined) this.billingData.lastInvoiceRef = context.lastInvoiceRef;
    if (context.lastPaymentMode !== undefined) this.billingData.lastPaymentMode = context.lastPaymentMode;

    // Dynamically update Invoices tutorial count
    const invoicesStep5 = COMMERCE_BILLING_INVOICES_TUTORIAL.steps.find(s => s.targetAcomId === 'billing.invoices.counter');
    if (invoicesStep5) {
      const count = this.billingData.invoiceCount;
      const textFr = count > 0
        ? `Ce badge comptabilise en direct ${count} facture${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''} dans votre base de données.`
        : "Ce badge indique qu'aucune facture n'est actuellement enregistrée dans votre base.";
      const textWo = count > 0
        ? `Compteur bi dafay wone ${count} facture yi bindu ci sa base de données.`
        : "Compteur bi dafay wone ni amul benn facture bu bindu fi léegi.";
      invoicesStep5.description = textFr;
      invoicesStep5.speechFr = textFr;
      invoicesStep5.speechWolof = textWo;
    }

    // Dynamically update Pending tutorial count
    const pendingStep2 = COMMERCE_BILLING_PENDING_TUTORIAL.steps.find(s => s.targetAcomId === 'billing.pending.counter');
    if (pendingStep2) {
      const count = this.billingData.pendingCount;
      const textFr = count > 0
        ? `Ce compteur surveille en direct ${count} facture${count > 1 ? 's' : ''} comportant un solde restant dû par vos clients.`
        : "Ce compteur confirme qu'aucune facture n'est en impayé. Tous vos comptes clients sont à jour.";
      const textWo = count > 0
        ? `Compteur bi dafay xamal ${count} factures yi am xaalis bu des buñu war a fay.`
        : "Compteur bi dafay wone ni amul benn impayé. Këru liggéey bi lépp leer na.";
      pendingStep2.description = textFr;
      pendingStep2.speechFr = textFr;
      pendingStep2.speechWolof = textWo;
    }

    // Dynamically update Quotes tutorial count
    const quotesStep2 = COMMERCE_BILLING_QUOTES_TUTORIAL.steps.find(s => s.targetAcomId === 'billing.quotes.counter');
    if (quotesStep2) {
      const count = this.billingData.quoteCount;
      const textFr = count > 0
        ? `Ce badge indique que ${count} devis et proposition${count > 1 ? 's' : ''} proforma ${count > 1 ? 'sont' : 'est'} actuellement enregistré${count > 1 ? 's' : ''}.`
        : "Ce badge indique qu'aucun devis n'a encore été créé. Cliquez sur Nouveau Devis pour débuter.";
      const textWo = count > 0
        ? `Badge bi dafay wone ${count} devis ak propositions proforma yi bindu fi léegi.`
        : "Badge bi dafay wone ni amul benn devis bu fi nekk. Cuqal ci Nouveau Devis ngir tambali.";
      quotesStep2.description = textFr;
      quotesStep2.speechFr = textFr;
      quotesStep2.speechWolof = textWo;
    }

    // If tutorial is currently active on billing and subTab changed, automatically switch scenario
    if (this.isActive && context.subTab && context.subTab !== prevSubTab) {
      const isBillingScenario =
        this.currentScenario?.id === 'commerce_billing_invoices_tutorial' ||
        this.currentScenario?.id === 'commerce_billing_pending_tutorial' ||
        this.currentScenario?.id === 'commerce_billing_quotes_tutorial';

      if (isBillingScenario && !this.activeModal) {
        if (context.subTab === 'invoices') {
          this.currentScenario = COMMERCE_BILLING_INVOICES_TUTORIAL;
        } else if (context.subTab === 'pending') {
          this.currentScenario = COMMERCE_BILLING_PENDING_TUTORIAL;
        } else if (context.subTab === 'quotes') {
          this.currentScenario = COMMERCE_BILLING_QUOTES_TUTORIAL;
        }
        this.requestTutorialStep(0, 'immediate');
      }
    }
  }

  public startTutorialSelection(saasModule: string = 'pressing'): void {
    if (this.isActive) {
      this.stopTutorial();
    }
    this.isWaitingForTab = true;
    this.waitingSaas = saasModule;
    this.waitingMessage = "Sélectionnez l'onglet de la page sur laquelle vous souhaitez lancer le tutoriel.";

    this.enqueueNarration({
      id: 'tab_selection_waiting',
      text: this.waitingMessage,
      lang: 'fr',
      priority: 'immediate'
    });
    this.notify();
  }

  public cancelTabSelection(): void {
    this.isWaitingForTab = false;
    this.waitingMessage = null;
    this.tutorialVoiceLock = false;
    this.tutorialVoiceQueue = [];
    this.activeNarrationToken++;
    LanguageEngine.stopSpeech();
    this.notify();
  }

  public isWaitingForTabSelection(): boolean {
    return this.isWaitingForTab;
  }

  public getWaitingMessage(): string | null {
    return this.waitingMessage;
  }

  public getOverviewScenarioForSaas(saasModule?: string): TutorialScenario {
    const rawSaas = saasModule || ContextEngine.getContext().activeSaaS || 'boutique';
    const s = String(rawSaas).toLowerCase();
    if (s === 'tailleur' || s === 'couture' || s === 'atelier' || s === 'broderie') {
      return COUTURE_OVERVIEW_TUTORIAL;
    }
    if (s === 'pressing' || s === 'pressing_pro' || s === 'lave-linge') {
      return PRESSING_DASHBOARD_TUTORIAL;
    }
    return COMMERCE_OVERVIEW_TUTORIAL;
  }

  public getScenarioForPage(pageId: string, saasModule?: string): TutorialScenario | undefined {
    const activeSaas = saasModule || ContextEngine.getContext().activeSaaS || 'boutique';
    const saas = String(activeSaas).toLowerCase();

    // Universal Overview / Dashboard resolution based on active SaaS
    if (
      pageId === 'dashboard' || 
      pageId === 'apercu' || 
      pageId === 'overview' || 
      pageId === 'commerce_overview' || 
      pageId === 'tailleur_dashboard' || 
      pageId === 'couture_dashboard' || 
      pageId === 'pressing_dashboard'
    ) {
      if (pageId === 'tailleur_dashboard' || pageId === 'couture_dashboard') {
        return COUTURE_OVERVIEW_TUTORIAL;
      }
      if (pageId === 'pressing_dashboard') {
        return PRESSING_DASHBOARD_TUTORIAL;
      }
      if (pageId === 'commerce_overview') {
        return COMMERCE_OVERVIEW_TUTORIAL;
      }
      return this.getOverviewScenarioForSaas(saas);
    }
    if (pageId === 'pressing_receipt') {
      return PRESSING_GOLDEN_TUTORIAL;
    }
    if (pageId === 'pressing_tarifs') {
      return PRESSING_TARIFS_TUTORIAL;
    }
    if (pageId === 'pressing_stock') {
      return PRESSING_STOCK_SALES_TUTORIAL;
    }
    if (pageId === 'pressing_closure' || pageId === 'cash_closure' || pageId === 'cloture' || pageId === 'closure' || pageId === 'tailleur_closure' || pageId === 'cash_closure_manager') {
      return PRESSING_CLOSURE_TUTORIAL;
    }
    if (pageId === 'accounting' || pageId === 'pressing_compta' || pageId === 'pressing_accounting' || pageId === 'comptabilite') {
      return PRESSING_ACCOUNTING_TUTORIAL;
    }
    if (pageId === 'reports' || pageId === 'pressing_reports' || pageId === 'financial_reports' || pageId === 'pressing_financial_reports' || pageId === 'rapports') {
      return PRESSING_FINANCIAL_REPORTS_TUTORIAL;
    }
    if (pageId === 'settings' || pageId === 'pressing_settings' || pageId === 'reglages' || pageId === 'pressing_reglages' || pageId === 'merchant_settings') {
      return PRESSING_SETTINGS_TUTORIAL;
    }
    if (pageId === 'pos' || pageId === 'caisse' || pageId === 'caisse_pos' || pageId === 'merchant_pos' || pageId === 'commerce_pos') {
      return COMMERCE_POS_TUTORIAL;
    }
    if (pageId === 'inventory' || pageId === 'stock' || pageId === 'stock_manager' || pageId === 'stock_products' || pageId === 'gestion_stock') {
      if (this.activeModal === 'stock.reorder_modal' || this.activeModal === 'stock_reorder_modal') {
        return COMMERCE_REORDER_PO_TUTORIAL;
      }
      if (this.activeModal === 'stock.inventory_sheet_modal' || this.activeModal === 'stock_inventory_sheet_modal') {
        return COMMERCE_INVENTORY_SHEET_TUTORIAL;
      }
      if (this.activeModal === 'stock.adjustment_modal' || this.activeModal === 'stock_adjustment_modal') {
        return COMMERCE_STOCK_ADJUSTMENT_TUTORIAL;
      }
      if (this.activeModal === 'stock.product_modal' || this.activeModal === 'stock_product_modal') {
        return COMMERCE_PRODUCT_DETAILS_TUTORIAL;
      }
      if (this.activeModal === 'stock.csv_success_modal' || this.activeModal === 'stock_csv_export_success') {
        return COMMERCE_CSV_EXPORT_SUCCESS_TUTORIAL;
      }
      return COMMERCE_STOCK_TUTORIAL;
    }
    if (pageId === 'suppliers' || pageId === 'fournisseurs' || pageId === 'logistique' || pageId === 'partenaires') {
      if (this.activeModal === 'supplier.new_supplier_modal' || this.activeModal === 'supplier_new_modal') {
        return COMMERCE_NEW_SUPPLIER_MODAL_TUTORIAL;
      }
      return COMMERCE_SUPPLIERS_TUTORIAL;
    }
    if (pageId === 'billing' || pageId === 'facturation' || pageId === 'devis' || pageId === 'factures' || pageId === 'impayes' || pageId === 'merchant_billing') {
      if (this.activeModal === 'billing.quote_modal' || this.activeModal === 'billing_quote_modal') {
        return COMMERCE_BILLING_QUOTE_MODAL_TUTORIAL;
      }
      if (this.activeModal === 'billing.print_modal' || this.activeModal === 'billing_print_modal') {
        return COMMERCE_BILLING_PRINT_MODAL_TUTORIAL;
      }
      if (this.billingSubTab === 'pending') {
        return COMMERCE_BILLING_PENDING_TUTORIAL;
      }
      if (this.billingSubTab === 'quotes') {
        return COMMERCE_BILLING_QUOTES_TUTORIAL;
      }
      return COMMERCE_BILLING_INVOICES_TUTORIAL;
    }
    if (pageId === 'audit' || pageId === 'journal_audit' || pageId === 'merchant_audit' || pageId === 'audit_log') {
      return MERCHANT_AUDIT_LOG_TUTORIAL;
    }
    return undefined;
  }

  public onModalOpened(modalId: string): void {
    this.activeModal = modalId;
    if (modalId === 'stock.reorder_modal' || modalId === 'stock_reorder_modal') {
      this.currentScenario = COMMERCE_REORDER_PO_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    } else if (modalId === 'stock.product_modal' || modalId === 'stock_product_modal') {
      this.currentScenario = COMMERCE_PRODUCT_DETAILS_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    } else if (modalId === 'stock.adjustment_modal' || modalId === 'stock_adjustment_modal') {
      this.currentScenario = COMMERCE_STOCK_ADJUSTMENT_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    } else if (modalId === 'stock.inventory_sheet_modal' || modalId === 'stock_inventory_sheet_modal') {
      this.currentScenario = COMMERCE_INVENTORY_SHEET_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    } else if (modalId === 'stock.csv_success_modal' || modalId === 'stock_csv_export_success') {
      this.currentScenario = COMMERCE_CSV_EXPORT_SUCCESS_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    } else if (modalId === 'supplier.new_supplier_modal' || modalId === 'supplier_new_modal') {
      this.currentScenario = COMMERCE_NEW_SUPPLIER_MODAL_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    } else if (modalId === 'billing.quote_modal' || modalId === 'billing_quote_modal') {
      this.currentScenario = COMMERCE_BILLING_QUOTE_MODAL_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    } else if (modalId === 'billing.print_modal' || modalId === 'billing_print_modal') {
      this.currentScenario = COMMERCE_BILLING_PRINT_MODAL_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    }
  }

  public onModalClosed(modalId: string): void {
    if (this.activeModal === modalId) {
      this.activeModal = null;
    }
    if (modalId === 'stock.reorder_modal' || modalId === 'stock_reorder_modal') {
      if (this.isActive && this.currentScenario?.id === 'commerce_reorder_po_tutorial') {
        this.currentScenario = COMMERCE_STOCK_TUTORIAL;
        this.requestTutorialStep(0, 'immediate');
      }
    } else if (modalId === 'stock.product_modal' || modalId === 'stock_product_modal') {
      if (this.isActive && this.currentScenario?.id === 'commerce_product_details_tutorial') {
        this.currentScenario = COMMERCE_STOCK_TUTORIAL;
        this.requestTutorialStep(9, 'immediate');
      }
    } else if (modalId === 'stock.adjustment_modal' || modalId === 'stock_adjustment_modal') {
      if (this.isActive && this.currentScenario?.id === 'commerce_stock_adjustment_tutorial') {
        this.currentScenario = COMMERCE_STOCK_TUTORIAL;
        this.requestTutorialStep(10, 'immediate');
      }
    } else if (modalId === 'stock.inventory_sheet_modal' || modalId === 'stock_inventory_sheet_modal') {
      if (this.isActive && this.currentScenario?.id === 'commerce_inventory_sheet_tutorial') {
        this.currentScenario = COMMERCE_STOCK_TUTORIAL;
        this.requestTutorialStep(11, 'immediate');
      }
    } else if (modalId === 'stock.csv_success_modal' || modalId === 'stock_csv_export_success') {
      if (this.isActive && this.currentScenario?.id === 'commerce_csv_export_success_tutorial') {
        this.currentScenario = COMMERCE_STOCK_TUTORIAL;
        this.requestTutorialStep(0, 'immediate');
      }
    } else if (modalId === 'supplier.new_supplier_modal' || modalId === 'supplier_new_modal') {
      if (this.isActive && this.currentScenario?.id === 'commerce_new_supplier_modal_tutorial') {
        this.currentScenario = COMMERCE_SUPPLIERS_TUTORIAL;
        this.requestTutorialStep(0, 'immediate');
      }
    } else if (modalId === 'billing.quote_modal' || modalId === 'billing_quote_modal' || modalId === 'billing.print_modal' || modalId === 'billing_print_modal') {
      if (this.isActive) {
        if (this.billingSubTab === 'pending') {
          this.currentScenario = COMMERCE_BILLING_PENDING_TUTORIAL;
        } else if (this.billingSubTab === 'quotes') {
          this.currentScenario = COMMERCE_BILLING_QUOTES_TUTORIAL;
        } else {
          this.currentScenario = COMMERCE_BILLING_INVOICES_TUTORIAL;
        }
        this.requestTutorialStep(0, 'immediate');
      }
    }
  }

  public async onPageSelected(pageId: string): Promise<void> {
    if (!this.isWaitingForTab) return;

    const pageDef = SaaSPageRegistry.getPage(pageId);
    if (pageDef) {
      const scenario = this.getScenarioForPage(pageId);
      if (scenario) {
        this.isWaitingForTab = false;
        this.waitingMessage = null;
        this.startTutorial(scenario);
      } else {
        const msg = "Cette page est bien reconnue, mais son tutoriel n'est pas encore disponible. Sélectionnez un autre onglet.";
        this.waitingMessage = msg;
        this.enqueueNarration({
          id: 'tab_selection_unavailable',
          text: msg,
          lang: 'fr',
          priority: 'immediate'
        });
        this.notify();
      }
    } else {
      const msg = "Cette page n'est pas encore reconnue pour le tutoriel. Sélectionnez un autre onglet.";
      this.waitingMessage = msg;
      this.enqueueNarration({
        id: 'tab_selection_unrecognized',
        text: msg,
        lang: 'fr',
        priority: 'immediate'
      });
      this.notify();
    }
  }

  public startTutorial(scenario: TutorialScenario = PRESSING_GOLDEN_TUTORIAL, initialStepIndex = 0): void {
    this.isWaitingForTab = false;
    this.waitingMessage = null;
    this.currentScenario = scenario;
    this.isActive = true;
    this.isAutoPresenting = false;

    // Listen to business events
    if (this.unsubscribeEventBus) this.unsubscribeEventBus();
    this.unsubscribeEventBus = EventBus.subscribe('*', (event) => {
      this.handleBusinessEvent(event.type);
    });

    this.requestTutorialStep(initialStepIndex, 'immediate');
  }

  public getCurrentScenario(): TutorialScenario | null {
    return this.currentScenario;
  }

  public isFunctionChooserOpen(): boolean {
    return this.isFunctionChooserVisible;
  }

  public openFunctionChooser(): void {
    this.isFunctionChooserVisible = true;
    this.notify();
  }

  public closeFunctionChooser(): void {
    this.isFunctionChooserVisible = false;
    this.notify();
  }

  public toggleFunctionChooser(): void {
    this.isFunctionChooserVisible = !this.isFunctionChooserVisible;
    this.notify();
  }

  public jumpToStepIndex(index: number): void {
    if (!this.currentScenario) {
      this.currentScenario = COMMERCE_STOCK_TUTORIAL;
      this.isActive = true;
    }
    if (index >= 0 && index < this.currentScenario.steps.length) {
      this.isAutoPresenting = false;
      this.isFunctionChooserVisible = false;
      this.isActive = true;
      this.requestTutorialStep(index, 'immediate');
    }
  }

  public jumpToStepNumber(stepNumber: number): void {
    if (!this.currentScenario) {
      this.currentScenario = COMMERCE_STOCK_TUTORIAL;
      this.isActive = true;
    }
    const idx = this.currentScenario.steps.findIndex(s => s.stepNumber === stepNumber);
    if (idx !== -1) {
      this.jumpToStepIndex(idx);
    }
  }

  public jumpToAcomId(targetAcomId: string): void {
    if (targetAcomId.startsWith('supplier.modal')) {
      this.currentScenario = COMMERCE_NEW_SUPPLIER_MODAL_TUTORIAL;
      this.isActive = true;
      const modalIdx = COMMERCE_NEW_SUPPLIER_MODAL_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(modalIdx !== -1 ? modalIdx : 0);
      return;
    }

    if (targetAcomId.startsWith('supplier.')) {
      this.currentScenario = COMMERCE_SUPPLIERS_TUTORIAL;
      this.isActive = true;
      const suppIdx = COMMERCE_SUPPLIERS_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(suppIdx !== -1 ? suppIdx : 0);
      return;
    }

    if (targetAcomId.startsWith('stock.csv_success_modal')) {
      this.currentScenario = COMMERCE_CSV_EXPORT_SUCCESS_TUTORIAL;
      this.isActive = true;
      const modalIdx = COMMERCE_CSV_EXPORT_SUCCESS_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(modalIdx !== -1 ? modalIdx : 0);
      return;
    }

    if (targetAcomId.startsWith('billing.quote_modal')) {
      this.currentScenario = COMMERCE_BILLING_QUOTE_MODAL_TUTORIAL;
      this.isActive = true;
      const modalIdx = COMMERCE_BILLING_QUOTE_MODAL_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(modalIdx !== -1 ? modalIdx : 0);
      return;
    }

    if (targetAcomId.startsWith('billing.print_modal')) {
      this.currentScenario = COMMERCE_BILLING_PRINT_MODAL_TUTORIAL;
      this.isActive = true;
      const modalIdx = COMMERCE_BILLING_PRINT_MODAL_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(modalIdx !== -1 ? modalIdx : 0);
      return;
    }

    if (targetAcomId.startsWith('billing.invoices')) {
      this.currentScenario = COMMERCE_BILLING_INVOICES_TUTORIAL;
      this.isActive = true;
      const idx = COMMERCE_BILLING_INVOICES_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(idx !== -1 ? idx : 0);
      return;
    }

    if (targetAcomId.startsWith('billing.pending')) {
      this.currentScenario = COMMERCE_BILLING_PENDING_TUTORIAL;
      this.isActive = true;
      const idx = COMMERCE_BILLING_PENDING_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(idx !== -1 ? idx : 0);
      return;
    }

    if (targetAcomId.startsWith('billing.quotes')) {
      this.currentScenario = COMMERCE_BILLING_QUOTES_TUTORIAL;
      this.isActive = true;
      const idx = COMMERCE_BILLING_QUOTES_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(idx !== -1 ? idx : 0);
      return;
    }

    if (targetAcomId.startsWith('stock.reorder_modal')) {
      this.currentScenario = COMMERCE_REORDER_PO_TUTORIAL;
      this.isActive = true;
      const modalIdx = COMMERCE_REORDER_PO_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(modalIdx !== -1 ? modalIdx : 0);
      return;
    }

    if (targetAcomId.startsWith('stock.inventory_sheet_modal')) {
      this.currentScenario = COMMERCE_INVENTORY_SHEET_TUTORIAL;
      this.isActive = true;
      const modalIdx = COMMERCE_INVENTORY_SHEET_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(modalIdx !== -1 ? modalIdx : 0);
      return;
    }

    if (targetAcomId.startsWith('stock.adjustment_modal')) {
      this.currentScenario = COMMERCE_STOCK_ADJUSTMENT_TUTORIAL;
      this.isActive = true;
      const modalIdx = COMMERCE_STOCK_ADJUSTMENT_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(modalIdx !== -1 ? modalIdx : 0);
      return;
    }

    if (targetAcomId.startsWith('stock.product_modal')) {
      this.currentScenario = COMMERCE_PRODUCT_DETAILS_TUTORIAL;
      this.isActive = true;
      const modalIdx = COMMERCE_PRODUCT_DETAILS_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(modalIdx !== -1 ? modalIdx : 0);
      return;
    }

    if (!this.currentScenario) {
      this.currentScenario = COMMERCE_STOCK_TUTORIAL;
      this.isActive = true;
    }
    const idx = this.currentScenario.steps.findIndex(s => s.targetAcomId === targetAcomId);
    if (idx !== -1) {
      this.jumpToStepIndex(idx);
    } else {
      const stockIdx = COMMERCE_STOCK_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      if (stockIdx !== -1) {
        this.currentScenario = COMMERCE_STOCK_TUTORIAL;
        this.jumpToStepIndex(stockIdx);
      } else {
        const detailsIdx = COMMERCE_PRODUCT_DETAILS_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
        if (detailsIdx !== -1) {
          this.currentScenario = COMMERCE_PRODUCT_DETAILS_TUTORIAL;
          this.jumpToStepIndex(detailsIdx);
        } else {
          const adjIdx = COMMERCE_STOCK_ADJUSTMENT_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
          if (adjIdx !== -1) {
            this.currentScenario = COMMERCE_STOCK_ADJUSTMENT_TUTORIAL;
            this.jumpToStepIndex(adjIdx);
          } else {
            const sheetIdx = COMMERCE_INVENTORY_SHEET_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
            if (sheetIdx !== -1) {
              this.currentScenario = COMMERCE_INVENTORY_SHEET_TUTORIAL;
              this.jumpToStepIndex(sheetIdx);
            } else {
              const reorderIdx = COMMERCE_REORDER_PO_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
              if (reorderIdx !== -1) {
                this.currentScenario = COMMERCE_REORDER_PO_TUTORIAL;
                this.jumpToStepIndex(reorderIdx);
              } else {
                const csvIdx = COMMERCE_CSV_EXPORT_SUCCESS_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
                if (csvIdx !== -1) {
                  this.currentScenario = COMMERCE_CSV_EXPORT_SUCCESS_TUTORIAL;
                  this.jumpToStepIndex(csvIdx);
                }
              }
            }
          }
        }
      }
    }
  }

  public getActiveModal(): string | null {
    return this.activeModal;
  }

  public startCsvExportSuccessTutorial(initialStepIndex = 0): void {
    this.startTutorial(COMMERCE_CSV_EXPORT_SUCCESS_TUTORIAL, initialStepIndex);
  }

  public playFullPresentation(scenarioOverride?: TutorialScenario): void {
    const scenario = scenarioOverride || this.currentScenario;
    if (!scenario) return;

    this.isAutoPresenting = true;
    this.currentScenario = scenario;
    this.isActive = true;
    this.isFunctionChooserVisible = false;

    this.requestTutorialStep(0, 'immediate');
  }

  public stopAutoPresentation(): void {
    this.isAutoPresenting = false;
    this.tutorialVoiceLock = false;
    this.tutorialVoiceQueue = [];
    this.activeNarrationToken++;
    LanguageEngine.stopSpeech();
    this.notify();
  }

  public startReorderTutorial(initialStepIndex = 0): void {
    this.startTutorial(COMMERCE_REORDER_PO_TUTORIAL, initialStepIndex);
  }

  public startInventorySheetTutorial(initialStepIndex = 0): void {
    this.startTutorial(COMMERCE_INVENTORY_SHEET_TUTORIAL, initialStepIndex);
  }

  public startStockAdjustmentTutorial(initialStepIndex = 0): void {
    this.startTutorial(COMMERCE_STOCK_ADJUSTMENT_TUTORIAL, initialStepIndex);
  }

  public startSuppliersTutorial(initialStepIndex = 0): void {
    this.startTutorial(COMMERCE_SUPPLIERS_TUTORIAL, initialStepIndex);
  }

  public startNewSupplierModalTutorial(initialStepIndex = 0): void {
    this.startTutorial(COMMERCE_NEW_SUPPLIER_MODAL_TUTORIAL, initialStepIndex);
  }

  public startStockTutorial(initialStepIndex = 0): void {
    this.startTutorial(COMMERCE_STOCK_TUTORIAL, initialStepIndex);
  }

  public startProductDetailsTutorial(initialStepIndex = 0): void {
    this.startTutorial(COMMERCE_PRODUCT_DETAILS_TUTORIAL, initialStepIndex);
  }

  public startBillingTutorial(subTab: 'invoices' | 'pending' | 'quotes' = 'invoices', initialStepIndex = 0): void {
    this.billingSubTab = subTab;
    let scenario = COMMERCE_BILLING_INVOICES_TUTORIAL;
    if (subTab === 'pending') {
      scenario = COMMERCE_BILLING_PENDING_TUTORIAL;
    } else if (subTab === 'quotes') {
      scenario = COMMERCE_BILLING_QUOTES_TUTORIAL;
    }
    this.startTutorial(scenario, initialStepIndex);
  }

  public startBillingQuoteModalTutorial(initialStepIndex = 0): void {
    this.startTutorial(COMMERCE_BILLING_QUOTE_MODAL_TUTORIAL, initialStepIndex);
  }

  public startBillingPrintModalTutorial(initialStepIndex = 0): void {
    this.startTutorial(COMMERCE_BILLING_PRINT_MODAL_TUTORIAL, initialStepIndex);
  }

  public startAuditLogTutorial(initialStepIndex = 0): void {
    this.startTutorial(MERCHANT_AUDIT_LOG_TUTORIAL, initialStepIndex);
  }

  public startCoutureOverviewTutorial(initialStepIndex = 0): void {
    this.startTutorial(COUTURE_OVERVIEW_TUTORIAL, initialStepIndex);
  }

  public startContextualOverviewTutorial(saasModule?: string, initialStepIndex = 0): void {
    const scenario = this.getOverviewScenarioForSaas(saasModule);
    this.startTutorial(scenario, initialStepIndex);
  }

  public onSaasChanged(newSaas: string, newPage: string = 'dashboard'): void {
    const wasActive = this.isActive;

    // 1. Abort any active speech and clear the voice queue immediately
    LanguageEngine.stopSpeech();
    this.tutorialVoiceLock = false;
    this.activeTutorialStep = null;
    this.tutorialVoiceQueue = [];
    this.activeNarrationToken++;

    // 2. Clear previous scenario state
    this.isActive = false;
    this.currentStepIndex = -1;
    this.currentScenario = null;
    this.isAutoPresenting = false;
    this.isWaitingForTab = false;
    this.waitingMessage = null;

    if (this.unsubscribeEventBus) {
      this.unsubscribeEventBus();
      this.unsubscribeEventBus = null;
    }

    // 3. Update ContextEngine with the new active SaaS and page
    ContextEngine.updateContext({
      activeSaaS: newSaas as any,
      currentPage: newPage
    });

    this.notify();

    // 4. If a tutorial was running, restart at step 1 in the new SaaS context
    if (wasActive) {
      const newScenario = this.getScenarioForPage(newPage, newSaas);
      if (newScenario) {
        this.startTutorial(newScenario, 0);
      }
    }
  }

  public stopTutorial(): void {
    this.isActive = false;
    this.isFunctionChooserVisible = false;
    this.isWaitingForTab = false;
    this.waitingMessage = null;
    this.currentStepIndex = -1;
    this.currentScenario = null;
    this.isAutoPresenting = false;
    this.tutorialVoiceLock = false;
    this.activeTutorialStep = null;
    this.tutorialVoiceQueue = [];
    this.activeNarrationToken++;

    if (this.unsubscribeEventBus) {
      this.unsubscribeEventBus();
      this.unsubscribeEventBus = null;
    }
    LanguageEngine.stopSpeech();
    this.notify();
  }

  public getCurrentStep(): TutorialStep | null {
    if (!this.isActive || !this.currentScenario || this.currentStepIndex < 0) return null;
    return this.currentScenario.steps[this.currentStepIndex] || null;
  }

  public getStepCount(): number {
    return this.currentScenario ? this.currentScenario.steps.length : 0;
  }

  public isTutorialActive(): boolean {
    return this.isActive;
  }

  public nextStep(): void {
    if (!this.currentScenario || !this.isActive) return;
    if (this.currentStepIndex < this.currentScenario.steps.length - 1) {
      this.isAutoPresenting = false;
      this.requestTutorialStep(this.currentStepIndex + 1, 'immediate');
    } else {
      this.isAutoPresenting = false;
      this.enqueueNarration({
        id: 'tutorial_finished_congratulations',
        text: "Félicitations ! Vous avez terminé le tutoriel guidé Acom IA.",
        lang: 'fr',
        priority: 'immediate'
      });
      setTimeout(() => {
        this.stopTutorial();
      }, 3500);
    }
  }

  public prevStep(): void {
    if (!this.currentScenario || !this.isActive) return;
    if (this.currentStepIndex > 0) {
      this.isAutoPresenting = false;
      this.requestTutorialStep(this.currentStepIndex - 1, 'immediate');
    }
  }

  public skipStep(): void {
    this.nextStep();
  }

  private handleBusinessEvent(eventType: string): void {
    const currentStep = this.getCurrentStep();
    if (currentStep && currentStep.expectedEvent === eventType) {
      setTimeout(() => {
        this.nextStep();
      }, 800);
    }
  }

  public pauseNarration(): void {
    LanguageEngine.pauseSpeech();
    this.notify();
  }

  public resumeNarration(): void {
    if (LanguageEngine.isSpeechPaused()) {
      LanguageEngine.resumeSpeech();
    } else if (this.currentStepIndex >= 0) {
      this.requestTutorialStep(this.currentStepIndex, 'immediate');
    }
    this.notify();
  }

  public stopNarration(): void {
    this.isAutoPresenting = false;
    this.tutorialVoiceLock = false;
    this.activeTutorialStep = null;
    this.tutorialVoiceQueue = [];
    this.activeNarrationToken++;
    LanguageEngine.stopSpeech();
    this.notify();
  }

  public repeatCurrentStep(): void {
    if (this.currentStepIndex >= 0) {
      this.requestTutorialStep(this.currentStepIndex, 'immediate');
    }
  }

  public isNarrationPaused(): boolean {
    return LanguageEngine.isSpeechPaused();
  }
}

export const TutorialEngine = new TutorialEngineService();
