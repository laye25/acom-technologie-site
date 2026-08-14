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

export const COUTURE_CLIENTS_TUTORIAL: TutorialScenario = {
  id: 'couture.clients.list',
  title: 'Fichier Clients Couture — Tableau de Bord',
  description: 'Présentation complète du fichier clients, des profils morphologiques et des mensurations de confection.',
  saasModule: 'couture',
  estimatedDurationSec: 300,
  steps: [
    {
      stepNumber: 1,
      title: '1. Fichier Clients Couture',
      description: 'Présentation du module de gestion des clients et des mesures.',
      targetAcomId: 'clients.title',
      actionToPerform: 'observe',
      speechFr: "Bienvenue dans votre fichier Clients Couture. Cet espace centralise toutes les fiches clients et les profils morphologiques de votre atelier.",
      speechWolof: "Dalal ak jàmm ci sa Fichier Clients Couture. Fi dafay dajale fiches clients yi ak natt yu atelier bi yëpp.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Compteur de Clients',
      description: 'Indicateur en temps réel du nombre de clients enregistrés.',
      targetAcomId: 'clients.counter',
      actionToPerform: 'observe',
      speechFr: "Le compteur indique actuellement qu'aucun client n'est encore enregistré dans votre fichier d'atelier.",
      speechWolof: "Compteur bi dafay wone ne amagul benn client bu bindu ci sa fichier.",
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. Synchronisation Cloud & Hors-ligne',
      description: 'Statut de synchronisation locale et cloud.',
      targetAcomId: 'clients.sync_btn',
      actionToPerform: 'observe',
      speechFr: "Le bouton de synchronisation permet d'actualiser et de sauvegarder vos fiches clients entre votre appareil local et le serveur sécurisé.",
      speechWolof: "Bouton de synchronisation bi dafay mayé nga synchroniser sa fiches clients ci sufe ak ci cloud bi.",
      stepCategory: 'action'
    },
    {
      stepNumber: 4,
      title: '4. Export Excel & CSV',
      description: 'Exportation de la base clients au format tableur.',
      targetAcomId: 'clients.export_excel_btn',
      actionToPerform: 'observe',
      speechFr: "Ce bouton exporte l'ensemble de votre base clients et leurs mensurations dans un fichier tableur Excel ou CSV.",
      speechWolof: "Bouton bi dafay génne sa liste clients ak natt yi ci fichier Excel wala CSV.",
      stepCategory: 'action'
    },
    {
      stepNumber: 5,
      title: '5. Impression & Export PDF',
      description: 'Export PDF et impression des fiches de mesures.',
      targetAcomId: 'clients.export_pdf_btn',
      actionToPerform: 'observe',
      speechFr: "Ce bouton permet d'imprimer directement ou d'exporter au format PDF les fiches de mesures de vos clients pour votre atelier.",
      speechWolof: "Bouton bi dafay mayé nga imprimer fiches de mesures yi ci PDF ngir sa liggéey ci atelier bi.",
      stepCategory: 'action'
    },
    {
      stepNumber: 6,
      title: '6. Bouton « + Ajouter un Client »',
      description: 'Bouton d\'action principal pour créer une nouvelle fiche.',
      targetAcomId: 'clients.add_btn',
      actionToPerform: 'observe',
      speechFr: "Le bouton principal « + Ajouter un Client » permet de lancer l'Assistant de Prise de Mesures pour enregistrer une nouvelle personne et configurer son vêtement.",
      speechWolof: "Bouton « + Ajouter un Client » bi dafay ubbi assistant natt bi ngir bind client bu bees.",
      stepCategory: 'action'
    },
    {
      stepNumber: 7,
      title: '7. Barre de Recherche Rapide',
      description: 'Filtre de recherche instantanée par nom ou téléphone.',
      targetAcomId: 'clients.search',
      actionToPerform: 'observe',
      speechFr: "La barre de recherche permet de filtrer instantanément vos clients par nom, prénom ou numéro de téléphone dès que votre base s'étoffe.",
      speechWolof: "Barre de recherche bi da lay may nga wër sa client ci tur, sant wala numéro téléphone.",
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: '8. Zone d\'État — Aucun Client Enregistré',
      description: 'Affichage de l\'état initial vide.',
      targetAcomId: 'clients.empty_state',
      actionToPerform: 'observe',
      speechFr: "Actuellement, la liste est vide car aucun client n'a encore été créé. Cliquez sur « Ajouter un Client » pour créer votre première fiche d'atelier.",
      speechWolof: "Léegi liste bi dafa vide ndaxte amagul client. Cuqal ci « Ajouter un Client » ngir tàmbli.",
      stepCategory: 'info'
    },
    {
      stepNumber: 9,
      title: '9. Démarrage de la Création',
      description: 'Invitation à lancer la création.',
      targetAcomId: 'clients.add_btn',
      actionToPerform: 'click',
      speechFr: "Cliquez sur « Ajouter un Client » pour débuter le parcours guidé de création d'une fiche client et de prise de mesures.",
      speechWolof: "Bëssal ci « Ajouter un Client » ngir tàmbli paas bu njëkk bi ci natt yi.",
      stepCategory: 'action'
    }
  ]
};

export const COUTURE_ADD_CLIENT_TUTORIAL: TutorialScenario = {
  id: 'couture.clients.add-client',
  title: 'Ajouter un client — Parcours Client Couture',
  description: 'Présentation complète interactive du Moteur Intelligent de Prise de Mesures v2.5.',
  saasModule: 'couture',
  estimatedDurationSec: 420,
  steps: [
    {
      stepNumber: 1,
      title: '1. Fichier Clients & Bouton "+ Ajouter un Client"',
      description: 'Lancer la création d\'une nouvelle fiche client en atelier.',
      targetAcomId: 'clients.add_btn',
      actionToPerform: 'click',
      speechFr: "Vous êtes dans votre fichier Clients Couture. Cliquez sur le bouton « + Ajouter un Client » pour ouvrir l'Assistant de Prise de Mesures et commencer l'enregistrement.",
      speechWolof: "Yaa ngi ci Fichier Clients Couture. Bëssal ci « + Ajouter un Client » ngir ubbi assistant natt bi te tàmbli bind client bu bees bi.",
      stepCategory: 'action'
    },
    {
      stepNumber: 2,
      title: '2. Bandeau du Parcours (5 Étapes)',
      description: 'Présentation du bandeau de progression unifié.',
      targetAcomId: 'add_client.stepper_banner',
      actionToPerform: 'observe',
      speechFr: "Ce parcours est composé de cinq étapes. Nous allons commencer par les informations du client, puis choisir le vêtement, prendre les mensurations, effectuer la validation atelier et terminer par la création de la fiche client.",
      speechWolof: "Parcours bi 5 paas la am : Informations Client, Choix Vêtement, Prise de Mesures, Validation Atelier ak Résumé Finalisation.",
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: '3. Titre : Informations Générales du Client',
      description: 'Rôle de la première étape.',
      targetAcomId: 'add_client.step1_title',
      actionToPerform: 'observe',
      speechFr: "Cette première étape permet d'enregistrer les informations générales du client avant de définir le vêtement et les mensurations nécessaires à sa confection.",
      speechWolof: "Paas bu jëkk bi dafay servir ci bind informations générales client bi lu jiitu ñaw bi ak natt yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 4,
      title: '4. Sous-titre & Objectif d\'Atelier',
      description: 'Présentation du sous-titre de l\'étape 1.',
      targetAcomId: 'add_client.step1_subtitle',
      actionToPerform: 'observe',
      speechFr: "Renseignez les coordonnées de la personne pour l'attribution des mensurations et le suivi d'atelier.",
      speechWolof: "Bindal coordonnées client bi ngir mën a ràññee natt am ak suivi d'atelier bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: '5. Champ — Prénom *',
      description: 'Présentation du champ prénom.',
      targetAcomId: 'add_client.firstname',
      actionToPerform: 'type',
      speechFr: "Saisissez ici le prénom du client. Ce champ permet d'identifier la personne dans sa fiche client. Le symbole astérisque indique qu'il s'agit d'une information obligatoire.",
      speechWolof: "Bindal turu client bi fi. Astérisque bi dafay wone ne lii du lu ñu mën a fàtte.",
      stepCategory: 'required'
    },
    {
      stepNumber: 6,
      title: '6. Champ — Nom de Famille *',
      description: 'Présentation du champ nom de famille.',
      targetAcomId: 'add_client.lastname',
      actionToPerform: 'type',
      speechFr: "Saisissez ici le nom de famille du client. Cette information sera associée à sa fiche et permettra de le retrouver plus facilement dans le fichier Clients Couture.",
      speechWolof: "Bindal fi santu client bi ngir mën ko gën a yomb a fekk ci fichier clients bi.",
      stepCategory: 'required'
    },
    {
      stepNumber: 7,
      title: '7. Genre / Silhouette d\'Atelier *',
      description: 'Sélecteur de silhouette d\'atelier.',
      targetAcomId: 'add_client.gender_selector',
      actionToPerform: 'observe',
      speechFr: "Cette sélection permet de définir la silhouette d'atelier utilisée pour le parcours de confection et les mensurations.",
      speechWolof: "Sélection lii dafay définir silhouette atelier bi ñuy jëfandikoog ci ñaw bi ak natt yi.",
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: '8. Choix — Homme',
      description: 'Profil de silhouette masculin.',
      targetAcomId: 'add_client.gender_male',
      actionToPerform: 'observe',
      speechFr: "Homme permet d'utiliser le profil de silhouette correspondant au parcours masculin. Dans cet exemple, la silhouette Homme est actuellement sélectionnée.",
      speechWolof: "Homme dafay jël profil silhouette goor bi. Ci exemple bi, Homme mooy silhouette bi tànnu légui.",
      stepCategory: 'info'
    },
    {
      stepNumber: 9,
      title: '9. Choix — Femme',
      description: 'Profil de silhouette féminin.',
      targetAcomId: 'add_client.gender_female',
      actionToPerform: 'observe',
      speechFr: "Femme permet d'utiliser le profil de silhouette correspondant au parcours féminin.",
      speechWolof: "Femme dafay jël profil silhouette jigéen bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 10,
      title: '10. Choix — Enfant',
      description: 'Profil de silhouette enfant.',
      targetAcomId: 'add_client.gender_child',
      actionToPerform: 'observe',
      speechFr: "Enfant permet d'utiliser le profil de silhouette adapté au parcours enfant.",
      speechWolof: "Enfant dafay jël profil silhouette xalale bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 11,
      title: '11. Champ — Téléphone',
      description: 'Présentation du champ téléphone.',
      targetAcomId: 'add_client.phone',
      actionToPerform: 'type',
      speechFr: "Indiquez ici le numéro de téléphone du client. Il pourra être utilisé pour le suivi de la commande ou pour contacter le client concernant son vêtement.",
      speechWolof: "Bindal fi numéro téléphone client bi ngir suivi commande walla jot ko sooy ñaw.",
      stepCategory: 'info'
    },
    {
      stepNumber: 12,
      title: '12. Champ — Adresse Email',
      description: 'Présentation du champ adresse e-mail.',
      targetAcomId: 'add_client.email',
      actionToPerform: 'type',
      speechFr: "Vous pouvez renseigner ici l'adresse e-mail du client afin de conserver ses coordonnées dans sa fiche.",
      speechWolof: "Mën nga fi bind email client bi ngir denc coordonnées am ci fiche bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 13,
      title: '13. Champ — Adresse de livraison / Quartier',
      description: 'Présentation de l\'adresse de livraison.',
      targetAcomId: 'add_client.address',
      actionToPerform: 'type',
      speechFr: "Ce champ permet d'indiquer le quartier ou l'adresse de livraison associée au client.",
      speechWolof: "Champ bi dafay wone quartier walla dëkkuwaay livraison client bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 14,
      title: '14. Champ — Notes & Préférences Morphologiques',
      description: 'Spécificités et aisance de coupe.',
      targetAcomId: 'add_client.notes',
      actionToPerform: 'type',
      speechFr: "Utilisez cette zone pour enregistrer les informations complémentaires utiles à l'atelier, par exemple des préférences de coupe, d'aisance ou des particularités morphologiques.",
      speechWolof: "Bindal fi lepp lu am solo ci style, aisance de coupe walla morphologie client bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 15,
      title: '15. Fin du Formulaire & Regroupement',
      description: 'Synthèse du formulaire avant validation.',
      targetAcomId: 'add_client.form_footer_divider',
      actionToPerform: 'observe',
      speechFr: "Les informations principales sont maintenant regroupées. Vous pouvez vérifier les données saisies avant de passer à l'étape suivante.",
      speechWolof: "Informations principales yi bennoo nañu. Mën nga vérifier li nga bind bala nga dem ci paas bu topp.",
      stepCategory: 'info'
    },
    {
      stepNumber: 16,
      title: '16. Bouton « CONTINUER : CHOIX DU VÊTEMENT »',
      description: 'Attente du clic utilisateur vers l\'étape 2.',
      targetAcomId: 'add_client.btn_step2',
      actionToPerform: 'click',
      speechFr: "Lorsque les informations nécessaires sont renseignées, cliquez sur ce bouton pour passer à la deuxième étape : le choix du vêtement à confectionner.",
      speechWolof: "Soo parée ci informations yi, bëssal ci bouton bi ngir dem ci paas bu ñaar bi : choix du vêtement.",
      stepCategory: 'action'
    },
    {
      stepNumber: 17,
      title: '17. Barre de Progression — 2. Choix du Vêtement',
      description: 'Présentation de l\'étape 2 sur le bandeau de progression.',
      targetAcomId: 'add_client.step_tab_2',
      actionToPerform: 'observe',
      speechFr: "Vous êtes maintenant à la deuxième étape du parcours : le choix du vêtement. Cette étape permet de sélectionner le modèle qui sera utilisé pour définir automatiquement le profil de mesures nécessaire à la confection.",
      speechWolof: "Yaa ngi ci paas bu ñaar bi : choix du vêtement. Mën nga fi tànn modèle bi ngir définir profil de mesures bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 18,
      title: '18. Titre : Modèle & Vêtement à Confectionner',
      description: 'Présentation de la section Choix du Vêtement.',
      targetAcomId: 'add_client.step2_title',
      actionToPerform: 'observe',
      speechFr: "Cette section vous permet de choisir le modèle de vêtement que vous souhaitez confectionner pour ce client.",
      speechWolof: "Section lii da lay may nga tànn modèle vêtement bi nga bëgg ñawal client bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 19,
      title: '19. Sous-titre : Chargement Automatique du Profil',
      description: 'Explication du chargement automatique du profil de mesures.',
      targetAcomId: 'add_client.step2_subtitle',
      actionToPerform: 'observe',
      speechFr: "Une fois le modèle choisi, le système charge automatiquement les mesures nécessaires à sa confection.",
      speechWolof: "Soo tànnee modèle bi, système bi dafay charger automatiquement natt yi am solo.",
      stepCategory: 'info'
    },
    {
      stepNumber: 20,
      title: '20. Modèle Actif',
      description: 'Affichage du vêtement actuellement sélectionné.',
      targetAcomId: 'add_client.active_model_block',
      actionToPerform: 'observe',
      speechFr: "Ce bloc indique le modèle actuellement actif. Il permet de vérifier immédiatement quel vêtement sera utilisé pour la prochaine étape de prise de mesures.",
      speechWolof: "Bloc lii dafay wone modèle bi tànnu légui ngir xam vêtement bi ñuy natt.",
      stepCategory: 'info'
    },
    {
      stepNumber: 21,
      title: '21. Catalogue — Modèle / Vêtement à Confectionner',
      description: 'Présentation du catalogue de modèles.',
      targetAcomId: 'add_client.garment_header_title',
      actionToPerform: 'observe',
      speechFr: "Cette zone contient le catalogue des modèles disponibles pour la confection.",
      speechWolof: "Zone lii mooy catalogue modèle yi nekk ci atelier bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 22,
      title: '22. Bouton « + Créer un Vêtement »',
      description: 'Création d\'un modèle sur-mesure personnalisé.',
      targetAcomId: 'add_client.btn_create_garment',
      actionToPerform: 'observe',
      speechFr: "Si le modèle recherché n'existe pas dans le catalogue, ce bouton permet de créer un nouveau modèle de vêtement.",
      speechWolof: "Soo fekkul modèle bi nga bëgg ci catalogue bi, bouton lii da lay may nga créer modèle bu bées.",
      stepCategory: 'info'
    },
    {
      stepNumber: 23,
      title: '23. Filtre — Toutes les Catégories',
      description: 'Filtre d\'affichage de l\'ensemble des modèles.',
      targetAcomId: 'add_client.filter_all',
      actionToPerform: 'observe',
      speechFr: "Ce filtre affiche l'ensemble des modèles disponibles.",
      speechWolof: "Filtre lii dafay wone modèle yëpp nekk ci atelier bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 24,
      title: '24. Filtre — Couture Africaine',
      description: 'Catégorie tenues traditionnelles et boubous.',
      targetAcomId: 'add_client.filter_couture_africaine',
      actionToPerform: 'observe',
      speechFr: "Ce filtre permet d'afficher les modèles classés dans la catégorie Couture Africaine.",
      speechWolof: "Filtre lii dafay wone modèle yi nekk ci Couture Africaine.",
      stepCategory: 'info'
    },
    {
      stepNumber: 25,
      title: '25. Filtre — Silhouette Femme',
      description: 'Modèles destinés aux silhouettes féminines.',
      targetAcomId: 'add_client.filter_femme',
      actionToPerform: 'observe',
      speechFr: "Ce filtre permet d'afficher les modèles destinés aux silhouettes féminines.",
      speechWolof: "Filtre lii dafay wone modèle jigéen yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 26,
      title: '26. Filtre — Silhouette Enfant',
      description: 'Modèles adaptés aux enfants.',
      targetAcomId: 'add_client.filter_enfant',
      actionToPerform: 'observe',
      speechFr: "Ce filtre permet d'afficher les modèles destinés aux enfants.",
      speechWolof: "Filtre lii dafay wone modèle xalale yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 27,
      title: '27. Filtre — Couture Internationale',
      description: 'Costumes, vestes et tenues modernes.',
      targetAcomId: 'add_client.filter_couture_internationale',
      actionToPerform: 'observe',
      speechFr: "Ce filtre permet d'afficher les modèles classés dans la catégorie Couture Internationale.",
      speechWolof: "Filtre lii dafay wone modèle Couture Internationale.",
      stepCategory: 'info'
    },
    {
      stepNumber: 28,
      title: '28. Carte 1 — Grand Boubou 3 Pièces / Agbada',
      description: 'Modèle Grand Boubou traditional.',
      targetAcomId: 'add_client.garment_card_1',
      actionToPerform: 'observe',
      speechFr: "Cette carte correspond au modèle Grand Boubou 3 Pièces / Agbada. Le nombre de mesures affiché indique les mesures nécessaires à son profil de confection.",
      speechWolof: "Carte bi mooy Grand Boubou 3 Pièces / Agbada. Limu natt bi mooy wone li am solo ci ñaw bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 29,
      title: '29. Carte 2 — Petit Boubou / Senegalese Boubou',
      description: 'Modèle Petit Boubou sénégalais.',
      targetAcomId: 'add_client.garment_card_2',
      actionToPerform: 'observe',
      speechFr: "Cette carte correspond au modèle Petit Boubou / Senegalese Boubou. Elle indique sa catégorie et le nombre de mesures d'atelier requises.",
      speechWolof: "Carte bi mooy Petit Boubou. Da lay wone catégorie am ak limu natt yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 30,
      title: '30. Carte 3 — Ensemble Bazin Riche / Rigide',
      description: 'Modèle Ensemble Bazin.',
      targetAcomId: 'add_client.garment_card_3',
      actionToPerform: 'observe',
      speechFr: "Cette carte correspond au modèle Ensemble Bazin Riche / Rigide.",
      speechWolof: "Carte bi mooy Ensemble Bazin Riche.",
      stepCategory: 'info'
    },
    {
      stepNumber: 31,
      title: '31. Carte 4 — Kaftan / Djellaba Homme',
      description: 'Modèle Kaftan traditionnel.',
      targetAcomId: 'add_client.garment_card_4',
      actionToPerform: 'observe',
      speechFr: "Cette carte correspond au modèle Kaftan / Djellaba Homme.",
      speechWolof: "Carte bi mooy Kaftan / Djellaba Homme.",
      stepCategory: 'info'
    },
    {
      stepNumber: 32,
      title: '32. Carte 5 — Agbada Royal West Africa',
      description: 'Modèle Agbada Prestige.',
      targetAcomId: 'add_client.garment_card_5',
      actionToPerform: 'observe',
      speechFr: "Cette carte correspond au modèle Agbada Royal West Africa.",
      speechWolof: "Carte bi mooy Agbada Royal West Africa.",
      stepCategory: 'info'
    },
    {
      stepNumber: 33,
      title: '33. Carte 6 — Dashiki / Tunique Imprimée',
      description: 'Modèle Dashiki et tunique.',
      targetAcomId: 'add_client.garment_card_6',
      actionToPerform: 'observe',
      speechFr: "Cette carte correspond au modèle Dashiki / Tunique Imprimée.",
      speechWolof: "Carte bi mooy Dashiki / Tunique Imprimée.",
      stepCategory: 'info'
    },
    {
      stepNumber: 34,
      title: '34. Carte 7 — Gandoura Traditionnelle',
      description: 'Modèle Gandoura artisanale.',
      targetAcomId: 'add_client.garment_card_7',
      actionToPerform: 'observe',
      speechFr: "Cette carte correspond au modèle Gandoura Traditionnelle.",
      speechWolof: "Carte bi mooy Gandoura Traditionnelle.",
      stepCategory: 'info'
    },
    {
      stepNumber: 35,
      title: '35. Carte 8 — Tunique / Mande Shirt',
      description: 'Modèle Tunique Mandingue.',
      targetAcomId: 'add_client.garment_card_8',
      actionToPerform: 'observe',
      speechFr: "Cette carte correspond au modèle Tunique / Mande Shirt.",
      speechWolof: "Carte bi mooy Tunique / Mande Shirt.",
      stepCategory: 'info'
    },
    {
      stepNumber: 36,
      title: '36. Zone de Défilement des Modèles',
      description: 'Scrollbar du catalogue de vêtements.',
      targetAcomId: 'add_client.garment_scroll_area',
      actionToPerform: 'observe',
      speechFr: "La liste contient davantage de modèles. Utilisez cette zone de défilement pour parcourir les autres modèles disponibles.",
      speechWolof: "Am na yeneen modèle ci suuf. Mën nga défiler catalogue bi ngir gis yeneen vêtement.",
      stepCategory: 'info'
    },
    {
      stepNumber: 37,
      title: '37. Profil de Mesures Chargé',
      description: 'Synthèse du profil de mesures du modèle sélectionné.',
      targetAcomId: 'add_client.selected_garment_summary',
      actionToPerform: 'observe',
      speechFr: "Le modèle sélectionné possède maintenant un profil de mesures. Ici, le système indique les mesures obligatoires et facultatives requises pour la confection.",
      speechWolof: "Modèle bi tànnu am na légui profil de mesures. Système bi dafay wone natt yi am solo ci paas 3 bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 38,
      title: '38. Bouton « LANCER LA PRISE DE MESURES »',
      description: 'Attente du clic utilisateur pour l\'étape 3.',
      targetAcomId: 'add_client.btn_step3',
      actionToPerform: 'click',
      speechFr: "Lorsque le modèle est correctement sélectionné, cliquez sur ce bouton pour passer à la prise de mesures du client.",
      speechWolof: "Soo tànnee modèle bi paré, bëssal ci bouton bi ngir dem ci natt client bi.",
      stepCategory: 'action'
    },
    {
      stepNumber: 39,
      title: '39. Barre de Progression — 3. Prise de Mesures',
      description: 'Présentation de l\'étape 3 sur le bandeau de progression.',
      targetAcomId: 'add_client.step_tab_3',
      actionToPerform: 'observe',
      speechFr: "Vous êtes maintenant à la troisième étape du parcours Client Couture : la prise de mesures. Cette étape permet d'enregistrer les mensurations nécessaires à la confection du vêtement sélectionné et de vérifier leur cohérence. Le système connaît déjà le client et le modèle choisi à l'étape précédente. Il vous guide maintenant mesure par mesure.",
      speechWolof: "Yaa ngi ci paas bu ñett bi : natt yi. Paas bi da lay may nga bind natt yi am solo ngir ñaw vêtement bi nga tànn.",
      stepCategory: 'info'
    },
    {
      stepNumber: 40,
      title: '40. Panneau « Guide & Silhouette »',
      description: 'Présentation du panneau d\'aide.',
      targetAcomId: 'add_client.guide_title',
      actionToPerform: 'observe',
      speechFr: "Cette zone vous accompagne pendant la prise de mesures. Elle fournit un guide visuel et des indications pratiques pour effectuer correctement chaque mesure.",
      speechWolof: "Zone lii da lay dimbali ci natt yi, di la wone nuñuy natté.",
      stepCategory: 'info'
    },
    {
      stepNumber: 41,
      title: '41. Badge Temps Réel',
      description: 'Information sur l\'adaptabilité.',
      targetAcomId: 'add_client.guide_badge_realtime',
      actionToPerform: 'observe',
      speechFr: "Les informations affichées ici s'adaptent en temps réel à la mesure actuellement sélectionnée.",
      speechWolof: "Xibaar yi fi nekk dañuy soppiku ci temps réel bés bu nga tànnee natt bu bées.",
      stepCategory: 'info'
    },
    {
      stepNumber: 42,
      title: '42. Profil Homme',
      description: 'Sélecteur de profil masculin.',
      targetAcomId: 'add_client.gender_homme',
      actionToPerform: 'observe',
      speechFr: "Le profil Homme est actuellement sélectionné.",
      speechWolof: "Profil góor bi moo tànnu.",
      stepCategory: 'info'
    },
    {
      stepNumber: 43,
      title: '43. Profil Femme',
      description: 'Sélecteur de profil féminin.',
      targetAcomId: 'add_client.gender_femme',
      actionToPerform: 'observe',
      speechFr: "Cette option permet d'adapter le guide à une silhouette féminine.",
      speechWolof: "Lii da lay may nga tànn profil jigéen.",
      stepCategory: 'info'
    },
    {
      stepNumber: 44,
      title: '44. Profil Enfant',
      description: 'Sélecteur de profil enfant.',
      targetAcomId: 'add_client.gender_enfant',
      actionToPerform: 'observe',
      speechFr: "Cette option permet d'adapter le guide à une silhouette enfant.",
      speechWolof: "Lii da lay may nga tànn profil xale.",
      stepCategory: 'info'
    },
    {
      stepNumber: 45,
      title: '45. Modèle Actif',
      description: 'Affichage du modèle utilisé pour les mesures.',
      targetAcomId: 'add_client.guide_active_model_info',
      actionToPerform: 'observe',
      speechFr: "Le modèle actif est l'Ensemble Africain 2 Pièces, composé d'une chemise et d'un pantalon. Les mesures affichées correspondent donc au profil nécessaire pour ce modèle.",
      speechWolof: "Modèle bi tànnu mooy Ensemble Africain 2 Pièces. Natt yi fi nekk ñooy natt yi am solo ngir ñaw ko.",
      stepCategory: 'info'
    },
    {
      stepNumber: 46,
      title: '46. Mesures Requises (Badge)',
      description: 'Nombre de mesures obligatoires.',
      targetAcomId: 'add_client.guide_active_model_badge',
      actionToPerform: 'observe',
      speechFr: "Ce modèle nécessite neuf mesures obligatoires. Le système va vérifier leur présence et leur cohérence avant de permettre la validation de l'atelier.",
      speechWolof: "Modèle bi dafa laaj 9 natt yu am solo.",
      stepCategory: 'info'
    },
    {
      stepNumber: 47,
      title: '47. Mesure Actuellement Sélectionnée',
      description: 'Indicateur de la mesure active.',
      targetAcomId: 'add_client.guide_selected_measure_badge',
      actionToPerform: 'observe',
      speechFr: "La mesure actuellement sélectionnée est le Tour de Poitrine. Le panneau de droite affiche les instructions et le champ correspondant à cette mesure.",
      speechWolof: "Natt bi tànnu légui mooy Tour de Poitrine. Instructions yi ak champ bi dafay wone loolu.",
      stepCategory: 'info'
    },
    {
      stepNumber: 48,
      title: '48. Carte d\'Information de la Mesure',
      description: 'Titre et identifiant de la mesure.',
      targetAcomId: 'add_client.guide_measure_info_header',
      actionToPerform: 'observe',
      speechFr: "Cette fiche identifie la mesure actuellement sélectionnée. Le code POI correspond au Tour de Poitrine et cette mesure est applicable aux profils concernés par ce modèle.",
      speechWolof: "Fiche bi dafay wone natt bi tànnu légui.",
      stepCategory: 'info'
    },
    {
      stepNumber: 49,
      title: '49. Description de la Mesure',
      description: 'Description détaillée.',
      targetAcomId: 'add_client.guide_measure_description',
      actionToPerform: 'observe',
      speechFr: "Il s'agit de la circonférence horizontale du torse, mesurée au niveau de la poitrine, en passant par les points de référence indiqués.",
      speechWolof: "Mooy tour poitrine bi, nga natt ko ci niveau poitrine bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 50,
      title: '50. Étapes de Prise de Mesure — Pas-à-Pas',
      description: 'En-tête des instructions.',
      targetAcomId: 'add_client.guide_steps_header',
      actionToPerform: 'observe',
      speechFr: "Cette section détaille les étapes pour prendre la mesure correctement.",
      speechWolof: "Section lii da lay wone ni ñuy natté.",
      stepCategory: 'info'
    },
    {
      stepNumber: 51,
      title: '51. Instruction 1',
      description: 'Première étape.',
      targetAcomId: 'add_client.guide_step_1',
      actionToPerform: 'observe',
      speechFr: "Passez le mètre sous les aisselles.",
      speechWolof: "Jaaral mètre bi ci suufu noq yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 52,
      title: '52. Instruction 2',
      description: 'Deuxième étape.',
      targetAcomId: 'add_client.guide_step_2',
      actionToPerform: 'observe',
      speechFr: "Faites-le passer sur la pointe du buste / poitrine.",
      speechWolof: "Jaaral ko ci pointe poitrine bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 53,
      title: '53. Instruction 3',
      description: 'Troisième étape.',
      targetAcomId: 'add_client.guide_step_3',
      actionToPerform: 'observe',
      speechFr: "Gardez le mètre bien horizontal dans le dos sans affaissement. Cette position permet d'obtenir une mesure régulière et exploitable.",
      speechWolof: "Mètre bi dafa wara tollu ci ginnaaw bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 54,
      title: '54. Silhouette Visuelle',
      description: 'Illustration de la mesure.',
      targetAcomId: 'add_client.guide_silhouette_svg',
      actionToPerform: 'observe',
      speechFr: "Cette silhouette représente visuellement la zone du corps concernée par la mesure. Les repères permettent de comprendre où positionner le mètre.",
      speechWolof: "Dessin bi da lay wone fu mètre bi wara nekk.",
      stepCategory: 'info'
    },
    {
      stepNumber: 55,
      title: '55. Bonnes Pratiques',
      description: 'En-tête des recommandations.',
      targetAcomId: 'add_client.guide_best_practices_header',
      actionToPerform: 'observe',
      speechFr: "Cette section liste les bonnes pratiques pour une mesure précise.",
      speechWolof: "Section lii da lay wone bonnes pratiques yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 56,
      title: '56. Recommandation 1',
      description: 'Première bonne pratique.',
      targetAcomId: 'add_client.guide_best_practice_1',
      actionToPerform: 'observe',
      speechFr: "Demandez au client d'inspirer normalement et non de gonfler la poitrine. L'objectif est d'obtenir une mesure naturelle et reproductible.",
      speechWolof: "Ñaanal client bi mu noyyi normalement.",
      stepCategory: 'info'
    },
    {
      stepNumber: 57,
      title: '57. Recommandation 2',
      description: 'Deuxième bonne pratique.',
      targetAcomId: 'add_client.guide_best_practice_2',
      actionToPerform: 'observe',
      speechFr: "Pour les dames, prendre la mesure avec le soutien-gorge de port quotidien.",
      speechWolof: "Pour jigéen yi, natt ak soutien-gorge bi ñuy sol bés bu nekk.",
      stepCategory: 'info'
    },
    {
      stepNumber: 58,
      title: '58. Pièges à Éviter',
      description: 'En-tête des pièges.',
      targetAcomId: 'add_client.guide_common_mistakes_header',
      actionToPerform: 'observe',
      speechFr: "Cette section liste les erreurs fréquentes à éviter.",
      speechWolof: "Section lii da lay wone erreurs yi ñuy def souvent.",
      stepCategory: 'info'
    },
    {
      stepNumber: 59,
      title: '59. Piège 1',
      description: 'Premier piège.',
      targetAcomId: 'add_client.guide_common_mistake_1',
      actionToPerform: 'observe',
      speechFr: "Mètre qui glisse vers le bas dans le dos. Le mètre doit rester correctement positionné afin d'éviter une mesure faussée.",
      speechWolof: "Mètre bi glisser ci suuf ginnaaw bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 60,
      title: '60. Piège 2',
      description: 'Deuxième piège.',
      targetAcomId: 'add_client.guide_common_mistake_2',
      actionToPerform: 'observe',
      speechFr: "Client qui retient sa respiration. La mesure doit être prise dans une posture naturelle, sans retenir la respiration.",
      speechWolof: "Client bi di tëyé noyyi bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 61,
      title: '61. Plage Habituelle',
      description: 'Fourchette de valeurs.',
      targetAcomId: 'add_client.guide_normal_bounds',
      actionToPerform: 'observe',
      speechFr: "Cette indication donne une plage habituelle permettant de repérer plus facilement une valeur potentiellement inhabituelle.",
      speechWolof: "Lii da lay wone intervalle normal bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 62,
      title: '62. Panneau « Vêtement Sélectionné »',
      description: 'Bannière de résumé vêtement.',
      targetAcomId: 'add_client.form_garment_banner',
      actionToPerform: 'observe',
      speechFr: "Cette zone rappelle le vêtement actuellement utilisé pour la prise de mesures et le profil auquel ces mesures sont associées : Ensemble Africain 2 Pièces (Chemise & Pantalon), Couture Africaine, Homme.",
      speechWolof: "Zone lii da lay rappeler vêtement bi ñuy natt ak profil bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 63,
      title: '63. Bouton « Changer de Vêtement »',
      description: 'Bouton de retour.',
      targetAcomId: 'add_client.form_btn_change_garment',
      actionToPerform: 'observe',
      speechFr: "Ce bouton permet de revenir au choix du vêtement si vous devez modifier le modèle avant de poursuivre la prise de mesures.",
      speechWolof: "Bouton lii da lay may nga dellu ci choix vêtement bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 64,
      title: '64. Profil de Mesures Chargé',
      description: 'Synthèse des mesures.',
      targetAcomId: 'add_client.form_profile_summary',
      actionToPerform: 'observe',
      speechFr: "Le profil chargé contient neuf mesures obligatoires et trois mesures optionnelles. Les mesures obligatoires devront être complétées avant la validation.",
      speechWolof: "Profil bi am na 9 natt yu am solo ak 3 optionnelles.",
      stepCategory: 'info'
    },
    {
      stepNumber: 65,
      title: '65. Onglet Saisie des Mesures',
      description: 'Onglet principal.',
      targetAcomId: 'add_client.form_tab_saisie',
      actionToPerform: 'observe',
      speechFr: "Cet onglet permet de saisir et contrôler les mensurations du client.",
      speechWolof: "Onglet lii da lay may nga bind natt yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 66,
      title: '66. Onglet Historique & Évolutions',
      description: 'Onglet d\'historique.',
      targetAcomId: 'add_client.form_tab_history',
      actionToPerform: 'observe',
      speechFr: "Cet onglet permet de consulter l'évolution ou l'historique des mesures lorsque des données sont disponibles.",
      speechWolof: "Onglet lii da lay wone historique natt yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 67,
      title: '67. Analyseur de Cohérence Anatomique',
      description: 'Bannière d\'analyse.',
      targetAcomId: 'add_client.validator_header',
      actionToPerform: 'observe',
      speechFr: "Le système analyse automatiquement les mesures saisies afin de détecter les mesures manquantes ou les incohérences.",
      speechWolof: "Système bi dafay vérifier natt yi automatiquement.",
      stepCategory: 'info'
    },
    {
      stepNumber: 68,
      title: '68. Score de Cohérence',
      description: 'Score d\'analyse.',
      targetAcomId: 'add_client.validator_score',
      actionToPerform: 'observe',
      speechFr: "Le score actuel est de zéro pour cent, car les mesures obligatoires ne sont pas encore renseignées.",
      speechWolof: "Score bi 0% la, ndaxte bindoo natt yi am solo.",
      stepCategory: 'info'
    },
    {
      stepNumber: 69,
      title: '69. Alerte : Tour de Cou',
      description: 'Alerte manquante.',
      targetAcomId: 'add_client.validator_alert_cou',
      actionToPerform: 'observe',
      speechFr: "Tour de Cou (Col) : mesure obligatoire manquante.",
      speechWolof: "Tour de Cou (Col) : natt bi dafa manke.",
      stepCategory: 'info'
    },
    {
      stepNumber: 70,
      title: '70. Alerte : Tour de Poitrine',
      description: 'Alerte manquante.',
      targetAcomId: 'add_client.validator_alert_poitrine',
      actionToPerform: 'observe',
      speechFr: "Tour de Poitrine : mesure obligatoire manquante.",
      speechWolof: "Tour de Poitrine : natt bi dafa manke.",
      stepCategory: 'info'
    },
    {
      stepNumber: 71,
      title: '71. Alerte : Carrure',
      description: 'Alerte manquante.',
      targetAcomId: 'add_client.validator_alert_carrure',
      actionToPerform: 'observe',
      speechFr: "Carrure / Épaule à Épaule : mesure obligatoire manquante.",
      speechWolof: "Carrure : natt bi dafa manke.",
      stepCategory: 'info'
    },
    {
      stepNumber: 72,
      title: '72. Bouton Corriger',
      description: 'Bouton de correction.',
      targetAcomId: 'add_client.validator_fix_btn',
      actionToPerform: 'observe',
      speechFr: "Ce bouton permet de revenir directement à la mesure concernée afin de compléter ou corriger sa valeur.",
      speechWolof: "Bouton lii da lay dellu ci natt bi ngir nga corriger ko.",
      stepCategory: 'info'
    },
    {
      stepNumber: 73,
      title: '73. Recherche de Mesure',
      description: 'Champ de recherche.',
      targetAcomId: 'add_client.form_search_input',
      actionToPerform: 'observe',
      speechFr: "Cette recherche permet d'accéder rapidement à une mesure particulière sans parcourir toute la liste.",
      speechWolof: "Recherche lii da lay may nga seet natt bu gaaw.",
      stepCategory: 'info'
    },
    {
      stepNumber: 74,
      title: '74. Mesures Requises (Titre)',
      description: 'En-tête des champs obligatoires.',
      targetAcomId: 'add_client.form_mandatory_header',
      actionToPerform: 'observe',
      speechFr: "Cette section regroupe les mesures nécessaires pour le modèle sélectionné.",
      speechWolof: "Section lii dafay wone natt yi am solo.",
      stepCategory: 'info'
    },
    {
      stepNumber: 75,
      title: '75. Champ : Tour de Cou',
      description: 'Saisie Tour de Cou.',
      targetAcomId: 'add_client.form_input_neck_circumference',
      actionToPerform: 'type',
      speechFr: "Voici le champ Tour de Cou. Il permet de saisir la circonférence du cou en centimètres.",
      speechWolof: "Champ lii mooy Tour de Cou. Bindal natt bi ci centimètres.",
      stepCategory: 'required'
    },
    {
      stepNumber: 76,
      title: '76. Champ : Tour de Poitrine',
      description: 'Saisie Tour de Poitrine.',
      targetAcomId: 'add_client.form_input_chest_circumference',
      actionToPerform: 'type',
      speechFr: "Voici le champ Tour de Poitrine. Il permet de saisir la circonférence de la poitrine en centimètres.",
      speechWolof: "Champ lii mooy Tour de Poitrine.",
      stepCategory: 'required'
    },
    {
      stepNumber: 77,
      title: '77. Champ : Carrure',
      description: 'Saisie Carrure.',
      targetAcomId: 'add_client.form_input_shoulder_to_shoulder',
      actionToPerform: 'type',
      speechFr: "Voici le champ Carrure / Épaule à Épaule. Il permet de saisir la largeur correspondante en centimètres.",
      speechWolof: "Champ lii mooy Carrure.",
      stepCategory: 'required'
    },
    {
      stepNumber: 78,
      title: '78. Champ : Longueur de Manche',
      description: 'Saisie Longueur de Manche.',
      targetAcomId: 'add_client.form_input_sleeve_length',
      actionToPerform: 'type',
      speechFr: "Voici le champ Longueur de Manche.",
      speechWolof: "Champ lii mooy Longueur de Manche.",
      stepCategory: 'required'
    },
    {
      stepNumber: 79,
      title: '79. Champ : Longueur de Chemise',
      description: 'Saisie Longueur de Chemise.',
      targetAcomId: 'add_client.form_input_shirt_length',
      actionToPerform: 'type',
      speechFr: "Voici le champ Longueur de Veste / Chemise.",
      speechWolof: "Champ lii mooy Longueur de Chemise.",
      stepCategory: 'required'
    },
    {
      stepNumber: 80,
      title: '80. Champ : Tour de Biceps',
      description: 'Saisie Tour de Biceps.',
      targetAcomId: 'add_client.form_input_bicep_circumference',
      actionToPerform: 'type',
      speechFr: "Voici le champ Tour de Biceps.",
      speechWolof: "Champ lii mooy Tour de Biceps.",
      stepCategory: 'required'
    },
    {
      stepNumber: 81,
      title: '81. Champ : Tour de Taille',
      description: 'Saisie Tour de Taille.',
      targetAcomId: 'add_client.form_input_waist_circumference',
      actionToPerform: 'type',
      speechFr: "Voici le champ Tour de Taille.",
      speechWolof: "Champ lii mooy Tour de Taille.",
      stepCategory: 'required'
    },
    {
      stepNumber: 82,
      title: '82. Champ : Longueur de Pantalon',
      description: 'Saisie Longueur de Pantalon.',
      targetAcomId: 'add_client.form_input_outseam',
      actionToPerform: 'type',
      speechFr: "Voici le champ Longueur Extérieure (Pantalon).",
      speechWolof: "Champ lii mooy Longueur Extérieure.",
      stepCategory: 'required'
    },
    {
      stepNumber: 83,
      title: '83. Champ : Tour de Cuisse',
      description: 'Saisie Tour de Cuisse.',
      targetAcomId: 'add_client.form_input_thigh_circumference',
      actionToPerform: 'type',
      speechFr: "Voici le champ Tour de Cuisse. Renseignez l'ensemble des champs requis. Vous connaissez maintenant l'ensemble de l'écran de prise de mesures : le guide de silhouette, la mesure sélectionnée, les instructions, les bonnes pratiques, les alertes de cohérence, le profil de mesures et les champs de saisie.",
      speechWolof: "Champ lii mooy Tour de Cuisse. Bindal natt yëpp ngir valider paas bi.",
      stepCategory: 'required'
    },
    {
      stepNumber: 84,
      title: '84. Contrôle & Validation Atelier (Étape 4/5)',
      description: 'Vérification automatique de la cohérence anatomique.',
      targetAcomId: 'add_client.btn_step4',
      actionToPerform: 'click',
      speechFr: "Lorsque toutes les mesures obligatoires sont correctement renseignées, le système vérifiera automatiquement leur cohérence avant la validation. Vous pourrez ensuite cliquer sur « Suivant : Validation » pour soumettre la fiche au contrôle de cohérence anatomique d'Acom IA.",
      speechWolof: "Soo bindee natt yëpp, bëssal ci « Suivant : Validation » ngir Acom IA vérifier proportions yaram bi.",
      stepCategory: 'action'
    },
    {
      stepNumber: 85,
      title: '85. Barre de Progression — 4. Validation Atelier',
      description: 'Détection du contexte Étape 4.',
      targetAcomId: 'add_client.step_tab_4',
      actionToPerform: 'observe',
      speechFr: "Vous êtes actuellement à l'étape 4 : Validation Atelier. Le système vérifie ici que les mesures nécessaires à la confection sont complètes et conformes.",
      speechWolof: "Yaa ngi ci ñeenteelu paas bi : Validation Atelier. Système bi dafay vérifier natt yi ngir xam ndax am na luy manke wala luy wuute.",
      stepCategory: 'info'
    },
    {
      stepNumber: 86,
      title: '86. Titre de la page',
      description: 'Contrôle Qualité & Conformité Atelier.',
      targetAcomId: 'add_client.step4_title',
      actionToPerform: 'observe',
      speechFr: "Cette page est dédiée au contrôle qualité du dossier avant sa validation.",
      speechWolof: "Xët wii mooy contrôle qualité bi. Moteur bi dafay xool ndax natt yi mat nañu.",
      stepCategory: 'info'
    },
    {
      stepNumber: 87,
      title: '87. Sous-titre de la page',
      description: 'Description de la validation.',
      targetAcomId: 'add_client.step4_subtitle',
      actionToPerform: 'observe',
      speechFr: "Acom analyse automatiquement les mesures afin d'identifier les données manquantes ou incohérentes.",
      speechWolof: "Système bi dafay xool natt yi nga bind par rapport ak vêtement bi nga tànn.",
      stepCategory: 'info'
    },
    {
      stepNumber: 88,
      title: '88. Bloc d\'alerte principal',
      description: 'Alerte mesures manquantes.',
      targetAcomId: 'add_client.validation_alert_banner',
      actionToPerform: 'observe',
      speechFr: "Le contrôle qualité est terminé. Toutes les mesures requises sont actuellement valides et cohérentes pour le modèle sélectionné.",
      speechWolof: "Alerte bi dafay wone ni am na natt yu manke ngir modèle bi nga tànn.",
      stepCategory: 'info'
    },
    {
      stepNumber: 88.5,
      title: '88.5. Modèle de référence',
      description: 'Modèle de référence.',
      targetAcomId: 'add_client.reference_model',
      actionToPerform: 'observe',
      speechFr: "Le contrôle est effectué par rapport au modèle de vêtement actuellement sélectionné.",
      speechWolof: "Modèle bi nga tànn.",
      stepCategory: 'info'
    },
    {
      stepNumber: 89,
      title: '89. Section « Mesures Manquantes »',
      description: 'Nombre de mesures manquantes.',
      targetAcomId: 'add_client.missing_measurements_header',
      actionToPerform: 'observe',
      speechFr: "Le système indique ici le nombre de mesures obligatoires qui doivent encore être renseignées. Dans cet exemple, neuf mesures sont manquantes.",
      speechWolof: "Fi lay wone ñaatay natt yoo wara bind. Fi, 9 natt ñoo manke.",
      stepCategory: 'info'
    },
    {
      stepNumber: 90,
      title: '90. Mesure manquante : Tour de Cou',
      description: 'Tour de cou.',
      targetAcomId: 'add_client.missing_measure_neck_circumference',
      actionToPerform: 'observe',
      speechFr: "Première mesure manquante : le Tour de Cou, également appelé Tour de Cou ou Col. Cette mesure est obligatoire pour le modèle sélectionné. Vous pouvez sélectionner cette mesure pour revenir à son emplacement de saisie et compléter sa valeur.",
      speechWolof: "Natt bu njëkk bi manke mooy Tour de Cou. Mën nga ko bëss ngir dellu bind ko.",
      stepCategory: 'info'
    },
    {
      stepNumber: 91,
      title: '91. Mesure manquante : Tour de Poitrine',
      description: 'Tour de poitrine.',
      targetAcomId: 'add_client.missing_measure_chest_circumference',
      actionToPerform: 'observe',
      speechFr: "Deuxième mesure manquante : le Tour de Poitrine. Elle est nécessaire pour déterminer correctement les dimensions du vêtement au niveau du buste.",
      speechWolof: "Natt ñaareel bi manke mooy Tour de Poitrine.",
      stepCategory: 'info'
    },
    {
      stepNumber: 92,
      title: '92. Mesure manquante : Carrure',
      description: 'Carrure.',
      targetAcomId: 'add_client.missing_measure_shoulder_to_shoulder',
      actionToPerform: 'observe',
      speechFr: "Troisième mesure manquante : la Carrure, ou mesure Épaule à Épaule.",
      speechWolof: "Natt ñetteel bi mooy Carrure.",
      stepCategory: 'info'
    },
    {
      stepNumber: 93,
      title: '93. Mesure manquante : Longueur de Manche',
      description: 'Longueur de Manche.',
      targetAcomId: 'add_client.missing_measure_sleeve_length',
      actionToPerform: 'observe',
      speechFr: "Quatrième mesure manquante : la Longueur de Manche.",
      speechWolof: "Ñeenteel bi mooy Longueur de Manche.",
      stepCategory: 'info'
    },
    {
      stepNumber: 94,
      title: '94. Mesure manquante : Longueur de Chemise',
      description: 'Longueur de Veste / Chemise.',
      targetAcomId: 'add_client.missing_measure_shirt_length',
      actionToPerform: 'observe',
      speechFr: "Cinquième mesure manquante : la Longueur de Veste ou de Chemise.",
      speechWolof: "Juróomeel bi mooy Longueur de Chemise.",
      stepCategory: 'info'
    },
    {
      stepNumber: 95,
      title: '95. Mesure manquante : Tour de Taille',
      description: 'Tour de Taille.',
      targetAcomId: 'add_client.missing_measure_waist_circumference',
      actionToPerform: 'observe',
      speechFr: "Sixième mesure manquante : le Tour de Taille ou Ceinture.",
      speechWolof: "Juróom benneel bi mooy Tour de Taille.",
      stepCategory: 'info'
    },
    {
      stepNumber: 96,
      title: '96. Mesure manquante : Tour de Hanches',
      description: 'Tour de Hanches.',
      targetAcomId: 'add_client.missing_measure_hip_circumference',
      actionToPerform: 'observe',
      speechFr: "Septième mesure manquante : le Tour de Hanches.",
      speechWolof: "Juróom ñaareel bi mooy Tour de Hanches.",
      stepCategory: 'info'
    },
    {
      stepNumber: 97,
      title: '97. Mesure manquante : Longueur de Pantalon',
      description: 'Longueur de Pantalon.',
      targetAcomId: 'add_client.missing_measure_outseam',
      actionToPerform: 'observe',
      speechFr: "Huitième mesure manquante : la Longueur de Pantalon ou de Jupe.",
      speechWolof: "Juróom ñetteel bi mooy Longueur de Pantalon.",
      stepCategory: 'info'
    },
    {
      stepNumber: 98,
      title: '98. Mesure manquante : Longueur Entrejambe',
      description: 'Longueur Entrejambe.',
      targetAcomId: 'add_client.missing_measure_inseam',
      actionToPerform: 'observe',
      speechFr: "Neuvième mesure manquante : la Longueur Entrejambe.",
      speechWolof: "Juróom ñeenteel bi mooy Longueur Entrejambe.",
      stepCategory: 'info'
    },
    {
      stepNumber: 99,
      title: '99. Section « Avertissements & Recommandations »',
      description: 'En-tête des avertissements.',
      targetAcomId: 'add_client.warnings_header',
      actionToPerform: 'observe',
      speechFr: "Cette section détaille les raisons pour lesquelles chaque mesure est considérée comme manquante et indique ce qui doit être corrigé avant de poursuivre.",
      speechWolof: "Section lii dafay wone lu tax natt yi manke ak lu ñu wara def.",
      stepCategory: 'info'
    },
    {
      stepNumber: 100,
      title: '100. Avertissement 1',
      description: 'Premier avertissement.',
      targetAcomId: 'add_client.warning_0',
      actionToPerform: 'observe',
      speechFr: "Le Tour de Cou est obligatoire et doit être renseigné avant de pouvoir valider l'atelier.",
      speechWolof: "Tour de Cou dafa am solo, wara nañu ko bind.",
      stepCategory: 'info'
    },
    {
      stepNumber: 101,
      title: '101. Avertissement 2',
      description: 'Deuxième avertissement.',
      targetAcomId: 'add_client.warning_1',
      actionToPerform: 'observe',
      speechFr: "Le Tour de Poitrine est également obligatoire pour ce modèle.",
      speechWolof: "Tour de Poitrine itam dafa am solo.",
      stepCategory: 'info'
    },
    {
      stepNumber: 102,
      title: '102. Avertissement 3',
      description: 'Troisième avertissement.',
      targetAcomId: 'add_client.warning_2',
      actionToPerform: 'observe',
      speechFr: "La Carrure doit être renseignée pour permettre au système de vérifier correctement le patron et les proportions du vêtement. À l'étape précédente, vous avez saisi les mesures du client. Cette étape vérifie maintenant que toutes les mesures nécessaires au modèle sont présentes et exploitables.",
      speechWolof: "Carrure dafa am solo ngir système bi xam proportions yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 103,
      title: '103. Bouton « Compléter dans la Prise de Mesures »',
      description: 'Retour à l\'étape 3.',
      targetAcomId: 'add_client.btn_return_step3',
      actionToPerform: 'observe',
      speechFr: "Ce bouton permet de revenir à l'étape Prise de Mesures afin de compléter ou de modifier les mensurations si nécessaire.",
      speechWolof: "Bëss bii dafay dellu ci Prise de Mesures ngir nga mën a yokk wala soppi natt yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 103.5,
      title: '104. Bouton « Voir le résumé final »',
      description: 'Bouton vers étape 5.',
      targetAcomId: 'add_client.btn_step5',
      actionToPerform: 'observe',
      speechFr: "Lorsque toutes les mesures sont validées, ce bouton permet de passer à l'étape 5 : Résumé & Finalisation. Cliquez ici pour consulter le résumé final du dossier client avant son enregistrement.",
      speechWolof: "Soo paré, mën nga bëss fii ngir xool résumé bi te enregistrer fiche bi.",
      stepCategory: 'action'
    },
    {
      stepNumber: 104,
      title: '105. En-tête de l\'Étape 5',
      description: 'Présentation de l\'étape finale.',
      targetAcomId: 'add_client.step5_header',
      actionToPerform: 'observe',
      speechFr: "Vous êtes à la dernière étape du parcours Client Couture. Cette page permet de vérifier les informations du client, le vêtement sélectionné et les mesures avant de créer définitivement la fiche client.",
      speechWolof: "Yaa ngi ci étape bu mujj bi. Fii dangay vérifier lepp lu jëm ci client bi ak natt yi balaa nga enregistrer.",
      stepCategory: 'info'
    },
    {
      stepNumber: 105,
      title: '106. Bloc Identité Client',
      description: 'Récapitulatif des informations du client.',
      targetAcomId: 'add_client.summary_client_recap',
      actionToPerform: 'observe',
      speechFr: "Cette section récapitule l'identité ou le profil du client qui vient d'être renseigné.",
      speechWolof: "Fii mooy résumé client bi : turam, santam ak nimba.",
      stepCategory: 'info'
    },
    {
      stepNumber: 106,
      title: '107. Bloc Vêtement Sélectionné',
      description: 'Récapitulatif du modèle de vêtement.',
      targetAcomId: 'add_client.summary_garment_recap',
      actionToPerform: 'observe',
      speechFr: "Cette section confirme le modèle de vêtement choisi pour la confection du client.",
      speechWolof: "Fii dafay wone modèle vêtement bi nga tànnoon.",
      stepCategory: 'info'
    },
    {
      stepNumber: 107,
      title: '108. Bloc Mensurations Enregistrées',
      description: 'Récapitulatif de toutes les mesures.',
      targetAcomId: 'add_client.summary_measurements_table',
      actionToPerform: 'observe',
      speechFr: "Cette section indique les mesures actuellement enregistrées pour ce client.",
      speechWolof: "Tableau bii dafay wone natt yëpp yi nga bind te vérifier.",
      stepCategory: 'info'
    },
    {
      stepNumber: 108,
      title: '108.5. Bouton de Modification des Mesures',
      description: 'Permet de revenir modifier les mesures directement.',
      targetAcomId: 'add_client.summary_edit_measurements_btn',
      actionToPerform: 'observe',
      speechFr: "Le bouton Modifier les mesures permet de revenir au parcours de prise de mesures afin de compléter ou de modifier les mensurations.",
      speechWolof: "Soo bëggee soppi natt yi, bëssal fii ngir dellu.",
      stepCategory: 'action'
    },
    {
      stepNumber: 109,
      title: '109. Bouton Retour',
      description: 'Permet de revenir à l\'étape de validation.',
      targetAcomId: 'add_client.summary_return_btn',
      actionToPerform: 'observe',
      speechFr: "Le bouton Retour permet de revenir à l'étape précédente du parcours.",
      speechWolof: "Bëss bii dafay dellu ci étape contrôle bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 110,
      title: '110. Bouton Supérieur - Enregistrer',
      description: 'Action dans la barre supérieure.',
      targetAcomId: 'add_client.topbar_save_btn',
      actionToPerform: 'observe',
      speechFr: "Cette commande permet également de lancer l'enregistrement de la fiche client.",
      speechWolof: "Bëss bii tamit dafay enregistrer fiche bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 111,
      title: '111. Bouton Principal de Finalisation',
      description: 'Sauvegarde définitive en base de données.',
      targetAcomId: 'add_client.save_btn',
      actionToPerform: 'click',
      speechFr: "Ce bouton permet d'enregistrer définitivement la fiche client ainsi que les mesures associées. Il s'agit de l'action finale du parcours Client Couture.",
      speechWolof: "Lii mooy étape bu mujj bi : bëssal fii ngir enregistrer fiche bi ci sa base de données.",
      stepCategory: 'final'
    },
    {
      stepNumber: 112,
      title: '112. Confirmation & Fiche Enregistrée',
      description: 'Retour au fichier clients avec confirmation.',
      targetAcomId: 'clients.title',
      actionToPerform: 'observe',
      speechFr: "Vous êtes arrivé à la dernière étape du parcours Client Couture. Vous avez maintenant vérifié l'identité du client, le vêtement sélectionné et l'état des mensurations. Lorsque toutes les informations sont correctes, utilisez Enregistrer la fiche client & mesures pour finaliser le dossier.",
      speechWolof: "Fiche client bi ak natt yi dencu nañu avec succès ! Client bi paré na ngir commande.",
      stepCategory: 'final'
    }
  ]
};

export const COUTURE_ORDERS_TUTORIAL: TutorialScenario = {
  id: 'couture_tutorial_orders',
  title: 'Suivi des Commandes de Confection Atelier',
  description: 'Pilotage complet du cycle de fabrication en atelier, du dépôt initial jusqu\'à la livraison finale et encaissement.',
  saasModule: 'couture',
  estimatedDurationSec: 360,
  steps: [
    {
      stepNumber: 1,
      title: '1. Commandes Mesures & Confection',
      description: 'Tableau de bord de suivi des commandes de confection sur-mesure.',
      targetAcomId: 'orders.title',
      actionToPerform: 'observe',
      speechFr: "Nous sommes maintenant dans le suivi des Commandes Mesures. Cet espace gère l'ensemble du cycle de fabrication en atelier, du dépôt initial jusqu'à la livraison finale.",
      speechWolof: "Yaa ngi léegi ci Commandes Mesures. Fi dafay saytu lepp lu jëm ci ñaw sur-mesure, tàmbli ba kérog ñuy livreur.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Enregistrer une Nouvelle Commande',
      description: 'Prise de commande, attribution client, choix du modèle, tissu et acomptes.',
      targetAcomId: 'orders.add_btn',
      actionToPerform: 'observe',
      speechFr: "Cliquez sur Nouvelle Commande pour sélectionner un client, choisir les modèles à confectionner, enregistrer les tissus et fixer la date d'essayage.",
      speechWolof: "Bëssal ci Nouvelle Commande ngir tànn client, tànn modèle, def sër bi ak acompte bi.",
      stepCategory: 'action'
    },
    {
      stepNumber: 3,
      title: '3. Filtres & Statuts d\'Atelier',
      description: 'Filtrage par étape de fabrication : Mesures, Coupe, Couture, Retouche, Prêt, Livré.',
      targetAcomId: 'orders.filters',
      actionToPerform: 'observe',
      speechFr: "Filtrez vos commandes par statut d'avancement : En attente de mesures, En coupe, En assemblage couture, Prêt pour essayage ou Livré.",
      speechWolof: "Tànnal commande yi ci kanam : Natt, Coupe, Ñaw, Retouche, Paré ngir essayage wala Livré.",
      stepCategory: 'control'
    },
    {
      stepNumber: 4,
      title: '4. Suivi Kanban / Liste des Commandes',
      description: 'Vue d\'ensemble de l\'avancement des pièces, acomptes perçus et soldes restants.',
      targetAcomId: 'orders.list',
      actionToPerform: 'observe',
      speechFr: "Visualisez en direct l'avancement des pièces en atelier, les acomptes versés et les soldes restants à l'encaissement.",
      speechWolof: "Xoolal ci direct nax liggéey bi ngi doxee ci atelier bi, acompte yi jot a fay ak li des ci xalis bi.",
      stepCategory: 'info'
    }
  ]
};

export const COUTURE_ORDERS_PLANNING_TUTORIAL: TutorialScenario = {
  id: 'couture.orders.planning',
  title: 'Planning d\'Atelier & Délais — Commandes Mesures',
  description: 'Organisation temporelle des confections, suivi des urgences, de la semaine, des planifications et des livraisons.',
  saasModule: 'couture',
  estimatedDurationSec: 300,
  steps: [
    {
      stepNumber: 1,
      title: '1. Commandes Mesures — Organisation du Planning',
      description: 'Présentation de la section Commandes Mesures.',
      targetAcomId: 'orders.title',
      actionToPerform: 'observe',
      speechFr: "Vous êtes dans l'onglet Commandes Mesures. Cette section permet de suivre et organiser les commandes de couture selon leur état et leur planning.",
      speechWolof: "Yaa ngi ci onglet Commandes Mesures. Fi dafay saytu ak di teerel commandes ñaw yi ci planning bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Vue Active : Planning d\'Atelier',
      description: 'Organisation temporelle des commandes selon leur situation et état.',
      targetAcomId: 'orders.view_modes',
      actionToPerform: 'observe',
      speechFr: "Trois vues sont disponibles : Fiches Liste, Planning et Fidélisation. La vue Planning permet d'organiser les commandes selon leur situation temporelle et leur état de traitement.",
      speechWolof: "Ñetti xët ñoo am : Fiches Liste, Planning ak Fidélisation. Vue Planning bi dafay teerel commandes yi ci waxtu ak statut liggéey bi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 3,
      title: '3. Synchronisation & Exports (SYNC, EXCEL, PDF)',
      description: 'Sauvegarde sécurisée cloud et exportations d\'atelier.',
      targetAcomId: 'orders.sync_btn',
      actionToPerform: 'observe',
      speechFr: "Les boutons SYNC, EXCEL et PDF permettent de synchroniser vos commandes avec le serveur sécurisé et d'exporter l'ensemble de votre carnet d'atelier aux formats Excel ou PDF.",
      speechWolof: "Bouton yii dañuy sync sa données yi tey génne sa carnet d'atelier ci Excel wala PDF.",
      stepCategory: 'action'
    },
    {
      stepNumber: 4,
      title: '4. Bouton « + Créer une Commande »',
      description: 'Créer une nouvelle commande de confection.',
      targetAcomId: 'orders.add_btn',
      actionToPerform: 'observe',
      speechFr: "Ce bouton permet de créer une nouvelle fiche commande couture. Si vous le souhaitez, vous pouvez suivre le parcours dédié à la création d'une commande.",
      speechWolof: "Bouton « + Créer une Commande » bi dafay ubbi création bu commande couture bu bees.",
      stepCategory: 'action'
    },
    {
      stepNumber: 5,
      title: '5. Barre de Recherche Rapide',
      description: 'Recherche instantanée par client ou modèle.',
      targetAcomId: 'orders.filters',
      actionToPerform: 'observe',
      speechFr: "Utilisez cette recherche pour retrouver rapidement une commande à partir du client ou du modèle.",
      speechWolof: "Barre de recherche bi da lay may nga wër commande ci turu client bi wala modèle bi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 6,
      title: '6. Filtres par Statut d\'Atelier',
      description: 'Filtrer les commandes selon l\'étape de confection.',
      targetAcomId: 'orders.filters',
      actionToPerform: 'observe',
      speechFr: "Ces filtres permettent de limiter les commandes affichées selon leur état de traitement : Tous, Mesures, Couture, Retouche, Prêts ou Livrés.",
      speechWolof: "Filtres yii dañuy limité commandes yi ñuy wone selon statut ñaw bi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 7,
      title: '7. Indicateur « Conceptions en Cours »',
      description: 'Total des confections actives en cours d\'atelier.',
      targetAcomId: 'orders.counter',
      actionToPerform: 'observe',
      speechFr: "L'indicateur affiche le nombre de confections actuellement en cours de réalisation dans votre atelier.",
      speechWolof: "Compteur bi dafay wone limu commande yi ñuy ñaw léegi ci atelier bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: '8. Colonne « En Retard / Urgentes »',
      description: 'Commandes nécessitant une priorité immédiate.',
      targetAcomId: 'orders.planning_urgent_col',
      actionToPerform: 'observe',
      speechFr: "La colonne En Retard / Urgentes identifie les commandes prioritaires à traiter immédiatement sur la table de coupe.",
      speechWolof: "Colonne En Retard / Urgentes bi dafay wone commandes yu war a gaaw ci table de coupe bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 9,
      title: '9. Colonne « Cette Semaine »',
      description: 'Confections dont la livraison est prévue dans les 7 jours.',
      targetAcomId: 'orders.planning_this_week_col',
      actionToPerform: 'observe',
      speechFr: "La colonne Cette Semaine regroupe les commandes planifiées pour les 7 prochains jours.",
      speechWolof: "Colonne Cette Semaine bi dafay wone commandes yu wara paré ci juróom-ñaari fan yii di ñëw.",
      stepCategory: 'info'
    },
    {
      stepNumber: 10,
      title: '10. Colonne « Planifiées Plus Tard »',
      description: 'Commandes à échéance lointaine ou en attente.',
      targetAcomId: 'orders.planning_later_col',
      actionToPerform: 'observe',
      speechFr: "La colonne Planifiées Plus Tard regroupe les commandes à échéance plus lointaine. Le bouton Mettre cette semaine permet de les avancer à tout moment.",
      speechWolof: "Colonne Planifiées Plus Tard bi dafay wone commandes yu yàgg.",
      stepCategory: 'info'
    },
    {
      stepNumber: 11,
      title: '11. Colonne « Livrées (Historique) »',
      description: 'Historique des confections déjà livrées aux clients.',
      targetAcomId: 'orders.planning_delivered_col',
      actionToPerform: 'observe',
      speechFr: "Cette catégorie permet de retrouver les commandes déjà livrées et conservées dans l'historique.",
      speechWolof: "Fi mooy historique bu commandes yi ñu livré ba paré.",
      stepCategory: 'info'
    },
    {
      stepNumber: 12,
      title: '12. Actions Rapides sur les Cartes d\'Atelier',
      description: 'Changement de statut, boutons contextuels, WhatsApp et impressions.',
      targetAcomId: 'orders.view_modes',
      actionToPerform: 'observe',
      speechFr: "Chaque carte de commande permet de modifier son statut, d'ajuster son urgence ou son report, d'envoyer un message WhatsApp aux artisans ou au client, et d'imprimer la fiche A4 ou le ticket thermique 80mm.",
      speechWolof: "Carte bu ci nekk dafay mayé nga soppi statut bi, yónnee message WhatsApp ci artisans yi wala client bi, tey imprimer fiche A4 wala ticket.",
      stepCategory: 'final'
    }
  ]
};

export const COUTURE_ORDERS_CAMPAIGNS_TUTORIAL: TutorialScenario = {
  id: 'couture.orders.campaigns',
  title: 'Fidélisation & Campagnes — Commandes Mesures',
  description: 'Gestion des relations clients, relances et campagnes de fidélisation atelier.',
  saasModule: 'couture',
  estimatedDurationSec: 250,
  steps: [
    {
      stepNumber: 1,
      title: '1. Vue Active : Fidélisation 🌟',
      description: 'Présentation de la vue dédiée à la fidélisation.',
      targetAcomId: 'orders.view_modes',
      actionToPerform: 'observe',
      speechFr: "Vous êtes maintenant dans la vue Fidélisation. Cette section permet de gérer les éléments liés à la fidélisation et aux campagnes de communication pour vos clients atelier.",
      speechWolof: "Yaa ngi léegi ci vue Fidélisation bi ngir saytu ak amal campagne yi ci sa clients yi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Suivi de l\'Engagement & Relances',
      description: 'Analyse de l\'activité et campagnes de rappel clients.',
      targetAcomId: 'orders.title',
      actionToPerform: 'observe',
      speechFr: "Retrouvez ici les indicateurs de fidélité, les rappels d'essayage et les campagnes de relance par SMS ou WhatsApp.",
      speechWolof: "Fii nga fay gis indicateur fidélité yi ak relance yi ci SMS wala WhatsApp.",
      stepCategory: 'final'
    }
  ]
};

export const COUTURE_CREATE_ORDER_TUTORIAL: TutorialScenario = {
  id: 'couture.orders.create-order',
  title: 'Créer une Fiche Commande — Parcours Commande Couture',
  description: 'Présentation pas à pas des champs de la fiche commande et de la synchronisation client.',
  saasModule: 'couture',
  estimatedDurationSec: 300,
  steps: [
    {
      stepNumber: 1,
      title: '1. Fenêtre : Créer une Fiche Commande',
      description: 'Présentation de la fenêtre de création de commande couture.',
      targetAcomId: 'orders.form_modal_title',
      actionToPerform: 'observe',
      speechFr: "Cette fenêtre permet de créer une commande couture et de la synchroniser avec le dossier du client couture.",
      speechWolof: "Fenetre bi dafay mayé nga def commande couture bu bees te synchroniser ko ak dossier client bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Client Couture *',
      description: 'Sélection du client couture dans le fichier.',
      targetAcomId: 'orders.form_client_select',
      actionToPerform: 'click',
      speechFr: "Sélectionnez le client couture concerné par cette commande.",
      speechWolof: "Tànnal client bi concerné ci commande bi.",
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Description du Modèle Commandé *',
      description: 'Indication du modèle ou vêtement à confectionner.',
      targetAcomId: 'orders.form_model',
      actionToPerform: 'type',
      speechFr: "Indiquez précisément le modèle ou le vêtement commandé. Cette description permet d'identifier ce qui doit être confectionné.",
      speechWolof: "Bindal fi modèle wala vêtement bi client bi bëgg ñu ñawal ko ko.",
      stepCategory: 'required'
    },
    {
      stepNumber: 4,
      title: '4. Prix de la Confection (FCFA) *',
      description: 'Montant total convenu pour la réalisation du vêtement.',
      targetAcomId: 'orders.form_price',
      actionToPerform: 'type',
      speechFr: "Saisissez le prix convenu pour la confection, en francs CFA.",
      speechWolof: "Bindal fi prix total bi ngeen déggoo ci ñaw bi ci FCFA.",
      stepCategory: 'required'
    },
    {
      stepNumber: 5,
      title: '5. Acompte Versé (FCFA)',
      description: 'Montant de l\'avance déjà perçue lors de la commande.',
      targetAcomId: 'orders.form_advance',
      actionToPerform: 'type',
      speechFr: "Saisissez le montant déjà versé par le client, en francs CFA. Le prix de confection correspond au coût total, tandis que l'acompte permet de suivre l'avance perçue et le solde restant dû lors de la livraison.",
      speechWolof: "Bindal fi acompte bi client bi joxe ci xalis bi. Lii dafay mayé nga xam li des kérog livraison bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: '6. Date Prévue de Livraison *',
      description: 'Date promise au client pour la livraison ou l\'essayage.',
      targetAcomId: 'orders.form_delivery_date',
      actionToPerform: 'type',
      speechFr: "Sélectionnez la date à laquelle la commande doit être livrée au client.",
      speechWolof: "Tànnal kérog kañ lañu wara joxé yéré bi client bi.",
      stepCategory: 'required'
    },
    {
      stepNumber: 7,
      title: '7. Statut de Fabrication *',
      description: 'État d\'avancement de la fabrication en atelier.',
      targetAcomId: 'orders.form_status',
      actionToPerform: 'click',
      speechFr: "Ce champ permet d'indiquer l'état actuel de fabrication de la commande. Les statuts disponibles sont : Prise de Mesures, Coupe et Couture, Retouches, Prêt pour Essai et Livré.",
      speechWolof: "Menu déroulant bi dafay wone statut ñaw bi : Natt, Coupe ak Ñaw, Retouches, Paré pour Essai wala Livré.",
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: '8. Marquer Urgent',
      description: 'Priorisation accélérée de la commande en atelier.',
      targetAcomId: 'orders.form_urgent',
      actionToPerform: 'click',
      speechFr: "Cette option permet d'identifier la commande comme urgente. Lorsqu'elle est cochée, la commande apparaît en priorité haute avec un indicateur rouge sur le planning et le tableau d'atelier.",
      speechWolof: "Case bi dafay mayé nga def commande bi ci urgence ngir mu jékk ci coupe ak couture bi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 9,
      title: '9. Planifier Plus Tard',
      description: 'Mise en attente sans réservation immédiate du planning.',
      targetAcomId: 'orders.form_later',
      actionToPerform: 'click',
      speechFr: "Cette option permet d'indiquer que la commande doit être planifiée ultérieurement sans bloquer le planning immédiat de coupe.",
      speechWolof: "Case bi dafay wone ne commande bi dañu koy planifier ëllëg.",
      stepCategory: 'control'
    },
    {
      stepNumber: 10,
      title: '10. Consommation Tissu Stock Atelier (Optionnel)',
      description: 'Section de prélèvement de coupons de tissu dans le stock.',
      targetAcomId: 'orders.form_fabric_section',
      actionToPerform: 'observe',
      speechFr: "Cette section permet d'associer une consommation de tissu du stock atelier à la commande. Elle reste facultative si le client a lui-même fourni son propre tissu.",
      speechWolof: "Wàll bi dafay mayé nga prélever sër ci stock atelier bi ngir commande bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 11,
      title: '11. Tissu Sélectionné',
      description: 'Choix du tissu parmi les coupons disponibles.',
      targetAcomId: 'orders.form_fabric_select',
      actionToPerform: 'click',
      speechFr: "Si un tissu du stock de l'atelier est utilisé pour cette commande, sélectionnez le tissu dans la liste déroulante.",
      speechWolof: "Tànnal sër bi ci stock bi su fekkee atelier bi mookoy joxé.",
      stepCategory: 'control'
    },
    {
      stepNumber: 12,
      title: '12. Mètres à Déduire du Stock',
      description: 'Métrage consommé à déduire de l\'inventaire.',
      targetAcomId: 'orders.form_fabric_meters',
      actionToPerform: 'type',
      speechFr: "Indiquez le nombre de mètres à déduire du stock pour cette confection.",
      speechWolof: "Bindal fi ñaata mètres nga wara waññi ci stock sër bi.",
      stepCategory: 'control'
    },
    {
      stepNumber: 13,
      title: '13. Consommation Mercerie (Optionnel)',
      description: 'Articles de mercerie associés (fils, boutons, zips).',
      targetAcomId: 'orders.form_mercerie_section',
      actionToPerform: 'observe',
      speechFr: "Cette section permet d'ajouter les articles de mercerie utilisés pour cette commande, comme les fils, fermetures, boutons ou entoilages.",
      speechWolof: "Wàll bi dafay mayé nga yokk mercerie : wëñ, boutons, fermetures ci commande bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 14,
      title: '14. Bouton « + Ajouter un article »',
      description: 'Ajout d\'une ligne de mercerie et quantité.',
      targetAcomId: 'orders.form_add_mercerie_btn',
      actionToPerform: 'click',
      speechFr: "Ce bouton permet d'ajouter une nouvelle ligne d'article de mercerie et de choisir la quantité à prélever sur le stock.",
      speechWolof: "Bouton bi dafay yokk benn ligne mercerie bu bees.",
      stepCategory: 'action'
    },
    {
      stepNumber: 15,
      title: '15. Bouton « Annuler »',
      description: 'Fermeture de la fenêtre sans enregistrer.',
      targetAcomId: 'orders.form_cancel_btn',
      actionToPerform: 'click',
      speechFr: "Ce bouton permet de fermer la fenêtre sans enregistrer la fiche commande.",
      speechWolof: "Bouton bi dafay tëj fenetre bi te du denc dara.",
      stepCategory: 'action'
    },
    {
      stepNumber: 16,
      title: '16. Bouton « Enregistrer & Synchroniser »',
      description: 'Validation finale et synchronisation avec le dossier client.',
      targetAcomId: 'orders.form_submit_btn',
      actionToPerform: 'click',
      speechFr: "Lorsque tous les champs obligatoires sont correctement renseignés, cliquez ici pour enregistrer la fiche commande et synchroniser les informations avec le dossier client couture.",
      speechWolof: "Bëssal fi ngir denc commande bi te synchroniser ko ak dossier client bi.",
      stepCategory: 'action'
    }
  ]
};

export const COUTURE_TEXTILES_TUTORIAL: TutorialScenario = {
  id: 'couture_tutorial_textiles',
  title: 'Gestion du Stock de Tissus & Coupons Wax',
  description: 'Inventaire des coupons de tissus, métrages disponibles, Bazin, Wax et soieries.',
  saasModule: 'couture',
  estimatedDurationSec: 240,
  steps: [
    {
      stepNumber: 1,
      title: '1. Stock Tissus & Coupons Wax',
      description: 'Espace de gestion des tissus, métrages disponibles et références textiles.',
      targetAcomId: 'textiles.title',
      actionToPerform: 'observe',
      speechFr: "Voici votre espace Tissus & Wax. Il permet de répertorier tous vos coupons de tissus, Wax, Bazin, Soie et Dentelles disponibles en atelier.",
      speechWolof: "Fi mooy sa dencukaay sër ak Wax. Dafay lim kuponu sër yi nga am ci atelier bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Enregistrer un Coupon de Tissu',
      description: 'Ajout d\'un nouveau coupon avec métrage, largeur et type d\'étoffe.',
      targetAcomId: 'textiles.add_btn',
      actionToPerform: 'observe',
      speechFr: "Enregistrez de nouvelles pièces de tissu avec leur métrage total, la largeur du coupon, la couleur et le motif.",
      speechWolof: "Bindal sër bu bees ak limu mètre bi, yaatuyaay bi ak couleur bi.",
      stepCategory: 'action'
    },
    {
      stepNumber: 3,
      title: '3. Suivi du Métrage & Déduction',
      description: 'Mise à jour automatique du stock de tissu lors des commandes.',
      targetAcomId: 'textiles.grid',
      actionToPerform: 'observe',
      speechFr: "Suivez l'utilisation de vos coupons en temps réel. Lors d'une commande client, le métrage utilisé est automatiquement déduit du stock.",
      speechWolof: "Saytul mètre bi ci temps réel. Soo nattalée client, métre bi dafay wáññiku ci stock bi.",
      stepCategory: 'info'
    }
  ]
};

export const COUTURE_TEXTILE_FORM_TUTORIAL: TutorialScenario = {
  id: 'couture.tissu.form',
  title: 'Enregistrer un nouveau Tissu en Stock — Fiche Technique',
  description: 'Présentation pas à pas des champs de la fiche technique du tissu.',
  saasModule: 'couture',
  estimatedDurationSec: 240,
  steps: [
    {
      stepNumber: 1,
      title: '1. Titre du Formulaire',
      description: 'Présentation du titre du formulaire.',
      targetAcomId: 'textiles.modal_title',
      actionToPerform: 'observe',
      speechFr: "Ce titre indique de manière claire et explicite si vous êtes actuellement en train d'enregistrer un nouveau tissu ou de modifier une fiche existante.",
      speechWolof: "Fii mooy woné su fekké danga bëgg a duggal sër bu bees wala soppi bu fi nekk.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Bouton Fermer',
      description: 'Fermer le formulaire sans enregistrer.',
      targetAcomId: 'textiles.modal_close',
      actionToPerform: 'observe',
      speechFr: "Ce bouton en forme de croix vous permet d'interrompre la saisie et de fermer la fenêtre à tout moment sans sauvegarder vos changements.",
      speechWolof: "Bouton bi dafay tax nga mën a tëj fenetre bi sa saa su la neexee.",
      stepCategory: 'action'
    },
    {
      stepNumber: 3,
      title: '3. Nom du Tissu *',
      description: 'Saisie du nom commercial ou descriptif du tissu.',
      targetAcomId: 'textiles.form_name',
      actionToPerform: 'type',
      speechFr: "Renseignez ici le nom descriptif et commercial du tissu (par exemple, Wax Hollandais Authentique, Bazin Riche Getzner Super VIP ou Soie d'Italie).",
      speechWolof: "Fii nga fay bind turu sër bi, niki Wax Hollandais, Bazin Getzner wala Soie Italienne.",
      stepCategory: 'required'
    },
    {
      stepNumber: 4,
      title: '4. Catégorie de Textile *',
      description: 'Sélectionner la famille de tissu ou en ajouter une nouvelle.',
      targetAcomId: 'textiles.form_category',
      actionToPerform: 'click',
      speechFr: "Choisissez la catégorie du tissu parmi les options du menu (Bazin, Wax, Lin, Soie...) ou cliquez sur \"+ Nouvelle catégorie...\" pour définir une nouvelle famille sur-mesure.",
      speechWolof: "Tànnal catégorie sër bi, wala nga doli catégorie bu bees.",
      stepCategory: 'required'
    },
    {
      stepNumber: 5,
      title: '5. Référence Interne',
      description: 'Code d\'identification unique ou emplacement du rouleau.',
      targetAcomId: 'textiles.form_internal_ref',
      actionToPerform: 'type',
      speechFr: "La référence interne est un identifiant unique (par exemple, code-barres, numéro de rouleau ou code d'étagère) facilitant le suivi logistique dans votre atelier.",
      speechWolof: "Fii mooy code bi nga mën a jox sa rouleau ngir xam fan la nekk ci sa bërab liggéey.",
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: '6. Couleur Principale Sélectionnée',
      description: 'Aperçu de la couleur principale actuellement sélectionnée.',
      targetAcomId: 'textiles.form_color_main',
      actionToPerform: 'observe',
      speechFr: "Cet indicateur synthétise visuellement la couleur actuellement active pour la fiche, en affichant son nom, son code hexadécimal et sa pastille de nuance correspondante.",
      speechWolof: "Fii mu ngi wone couleur bi nga tànn ak pastille bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 7,
      title: '7. Catégories de Couleurs',
      description: 'Filtres rapides par famille de couleurs.',
      targetAcomId: 'textiles.form_color_categories',
      actionToPerform: 'click',
      speechFr: "Utilisez ces boutons horizontaux pour filtrer la palette par famille chromatique : bleus, rouges, verts, jaunes ou tons neutres, afin de trouver plus vite votre nuance.",
      speechWolof: "Sélecteur yii dañuy tax nga mën a tànn sa couleur ci gaaw.",
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: '8. Recherche de Nuance',
      description: 'Filtrer la palette par mot-clé.',
      targetAcomId: 'textiles.form_color_search',
      actionToPerform: 'type',
      speechFr: "Recherchez instantanément une nuance de couleur précise en saisissant son nom (comme Turquoise, Fuchsia, Bordeaux ou Crème) pour filtrer dynamiquement les pastilles.",
      speechWolof: "Mën nga fi seet couleur bi nga bëgg ci gaaw.",
      stepCategory: 'info'
    },
    {
      stepNumber: 9,
      title: '9. Palette de Nuances',
      description: 'Sélection d\'une couleur depuis la bibliothèque couture.',
      targetAcomId: 'textiles.form_color_grid',
      actionToPerform: 'observe',
      speechFr: "Cette grille regroupe l'ensemble de la bibliothèque de couleurs professionnelles pré-configurée par la plateforme. Nous allons pouvoir sélectionner précisément n'importe quelle nuance.",
      speechWolof: "Grille bi dafay wone nuance yi nga mën a tànn ci sa sër.",
      stepCategory: 'info'
    },
    {
      stepNumber: 10,
      title: '10. Pastille Individuelle',
      description: 'Sélectionner précisément une pastille de couleur.',
      targetAcomId: 'textiles.form_color_swatch_0',
      actionToPerform: 'click',
      speechFr: "Cliquez sur l'une des pastilles individuelles pour attribuer instantanément cette couleur à votre fiche. Les codes couleur et les noms s'adapteront en temps réel.",
      speechWolof: "Cuubal pastille bi ngir tànn nuance bi. Code bi dafay soppiku ci gaaw.",
      stepCategory: 'action'
    },
    {
      stepNumber: 11,
      title: '11. Nom de Couleur Personnalisé',
      description: 'Donner un nom précis à votre coloris.',
      targetAcomId: 'textiles.form_color_custom_name',
      actionToPerform: 'type',
      speechFr: "Si vous le souhaitez, vous pouvez personnaliser le nom de couleur librement ou y ajouter des précisions (par exemple, Bleu Indigo Foncé, Blanc de Soie ou Rose Fête).",
      speechWolof: "Soo guissul couleur bi ci liste bi, mën nga bind fi tur bi nga bëgg.",
      stepCategory: 'info'
    },
    {
      stepNumber: 12,
      title: '12. Nuanceur HEX',
      description: 'Ajustement précis du code couleur hexadécimal.',
      targetAcomId: 'textiles.form_color_hex',
      actionToPerform: 'type',
      speechFr: "Saisissez directement un code couleur HEX ou utilisez la pipette intégrée pour définir de manière extrêmement précise la nuance visuelle exacte de votre coupon.",
      speechWolof: "Pipette bi dafay tax nga mën a tànn code couleur HEX bi nga bëgg.",
      stepCategory: 'info'
    },
    {
      stepNumber: 13,
      title: '13. Couleur Secondaire (Option)',
      description: 'Saisie d\'une seconde couleur présente sur le motif.',
      targetAcomId: 'textiles.form_color_secondary',
      actionToPerform: 'type',
      speechFr: "Pour les tissus imprimés, brodés ou multicolores, indiquez ici la couleur secondaire de contraste (comme des fils d'or, d'argent, ou des motifs jaunes).",
      speechWolof: "Soo amé motif yu bari couleur, bindal fi couleur secondaire bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 14,
      title: '14. Motif & Style',
      description: 'Sélectionner le style visuel de l\'étoffe.',
      targetAcomId: 'textiles.form_pattern',
      actionToPerform: 'click',
      speechFr: "Indiquez le style graphique de l'étoffe dans la liste déroulante : Uni, Imprimé Wax, Brodé, Fleuri, Bogolan, Carreaux ou Rayé.",
      speechWolof: "Sélecteur bi dafay woné style sër bi : Uni, Fleuri, Brodé, Bogolan...",
      stepCategory: 'info'
    },
    {
      stepNumber: 15,
      title: '15. Quantité (Mètres) *',
      description: 'Quantité en mètres disponible en stock.',
      targetAcomId: 'textiles.form_qty',
      actionToPerform: 'type',
      speechFr: "Indiquez la longueur totale du coupon de tissu ou du rouleau en mètres. C'est ce métrage qui sera débité de manière automatique lors de vos confections.",
      speechWolof: "Bindal fi limu mètres sër bi nga am ci stock bi.",
      stepCategory: 'required'
    },
    {
      stepNumber: 16,
      title: '16. Seuil d\'Alerte',
      description: 'Quantité minimale déclenchant l\'alerte de réapprovisionnement.',
      targetAcomId: 'textiles.form_alert_threshold',
      actionToPerform: 'type',
      speechFr: "Déterminez le seuil critique (par exemple, 3 mètres) sous lequel le système émettra un signal visuel d'avertissement pour vous alerter de la pénurie imminente.",
      speechWolof: "Fii mooy seuil bi nga mën a jox ngir masin bi artu la soo jeexé sër bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 17,
      title: '17. Coût d\'Achat par Mètre *',
      description: 'Prix d\'achat ou coût de revient de la matière première.',
      targetAcomId: 'textiles.form_cost_price',
      actionToPerform: 'type',
      speechFr: "Saisissez le coût d'achat unitaire au mètre pour votre atelier. Cette valeur monétaire est essentielle pour valoriser fidèlement la valeur totale de votre inventaire.",
      speechWolof: "Bindal fi prix bi nga jëndé sër bi ci mètre bu nekk ngir calcul bénéfice bi.",
      stepCategory: 'required'
    },
    {
      stepNumber: 18,
      title: '18. Prix de Vente Conseillé par Mètre *',
      description: 'Tarif de facturation unitaire au mètre pour le client.',
      targetAcomId: 'textiles.form_sale_price',
      actionToPerform: 'type',
      speechFr: "Indiquez le tarif unitaire de revente au mètre. Ce prix sera appliqué pour facturer le tissu au client couture s'il choisit d'utiliser les matières de l'atelier.",
      speechWolof: "Saisis-al fi prix bi nga koy jaayé ci mètre bu nekk.",
      stepCategory: 'required'
    },
    {
      stepNumber: 19,
      title: '19. Fournisseur / Boutique',
      description: 'Origine d\'achat du tissu pour le réapprovisionnement.',
      targetAcomId: 'textiles.form_supplier',
      actionToPerform: 'type',
      speechFr: "Ajoutez de manière optionnelle le nom de la boutique ou du fournisseur d'acquisition (par exemple, Amy Wax Sandaga) pour faciliter un futur réapprovisionnement.",
      speechWolof: "Bindal fi turu fournisseur bi ngir yombal sa jënd yu bees.",
      stepCategory: 'info'
    },
    {
      stepNumber: 20,
      title: '20. Notes & Emplacement',
      description: 'Informations complémentaires, texture et consignes d\'entreposage.',
      targetAcomId: 'textiles.form_notes',
      actionToPerform: 'type',
      speechFr: "Consignez ici des informations utiles telles que l'emplacement physique exact en atelier (ex: Étagère Nord, Tiroir B), la texture de l'étoffe ou sa brillance.",
      speechWolof: "Mën nga fi doli leral yeneen niki fan la denc sër bi ci sa atelier.",
      stepCategory: 'info'
    },
    {
      stepNumber: 21,
      title: '21. Bouton Annuler',
      description: 'Abandonner la saisie en cours.',
      targetAcomId: 'textiles.modal_cancel',
      actionToPerform: 'click',
      speechFr: "Ce bouton ferme la fenêtre et annule l'intégralité de la saisie actuelle sans enregistrer de modifications dans votre stock de tissus.",
      speechWolof: "Bouton Annuler bi dafay tëj fenetre bi te du denc dara.",
      stepCategory: 'action'
    },
    {
      stepNumber: 22,
      title: '22. Bouton Enregistrer le Tissu',
      description: 'Validation finale et enregistrement dans la base locale.',
      targetAcomId: 'textiles.modal_submit',
      actionToPerform: 'click',
      speechFr: "Lorsque tous les champs obligatoires (marqués d'un astérisque) sont valides, cliquez ici pour finaliser l'enregistrement ou la mise à jour de votre fiche de tissu.",
      speechWolof: "Soo paree bind lépp, bëssal fi ngir denc sër bi ci sa stock.",
      stepCategory: 'action'
    },
    {
      stepNumber: 23,
      title: '23. Alerte de Validation',
      description: 'Indication visuelle des champs obligatoires manquants.',
      targetAcomId: 'textiles.modal_warning',
      actionToPerform: 'observe',
      speechFr: "Si certains critères obligatoires de saisie ne sont pas encore satisfaits (par exemple, un nom manquant ou une quantité invalide), cette zone d'avertissement vous explique précisément la cause du blocage.",
      speechWolof: "Bandeau bi dafay wone li manké ci sa formulaire bi ngir mën a denc.",
      stepCategory: 'info'
    }
  ]
};

export const COUTURE_BOUTIQUE_FORM_TUTORIAL: TutorialScenario = {
  id: 'couture_tutorial_boutique_form',
  title: 'Enregistrer une Confection Prêt-à-Porter',
  description: 'Présentation du formulaire de création et modification de tenues prêtes à la vente directe.',
  saasModule: 'couture',
  estimatedDurationSec: 180,
  steps: [
    {
      stepNumber: 1,
      title: 'Formulaire de Confection',
      description: 'Titre de la fenêtre modale.',
      targetAcomId: 'boutique.modal_title',
      actionToPerform: 'observe',
      speechFr: "Voici le formulaire d'enregistrement d'une confection prêt-à-porter. Vous pouvez ajouter un nouveau modèle confectionné à l'atelier ou mettre à jour un article existant.",
      speechWolof: "Fii mooy formulaire bi nga mën a duggalé ñaw yu paré ci sa atelier.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: 'Bouton Fermer',
      description: 'Fermer la fenêtre sans enregistrer.',
      targetAcomId: 'boutique.modal_close_btn',
      actionToPerform: 'observe',
      speechFr: "Ce bouton en croix permet d'interrompre et de fermer la fenêtre à tout moment sans enregistrer.",
      speechWolof: "Bouton bi dafay tëj fenetre bi sa saa su la neexee.",
      stepCategory: 'action'
    },
    {
      stepNumber: 3,
      title: 'Nom du Modèle *',
      description: 'Désignation de la tenue ou création.',
      targetAcomId: 'boutique.modal_name_input',
      actionToPerform: 'type',
      speechFr: "Renseignez le nom commercial ou le modèle de la tenue (ex: Robe Bazin Royal Broderie fine, Ensemble Lin Casual...).",
      speechWolof: "Bindal fi turu tenue bi wala modèle bi nga ñaw.",
      stepCategory: 'required'
    },
    {
      stepNumber: 4,
      title: 'Catégorie *',
      description: 'Type de vêtement.',
      targetAcomId: 'boutique.modal_category_select',
      actionToPerform: 'click',
      speechFr: "Sélectionnez la catégorie du vêtement parmi les choix proposés : Robe, Boubou, Kaftan, Ensemble, Chemise ou Autre création.",
      speechWolof: "Tànnal catégorie bi : Robe, Boubou, Kaftan, Ensemble...",
      stepCategory: 'required'
    },
    {
      stepNumber: 5,
      title: 'Taille du Vêtement *',
      description: 'Taille standardisée de la tenue.',
      targetAcomId: 'boutique.modal_size_select',
      actionToPerform: 'click',
      speechFr: "Précisez la taille confectionnée de la pièce (Taille Unique, S, M, L, XL, XXL ou XXXL).",
      speechWolof: "Tànnal taille bi nga ñaw ci tenue bi.",
      stepCategory: 'required'
    },
    {
      stepNumber: 6,
      title: 'Prix de Vente *',
      description: 'Tarif public de vente directe.',
      targetAcomId: 'boutique.modal_price_input',
      actionToPerform: 'type',
      speechFr: "Indiquez le prix de vente au comptoir pour ce vêtement de prêt-à-porter.",
      speechWolof: "Bindal fi prix bi nga koy jaayé ci boutique bi.",
      stepCategory: 'required'
    },
    {
      stepNumber: 7,
      title: 'Quantité en Stock *',
      description: 'Nombre de pièces disponibles en rayon.',
      targetAcomId: 'boutique.modal_quantity_input',
      actionToPerform: 'type',
      speechFr: "Indiquez le nombre d'exemplaires confectionnés et actuellement disponibles en rayon pour la vente directe.",
      speechWolof: "Bindal fi limu tenue yi nga am ci rayon bi.",
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: 'Coût de Revient Estimé',
      description: 'Coût total matières premières + main d\'œuvre.',
      targetAcomId: 'boutique.modal_cost_input',
      actionToPerform: 'type',
      speechFr: "Renseignez le coût de revient estimé (tissu, mercerie et main d'œuvre) pour calculer automatiquement votre marge bénéficiaire nette.",
      speechWolof: "Doli-al fi li la tenue bi jaré ci tissu ak main d'œuvre ngir calcul sa bénéfice.",
      stepCategory: 'info'
    },
    {
      stepNumber: 9,
      title: 'Type de Tissu / Matière',
      description: 'Étoffe utilisée pour la confection.',
      targetAcomId: 'boutique.modal_fabric_input',
      actionToPerform: 'type',
      speechFr: "Précisez le type de tissu utilisé (ex: Wax Hollandais, Lin, Soie, Bazin...) pour informer immédiatement vos clients.",
      speechWolof: "Bindal fi sër bi nga jëfandikoo ngir ñaw ko.",
      stepCategory: 'info'
    },
    {
      stepNumber: 10,
      title: 'Photo du Vêtement',
      description: 'Téléverser ou visualiser la photo du modèle.',
      targetAcomId: 'boutique.modal_image_upload',
      actionToPerform: 'observe',
      speechFr: "Importez ici une photo réelle de la tenue terminée. Elle permettra d'illustrer la fiche de stock et d'offrir un aperçu visuel zoomable.",
      speechWolof: "Duggalal fi nataalu tenue bi ngir wan ko ci liste bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 11,
      title: 'Notes & Finitions',
      description: 'Détails des découpes, broderies et finitions.',
      targetAcomId: 'boutique.modal_notes_input',
      actionToPerform: 'type',
      speechFr: "Notez ici les particularités techniques et finitions esthétiques de la confection (ex: Broderie col V, manches bouffantes, doublure satin...).",
      speechWolof: "Bindal fi finitions ak particularités yi am ci tenue bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 12,
      title: 'Bouton Annuler',
      description: 'Annuler la saisie sans modifier le stock.',
      targetAcomId: 'boutique.modal_cancel_btn',
      actionToPerform: 'observe',
      speechFr: "Ce bouton annule la saisie et referme le formulaire sans appliquer de changements.",
      speechWolof: "Bouton Annuler bi dafay tëj formulaire bi te du denc dara.",
      stepCategory: 'action'
    },
    {
      stepNumber: 13,
      title: 'Bouton Enregistrer l\'Article',
      description: 'Validation finale et mise en rayon.',
      targetAcomId: 'boutique.modal_submit_btn',
      actionToPerform: 'observe',
      speechFr: "Cliquez ici pour finaliser l'enregistrement de votre création prêt-à-porter et la rendre immédiatement disponible à la vente dans votre boutique.",
      speechWolof: "Bëssal fi ngir denc tenue bi te duggal ko ci boutique bi.",
      stepCategory: 'action'
    }
  ]
};

export const COUTURE_READY_TO_WEAR_TUTORIAL: TutorialScenario = {
  id: 'couture_tutorial_ready_to_wear',
  title: 'Boutique Prêt-à-Porter Atelier',
  description: 'Gestion des vêtements pré-confectionnés en rayon, tailles disponibles et ventes directes.',
  saasModule: 'couture',
  estimatedDurationSec: 240,
  steps: [
    {
      stepNumber: 1,
      title: 'Boutique Prêt-à-Porter',
      description: 'Titre principal du module de vente directe.',
      targetAcomId: 'boutique.title',
      actionToPerform: 'observe',
      speechFr: "Bienvenue dans la Boutique Prêt-à-Porter de l'atelier. Cet espace vous permet de gérer et de vendre directement les confections déjà réalisées en atelier.",
      speechWolof: "Dalal jàmm ci Boutique Prêt-à-Porter. Fi dafay saytu ñaw yu paré ngir jaay ci atelier bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: 'Description du Module',
      description: 'Objectif de la vente directe atelier.',
      targetAcomId: 'boutique.description',
      actionToPerform: 'observe',
      speechFr: "Vous pouvez suivre les confections en rayon, enregistrer les ventes comptoir rapides et analyser votre rentabilité.",
      speechWolof: "Mën nga saytu ñaw yi nekk ci rayon bi ak jaay ci gaaw.",
      stepCategory: 'info'
    },
    {
      stepNumber: 3,
      title: 'Bouton Exporter Stock',
      description: 'Télécharger l\'inventaire en fichier CSV.',
      targetAcomId: 'boutique.export_stock_btn',
      actionToPerform: 'observe',
      speechFr: "Le bouton « Exporter Stock (CSV) » génère un tableur complet de tous les vêtements en stock avec leurs tailles, prix et marges.",
      speechWolof: "Bouton bi dafay générer fichier CSV bu am mbooleem ñaw yi ci rayon bi.",
      stepCategory: 'action'
    },
    {
      stepNumber: 4,
      title: 'Bouton Ajouter une Tenue',
      description: 'Mettre en rayon une nouvelle création.',
      targetAcomId: 'boutique.add_outfit_btn',
      actionToPerform: 'observe',
      speechFr: "Le bouton « Ajouter une Tenue » ouvre le formulaire pour enregistrer une confection terminée avec ses détails de taille, tissu et prix.",
      speechWolof: "Bouton Ajouter une Tenue bi dafay ubbi formulaire ngir duggal ñaw bu bees ci boutique bi.",
      stepCategory: 'action'
    },
    {
      stepNumber: 5,
      title: 'Onglets de Navigation',
      description: 'Collection, Registre des Ventes et Statistiques.',
      targetAcomId: 'boutique.subtabs',
      actionToPerform: 'observe',
      speechFr: "Ces 3 onglets structurent la boutique : la Collection & Stock, le Registre des Ventes, et les Statistiques & Profits.",
      speechWolof: "Ñetti onglet yii dañuy séddatle boutique bi : Collection, Ventes, ak Statistiques.",
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: 'Onglet Collection & Stock',
      description: 'Vue catalogue des tenues prêtes.',
      targetAcomId: 'boutique.subtab_stock',
      actionToPerform: 'observe',
      speechFr: "L'onglet « Collection & Stock » affiche vos modèles confectionnés disponibles avec leurs photographies, tailles et indicateurs de stock.",
      speechWolof: "Onglet Collection & Stock bi dafay wone mbooleem tenue yu paré ci rayon bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 7,
      title: 'Onglet Registre des Ventes',
      description: 'Historique des encaissements boutique.',
      targetAcomId: 'boutique.subtab_sales',
      actionToPerform: 'observe',
      speechFr: "L'onglet « Registre des Ventes » consigne toutes les transactions au comptoir avec mode de règlement (Espèces, Wave, Orange Money) et impression de tickets.",
      speechWolof: "Onglet Registre des Ventes bi dafay denc mbooleem jaay yi nga def ci boutique bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: 'Onglet Statistiques & Profits',
      description: 'Rentabilité et meilleures ventes.',
      targetAcomId: 'boutique.subtab_stats',
      actionToPerform: 'observe',
      speechFr: "L'onglet « Statistiques & Profits » analyse votre chiffre d'affaires, marge nette réelle et classe vos créations les plus vendues.",
      speechWolof: "Onglet Statistiques bi dafay calcul sa chiffre d'affaires ak sa bénéfice ci ñaw yi gën a jaayu.",
      stepCategory: 'info'
    }
  ]
};

export const COUTURE_GALLERY_MODEL_FORM_TUTORIAL: TutorialScenario = {
  id: 'couture_tutorial_gallery_model_form',
  title: 'Ajouter un Nouveau Modèle',
  description: 'Création et enregistrement d\'un modèle de vêtement dans la galerie Couture Design Studio.',
  saasModule: 'couture',
  estimatedDurationSec: 180,
  steps: [
    {
      stepNumber: 1,
      title: 'Titre — Ajouter un Nouveau Modèle',
      description: 'Fenêtre d\'enregistrement d\'un nouveau modèle.',
      targetAcomId: 'inspirations.modal_title',
      actionToPerform: 'observe',
      speechFr: "Vous êtes dans la fenêtre Ajouter un nouveau modèle. Cette fenêtre permet d'enregistrer un nouveau modèle dans la galerie Couture Design Studio.",
      speechWolof: "Yaa ngi ci fenetre Ajouter un nouveau modèle. Fenetre bi dafay mayé nga duggal modèle bu bees ci sa galerie.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: 'Bouton Fermer (X)',
      description: 'Fermer la fenêtre sans enregistrer.',
      targetAcomId: 'inspirations.modal_close_btn',
      actionToPerform: 'observe',
      speechFr: "Cette icône permet de fermer la fenêtre sans poursuivre la création du modèle.",
      speechWolof: "Bouton bi dafay tëj fenetre bi te du denc dara ci li nga bind.",
      stepCategory: 'action'
    },
    {
      stepNumber: 3,
      title: 'Nom du Modèle *',
      description: 'Intitulé commercial du vêtement (Obligatoire).',
      targetAcomId: 'inspirations.modal_title_input',
      actionToPerform: 'observe',
      speechFr: "Saisissez ici le nom du nouveau modèle. Ce champ est obligatoire.",
      speechWolof: "Bindal fi turu modèle bu bees bi. Champ bi dafa obligatoire.",
      stepCategory: 'required'
    },
    {
      stepNumber: 4,
      title: 'Description & Fonctions',
      description: 'Description détaillée, coupe et caractéristiques particulières.',
      targetAcomId: 'inspirations.modal_desc_input',
      actionToPerform: 'observe',
      speechFr: "Cette zone permet de décrire le modèle, ses caractéristiques et ses fonctions particulières.",
      speechWolof: "Fi nga mën a leralé coupe bi, finitions yi ak mbir yu am solo ci tenue bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 5,
      title: 'Prix Main d\'Œuvre Min (FCFA)',
      description: 'Tarif plancher de confection main-d\'œuvre.',
      targetAcomId: 'inspirations.modal_pricemin_input',
      actionToPerform: 'observe',
      speechFr: "Ce champ correspond au montant minimum de main-d'œuvre prévu pour le modèle.",
      speechWolof: "Champ bi mooy prix de base bu gën a suufe ci ñawu modèle bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 6,
      title: 'Prix Main d\'Œuvre Max (FCFA)',
      description: 'Tarif maximum de confection pour finitions d\'apparat.',
      targetAcomId: 'inspirations.modal_pricemax_input',
      actionToPerform: 'observe',
      speechFr: "Ce champ correspond au montant maximum de main-d'œuvre prévu.",
      speechWolof: "Champ bi mooy prix maximum bu ñaw bi mën a tollu.",
      stepCategory: 'info'
    },
    {
      stepNumber: 7,
      title: 'Temps Estimé (jours)',
      description: 'Durée moyenne nécessaire pour confectionner la tenue.',
      targetAcomId: 'inspirations.modal_days_input',
      actionToPerform: 'observe',
      speechFr: "Indiquez ici le temps estimé nécessaire à la confection du modèle, en jours.",
      speechWolof: "Bindal fi ñaata fan lañuy am ngir parél ñaw bi ci atelier bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 8,
      title: 'Difficulté de Travail',
      description: 'Sélecteur du niveau de complexité de coupe.',
      targetAcomId: 'inspirations.modal_difficulty_select',
      actionToPerform: 'observe',
      speechFr: "Ce sélecteur permet de définir le niveau de difficulté du modèle.",
      speechWolof: "Sélecteur bi dafay tax nga tànn niveau difficulté bi : Facile, Moyen wala Difficile.",
      stepCategory: 'control'
    },
    {
      stepNumber: 9,
      title: 'Matière / Tissu Principal',
      description: 'Textile conseillé pour cette confection.',
      targetAcomId: 'inspirations.modal_fabric_input',
      actionToPerform: 'observe',
      speechFr: "Sélectionnez ici la matière ou le tissu principal utilisé pour ce modèle.",
      speechWolof: "Bindal fi sër bi gën a baax ci modèle bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 10,
      title: 'Métrage Requis',
      description: 'Quantité de tissu nécessaire pour la confection.',
      targetAcomId: 'inspirations.modal_yardage_input',
      actionToPerform: 'observe',
      speechFr: "Indiquez la quantité de tissu nécessaire à la réalisation du modèle.",
      speechWolof: "Bindal fi ñaata mètre sër nga soxla ngir ñaw ko.",
      stepCategory: 'info'
    },
    {
      stepNumber: 11,
      title: 'Photo du Modèle *',
      description: 'Zone principale du visuel du vêtement.',
      targetAcomId: 'inspirations.modal_photo_section',
      actionToPerform: 'observe',
      speechFr: "Cette zone interactive permet d'importer le visuel haute définition du modèle.",
      speechWolof: "Wàll bi mooy nataalu modèle bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 12,
      title: 'Zone d\'Importation de Photo',
      description: 'Déposer une photo ici ou parcourir vos fichiers.',
      targetAcomId: 'inspirations.modal_image_dropzone',
      actionToPerform: 'observe',
      speechFr: "Vous pouvez déposer directement une image ou parcourir vos fichiers afin d'ajouter la photo du modèle.",
      speechWolof: "Mën nga duggal nataal bi ci drag-and-drop wala nga tànn ko ci sa appareil.",
      stepCategory: 'action'
    },
    {
      stepNumber: 13,
      title: 'URL de l\'Image (Optionnel)',
      description: 'Adresse web directe d\'une image hébergée.',
      targetAcomId: 'inspirations.modal_image_url_input',
      actionToPerform: 'observe',
      speechFr: "Vous pouvez également renseigner l'adresse d'une image existante.",
      speechWolof: "Mën nga binde itam lien URL nataal bi.",
      stepCategory: 'info'
    },
    {
      stepNumber: 14,
      title: 'Tags (Mots-Clés)',
      description: 'Mots-clés pour classer et retrouver le modèle.',
      targetAcomId: 'inspirations.modal_tags_input',
      actionToPerform: 'observe',
      speechFr: "Ajoutez ici les mots-clés permettant de classer et retrouver plus facilement le modèle. Les tags sont séparés par des virgules.",
      speechWolof: "Duggalal fi ay tags yu séddatle ci virgule ngir seet ko ci gaaw.",
      stepCategory: 'info'
    },
    {
      stepNumber: 15,
      title: 'Bouton Annuler',
      description: 'Quitter sans enregistrer les modifications.',
      targetAcomId: 'inspirations.modal_cancel_btn',
      actionToPerform: 'observe',
      speechFr: "Ce bouton permet de quitter la création du modèle sans enregistrer les informations saisies.",
      speechWolof: "Bouton bi dafay dindi sa liggéey te tëj fenetre bi.",
      stepCategory: 'action'
    },
    {
      stepNumber: 16,
      title: 'Bouton Sauvegarder',
      description: 'Enregistrer le nouveau modèle dans le catalogue.',
      targetAcomId: 'inspirations.modal_submit_btn',
      actionToPerform: 'observe',
      speechFr: "Ce bouton permet d'enregistrer le nouveau modèle.",
      speechWolof: "Bouton bi dafay denc modèle bu bees bi ci sa catalogue.",
      stepCategory: 'action'
    },
    {
      stepNumber: 17,
      title: 'Synthèse — Formulaire Modèle',
      description: 'Fin du parcours de la modale.',
      targetAcomId: 'inspirations.modal_title',
      actionToPerform: 'observe',
      speechFr: "Nous avons parcouru la fenêtre Ajouter un nouveau modèle, de la saisie des informations jusqu'à l'enregistrement.",
      speechWolof: "Saytu nañu mbooleem wàll yi ci fenetre Ajouter un nouveau modèle.",
      stepCategory: 'info'
    }
  ]
};

export const COUTURE_INSPIRATIONS_TUTORIAL: TutorialScenario = {
  id: 'couture_tutorial_inspirations',
  title: 'Galerie d\'Inspirations & Moodboards',
  description: 'Catalogue visuel de modèles, tendances de mode et cahiers de styles pour vos clients.',
  saasModule: 'couture',
  estimatedDurationSec: 240,
  steps: [
    {
      stepNumber: 1,
      title: '1. Galerie d\'Inspirations & Moodboards',
      description: 'Espace d\'exposition des modèles et idées de confection.',
      targetAcomId: 'inspirations.title',
      actionToPerform: 'observe',
      speechFr: "Voici la Galerie d'Inspirations & Moodboards. Présentez à vos clients vos derniers catalogues de modèles, tendances et cahiers de styles.",
      speechWolof: "Fi mooy Galerie d'Inspirations. Wanel sa client yi modèle bu bees ak style yu am xew.",
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Catalogue Visuel & Créations',
      description: 'Sélection directe de modèles pour de nouvelles commandes.',
      targetAcomId: 'inspirations.grid',
      actionToPerform: 'observe',
      speechFr: "Accédez aux photos de réalisations et enregistrez des modèles directement pour de nouvelles commandes.",
      speechWolof: "Sélectionnél modèle yi nga bëgg ngir bind commande bu bees ngir sa client.",
      stepCategory: 'info'
    }
  ]
};

export const COUTURE_ARTISANS_TUTORIAL: TutorialScenario = {
  id: 'couture_tutorial_artisans',
  title: 'Artisans, Équipe & Paie d\'Atelier',
  description: 'Gestion de l\'équipe de couturiers, affectations des commandes et suivi des salaires et règlements.',
  saasModule: 'couture',
  estimatedDurationSec: 240,
  steps: [
    {
      stepNumber: 1,
      title: 'Artisans & Équipe Couture',
      description: 'Espace de gestion du personnel d\'atelier.',
      targetAcomId: 'artisans.title',
      actionToPerform: 'observe',
      speechFr: "Voici l'espace Artisans & Équipe Couture. Pilotez ici votre équipe de couturiers, affectez les confections et gérez la paie d'atelier.",
      speechWolof: "Fi mooy bérab bu Artisans & Équipe. Gérel fi say couturiers, affectations yi ak paie bi.",
      stepCategory: 'info'
    }
  ]
};

export const COUTURE_ARTISAN_FORM_TUTORIAL: TutorialScenario = {
  id: 'couture_tutorial_artisan_form',
  title: 'Fiche Embauche & Profil Artisan',
  description: 'Formulaire d\'enregistrement et modification d\'un artisan couturier.',
  saasModule: 'couture',
  estimatedDurationSec: 180,
  steps: [
    {
      stepNumber: 1,
      title: 'Formulaire Artisan',
      description: 'Fenêtre d\'embauche ou modification d\'un artisan.',
      targetAcomId: 'artisans.modal_title',
      actionToPerform: 'observe',
      speechFr: "Voici le formulaire d'enregistrement de votre artisan. Saisissez son nom, sa spécialité, son numéro de téléphone et ses conditions de rémunération.",
      speechWolof: "Fii mooy formulaire embauche bu artisan bi. Bindal tur am, spécialité am ak façon fay am.",
      stepCategory: 'info'
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
  private ordersViewMode: 'list' | 'timeline' | 'campaigns' = 'list';
  private explainedElements: Set<string> = new Set();

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

  public getInstance(): TutorialEngineService {
    return this;
  }

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

    if (step.targetAcomId) {
      this.explainedElements.add(step.targetAcomId);
    }

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

  public setClientsPageState(context: {
    clientCount: number;
    firstClient?: any;
    garmentProfile?: any;
    displayProfile?: any;
  }): void {
    const { clientCount, firstClient, garmentProfile, displayProfile } = context;

    if (clientCount === 0 || !firstClient) {
      // ÉTAT A : Aucun client enregistré
      COUTURE_CLIENTS_TUTORIAL.steps = [
        {
          stepNumber: 1,
          title: '1. Fichier Clients Couture',
          description: 'Présentation du module de gestion des clients et des mesures.',
          targetAcomId: 'clients.title',
          actionToPerform: 'observe',
          speechFr: "Bienvenue dans votre fichier Clients Couture. Cet espace centralise toutes les fiches clients et les profils morphologiques de votre atelier.",
          speechWolof: "Dalal ak jàmm ci sa Fichier Clients Couture. Fi dafay dajale fiches clients yi ak natt yu atelier bi yëpp.",
          stepCategory: 'info'
        },
        {
          stepNumber: 2,
          title: '2. Compteur de Clients',
          description: 'Indicateur en temps réel du nombre de clients enregistrés.',
          targetAcomId: 'clients.counter',
          actionToPerform: 'observe',
          speechFr: "Le compteur indique actuellement qu'aucun client n'est encore enregistré dans votre fichier d'atelier.",
          speechWolof: "Compteur bi dafay wone ne amagul benn client bu bindu ci sa fichier.",
          stepCategory: 'info'
        },
        {
          stepNumber: 3,
          title: '3. Synchronisation Cloud & Hors-ligne',
          description: 'Statut de synchronisation locale et cloud.',
          targetAcomId: 'clients.sync_btn',
          actionToPerform: 'observe',
          speechFr: "Le bouton de synchronisation permet d'actualiser et de sauvegarder vos fiches clients entre votre appareil local et le serveur sécurisé.",
          speechWolof: "Bouton de synchronisation bi dafay mayé nga synchroniser sa fiches clients ci sufe ak ci cloud bi.",
          stepCategory: 'action'
        },
        {
          stepNumber: 4,
          title: '4. Export Excel & CSV',
          description: 'Exportation de la base clients au format tableur.',
          targetAcomId: 'clients.export_excel_btn',
          actionToPerform: 'observe',
          speechFr: "Ce bouton exporte l'ensemble de votre base clients et leurs mensurations dans un fichier tableur Excel ou CSV.",
          speechWolof: "Bouton bi dafay génne sa liste clients ak natt yi ci fichier Excel wala CSV.",
          stepCategory: 'action'
        },
        {
          stepNumber: 5,
          title: '5. Impression & Export PDF',
          description: 'Export PDF et impression des fiches de mesures.',
          targetAcomId: 'clients.export_pdf_btn',
          actionToPerform: 'observe',
          speechFr: "Ce bouton permet d'imprimer directement ou d'exporter au format PDF les fiches de mesures de vos clients pour votre atelier.",
          speechWolof: "Bouton bi dafay mayé nga imprimer fiches de mesures yi ci PDF ngir sa liggéey ci atelier bi.",
          stepCategory: 'action'
        },
        {
          stepNumber: 6,
          title: '6. Bouton « + Ajouter un Client »',
          description: 'Bouton d\'action principal pour créer une nouvelle fiche.',
          targetAcomId: 'clients.add_btn',
          actionToPerform: 'observe',
          speechFr: "Le bouton principal « + Ajouter un Client » permet de lancer l'Assistant de Prise de Mesures pour enregistrer une nouvelle personne et configurer son vêtement.",
          speechWolof: "Bouton « + Ajouter un Client » bi dafay ubbi assistant natt bi ngir bind client bu bees.",
          stepCategory: 'action'
        },
        {
          stepNumber: 7,
          title: '7. Barre de Recherche Rapide',
          description: 'Filtre de recherche instantanée par nom ou téléphone.',
          targetAcomId: 'clients.search',
          actionToPerform: 'observe',
          speechFr: "La barre de recherche permet de filtrer instantanément vos clients par nom, prénom ou numéro de téléphone dès que votre base s'étoffe.",
          speechWolof: "Barre de recherche bi da lay may nga wër sa client ci tur, sant wala numéro téléphone.",
          stepCategory: 'info'
        },
        {
          stepNumber: 8,
          title: '8. Zone d\'État — Aucun Client Enregistré',
          description: 'Affichage de l\'état initial vide.',
          targetAcomId: 'clients.empty_state',
          actionToPerform: 'observe',
          speechFr: "Actuellement, la liste est vide car aucun client n'a encore été créé. Cliquez sur « Ajouter un Client » pour créer votre première fiche d'atelier.",
          speechWolof: "Léegi liste bi dafa vide ndaxte amagul client. Cuqal ci « Ajouter un Client » ngir tàmbli.",
          stepCategory: 'info'
        },
        {
          stepNumber: 9,
          title: '9. Démarrage de la Création',
          description: 'Invitation à lancer la création.',
          targetAcomId: 'clients.add_btn',
          actionToPerform: 'click',
          speechFr: "Cliquez sur « Ajouter un Client » pour débuter le parcours guidé de création d'une fiche client et de prise de mesures.",
          speechWolof: "Bëssal ci « Ajouter un Client » ngir tàmbli paas bu njëkk bi ci natt yi.",
          stepCategory: 'action'
        }
      ];
    } else {
      // ÉTAT B : Un ou plusieurs clients enregistrés
      const clientName = `${firstClient.firstName || ''} ${firstClient.lastName || ''}`.trim() || 'Client';
      const clientGender = firstClient.gender === 'F' ? 'Femme' : firstClient.gender === 'E' ? 'Enfant' : 'Homme';
      const garmentName = garmentProfile?.garmentName || firstClient.preferredGarment || 'Modèle Sur-Mesure';
      const category = garmentProfile?.definition?.category || firstClient.category || 'Confection';
      const phone = firstClient.phone || '';
      const address = firstClient.address || '';
      const primaryMeasurements = displayProfile?.primaryMeasurements || [];
      const totalFilled = displayProfile?.totalFilledCount ?? Object.keys(firstClient.measurements || {}).length;

      const steps: TutorialStep[] = [
        {
          stepNumber: 1,
          title: '1. Fichier Clients Couture',
          description: 'Tableau de bord de gestion des clients et profils de coupe.',
          targetAcomId: 'clients.title',
          actionToPerform: 'observe',
          speechFr: "Bienvenue dans votre fichier Clients Couture. Cet espace centralise les fiches clients, les modèles de confection et l'ensemble des mensurations d'atelier.",
          speechWolof: "Dalal ak jàmm ci sa Fichier Clients Couture. Fi dafay dajale fiches clients yi ak natt yu atelier bi yëpp.",
          stepCategory: 'info'
        },
        {
          stepNumber: 2,
          title: '2. Compteur de Clients Actifs',
          description: 'Nombre de clients enregistrés en temps réel.',
          targetAcomId: 'clients.counter',
          actionToPerform: 'observe',
          speechFr: `Le compteur indique actuellement ${clientCount} client${clientCount > 1 ? 's' : ''} enregistré${clientCount > 1 ? 's' : ''} dans votre base d'atelier.`,
          speechWolof: `Compteur bi dafay wone ne am nga ${clientCount} client ci sa atelier.`,
          stepCategory: 'info'
        },
        {
          stepNumber: 3,
          title: '3. Synchronisation Cloud',
          description: 'Sauvegarde et synchronisation sécurisée.',
          targetAcomId: 'clients.sync_btn',
          actionToPerform: 'observe',
          speechFr: "Ce bouton permet de synchroniser les fiches clients et leurs mesures avec la base de données sécurisée.",
          speechWolof: "Bouton bi dafay mayé nga synchroniser sa fiches clients ci sufe ak ci cloud bi.",
          stepCategory: 'action'
        },
        {
          stepNumber: 4,
          title: '4. Export Tableur (Excel / CSV)',
          description: 'Exportation de la liste et des mensurations.',
          targetAcomId: 'clients.export_excel_btn',
          actionToPerform: 'observe',
          speechFr: "Exportez l'ensemble des fiches et mesures au format Excel ou CSV pour vos sauvegardes et vos analyses.",
          speechWolof: "Bouton bi dafay génne sa liste clients ak natt yi ci fichier Excel wala CSV.",
          stepCategory: 'action'
        },
        {
          stepNumber: 5,
          title: '5. Impression & Export PDF',
          description: 'Génération de fiches atelier imprimables.',
          targetAcomId: 'clients.export_pdf_btn',
          actionToPerform: 'observe',
          speechFr: "Imprimez le listing complet des fiches de mesures de vos clients pour les coupeurs et tailleurs de l'atelier.",
          speechWolof: "Bouton bi dafay mayé nga imprimer fiches de mesures yi ci PDF ngir sa liggéey ci atelier bi.",
          stepCategory: 'action'
        },
        {
          stepNumber: 6,
          title: '6. Bouton « + Ajouter un Client »',
          description: 'Créer une nouvelle fiche ou un nouveau profil.',
          targetAcomId: 'clients.add_btn',
          actionToPerform: 'observe',
          speechFr: "Cliquez sur « + Ajouter un Client » pour enregistrer un nouveau client ou créer une nouvelle fiche de mesures.",
          speechWolof: "Bouton « + Ajouter un Client » bi dafay ubbi assistant natt bi ngir bind client bu bees.",
          stepCategory: 'action'
        },
        {
          stepNumber: 7,
          title: '7. Barre de Recherche Rapide',
          description: 'Recherche par nom, prénom ou téléphone.',
          targetAcomId: 'clients.search',
          actionToPerform: 'observe',
          speechFr: "Utilisez la barre de recherche pour retrouver rapidement un client par son nom, son prénom ou son numéro de téléphone.",
          speechWolof: "Barre de recherche bi da lay may nga wër sa client ci tur, sant wala numéro téléphone.",
          stepCategory: 'info'
        },
        {
          stepNumber: 8,
          title: '8. Fiche Client d\'Atelier',
          description: 'Présentation de la carte client synthétique.',
          targetAcomId: 'clients.client_card_0',
          actionToPerform: 'observe',
          speechFr: `Voici la fiche d'atelier de ${clientName}. Elle regroupe l'identité, le modèle de vêtement à confectionner et les mensurations complètes.`,
          speechWolof: `Lii mooy fiche client bu ${clientName}.`,
          stepCategory: 'info'
        },
        {
          stepNumber: 9,
          title: '9. Identité & Silhouette',
          description: 'Nom et silhouette du client.',
          targetAcomId: 'clients.client_name_0',
          actionToPerform: 'observe',
          speechFr: `Ce profil concerne ${clientName}, avec la silhouette ${clientGender}.`,
          speechWolof: `Client bi ${clientName} la tudd, silhouette ${clientGender}.`,
          stepCategory: 'info'
        },
        {
          stepNumber: 10,
          title: '10. Actions Rapides (Modifier & Supprimer)',
          description: 'Commandes de gestion de la fiche client.',
          targetAcomId: 'clients.client_actions_0',
          actionToPerform: 'observe',
          speechFr: "Ces boutons permettent de modifier la fiche et les mesures dans l'assistant, ou de supprimer la fiche si nécessaire.",
          speechWolof: "Bouton yii dañuy mayé nga modifier wala supprimer fiche client bi.",
          stepCategory: 'action'
        },
        {
          stepNumber: 11,
          title: '11. Coordonnées de Contact',
          description: 'Téléphone et adresse du client.',
          targetAcomId: 'clients.client_contact_0',
          actionToPerform: 'observe',
          speechFr: `Les coordonnées indiquent le numéro de téléphone ${phone || 'non renseigné'} et l'adresse ${address || 'non renseignée'} pour le suivi d'atelier.`,
          speechWolof: `Numéro téléphone : ${phone || 'amul'} ak adresse : ${address || 'amul'}.`,
          stepCategory: 'info'
        },
        {
          stepNumber: 12,
          title: '12. Section Modèle à Confectionner',
          description: 'Vêtement et catégorie sélectionnés.',
          targetAcomId: 'clients.garment_section_0',
          actionToPerform: 'observe',
          speechFr: `Cette section présente le modèle de vêtement sélectionné : ${garmentName} (${category}), avec ${totalFilled} mesure(s) enregistrée(s).`,
          speechWolof: `Vêtement bi ñu tànn mooy ${garmentName} ci wàllu ${category}.`,
          stepCategory: 'info'
        },
        {
          stepNumber: 13,
          title: '13. Profil & Bouton Mesurer',
          description: 'Accès rapide au Moteur Intelligent de Mesures.',
          targetAcomId: 'clients.profile_section_0',
          actionToPerform: 'observe',
          speechFr: "Le profil textile sélectionné structure les mensurations. Le bouton « Mesurer » permet d'ouvrir directement l'Assistant Intelligent.",
          speechWolof: "Profil textile bi dafay téye natt yi. Bëssal « Mesurer » ngir ubbi assistant bi.",
          stepCategory: 'action'
        }
      ];

      // Add dynamic steps for primary measurements
      primaryMeasurements.forEach((m: any, idx: number) => {
        const stepNum = steps.length + 1;
        const valText = m.isFilled && m.value !== '—' ? `${m.value} ${m.unit || 'cm'}` : 'non renseignée';
        steps.push({
          stepNumber: stepNum,
          title: `${stepNum}. Mesure : ${m.label}`,
          description: `Présentation de la mesure ${m.label}.`,
          targetAcomId: `clients.measurement_0_${idx}`,
          actionToPerform: 'observe',
          speechFr: `Mesure principale : ${m.label}. Valeur enregistrée : ${valText}.`,
          speechWolof: `Natt bu am solo : ${m.label} = ${valText}.`,
          stepCategory: 'info'
        });
      });

      // Total count indicator step
      const countStepNum = steps.length + 1;
      steps.push({
        stepNumber: countStepNum,
        title: `${countStepNum}. Nombre de Mesures Enregistrées`,
        description: 'Total des mesures enregistrées pour ce profil.',
        targetAcomId: 'clients.measurement_count_0',
        actionToPerform: 'observe',
        speechFr: `Cette indication confirme le nombre total de mensurations actuellement enregistrées pour ce profil (${totalFilled} mesure(s)).`,
        speechWolof: `Lii dafay wone ñaatay natt nga bind ci profil bi (${totalFilled} natt).`,
        stepCategory: 'info'
      });

      // View all measurements button step
      const viewAllStepNum = steps.length + 1;
      steps.push({
        stepNumber: viewAllStepNum,
        title: `${viewAllStepNum}. Voir toutes les mensurations`,
        description: 'Afficher le détail de toutes les mensurations.',
        targetAcomId: 'clients.view_all_measurements_0',
        actionToPerform: 'observe',
        speechFr: "Cette commande ouvre le panneau complet pour consulter l'ensemble des mesures principales, complémentaires et les détails morphologiques.",
        speechWolof: "Bëss bii dafay wone natt yëpp yi nga bind ci client bi.",
        stepCategory: 'action'
      });

      COUTURE_CLIENTS_TUTORIAL.steps = steps;
    }

    if (this.isActive && (this.currentScenario?.id === 'couture_tutorial_clients' || this.currentScenario?.id === 'couture.clients.list')) {
      this.currentScenario.steps = COUTURE_CLIENTS_TUTORIAL.steps;
    }
  }

  private getFilteredCoutureSteps(rawSteps: TutorialStep[]): TutorialStep[] {
    const filtered = rawSteps.filter((step, index) => {
      // Step 1 is always the introductory/announcement step, so it should NEVER be filtered out.
      if (index === 0) return true;
      if (!step.targetAcomId) return true;
      const isCommon = [
        'orders.title',
        'orders.counter',
        'orders.view_modes',
        'orders.view_mode_list_btn',
        'orders.view_mode_timeline_btn',
        'orders.view_mode_campaigns_btn',
        'orders.sync_btn',
        'orders.export_excel_btn',
        'orders.export_pdf_btn',
        'orders.add_btn',
        'orders.filters'
      ].includes(step.targetAcomId);
      
      if (isCommon && this.explainedElements.has(step.targetAcomId)) {
        return false;
      }
      return true;
    });

    // Renumber sequentially
    return filtered.map((step, i) => ({
      ...step,
      stepNumber: i + 1,
      title: `${i + 1}. ${step.title.replace(/^\d+\.\s*/, '')}`
    }));
  }

  public setTissusPageState(context: {
    tissusCount: number;
    totalMeters: number;
    totalCost: number;
    expectedProfit: number;
    currency: string;
    searchQuery: string;
    selectedCategory: string;
    selectedColorFamily: string;
    selectedPattern: string;
    stockFilter: string;
    sortBy: string;
    firstTissu?: any;
    allTissus?: any[];
  }): void {
    const {
      tissusCount,
      totalMeters,
      totalCost,
      expectedProfit,
      currency,
      searchQuery,
      selectedCategory,
      selectedColorFamily,
      selectedPattern,
      stockFilter,
      sortBy,
      allTissus = []
    } = context;

    const isTransition = this.explainedElements.size > 0;
    const introSpeechFr = isTransition
      ? "Vous êtes maintenant dans l'onglet Tissus & Wax. Cette section permet de gérer le stock de tissus et de Wax de l'atelier."
      : "Vous êtes dans l'onglet Tissus & Wax. Cette section permet de gérer le stock de tissus et de Wax de l'atelier.";

    const introSpeechWo = isTransition
      ? "Yaa ngi léegi ci onglet Tissus & Wax ngir gérer sa stocku sër ak wax."
      : "Yaa ngi ci onglet Tissus & Wax ngir gérer sa stocku sër ak wax.";

    const steps: TutorialStep[] = [
      {
        stepNumber: 1,
        title: 'Sélecteur Tissus & Wax',
        description: 'Présentation de l\'onglet Tissus & Wax.',
        targetAcomId: 'nav-tailleur_tissus',
        actionToPerform: 'observe',
        speechFr: introSpeechFr,
        speechWolof: introSpeechWo,
        stepCategory: 'info'
      },
      {
        stepNumber: 2,
        title: 'Gestion du Stock de Tissus & Wax',
        description: 'Titre principal de la page.',
        targetAcomId: 'textiles.title',
        actionToPerform: 'observe',
        speechFr: "Vous pouvez voir ici le titre principal, « Gestion du Stock de Tissus & Wax », ainsi que sa description : « Suivez vos métrages disponibles, gérez vos approvisionnements et déduisez automatiquement vos tissus lors des commandes. » C'est le point d'entrée pour la gestion d'inventaire de vos matières premières.",
        speechWolof: "Mën nga guiss fi bat bi : Gestion du Stock de Tissus & Wax. Lii dafay tax nga saytu sa stock yi.",
        stepCategory: 'info'
      },
      {
        stepNumber: 3,
        title: 'Bouton Actualiser',
        description: 'Rafraîchir les données de l\'inventaire.',
        targetAcomId: 'textiles.refresh_btn',
        actionToPerform: 'observe',
        speechFr: "Le bouton « Actualiser » permet de rafraîchir instantanément les données en synchronisant vos modifications locales avec le stockage central.",
        speechWolof: "Bouton Actualiser bi dafay yessal say données ci temps réel.",
        stepCategory: 'action'
      },
      {
        stepNumber: 4,
        title: 'Bouton Ajouter un Tissu',
        description: 'Enregistrer manuellement un nouveau coupon.',
        targetAcomId: 'textiles.add_btn',
        actionToPerform: 'observe',
        speechFr: "Le bouton « Ajouter un Tissu » vous permet d'enregistrer manuellement un nouveau tissu avec son métrage, ses prix de revient et de vente, son motif et ses coloris.",
        speechWolof: "Bouton Ajouter un Tissu bi dafay tax nga mën a duggal sër bu bees ci sa inventaire.",
        stepCategory: 'action'
      },
      {
        stepNumber: 5,
        title: 'Indicateur Variétés',
        description: 'Nombre de modèles uniques de tissus.',
        targetAcomId: 'textiles.stat_varieties',
        actionToPerform: 'observe',
        speechFr: tissusCount === 0 
          ? "La carte VARIÉTÉS indique le nombre de types de tissus uniques enregistrés. Elle affiche actuellement 0 modèle. Ces valeurs indiquent qu'aucun tissu n'est actuellement enregistré dans l'inventaire."
          : `La carte VARIÉTÉS indique le nombre de types de tissus uniques enregistrés. Elle affiche actuellement ${tissusCount} modèles.`,
        speechWolof: `Variétés bi dafay wone limu sër yu bari yi nga am : ${tissusCount} modèles.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 6,
        title: 'Indicateur Stock Global',
        description: 'Total cumulé des métrages de tissus.',
        targetAcomId: 'textiles.stat_global_stock',
        actionToPerform: 'observe',
        speechFr: totalMeters === 0
          ? "La carte STOCK GLOBAL totalise l'ensemble des métrages disponibles en atelier. Elle affiche actuellement 0 mètre. Ces valeurs indiquent qu'aucun tissu n'est actuellement enregistré ou disponible dans l'inventaire."
          : `La carte STOCK GLOBAL totalise l'ensemble des métrages disponibles en atelier. Nous avons actuellement ${totalMeters} mètres de stock.`,
        speechWolof: `Stock global bi dafay wone métrage yi nga am ci atelier bi : ${totalMeters} m.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 7,
        title: 'Indicateur Valeur d\'Achat (Coût)',
        description: 'Coût total estimé du stock disponible.',
        targetAcomId: 'textiles.stat_cost_value',
        actionToPerform: 'observe',
        speechFr: totalCost === 0
          ? `La carte VALEUR D'ACHAT (COÛT) calcule la valeur financière d'acquisition du stock basée sur le coût au mètre. Elle affiche actuellement 0 ${currency}. Ces valeurs indiquent que la valeur financière du stock actuel est de zéro.`
          : `La carte VALEUR D'ACHAT (COÛT) calcule la valeur financière d'acquisition du stock basée sur le coût au mètre. Elle s'élève actuellement à ${totalCost.toLocaleString()} ${currency}.`,
        speechWolof: `Valeur d'achat bi dafay woné ñata nga jëndé sa stock : ${totalCost.toLocaleString()} ${currency}.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 8,
        title: 'Indicateur Profit Estimé',
        description: 'Bénéfice attendu lors de la confection/revente.',
        targetAcomId: 'textiles.stat_estimated_profit',
        actionToPerform: 'observe',
        speechFr: expectedProfit === 0
          ? `La carte PROFIT ESTIMÉ affiche le gain projeté lors de la revente ou de la confection, calculé comme la différence entre la valeur de vente et le coût d'achat. Elle affiche actuellement +0 ${currency}, indiquant un profit prévisionnel de zéro.`
          : `La carte PROFIT ESTIMÉ affiche le gain projeté lors de la revente ou de la confection, calculé comme la différence entre la valeur de vente et le coût d'achat. Elle affiche actuellement +${expectedProfit.toLocaleString()} ${currency}.`,
        speechWolof: `Profit estimé bi dafay woné bénéfice bi nga mën a am : +${expectedProfit.toLocaleString()} ${currency}.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 9,
        title: 'Recherche de Tissu',
        description: 'Rechercher par nom, couleur ou motif.',
        targetAcomId: 'textiles.search_input',
        actionToPerform: 'observe',
        speechFr: `Voici la zone de recherche. Elle permet de retrouver très rapidement n'importe quel coupon par son nom, sa couleur (bleu, bordeaux, etc.), son motif ou sa référence. Sa valeur actuelle est ${searchQuery ? `'` + searchQuery + `'` : 'vide'}.`,
        speechWolof: "Fi nga mën a seet sa sër yi ci gaaw.",
        stepCategory: 'info'
      },
      {
        stepNumber: 10,
        title: 'Filtre de Catégorie',
        description: 'Isoler une catégorie de textile.',
        targetAcomId: 'textiles.filter_category',
        actionToPerform: 'observe',
        speechFr: `Le filtre de catégorie permet de cibler des familles de produits textiles comme le Bazin, le Lin ou le Wax. Actuellement, il est réglé sur : ${selectedCategory === 'All' ? 'Toutes les catégories' : selectedCategory}.`,
        speechWolof: `Sélecteur catégorie bi dafay lay may nga tànn sër yi nga bëgg. Léegi mu ngi ci : ${selectedCategory === 'All' ? 'Yëpp' : selectedCategory}.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 11,
        title: 'Filtre de Couleur',
        description: 'Filtrer par couleur dominante.',
        targetAcomId: 'textiles.filter_color',
        actionToPerform: 'observe',
        speechFr: `Le filtre de couleur permet d'affiner l'affichage selon le coloris dominant du tissu. Actuellement, sa valeur est : ${selectedColorFamily === 'all' ? 'Toutes les couleurs' : selectedColorFamily}.`,
        speechWolof: `Sélecteur couleur bi dafay mayé nga tànn couleur yi nga bëgg. Mu ngi ci : ${selectedColorFamily === 'all' ? 'Yëpp' : selectedColorFamily}.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 12,
        title: 'Filtre de Motif',
        description: 'Sélectionner le motif du textile.',
        targetAcomId: 'textiles.filter_pattern',
        actionToPerform: 'observe',
        speechFr: `Le filtre de motifs vous permet de trier les coupons unis, brodés, imprimés ou géométriques. Actuellement, il est configuré sur : ${selectedPattern === 'all' ? 'Tous les motifs' : selectedPattern}.`,
        speechWolof: `Sélecteur motif bi dafay woné sër yu am motifs wala uni. Mu ngi ci : ${selectedPattern === 'all' ? 'Yëpp' : selectedPattern}.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 13,
        title: 'Filtre de Niveau de Stock',
        description: 'Trier selon la quantité restante.',
        targetAcomId: 'textiles.filter_stock',
        actionToPerform: 'observe',
        speechFr: `Le filtre de niveau de stock permet d'identifier rapidement les matières en pénurie ou épuisées. Actuellement, sa valeur est : ${stockFilter === 'all' ? 'Tous les stocks' : stockFilter === 'instock' ? 'En stock' : stockFilter === 'low' ? 'Stock critique' : 'Épuisé'}.`,
        speechWolof: `Filtre stock bi dafay woné sër yi manké wala yu amé stock. Mu ngi ci : ${stockFilter}.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 14,
        title: 'Sélecteur de Tri',
        description: 'Réorganiser l\'affichage.',
        targetAcomId: 'textiles.filter_sort',
        actionToPerform: 'observe',
        speechFr: `Le sélecteur de tri réorganise l'ordre d'affichage de vos coupons. Actuellement, il utilise le critère : ${sortBy === 'newest' ? 'Plus récents' : sortBy === 'name' ? 'Nom alphabétique' : sortBy === 'quantity' ? 'Métrage décroissant' : 'Prix décroissant'}.`,
        speechWolof: `Tànneefu tri bi dafay soppi sër yi ci gannaaw. Mu ngi ci : ${sortBy}.`,
        stepCategory: 'info'
      }
    ];

    if (tissusCount === 0) {
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Aucun tissu trouvé',
        description: 'État d\'inventaire vide.',
        targetAcomId: 'textiles.empty_state',
        actionToPerform: 'observe',
        speechFr: "Aucun tissu n'est actuellement enregistré dans votre inventaire. L'application affiche l'état vide « Aucun tissu trouvé » avec l'explication : « Vous n'avez pas encore enregistré de tissus dans votre inventaire. Ajoutez-en un manuellement ou générez des exemples pour tester ! »",
        speechWolof: "Amul benn sër bu nekk ci sa stock. Da bëgg nga duggal ko ci sa loxxo wala nga bëss bouton bi ngir générer ay exemples.",
        stepCategory: 'info'
      });
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Générer des exemples de tissus',
        description: 'Créer des tissus d\'exemple automatiquement.',
        targetAcomId: 'textiles.generate_samples_btn',
        actionToPerform: 'observe',
        speechFr: "Le bouton « Générer des exemples de tissus » est disponible pour pré-remplir l'inventaire avec des pièces de démonstration typiques (Wax, Bazin Riche, Lin...) pour tester les fonctionnalités de l'atelier.",
        speechWolof: "Bouton bi dafay mayé nga générer ay modèles yu baax ngir sa saytu.",
        stepCategory: 'action'
      });
    } else {
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Liste des Tissus',
        description: 'Grille d\'inventaire active.',
        targetAcomId: 'textiles.grid',
        actionToPerform: 'observe',
        speechFr: `Voici la grille globale d'inventaire de vos tissus. Elle regroupe toutes vos fiches. Nous allons maintenant analyser en détail chaque coupon visible individuellement de haut en bas, élément par élément.`,
        speechWolof: "Fi yaay guiss sa liste sër yi yëpp nekk ci grille bi.",
        stepCategory: 'info'
      });

      allTissus.forEach((t, idx) => {
        const qty = t.quantity ?? 0;
        const isCrit = qty <= 2 && qty > 0;
        const isOut = qty === 0;

        const stockStateFr = isOut 
          ? "Rupture de stock (0 mètre)" 
          : isCrit 
            ? `Stock critique (seulement ${qty} m restants)` 
            : `Stock optimal (${qty} m disponibles)`;

        const stockStateWo = isOut 
          ? "dafa jeex (0 m)" 
          : isCrit 
            ? `dafa manke (${qty} m rekk)` 
            : `bari na (${qty} m)`;

        const costVal = t.costPricePerMeter ?? 0;
        const priceVal = t.pricePerMeter ?? t.price ?? 0;
        const displayColor = t.color || 'Couleur non spécifiée';
        const displayPattern = t.pattern || 'Uni / sans motif';
        const displaySupplier = t.supplier || 'Aucun fournisseur renseigné';
        const displayRef = t.internalRef || 'Aucune référence interne';

        // Add a scroll indicator step before card index 3 (4th card) to highlight dynamic list scrollability
        if (idx === 3) {
          steps.push({
            stepNumber: steps.length + 1,
            title: 'Défilement de l\'inventaire',
            description: 'Exploration des cartes de tissus situées plus bas dans la grille.',
            targetAcomId: 'textiles.grid',
            actionToPerform: 'observe',
            speechFr: "Nous détectons que d'autres coupons de tissus sont enregistrés plus bas. L'application gère le défilement vertical pour révéler l'intégralité de l'inventaire. Faisons défiler l'écran pour analyser les cartes suivantes sans omettre aucune donnée.",
            speechWolof: "Am na yeneen sër yu nekk ci suuf. Ñu ngi wacci ngir saytu leen yëpp ci gannaaw.",
            stepCategory: 'info'
          });
        }

        const scrollNotice = idx >= 3 ? "Après défilement, " : "";
        const introCardNoticeFr = idx > 0 ? "Passons maintenant au tissu suivant dans la liste. " : "";
        const introCardNoticeWo = idx > 0 ? "Léegi ñu weuy ci sër bi ci gannaaw. " : "";

        // 1. Category Badge
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Catégorie`,
          description: 'Catégorie du textile',
          targetAcomId: `textiles.card_category_${idx}`,
          actionToPerform: 'observe',
          speechFr: `${introCardNoticeFr}${scrollNotice}Cette zone en haut à gauche correspond à la catégorie « ${t.category || 'Non spécifiée'} » pour la fiche de tissu numéro ${idx + 1}.`,
          speechWolof: `${introCardNoticeWo}Boobu zone sër bu tudd « ${t.category || 'Non spécifiée'} » la ci fiche n°${idx + 1}.`,
          stepCategory: 'info'
        });

        // 2. Status Badge
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Statut`,
          description: 'Statut de synchronisation',
          targetAcomId: `textiles.card_status_${idx}`,
          actionToPerform: 'observe',
          speechFr: `Ici est affiché le statut de synchronisation en temps réel de la fiche : « ${t.syncStatus === 'pending' ? 'En attente' : 'Synchronisé' } » avec la référence interne : ${displayRef}.`,
          speechWolof: `Fii mu ngi wone statut de synchronisation bi : « ${t.syncStatus === 'pending' ? 'En attente' : 'Synchronisé' } » ak sa référence ${displayRef}.`,
          stepCategory: 'info'
        });

        // 3. Price Header Badge
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Prix public`,
          description: 'Tarif unitaire au mètre',
          targetAcomId: `textiles.card_price_${idx}`,
          actionToPerform: 'observe',
          speechFr: `Le prix de revente affiché en haut à droite pour ce coupon est de ${priceVal.toLocaleString()} ${currency} par mètre.`,
          speechWolof: `Prix bi ci en-tête mu ngi tollo ci ${priceVal.toLocaleString()} ${currency} ci m.`,
          stepCategory: 'info'
        });

        // 4. Quantity Header Badge
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Métrage Rapide`,
          description: 'Quantité globale en en-tête',
          targetAcomId: `textiles.card_qty_header_${idx}`,
          actionToPerform: 'observe',
          speechFr: `Le métrage rapide disponible affiché en en-tête est de ${qty} mètre${qty > 1 ? 's' : ''}. C'est une valeur consultable en un coup d'œil.`,
          speechWolof: `Métrage bi nekk ci en-tête mu ngi tollo ci ${qty} m.`,
          stepCategory: 'info'
        });

        // 5. Fabric Name
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Nom`,
          description: 'Nom réel du tissu',
          targetAcomId: `textiles.card_name_${idx}`,
          actionToPerform: 'observe',
          speechFr: `Le nom réel du tissu enregistré est « ${t.name} ».`,
          speechWolof: `Sër bi mu ngi tudd « ${t.name} ».`,
          stepCategory: 'info'
        });

        // 6. Main Color Pill
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Couleur`,
          description: 'Couleur enregistrée et pastille',
          targetAcomId: `textiles.card_color_${idx}`,
          actionToPerform: 'observe',
          speechFr: `La couleur principale enregistrée est « ${displayColor} », représentée par sa pastille colorée correspondante.`,
          speechWolof: `Couleur sër bi mu ngi nekk « ${displayColor} ».`,
          stepCategory: 'info'
        });

        // 7. Pattern Pill (Only if present)
        if (t.pattern) {
          steps.push({
            stepNumber: steps.length + 1,
            title: `Tissu n°${idx + 1} — Motif`,
            description: 'Motif et badge associé',
            targetAcomId: `textiles.card_pattern_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Le motif enregistré pour ce coupon est « ${displayPattern} », identifié par ce badge.`,
            speechWolof: `Motif bi mu ngi nekk « ${displayPattern} ».`,
            stepCategory: 'info'
          });
        }

        // 8. Cost price breakdown
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Coût d'achat`,
          description: 'Valeur de revient financière',
          targetAcomId: `textiles.card_cost_${idx}`,
          actionToPerform: 'observe',
          speechFr: `Le coût d'achat ou de revient au mètre pour votre atelier s'élève à ${costVal.toLocaleString()} ${currency}/m.`,
          speechWolof: `Li ñu ko jëndé mu ngi tollo ci ${costVal.toLocaleString()} ${currency} ci m.`,
          stepCategory: 'info'
        });

        // 9. Sales price breakdown
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Prix de vente`,
          description: 'Valeur de vente de détail',
          targetAcomId: `textiles.card_sale_${idx}`,
          actionToPerform: 'observe',
          speechFr: `Le prix de revente au détail configuré pour vos clients s'élève à ${priceVal.toLocaleString()} ${currency}/m.`,
          speechWolof: `Prix jaay bi mu ngi tollo ci ${priceVal.toLocaleString()} ${currency} ci m.`,
          stepCategory: 'info'
        });

        // 10. Supplier (Only if present)
        if (t.supplier) {
          steps.push({
            stepNumber: steps.length + 1,
            title: `Tissu n°${idx + 1} — Fournisseur`,
            description: 'Fournisseur enregistré',
            targetAcomId: `textiles.card_supplier_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Cette pièce de tissu a été acquise auprès du fournisseur « ${displaySupplier} ».`,
            speechWolof: `Sër bi mu ngi jige ci fournisseur « ${displaySupplier} ».`,
            stepCategory: 'info'
          });
        }

        // 11. Progress indicator
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Jauge de niveau`,
          description: 'Barre de niveau de stock restante',
          targetAcomId: `textiles.card_progress_${idx}`,
          actionToPerform: 'observe',
          speechFr: `La jauge de stock visuelle et le métrage restant de ${qty === 0 ? "zéro mètre" : qty + " m"} indiquent que ce coupon est actuellement dans l'état : ${stockStateFr}.`,
          speechWolof: `Jauge stock bi mu ngi wone niveau bi : ${stockStateWo}. Métrage bi fi nekk mu ngi tollo ci ${qty === 0 ? "zero" : qty} m.`,
          stepCategory: 'info'
        });

        // 12. Actions (Edit)
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Modifier la fiche`,
          description: 'Modifier les détails de la fiche',
          targetAcomId: `textiles.card_edit_${idx}`,
          actionToPerform: 'observe',
          speechFr: `L'icône de crayon « Modifier » permet d'ouvrir le formulaire d'édition complet pour corriger ou mettre à jour n'importe quel champ de cette fiche de tissu.`,
          speechWolof: `Icône crayon bi dafay lay may nga soppi mbooleem leralu sër bi.`,
          stepCategory: 'action'
        });

        // 12b. Actions (Delete)
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Supprimer le tissu`,
          description: 'Supprimer ce tissu de la liste',
          targetAcomId: `textiles.card_delete_${idx}`,
          actionToPerform: 'observe',
          speechFr: `Cette icône permet de supprimer ce tissu de la liste.`,
          speechWolof: `Icône corbeille bi dafay lay may nga dindi sër bi ci sa liste bi.`,
          stepCategory: 'action'
        });

        // 13. Adjust stock button
        steps.push({
          stepNumber: steps.length + 1,
          title: `Tissu n°${idx + 1} — Ajuster stock`,
          description: 'Modifier la quantité disponible rapidement',
          targetAcomId: `textiles.card_action_${idx}`,
          actionToPerform: 'observe',
          speechFr: `Le bouton « Ajuster stock » ouvre le formulaire rapide pour incrémenter ou décrémenter directement la quantité en mètres de ce tissu pour l'adapter au stock réel physique de l'atelier.`,
          speechWolof: `Bouton Ajuster stock bi dafay mayé nga yessal métrage sër bi ci gaaw.`,
          stepCategory: 'action'
        });
      });
    }

    COUTURE_TEXTILES_TUTORIAL.steps = steps;

    if (this.isActive) {
      if (this.currentScenario?.id === 'couture_tutorial_textiles' || this.currentScenario?.id === 'couture.tissus.list') {
        this.currentScenario.steps = steps;
      }
    }
  }

  public setBoutiquePageState(context: {
    activeSubTab: 'stock' | 'sales' | 'stats';
    totalArticles: number;
    salesCount: number;
    totalSales: number;
    totalProfit: number;
    currency: string;
    search: string;
    filterCategory: string;
    filterStock: string;
    articles: any[];
    sales: any[];
    cartCount: number;
    statsSummary: any;
  }): void {
    const {
      activeSubTab,
      totalArticles,
      salesCount,
      totalSales,
      totalProfit,
      currency,
      search,
      filterCategory,
      filterStock,
      articles = [],
      sales = [],
      cartCount,
      statsSummary
    } = context;

    const isTransition = this.explainedElements.size > 0;
    const introSpeechFr = isTransition
      ? "Vous êtes maintenant dans l'onglet Boutique Prêt-à-porter. Cette section permet la vente directe des tenues déjà confectionnées à l'atelier."
      : "Vous êtes dans l'onglet Boutique Prêt-à-porter. Cette section permet la vente directe des tenues déjà confectionnées à l'atelier.";

    const introSpeechWo = isTransition
      ? "Yaa ngi léegi ci onglet Boutique Prêt-à-porter ngir jaay ñaw yu paré ci atelier bi."
      : "Yaa ngi ci onglet Boutique Prêt-à-porter ngir jaay ñaw yu paré ci atelier bi.";

    const steps: TutorialStep[] = [
      {
        stepNumber: 1,
        title: 'Sélecteur Boutique Prêt-à-porter',
        description: 'Présentation de l\'onglet Boutique.',
        targetAcomId: 'nav-tailleur_boutique',
        actionToPerform: 'observe',
        speechFr: introSpeechFr,
        speechWolof: introSpeechWo,
        stepCategory: 'info'
      },
      {
        stepNumber: 2,
        title: 'Boutique Prêt-à-porter',
        description: 'Titre principal de l\'espace de vente directe.',
        targetAcomId: 'boutique.title',
        actionToPerform: 'observe',
        speechFr: "Voici l'en-tête de la Boutique Prêt-à-porter. Ce module permet d'exposer et de vendre les vêtements pré-confectionnés en rayon, sans attendre une commande sur-mesure.",
        speechWolof: "Fii mooy en-tête Boutique Prêt-à-porter ngir jaay ñaw yu paré.",
        stepCategory: 'info'
      },
      {
        stepNumber: 3,
        title: 'Description du Module',
        description: 'Vente directe de tenues déjà confectionnées à l\'atelier.',
        targetAcomId: 'boutique.description',
        actionToPerform: 'observe',
        speechFr: "Le sous-titre rappelle le rôle de cette section : la vente directe et immédiate de modèles en stock physique à l'atelier.",
        speechWolof: "Lii dafay leeral niki jaay ñaw yu paré ci atelier bi.",
        stepCategory: 'info'
      }
    ];

    if (cartCount > 0) {
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Panier de Vente Active',
        description: 'Accéder au panier de caisse en cours.',
        targetAcomId: 'boutique.cart_btn',
        actionToPerform: 'observe',
        speechFr: `Le bouton « Voir le Panier (${cartCount}) » permet d'ouvrir la caisse pour finaliser la vente des ${cartCount} article${cartCount > 1 ? 's' : ''} sélectionné${cartCount > 1 ? 's' : ''}.`,
        speechWolof: `Bouton Panier bi dafay ubbi caisse bi ngir jaay ${cartCount} tenue yi nga tànn.`,
        stepCategory: 'action'
      });
    }

    steps.push({
      stepNumber: steps.length + 1,
      title: 'Bouton Exporter Stock (CSV)',
      description: 'Téléchargement de l\'inventaire.',
      targetAcomId: 'boutique.export_stock_btn',
      actionToPerform: 'observe',
      speechFr: "Le bouton « Exporter Stock (CSV) » génère un export tabulaire de l'ensemble de votre catalogue prêt-à-porter avec les stocks, prix et marges.",
      speechWolof: "Bouton Exporter Stock bi dafay générer fichier CSV bu am mbooleem stock bi.",
      stepCategory: 'action'
    });

    steps.push({
      stepNumber: steps.length + 1,
      title: 'Bouton Ajouter une Tenue',
      description: 'Mettre en rayon un nouveau vêtement.',
      targetAcomId: 'boutique.add_outfit_btn',
      actionToPerform: 'observe',
      speechFr: "Le bouton « Ajouter une Tenue » ouvre le formulaire de saisie pour ajouter une nouvelle création prête à la vente directe.",
      speechWolof: "Bouton Ajouter une Tenue bi dafay ubbi formulaire ngir duggal ñaw bu bees.",
      stepCategory: 'action'
    });

    steps.push({
      stepNumber: steps.length + 1,
      title: 'Onglets de Navigation Boutique',
      description: 'Basculer entre Stock, Ventes et Statistiques.',
      targetAcomId: 'boutique.subtabs',
      actionToPerform: 'observe',
      speechFr: "La barre d'onglets structure la boutique en 3 vues complémentaires : Collection & Stock, Registre des Ventes, et Statistiques & Profits.",
      speechWolof: "Onglet yii dañuy séddatle boutique bi ci ñetti wàll : Collection, Ventes, ak Statistiques.",
      stepCategory: 'info'
    });

    steps.push({
      stepNumber: steps.length + 1,
      title: 'Onglet Collection & Stock',
      description: `Catalogue des créations (${totalArticles} modèles).`,
      targetAcomId: 'boutique.subtab_stock',
      actionToPerform: 'observe',
      speechFr: `L'onglet « Collection & Stock (${totalArticles}) » regroupe l'ensemble des vêtements confectionnés disponibles en rayon avec leurs tailles et prix.`,
      speechWolof: `Onglet Collection & Stock bi dafay wone ${totalArticles} tenue yu nekk ci rayon bi.`,
      stepCategory: 'info'
    });

    steps.push({
      stepNumber: steps.length + 1,
      title: 'Onglet Registre des Ventes',
      description: `Historique des encaissements (${salesCount} ventes).`,
      targetAcomId: 'boutique.subtab_sales',
      actionToPerform: 'observe',
      speechFr: `L'onglet « Registre des Ventes (${salesCount}) » consigne l'historique complet des transactions comptoir avec édition de reçus de caisse.`,
      speechWolof: `Onglet Registre des Ventes bi dafay wone ${salesCount} jaay yu ñu def.`,
      stepCategory: 'info'
    });

    steps.push({
      stepNumber: steps.length + 1,
      title: 'Onglet Statistiques & Profits',
      description: 'Analyse financière de la boutique.',
      targetAcomId: 'boutique.subtab_stats',
      actionToPerform: 'observe',
      speechFr: "L'onglet « Statistiques & Profits » analyse vos performances commerciales : chiffre d'affaires, marge nette et meilleures ventes.",
      speechWolof: "Onglet Statistiques bi dafay calcul sa chiffre d'affaires ak sa bénéfice.",
      stepCategory: 'info'
    });

    if (activeSubTab === 'stock') {
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Barre de Filtrage & Recherche',
        description: 'Recherche et filtres combinés.',
        targetAcomId: 'boutique.filters',
        actionToPerform: 'observe',
        speechFr: "Cette barre d'outils regroupe la recherche instantanée et les filtres de catégories et de stock pour trouver immédiatement une pièce.",
        speechWolof: "Barre d'outils bi dafay tax nga mën a seet tenue ci gaaw.",
        stepCategory: 'info'
      });

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Recherche Rapide',
        description: 'Rechercher par nom de modèle ou tissu.',
        targetAcomId: 'boutique.search_input',
        actionToPerform: 'observe',
        speechFr: `Le champ de recherche filtre en direct le catalogue par nom de modèle ou matière. Valeur actuelle : ${search ? `'` + search + `'` : 'vide'}.`,
        speechWolof: "Fi nga mën a binde turu tenue bi nga bëgg seet.",
        stepCategory: 'info'
      });

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Filtre de Catégorie',
        description: 'Filtrer par type de vêtement.',
        targetAcomId: 'boutique.filter_category',
        actionToPerform: 'observe',
        speechFr: `Ce menu filtre les modèles par catégorie : Robes, Boubous, Kaftans, Ensembles, Chemises. Actuellement : ${filterCategory === 'all' ? 'Toutes catégories' : filterCategory}.`,
        speechWolof: `Sélecteur catégorie bi dafay woné catégorie bi nga tànn : ${filterCategory}.`,
        stepCategory: 'info'
      });

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Filtre d\'État du Stock',
        description: 'Articles en stock ou en rupture.',
        targetAcomId: 'boutique.filter_stock',
        actionToPerform: 'observe',
        speechFr: `Ce sélecteur permet d'isoler les vêtements disponibles immédiatement ou en rupture de stock. Actuellement : ${filterStock === 'all' ? 'Tous les stocks' : filterStock === 'instock' ? 'En stock' : 'Rupture'}.`,
        speechWolof: `Sélecteur stock bi dafay woné tenue yi am stock wala yu jeex.`,
        stepCategory: 'info'
      });

      if (articles.length === 0) {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Aucun vêtement trouvé',
          description: 'Catalogue vide ou aucun résultat pour les filtres.',
          targetAcomId: 'boutique.empty_state',
          actionToPerform: 'observe',
          speechFr: "Aucun vêtement de prêt-à-porter ne correspond actuellement aux critères de recherche. Vous pouvez modifier vos filtres ou cliquer sur « Ajouter une Tenue » pour garnir le rayon.",
          speechWolof: "Amul benn tenue bu nekk ci rayon bi léegi. Mën nga soppi filtres yi wala nga doli tenue bu bees.",
          stepCategory: 'info'
        });
      } else {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Grille des Tenues en Rayon',
          description: 'Catalogue visuel des modèles confectionnés.',
          targetAcomId: 'boutique.grid',
          actionToPerform: 'observe',
          speechFr: `Voici la grille d'exposition des modèles prêt-à-porter. Nous allons analyser chaque création en rayon en détail, de haut en bas, élément par élément.`,
          speechWolof: "Fii yaay guiss mbooleem tenue yi nekk ci rayon bi.",
          stepCategory: 'info'
        });

        articles.forEach((art, idx) => {
          const isOutOfStock = art.quantity === 0;
          const isLowStock = art.quantity === 1;
          const stockStateFr = isOutOfStock
            ? "Rupture de stock (0 pièce)"
            : isLowStock
              ? "Dernier exemplaire disponible (1 pièce)"
              : `En stock (${art.quantity} pièce${art.quantity > 1 ? 's' : ''} disponible${art.quantity > 1 ? 's' : ''})`;

          if (idx === 3) {
            steps.push({
              stepNumber: steps.length + 1,
              title: 'Défilement de la Boutique',
              description: 'Exploration des modèles situés plus bas.',
              targetAcomId: 'boutique.grid',
              actionToPerform: 'observe',
              speechFr: "D'autres modèles sont exposés plus bas dans la vitrine. L'écran gère le défilement vertical pour examiner chaque pièce sans omission.",
              speechWolof: "Am na yeneen tenue yu nekk ci suuf. Ñu ngi wacci ngir saytu leen yëpp.",
              stepCategory: 'info'
            });
          }

          const isFirstCard = idx === 0;
          const cardIntroFr = isFirstCard
            ? `Examinons la première création en rayon : « ${art.name} ». `
            : `Nous avons vu comment fonctionnent le prix de vente, la marge et le stock sur la première carte. Passons maintenant à la tenue suivante : « ${art.name} ». `;
          const cardIntroWo = isFirstCard
            ? `Ñu xool tenue bu jëkk bi ci rayon bi : « ${art.name} ». `
            : `Léegi ñu jàll ci tenue bi ci topp : « ${art.name} ». `;

          // 1. Photo & Zoom
          steps.push({
            stepNumber: steps.length + 1,
            title: `Tenue n°${idx + 1} — Photo & Zoom`,
            description: `Visuel de la tenue : ${art.name}.`,
            targetAcomId: `boutique.card_image_${idx}`,
            actionToPerform: 'observe',
            speechFr: `${cardIntroFr}La photographie présente le rendu réel de la confection. Cliquer sur l'image ouvre le zoom grand format haute définition.`,
            speechWolof: `${cardIntroWo}Nataalu tenue bi mu ngi wone ñaw bi ci anam bu leer. Soo klikee ci nataal bi dafay yaatal photo bi.`,
            stepCategory: 'info'
          });

          // 2. Category Badge
          steps.push({
            stepNumber: steps.length + 1,
            title: `Tenue n°${idx + 1} — Catégorie`,
            description: `Catégorie du modèle : ${art.category}.`,
            targetAcomId: `boutique.card_category_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Ce badge indique la catégorie de la création : « ${art.category} ».`,
            speechWolof: `Badge bi dafay woné catégorie bi : « ${art.category} ».`,
            stepCategory: 'info'
          });

          // 3. Size Badge
          if (art.size) {
            steps.push({
              stepNumber: steps.length + 1,
              title: `Tenue n°${idx + 1} — Taille`,
              description: `Taille confectionnée : ${art.size}.`,
              targetAcomId: `boutique.card_size_${idx}`,
              actionToPerform: 'observe',
              speechFr: `Ce badge précise la taille confectionnée : « Taille ${art.size} ».`,
              speechWolof: `Badge bi dafay woné taille tenue bi : « Taille ${art.size} ».`,
              stepCategory: 'info'
            });
          }

          // 4. Stock Status Badge
          steps.push({
            stepNumber: steps.length + 1,
            title: `Tenue n°${idx + 1} — Disponibilité & Stock`,
            description: `État du stock : ${stockStateFr}.`,
            targetAcomId: `boutique.card_stock_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Cet indicateur signale la disponibilité physique en rayon : ${stockStateFr}.`,
            speechWolof: `Indicateur stock bi mu ngi wone : ${stockStateFr}.`,
            stepCategory: 'info'
          });

          // 5. Name / Designation
          steps.push({
            stepNumber: steps.length + 1,
            title: `Tenue n°${idx + 1} — Désignation`,
            description: `Nom du modèle : ${art.name}.`,
            targetAcomId: `boutique.card_name_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Le modèle est intitulé « ${art.name} ».`,
            speechWolof: `Turu tenue bi mu ngi tudd « ${art.name} ».`,
            stepCategory: 'info'
          });

          // 6. Fabric / Tissu
          if (art.fabric) {
            steps.push({
              stepNumber: steps.length + 1,
              title: `Tenue n°${idx + 1} — Tissu`,
              description: `Tissu utilisé : ${art.fabric}.`,
              targetAcomId: `boutique.card_fabric_${idx}`,
              actionToPerform: 'observe',
              speechFr: `Le tissu employé pour cette confection est : « ${art.fabric} ».`,
              speechWolof: `Sër bi ñu jëfandikoo mooy « ${art.fabric} ».`,
              stepCategory: 'info'
            });
          }

          // 7. Notes / Finitions / Description
          if (art.notes) {
            steps.push({
              stepNumber: steps.length + 1,
              title: `Tenue n°${idx + 1} — Description & Finitions`,
              description: 'Détails des finitions et particularités.',
              targetAcomId: `boutique.card_notes_${idx}`,
              actionToPerform: 'observe',
              speechFr: `Les finitions et détails de confection enregistrés sont : « ${art.notes} ».`,
              speechWolof: `Leral finitions yi ñu bind : « ${art.notes} ».`,
              stepCategory: 'info'
            });
          }

          // 8. Sale Price (OBLIGATOIRE ÉTAPE B — PRIX DE VENTE BLOC)
          steps.push({
            stepNumber: steps.length + 1,
            title: `Tenue n°${idx + 1} — Prix de Vente`,
            description: `Prix de vente : ${art.price.toLocaleString()} ${currency}.`,
            targetAcomId: `boutique.card_price_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Voici le prix de vente de cette tenue. Dans cet exemple, elle est proposée à ${art.price.toLocaleString()} ${currency}.`,
            speechWolof: `Lii mooy prix de vente bu tenue bi. Ci misaal bi, mu ngi tollo ci ${art.price.toLocaleString()} ${currency}.`,
            stepCategory: 'info'
          });

          // 9. Margin (OBLIGATOIRE ÉTAPE C — MARGE BLOC)
          if (art.cost) {
            const margin = art.price - art.cost;
            steps.push({
              stepNumber: steps.length + 1,
              title: `Tenue n°${idx + 1} — Marge Bénéficiaire`,
              description: `Marge estimée : +${margin.toLocaleString()} ${currency}.`,
              targetAcomId: `boutique.card_margin_${idx}`,
              actionToPerform: 'observe',
              speechFr: `Cette zone indique la marge estimée. Ici, elle est de plus ${margin.toLocaleString()} ${currency}.`,
              speechWolof: `Wàll bi dafay wone bénéfice bi nga ci am. Fii mu ngi tollo ci plus ${margin.toLocaleString()} ${currency}.`,
              stepCategory: 'info'
            });

            // 10. Cost (OBLIGATOIRE ÉTAPE D — COÛT BLOC)
            steps.push({
              stepNumber: steps.length + 1,
              title: `Tenue n°${idx + 1} — Coût d'Atelier`,
              description: `Coût de revient : ${art.cost.toLocaleString()} ${currency}.`,
              targetAcomId: `boutique.card_cost_${idx}`,
              actionToPerform: 'observe',
              speechFr: `Le coût correspond ici à ${art.cost.toLocaleString()} ${currency}. Cette information permet de distinguer le coût de revient du prix auquel la tenue est vendue.`,
              speechWolof: `Coût bi mu ngi tollo ci ${art.cost.toLocaleString()} ${currency}. Lii dafay tax nga xam li nga def ci tenue bi ak prix bi ngay jaaye.`,
              stepCategory: 'info'
            });
          }

          // 11. Add to Cart button
          steps.push({
            stepNumber: steps.length + 1,
            title: `Tenue n°${idx + 1} — Ajouter au Panier`,
            description: 'Placer la tenue dans la caisse de vente directe.',
            targetAcomId: `boutique.card_add_cart_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Ce bouton permet d'ajouter la tenue au panier.`,
            speechWolof: `Bouton bi dafay duggal tenue bi ci panier caisse bi.`,
            stepCategory: 'action'
          });

          // 12. Edit button
          steps.push({
            stepNumber: steps.length + 1,
            title: `Tenue n°${idx + 1} — Modifier`,
            description: 'Mettre à jour les informations du modèle.',
            targetAcomId: `boutique.card_edit_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Ce bouton permet de modifier la fiche.`,
            speechWolof: `Bouton bi dafay tax nga soppi leralu tenue bi.`,
            stepCategory: 'action'
          });

          // 13. Restock button
          steps.push({
            stepNumber: steps.length + 1,
            title: `Tenue n°${idx + 1} — Restocker`,
            description: 'Incrémenter la quantité en rayon.',
            targetAcomId: `boutique.card_restock_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Cette action permet d'ajuster le stock.`,
            speechWolof: `Action bi dafay tax nga doli limu tenue yi nekk ci stock bi.`,
            stepCategory: 'action'
          });

          // 14. Delete button (Trash icon)
          steps.push({
            stepNumber: steps.length + 1,
            title: `Tenue n°${idx + 1} — Retirer du Stock`,
            description: 'Supprimer cette tenue du stock.',
            targetAcomId: `boutique.card_delete_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Cette action permet de retirer la tenue du stock.`,
            speechWolof: `Action bi dafay dindi tenue bi ci stock boutique bi.`,
            stepCategory: 'action'
          });
        });

        // Final Synthesis Step
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Synthèse — Boutique Prêt-à-Porter',
          description: 'Présentation complète du module terminée.',
          targetAcomId: 'boutique.title',
          actionToPerform: 'observe',
          speechFr: "Vous maîtrisez désormais l'ensemble du catalogue prêt-à-porter : navigation, filtres, détails de confection, prix, marges, stocks et encaissement direct.",
          speechWolof: "Xam nga léegi mbooleem wàll yi ci Boutique Prêt-à-porter : filtres, tenue, prix, bénéfices, stock ak jaay ci caisse bi.",
          stepCategory: 'info'
        });
      }
    } else if (activeSubTab === 'sales') {
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Recherche dans les Ventes',
        description: 'Rechercher par nom de client ou vêtement.',
        targetAcomId: 'boutique.sales_search',
        actionToPerform: 'observe',
        speechFr: "Le champ de recherche filtre l'historique des encaissements par nom de client, numéro de téléphone ou modèle de vêtement.",
        speechWolof: "Fi nga mën a seet jaay yi ci turu client bi wala tenue bi.",
        stepCategory: 'info'
      });

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Chiffre d\'Affaires Global Boutique',
        description: `Total CA boutique : ${totalSales.toLocaleString()} ${currency}.`,
        targetAcomId: 'boutique.sales_total_ca',
        actionToPerform: 'observe',
        speechFr: `Cet encadré synthétise le montant total des ventes directes enregistrées : ${totalSales.toLocaleString()} ${currency}.`,
        speechWolof: `Fi mu ngi wone montant total jaay boutique bi : ${totalSales.toLocaleString()} ${currency}.`,
        stepCategory: 'info'
      });

      if (sales.length === 0) {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Aucune Vente Enregistrée',
          description: 'État vide du registre de caisse.',
          targetAcomId: 'boutique.sales_empty_state',
          actionToPerform: 'observe',
          speechFr: "Aucune vente n'a encore été enregistrée. Les transactions comptoir s'afficheront ici au fur et à mesure des encaissements.",
          speechWolof: "Amul benn jaay bu ñu denc ba léegi. Soo jaayee tenue, mu ngi fay feeñ.",
          stepCategory: 'info'
        });
      } else {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Tableau du Registre des Ventes',
          description: `Liste des ${sales.length} transactions comptoir.`,
          targetAcomId: 'boutique.sales_table',
          actionToPerform: 'observe',
          speechFr: `Le tableau récapitule toutes les ventes avec date, client, mode de paiement, montant encaissé et accès à l'impression du ticket de caisse.`,
          speechWolof: `Tableau bi dafay wone mbooleem jaay yi ak reçus yi nga mën a imprimer.`,
          stepCategory: 'info'
        });
      }
    } else if (activeSubTab === 'stats') {
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Indicateurs Clés de Rentabilité',
        description: 'Synthèse du chiffre d\'affaires, marges et stock.',
        targetAcomId: 'boutique.stats_overview',
        actionToPerform: 'observe',
        speechFr: `Cette grille de 4 indicateurs présente le chiffre d'affaires (${totalSales.toLocaleString()} ${currency}), le bénéfice réel estimé (${totalProfit.toLocaleString()} ${currency}), le volume de pièces vendues (${statsSummary?.itemsCount || 0} pièces) et la valeur totale de l'inventaire en rayon.`,
        speechWolof: `Ñeenti indicateurs yii dañuy wone chiffre d'affaires, bénéfice réel ak valeur stock bi ci rayon bi.`,
        stepCategory: 'info'
      });

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Graphiques & Meilleures Ventes',
        description: 'Répartition des paiements et palmarès des créations.',
        targetAcomId: 'boutique.stats_charts',
        actionToPerform: 'observe',
        speechFr: "Ces visualisations détaillent la répartition des règlements par moyen de paiement (Espèces, Wave, Orange Money, Carte) ainsi que le classement des modèles les plus vendus.",
        speechWolof: "Graphiques yii dañuy wone naka lañu fayé ak modèle yi gën a jaayu ci sa boutique.",
        stepCategory: 'info'
      });
    }

    COUTURE_READY_TO_WEAR_TUTORIAL.steps = steps;

    if (this.isActive) {
      if (this.currentScenario?.id === 'couture_tutorial_ready_to_wear' || this.currentScenario?.id === 'couture.boutique') {
        this.currentScenario.steps = steps;
      }
    }
  }

  public setInspirationsPageState(context: {
    activeSubTab: 'catalog' | 'moodboards' | 'ai_assistant';
    models: any[];
    filteredModels: any[];
    moodboards: any[];
    searchQuery: string;
    selectedDifficulty: string;
    selectedFabric: string;
    selectedMoodboardId: string | null;
    currency: string;
  }): void {
    const {
      activeSubTab = 'catalog',
      models = [],
      filteredModels = [],
      moodboards = [],
      searchQuery = '',
      selectedDifficulty = 'all',
      selectedFabric = 'all',
      selectedMoodboardId = null,
      currency = 'FCFA'
    } = context;

    const isTransition = this.explainedElements.size > 0;
    const introSpeechFr = isTransition
      ? "Vous êtes maintenant dans l'onglet Inspirations & Moodboards. Cet espace permet d'exposer vos modèles, organiser vos collections et inspirer vos clients."
      : "Vous êtes dans l'onglet Inspirations & Moodboards. Cet espace permet d'exposer vos modèles, organiser vos collections et inspirer vos clients.";

    const introSpeechWo = isTransition
      ? "Yaa ngi léegi ci onglet Inspirations & Moodboards ngir wone say modèle ak sa xalaati stylisme."
      : "Yaa ngi ci onglet Inspirations & Moodboards ngir wone say modèle ak sa xalaati stylisme.";

    const steps: TutorialStep[] = [
      {
        stepNumber: 1,
        title: 'Sélecteur Inspirations & Moodboards',
        description: 'Présentation du studio de création.',
        targetAcomId: 'nav-tailleur_gallery',
        actionToPerform: 'observe',
        speechFr: introSpeechFr,
        speechWolof: introSpeechWo,
        stepCategory: 'info'
      },
      {
        stepNumber: 2,
        title: 'Couture Design Studio — Inspirations',
        description: 'Espace d\'exposition des modèles, moodboards et stylisme.',
        targetAcomId: 'inspirations.title',
        actionToPerform: 'observe',
        speechFr: "Voici le Couture Design Studio et la Galerie d'Inspirations. Présentez à vos clients vos derniers catalogues de modèles, tendances et cahiers de styles pour déclencher de nouvelles confections.",
        speechWolof: "Fii mooy Couture Design Studio. Wanel sa clients yi say modèle bu bees ak sa cahiers de styles.",
        stepCategory: 'info'
      },
      {
        stepNumber: 3,
        title: 'Navigation du Studio de Création',
        description: 'Trois univers : Galerie, Moodboards et Styliste IA.',
        targetAcomId: 'inspirations.subtabs',
        actionToPerform: 'observe',
        speechFr: "La barre de sous-onglets structure le studio en 3 espaces : la Galerie de Modèles, les Moodboards Clients et le Styliste assisté par IA.",
        speechWolof: "Ñetti sous-onglets yii dañuy séddatle studio bi : Galerie, Moodboards ak Styliste IA.",
        stepCategory: 'info'
      },
      {
        stepNumber: 4,
        title: 'Onglet Galerie de Modèles',
        description: `Catalogue visuel des créations (${models.length} modèles).`,
        targetAcomId: 'inspirations.subtab_catalog',
        actionToPerform: 'observe',
        speechFr: `L'onglet « Galerie de Modèles » présente l'ensemble de vos patrons et confections avec photos, métrages, temps d'atelier et fourchettes de prix.`,
        speechWolof: `Onglet Galerie bi dafay wone mbooleem modèle yi nga am ci sa atelier.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 5,
        title: 'Onglet Moodboards Clients',
        description: `Cahiers de styles et thématiques (${moodboards.length} collections).`,
        targetAcomId: 'inspirations.subtab_moodboards',
        actionToPerform: 'observe',
        speechFr: `L'onglet « Moodboards Clients » regroupe vos collections thématiques (Tabaski, Mariages, Soirées) prêtes à être partagées avec vos clients.`,
        speechWolof: `Onglet Moodboards bi dafay dajale ay collections yu am thème ngir wone sa clients yi.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 6,
        title: 'Onglet Inspiration IA',
        description: 'Générateur de fiches techniques et modèles par IA.',
        targetAcomId: 'inspirations.subtab_ai',
        actionToPerform: 'observe',
        speechFr: "L'onglet « Inspiration IA » met à votre disposition un styliste virtuel capable de concevoir une fiche technique complète à partir d'une simple idée.",
        speechWolof: "Onglet Inspiration IA bi dafay mayé nga def ay modèle yu bees ak styliste virtuel.",
        stepCategory: 'info'
      }
    ];

    if (activeSubTab === 'catalog') {
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Barre de Filtres & Recherche',
        description: 'Recherche instantanée et sélecteurs de critères.',
        targetAcomId: 'inspirations.controls_panel',
        actionToPerform: 'observe',
        speechFr: "Cette barre d'outils permet de filtrer rapidement votre galerie par mots-clés, niveau de difficulté et type de tissu.",
        speechWolof: "Barre bi dafay tax nga seet modèle yi ci gaaw ci tur, difficulté wala sër.",
        stepCategory: 'info'
      });

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Recherche Rapide',
        description: 'Filtrer par nom de modèle, tissu ou mot-clé.',
        targetAcomId: 'inspirations.search_input',
        actionToPerform: 'observe',
        speechFr: `Le champ de recherche affine l'affichage en direct. Valeur actuelle : ${searchQuery ? `'${searchQuery}'` : 'vide'}.`,
        speechWolof: "Fi nga mën a binde turu modèle bi nga bëgg seet.",
        stepCategory: 'info'
      });

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Filtre de Difficulté',
        description: 'Filtrer par complexité de coupe.',
        targetAcomId: 'inspirations.filter_difficulty',
        actionToPerform: 'observe',
        speechFr: `Ce filtre trie les modèles selon le niveau d'exigence technique : Facile, Moyen ou Difficile. Sélection actuelle : ${selectedDifficulty === 'all' ? 'Toutes les difficultés' : selectedDifficulty}.`,
        speechWolof: `Sélecteur bi dafay wone difficulté bi : Facile, Moyen wala Difficile.`,
        stepCategory: 'info'
      });

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Filtre de Tissu',
        description: 'Filtrer par matière conseillée.',
        targetAcomId: 'inspirations.filter_fabric',
        actionToPerform: 'observe',
        speechFr: `Ce filtre isole les créations prévues pour un tissu particulier : Wax, Basin, Crêpe, Dentelle ou Soie. Sélection : ${selectedFabric === 'all' ? 'Tous les tissus' : selectedFabric}.`,
        speechWolof: `Sélecteur bi dafay wone sër yi : Wax, Basin, Soie wala Dentelle.`,
        stepCategory: 'info'
      });

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Bouton Ajouter un Modèle',
        description: 'Créer une nouvelle fiche de vêtement.',
        targetAcomId: 'inspirations.add_model_btn',
        actionToPerform: 'observe',
        speechFr: "Le bouton « Ajouter un Modèle » ouvre le formulaire pour enregistrer une nouvelle création avec photo, métrage, délais et grille tarifaire.",
        speechWolof: "Bouton bi dafay ubbi formulaire bi ngir duggal modèle bu bees ci sa galerie.",
        stepCategory: 'action'
      });

      if (selectedMoodboardId) {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Présenter au Client',
          description: 'Partager la collection sélectionnée.',
          targetAcomId: 'inspirations.present_client_btn',
          actionToPerform: 'observe',
          speechFr: "Ce bouton permet de générer une planche de présentation visuelle de ce moodboard et de l'envoyer directement au client.",
          speechWolof: "Bouton bi dafay mayé nga wone collection bi sa client.",
          stepCategory: 'action'
        });
      }

      if (filteredModels.length === 0) {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Aucun Modèle Trouvé',
          description: 'Aucune création ne correspond aux critères actuels.',
          targetAcomId: 'inspirations.empty_state',
          actionToPerform: 'observe',
          speechFr: "Aucun modèle ne correspond à vos filtres actuels. Modifiez vos critères ou cliquez sur « Ajouter un Modèle » pour enrichir votre catalogue.",
          speechWolof: "Amul benn modèle bu nekk ci sélection bi léegi. Mën nga soppi filtres yi.",
          stepCategory: 'info'
        });
      } else {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Grille d\'Exposition des Modèles',
          description: `Présentation détaillée des ${filteredModels.length} créations du catalogue.`,
          targetAcomId: 'inspirations.grid',
          actionToPerform: 'observe',
          speechFr: `Voici la vitrine de vos modèles. Nous allons parcourir chaque création en détail, carte par carte, élément par élément, sans aucune omission.`,
          speechWolof: "Fii yaay guiss mbooleem modèle yi nekk ci sa galerie. Ñu ngi koy saytu benn par benn.",
          stepCategory: 'info'
        });

        filteredModels.forEach((model, idx) => {
          if (idx === 3) {
            steps.push({
              stepNumber: steps.length + 1,
              title: 'Défilement de la Galerie',
              description: 'Exploration des modèles situés plus bas.',
              targetAcomId: 'inspirations.grid',
              actionToPerform: 'observe',
              speechFr: "D'autres créations sont exposées plus bas dans le catalogue. L'écran gère le défilement vertical pour examiner chaque pièce sans omission.",
              speechWolof: "Am na yeneen modèle yu nekk ci suuf. Ñu ngi wacci ngir saytu leen yëpp.",
              stepCategory: 'info'
            });
          }

          const isFirstCard = idx === 0;
          const cardIntroFr = isFirstCard
            ? `Examinons la première création du catalogue : « ${model.title} ». `
            : `Passons au modèle suivant : « ${model.title} ». `;
          const cardIntroWo = isFirstCard
            ? `Ñu xool modèle bu jëkk bi ci catalogue bi : « ${model.title} ». `
            : `Léegi ñu jàll ci modèle bi ci topp : « ${model.title} ». `;

          // 1. Photo & Zoom
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modèle n°${idx + 1} — Visuel & Zoom`,
            description: `Aperçu haute définition du modèle : ${model.title}.`,
            targetAcomId: `inspirations.card_image_${idx}`,
            actionToPerform: 'observe',
            speechFr: isFirstCard
              ? `${cardIntroFr}La photographie présente le rendu réel de la création. Cliquer sur l'image ouvre le zoom grand format haute définition avec fiche technique intégrée.`
              : `${cardIntroFr}Voici la photographie du vêtement avec zoom haute définition disponible au clic.`,
            speechWolof: `${cardIntroWo}Nataalu modèle bi mu ngi wone ñaw bi ci anam bu leer. Soo klikee ci nataal bi dafay yaatal photo bi.`,
            stepCategory: 'info'
          });

          // 2. Difficulty Badge
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modèle n°${idx + 1} — Difficulté`,
            description: `Niveau d'exigence technique : ${model.difficulty}.`,
            targetAcomId: `inspirations.card_difficulty_${idx}`,
            actionToPerform: 'observe',
            speechFr: isFirstCard
              ? `Ce badge indique la complexité technique de coupe et de montage : « ${model.difficulty} ». Il permet d'attribuer le modèle à l'artisan approprié.`
              : `Niveau de difficulté pour ce modèle : « ${model.difficulty} ».`,
            speechWolof: `Badge bi dafay woné difficulté bi : « ${model.difficulty} ».`,
            stepCategory: 'info'
          });

          // 3. Price Range Badge
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modèle n°${idx + 1} — Fourchette Tarifaire`,
            description: `Prix indicatif main d'œuvre : ${model.priceMin.toLocaleString('fr-FR')} à ${model.priceMax.toLocaleString('fr-FR')} ${currency}.`,
            targetAcomId: `inspirations.card_price_${idx}`,
            actionToPerform: 'observe',
            speechFr: isFirstCard
              ? `Cette pastille affiche la fourchette de prix conseillée pour la confection de ce modèle : de ${model.priceMin.toLocaleString('fr-FR')} à ${model.priceMax.toLocaleString('fr-FR')} ${currency}. Elle guide la négociation avec le client.`
              : `Fourchette tarifaire de confection : de ${model.priceMin.toLocaleString('fr-FR')} à ${model.priceMax.toLocaleString('fr-FR')} ${currency}.`,
            speechWolof: `Prix de confection bi mu ngi tollo ci ${model.priceMin.toLocaleString('fr-FR')} ba ${model.priceMax.toLocaleString('fr-FR')} ${currency}.`,
            stepCategory: 'info'
          });

          // 4. Designation / Title
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modèle n°${idx + 1} — Désignation`,
            description: `Intitulé de la création : ${model.title}.`,
            targetAcomId: `inspirations.card_title_${idx}`,
            actionToPerform: 'observe',
            speechFr: isFirstCard
              ? `Voici l'intitulé officiel de la création : « ${model.title} ».`
              : `Modèle : « ${model.title} ».`,
            speechWolof: `Turu modèle bi mu ngi tudd « ${model.title} ».`,
            stepCategory: 'info'
          });

          // 5. Description & Finitions
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modèle n°${idx + 1} — Description & Coupe`,
            description: model.description || 'Détails de style et coupe.',
            targetAcomId: `inspirations.card_description_${idx}`,
            actionToPerform: 'observe',
            speechFr: isFirstCard
              ? `La description technique précise les spécificités de la silhouette, des ouvertures et des finitions : « ${model.description} ».`
              : `Détails de coupe et finitions : « ${model.description} ».`,
            speechWolof: `Leral coupe ak finitions : « ${model.description} ».`,
            stepCategory: 'info'
          });

          // 6. Fabric / Tissu
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modèle n°${idx + 1} — Tissu Conseillé`,
            description: `Matière recommandée : ${model.fabricType}.`,
            targetAcomId: `inspirations.card_fabric_${idx}`,
            actionToPerform: 'observe',
            speechFr: isFirstCard
              ? `Cette mention indique le tissu optimal pour respecter la tombée et la structure du modèle : « ${model.fabricType} ».`
              : `Tissu préconisé : « ${model.fabricType} ».`,
            speechWolof: `Sër bi gën ci modèle bi mooy « ${model.fabricType} ».`,
            stepCategory: 'info'
          });

          // 7. Yardage / Métrage
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modèle n°${idx + 1} — Métrage Requis`,
            description: `Consommation de tissu estimée : ${model.yardageNeeded}.`,
            targetAcomId: `inspirations.card_yardage_${idx}`,
            actionToPerform: 'observe',
            speechFr: isFirstCard
              ? `Cet indicateur précise le métrage exact de tissu nécessaire à demander au client ou à prélever en stock : « ${model.yardageNeeded} ».`
              : `Métrage requis : « ${model.yardageNeeded} ».`,
            speechWolof: `Métrage sër bi nga soxla mooy « ${model.yardageNeeded} ».`,
            stepCategory: 'info'
          });

          // 8. Time / Temps de confection
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modèle n°${idx + 1} — Temps de Confection`,
            description: `Délai d'atelier moyen : ~${model.estimatedDays} jours.`,
            targetAcomId: `inspirations.card_time_${idx}`,
            actionToPerform: 'observe',
            speechFr: isFirstCard
              ? `Cette information évalue le temps d'atelier nécessaire pour la coupe, l'assemblage et les finitions, soit environ ${model.estimatedDays} jours.`
              : `Délai de réalisation estimé : environ ${model.estimatedDays} jours.`,
            speechWolof: `Délai ñaw bi mu ngi tollo ci lu mat ${model.estimatedDays} fan.`,
            stepCategory: 'info'
          });

          // 9. Tags & Mots-clés
          if (model.tags && model.tags.length > 0) {
            steps.push({
              stepNumber: steps.length + 1,
              title: `Modèle n°${idx + 1} — Mots-Clés & Thèmes`,
              description: `Tags associés : ${model.tags.map((t: string) => `#${t}`).join(', ')}.`,
              targetAcomId: `inspirations.card_tags_${idx}`,
              actionToPerform: 'observe',
              speechFr: isFirstCard
                ? `Les tags permettent d'associer des styles, cérémonies ou caractéristiques au modèle pour une recherche instantanée : ${model.tags.join(', ')}.`
                : `Tags : ${model.tags.join(', ')}.`,
              speechWolof: `Mots-clés yi ñu ci boolé : ${model.tags.join(', ')}.`,
              stepCategory: 'info'
            });
          }

          // 10. Action Pin to Moodboard
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modèle n°${idx + 1} — Épingler (Pin)`,
            description: 'Ajouter cette création à un moodboard thématique.',
            targetAcomId: `inspirations.card_pin_${idx}`,
            actionToPerform: 'observe',
            speechFr: "Le bouton « Pin » permet d'épingler ce modèle dans un ou plusieurs moodboards pour créer des planches thématiques personnalisées.",
            speechWolof: "Bouton Pin bi dafay mayé nga duggal modèle bi ci sa moodboards.",
            stepCategory: 'action'
          });

          // 11. Action Edit
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modèle n°${idx + 1} — Modifier la Fiche`,
            description: 'Mettre à jour les caractéristiques techniques du modèle.',
            targetAcomId: `inspirations.card_edit_${idx}`,
            actionToPerform: 'observe',
            speechFr: "Ce bouton ouvre la fenêtre de modification pour ajuster le nom, la description, les délais, les prix ou la photo du modèle.",
            speechWolof: "Bouton Modifier bi dafay tax nga soppi leralu modèle bi.",
            stepCategory: 'action'
          });

          // 12. Action Delete
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modèle n°${idx + 1} — Supprimer du Catalogue`,
            description: 'Archiver ou retirer ce modèle de la galerie.',
            targetAcomId: `inspirations.card_delete_${idx}`,
            actionToPerform: 'observe',
            speechFr: "Cette icône permet de supprimer définitivement ce modèle de votre galerie d'inspirations.",
            speechWolof: "Bouton bi dafay dindi modèle bi ci sa galerie.",
            stepCategory: 'action'
          });
        });
      }
    }

    COUTURE_INSPIRATIONS_TUTORIAL.steps = steps;

    if (this.isActive) {
      if (this.currentScenario?.id === 'couture_tutorial_inspirations' || this.currentScenario?.id === 'couture.inspirations') {
        this.currentScenario.steps = steps;
      }
    }
  }

  public setArtisansPageState(context: {
    activeSubTab?: 'artisans' | 'assignments' | 'payments' | 'rates' | string;
    subTab?: 'artisans' | 'assignments' | 'payments' | 'rates' | string;
    totalArtisansCount?: number;
    totalArtisans?: number;
    totalAssignmentsCount?: number;
    totalPendingAssignmentsCount?: number;
    totalCompletedAssignmentsCount?: number;
    totalPayrollAmount?: number;
    totalEarnedAll?: number;
    totalPaidPayrollAmount?: number;
    totalPaidAll?: number;
    totalPendingPayrollAmount?: number;
    remainingDueAll?: number;
    currency?: string;
    search?: string;
    searchQuery?: string;
    filterSpecialty?: string;
    filterStatus?: string;
    filterAssignStatus?: string;
    artisans?: any[];
    assignments?: any[];
    payments?: any[];
  }): void {
    const activeSubTab = (context.activeSubTab || context.subTab || 'artisans') as string;
    const totalEarnedAll = context.totalEarnedAll ?? context.totalPayrollAmount ?? 0;
    const totalPaidAll = context.totalPaidAll ?? context.totalPaidPayrollAmount ?? 0;
    const remainingDueAll = context.remainingDueAll ?? context.totalPendingPayrollAmount ?? 0;
    const currency = context.currency || 'FCFA';
    const search = context.search ?? context.searchQuery ?? '';
    const filterSpecialty = context.filterSpecialty || 'all';
    const artisans = context.artisans || [];
    const assignments = context.assignments || [];
    const payments = context.payments || [];

    const isSubTabChange = (this as any).lastArtisansSubTab !== undefined && (this as any).lastArtisansSubTab !== activeSubTab;
    (this as any).lastArtisansSubTab = activeSubTab;

    const subTabLabels: Record<string, string> = {
      artisans: 'Équipe & Statuts',
      assignments: 'Plan de Travail (Assignations)',
      payments: 'Rémunération à la pièce',
      salaries_mensuel: 'Rémunération Mensuelle',
      salaries_hebdomadaire: 'Rémunération Hebdomadaire',
      salaries_journalier: 'Rémunération Journalière'
    };
    const activeSubTabLabel = subTabLabels[activeSubTab] || activeSubTab;

    const steps: TutorialStep[] = [];

    // 1. Navigation / Titre
    steps.push({
      stepNumber: 1,
      title: 'Sélecteur Principal — ARTISANS & ÉQUIPE',
      description: 'Module de gestion du personnel et de la paie d\'atelier.',
      targetAcomId: 'nav-tailleur_artisans',
      actionToPerform: 'observe',
      speechFr: "Voici votre espace principal ARTISANS & ÉQUIPE pour piloter tout votre atelier de couture.",
      speechWolof: "Fii mooy wàllu ARTISANS & ÉQUIPE ngir gère mbooleem ouvriers yi ak paie bi.",
      stepCategory: 'info'
    });

    steps.push({
      stepNumber: 2,
      title: 'Atelier & Artisans',
      description: 'Titre de la vue d\'ensemble.',
      targetAcomId: 'artisans.title',
      actionToPerform: 'observe',
      speechFr: "Bienvenue dans la section Atelier & Artisans, votre centre de commande pour suivre vos collaborateurs, leurs tâches et leurs rémunérations.",
      speechWolof: "Titre « Atelier & Artisans ». Fii mooy suñu pôle central ngir gère équipe bi ak paie bi.",
      stepCategory: 'info'
    });

    steps.push({
      stepNumber: 3,
      title: 'Descriptif de la vue',
      description: 'Explication fonctionnelle.',
      targetAcomId: 'artisans.description',
      actionToPerform: 'observe',
      speechFr: "Ce descriptif vous rappelle le rôle de cette page : gérer le personnel, assigner la confection de pièces et suivre la paie.",
      speechWolof: "Sous-titre bi dafay leeral : gère ouvriers yi, joxe liggéey yi ak téerele fayu à la pièce.",
      stepCategory: 'info'
    });

    // 2. Navigation par sous-onglets
    steps.push({
      stepNumber: steps.length + 1,
      title: 'Navigation secondaire par Onglets',
      description: 'Basculer entre les différentes vues.',
      targetAcomId: 'artisans.subtabs',
      actionToPerform: 'observe',
      speechFr: `Ces onglets vous permettent de naviguer instantanément entre l'Équipe, le Plan de travail et les modes de Rémunération. Vous êtes actuellement dans la vue « ${activeSubTabLabel} ».`,
      speechWolof: `Bett yi ci suuf gisnañu leen. Vue bi nga nekk léegi mooy : « ${activeSubTabLabel} ».`,
      stepCategory: 'control'
    });

    // 3. Les 3 Indicateurs Financiers d'Équipe
    steps.push({
      stepNumber: steps.length + 1,
      title: 'Total Terminé (À Payer)',
      description: 'Valeur cumulée des confections achevées.',
      targetAcomId: 'artisans.kpi_earned',
      actionToPerform: 'observe',
      speechFr: `Voici le montant total des confections terminées à régler : ${totalEarnedAll.toLocaleString('fr-FR')} ${currency}. Ce chiffre représente la valeur accumulée des travaux achevés par votre équipe.`,
      speechWolof: `Total terminé à payer = ${totalEarnedAll.toLocaleString('fr-FR')} ${currency}. Lii mooy valeur liggéey yi pare yëpp.`,
      stepCategory: 'info'
    });

    steps.push({
      stepNumber: steps.length + 1,
      title: 'Acomptes Versés',
      description: 'Cumul des acomptes et avances payés.',
      targetAcomId: 'artisans.kpi_paid',
      actionToPerform: 'observe',
      speechFr: `Ce deuxième indicateur affiche le cumul des acomptes déjà versés : ${totalPaidAll.toLocaleString('fr-FR')} ${currency}. C'est le total des avances et paiements déjà déboursés.`,
      speechWolof: `Acomptes versés = ${totalPaidAll.toLocaleString('fr-FR')} ${currency}. Lii mooy xaalis bu ñu faye ba noppi.`,
      stepCategory: 'info'
    });

    steps.push({
      stepNumber: steps.length + 1,
      title: 'Solde du Restant',
      description: 'Montant net restant dû à l\'équipe.',
      targetAcomId: 'artisans.kpi_due',
      actionToPerform: 'observe',
      speechFr: `Enfin, voici le solde du restant dû à vos artisans : ${remainingDueAll.toLocaleString('fr-FR')} ${currency}. ${remainingDueAll > 0 ? 'Il indique le montant net qu\'il vous reste à leur verser.' : 'Toutes les rémunérations sont actuellement soldées.'}`,
      speechWolof: `Solde du restant = ${remainingDueAll.toLocaleString('fr-FR')} ${currency}. Lii mooy desaaj bu ñu wara faye ouvriers yi.`,
      stepCategory: 'info'
    });

    if (activeSubTab === 'artisans') {
      // 4. Barre de Recherche
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Recherche d\'Artisan',
        description: 'Filtrage instantané par nom ou téléphone.',
        targetAcomId: 'artisans.search_input',
        actionToPerform: 'observe',
        speechFr: `Grâce à cette barre de recherche, vous pouvez retrouver instantanément un artisan par son nom ou son numéro de téléphone. ${search ? `Recherche active : « ${search} ».` : ''}`,
        speechWolof: "Fi mën nga bind tur wala numóro télefoon ngir seet artisan.",
        stepCategory: 'control'
      });

      // 5. Filtre de Spécialité
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Filtre de Spécialité',
        description: 'Sélection par métier de couture.',
        targetAcomId: 'artisans.filter_specialty',
        actionToPerform: 'observe',
        speechFr: `Ce filtre par spécialité permet d'isoler rapidement les couturiers, brodeurs, apprentis ou stylistes. Filtre actuel : « ${filterSpecialty === 'all' ? 'Toutes les spécialités' : filterSpecialty} ».`,
        speechWolof: "Filtre spécialité bi dafay mayé nga tànn couturier, brodeur wala apprenti.",
        stepCategory: 'control'
      });

      // 6. Bouton Recruter un Artisan
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Bouton — Recruter un Artisan',
        description: 'Ajouter une nouvelle fiche dans l\'équipe.',
        targetAcomId: 'artisans.add_artisan_btn',
        actionToPerform: 'observe',
        speechFr: "Le bouton Recruter un Artisan vous ouvre le formulaire complet pour enregistrer un nouvel équipier avec son métier et son mode de rémunération.",
        speechWolof: "Bouton « Recruter un Artisan » bi mooy ubbi formulaire ngir bind membre bu bees.",
        stepCategory: 'action'
      });

      // 7. Catégories de Rémunération
      const countAll = artisans.length;
      const countPiece = artisans.filter(a => !a.remunerationType || a.remunerationType === 'Pièce' || a.remunerationType === 'task').length;
      const countMensuel = artisans.filter(a => a.remunerationType === 'Mensuel' || a.remunerationType === 'monthly' || a.remunerationType === 'Salarié').length;
      const countHebdo = artisans.filter(a => a.remunerationType === 'Hebdomadaire' || a.remunerationType === 'weekly').length;
      const countJourn = artisans.filter(a => a.remunerationType === 'Journalier' || a.remunerationType === 'daily').length;

      steps.push({
        stepNumber: steps.length + 1,
        title: 'Catégories de Rémunération',
        description: 'Barre de filtres par statut salarial.',
        targetAcomId: 'artisans.remuneration_selectors',
        actionToPerform: 'observe',
        speechFr: `Ces 5 catégories regroupent votre personnel : Toute l'équipe (${countAll} membre${countAll > 1 ? 's' : ''}), À la pièce (${countPiece}), Mensuel (${countMensuel}), Hebdomadaire (${countHebdo}) et Journalier (${countJourn}). Chaque catégorie est comptabilisée en temps réel, même lorsqu'elle compte 0 membre.`,
        speechWolof: `Catégories yii : Toute l'équipe (${countAll}), À la pièce (${countPiece}), Mensuel (${countMensuel}), Hebdomadaire (${countHebdo}), Journalier (${countJourn}).`,
        stepCategory: 'control'
      });

      // 8. En-tête du Bloc d'Équipe
      steps.push({
        stepNumber: steps.length + 1,
        title: 'En-tête de Catégorie & Effectif Total',
        description: 'Titre du groupe et décompte réel.',
        targetAcomId: 'artisans.block_team_header',
        actionToPerform: 'observe',
        speechFr: `Voici l'en-tête du groupe « Toute l'équipe ». Le compteur indique un effectif total de ${artisans.length} artisan${artisans.length > 1 ? 's' : ''} enregistré${artisans.length > 1 ? 's' : ''} dans l'atelier.`,
        speechWolof: `En-tête bloc : « Toute l'Équipe ». Total bu féñ : ${artisans.length} artisan(s).`,
        stepCategory: 'info'
      });

      // 9. Parcours exhaustif de chaque carte artisan
      if (artisans.length === 0) {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Effectif d\'Atelier',
          description: 'Aucun artisan enregistré pour le moment.',
          targetAcomId: 'artisans.empty_state',
          actionToPerform: 'observe',
          speechFr: "Votre atelier compte actuellement 0 artisan. Vous pouvez utiliser le bouton « Recruter un Artisan » pour ajouter votre première fiche.",
          speechWolof: "Amul benn artisan ci atelier bi (0 membre). Mën nga bëss « Recruter un Artisan ».",
          stepCategory: 'info'
        });
      } else {
        artisans.forEach((artisan, idx) => {
          const stats = {
            assignedCount: artisan.assignedCount || 0,
            inProgressCount: artisan.inProgressCount || 0,
            balance: artisan.balance || 0
          };

          const remLabel = artisan.remunerationType === 'Hebdomadaire' || artisan.remunerationType === 'weekly' ? 'Hebdomadaire' :
                           artisan.remunerationType === 'Journalier' || artisan.remunerationType === 'daily' ? 'Journalier' :
                           artisan.remunerationType === 'Mensuel' || artisan.remunerationType === 'monthly' || artisan.remunerationType === 'Salarié' ? 'Mensuel' :
                           'À la pièce';

          // Intro carte
          steps.push({
            stepNumber: steps.length + 1,
            title: `Artisan n°${idx + 1} — Fiche de ${artisan.name}`,
            description: `Aperçu global de la carte de ${artisan.name}.`,
            targetAcomId: `artisans.card_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Voici la fiche de ${artisan.name}. Nous passons en revue tous ses sous-éléments un par un.`,
            speechWolof: `Fiche bu ${artisan.name}. Ñu ngi koy xool lépp bu bëx.`,
            stepCategory: 'info'
          });

          // Badge 1: Specialty
          steps.push({
            stepNumber: steps.length + 1,
            title: `Spécialité — ${artisan.name}`,
            description: `Métier : ${artisan.specialty}`,
            targetAcomId: `artisans.card_specialty_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Ce premier badge indique son métier dans l'atelier, ici ${artisan.specialty}.`,
            speechWolof: `Spécialité : ${artisan.specialty}.`,
            stepCategory: 'info'
          });

          // Badge 2: Remuneration
          steps.push({
            stepNumber: steps.length + 1,
            title: `Mode de Paie — ${artisan.name}`,
            description: `Mode : ${remLabel}`,
            targetAcomId: `artisans.card_remuneration_${idx}`,
            actionToPerform: 'observe',
            speechFr: `À côté, ce badge précise son mode de rémunération, défini comme ${remLabel}.`,
            speechWolof: `Mode de rémunération : ${remLabel}.`,
            stepCategory: 'info'
          });

          // Badge 3: Status
          steps.push({
            stepNumber: steps.length + 1,
            title: `Disponibilité — ${artisan.name}`,
            description: `Statut : ${artisan.status}`,
            targetAcomId: `artisans.card_status_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Son statut de disponibilité indique qu'il est actuellement ${artisan.status}.`,
            speechWolof: `Statut bu ${artisan.name} : ${artisan.status}.`,
            stepCategory: 'info'
          });

          // Nom
          steps.push({
            stepNumber: steps.length + 1,
            title: `Nom Complet — ${artisan.name}`,
            description: artisan.name,
            targetAcomId: `artisans.card_name_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Voici son nom enregistré : ${artisan.name}.`,
            speechWolof: `Tur bi : ${artisan.name}.`,
            stepCategory: 'info'
          });

          // Téléphone
          steps.push({
            stepNumber: steps.length + 1,
            title: `Téléphone — ${artisan.name}`,
            description: artisan.phone || 'Non renseigné',
            targetAcomId: `artisans.card_phone_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Son numéro de contact direct est le ${artisan.phone || 'non renseigné'}.`,
            speechWolof: `Numóro télefoon : ${artisan.phone || 'amul'}.`,
            stepCategory: 'info'
          });

          // Notes / Description
          if (artisan.notes) {
            steps.push({
              stepNumber: steps.length + 1,
              title: `Notes — ${artisan.name}`,
              description: artisan.notes,
              targetAcomId: `artisans.card_desc_${idx}`,
              actionToPerform: 'observe',
              speechFr: `Ces notes apportent des précisions particulières : « ${artisan.notes} ».`,
              speechWolof: `Notes : ${artisan.notes}.`,
              stepCategory: 'info'
            });
          }

          // Compteur Assigné
          steps.push({
            stepNumber: steps.length + 1,
            title: `Confections Assignées — ${artisan.name}`,
            description: `${stats.assignedCount} tâche(s)`,
            targetAcomId: `artisans.card_assigned_cnt_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Ce premier compteur indique le nombre de travaux assignés à cet artisan, actuellement de ${stats.assignedCount}.`,
            speechWolof: `Tâches assignées : ${stats.assignedCount}.`,
            stepCategory: 'info'
          });

          // Compteur En cours
          steps.push({
            stepNumber: steps.length + 1,
            title: `Travaux en Cours — ${artisan.name}`,
            description: `${stats.inProgressCount} tâche(s)`,
            targetAcomId: `artisans.card_inprogress_cnt_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Ici, nous voyons les confections actuellement en cours sur ses machines : ${stats.inProgressCount}.`,
            speechWolof: `Tâches en cours : ${stats.inProgressCount}.`,
            stepCategory: 'info'
          });

          // Compteur Solde Dû
          steps.push({
            stepNumber: steps.length + 1,
            title: `Solde Dû — ${artisan.name}`,
            description: `${stats.balance.toLocaleString('fr-FR')} FCFA`,
            targetAcomId: `artisans.card_balance_amt_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Enfin, ce troisième chiffre affiche le solde dû net à régler pour ses confections : ${stats.balance.toLocaleString('fr-FR')} FCFA.`,
            speechWolof: `Solde dû : ${stats.balance.toLocaleString('fr-FR')} FCFA.`,
            stepCategory: 'info'
          });

          // Bouton Voir Fiche de Paie
          steps.push({
            stepNumber: steps.length + 1,
            title: `Voir Fiche de Paie — ${artisan.name}`,
            description: 'Consulter l\'historique financier.',
            targetAcomId: `artisans.card_pay_btn_${idx}`,
            actionToPerform: 'observe',
            speechFr: "Ce bouton ouvre sa fiche de paie détaillée avec le relevé de tous les travaux achevés et les acompte déjà versés.",
            speechWolof: `Bouton « Voir Fiche de Paie » ngir ${artisan.name}.`,
            stepCategory: 'action'
          });

          // Bouton Modifier (crayon)
          steps.push({
            stepNumber: steps.length + 1,
            title: `Modifier la Fiche — ${artisan.name}`,
            description: 'Ajuster les informations du profil.',
            targetAcomId: `artisans.card_edit_btn_${idx}`,
            actionToPerform: 'observe',
            speechFr: "L'icône crayon permet de modifier à tout moment son profil, sa spécialité ou son mode de rémunération.",
            speechWolof: `Modifier profil bu ${artisan.name}.`,
            stepCategory: 'action'
          });

          // Bouton Supprimer (poubelle)
          steps.push({
            stepNumber: steps.length + 1,
            title: `Supprimer l'Artisan — ${artisan.name}`,
            description: 'Retirer cet artisan de l\'atelier.',
            targetAcomId: `artisans.card_delete_btn_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Enfin, cette icône poubelle vous permet d'archiver ou de retirer la fiche de ${artisan.name} de votre atelier.`,
            speechWolof: `Supprimer ${artisan.name}.`,
            stepCategory: 'action'
          });
        });
      }
    } else if (activeSubTab === 'assignments') {
      if (assignments.length === 0) {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Aucune Affectation Active',
          description: 'Aucune tâche n\'est actuellement attribuée.',
          targetAcomId: 'artisans.assignments_empty_state',
          actionToPerform: 'observe',
          speechFr: "Aucune affectation de tâche n'est enregistrée. Cliquez sur « + Affecter une Tâche » pour attribuer une confection à un artisan.",
          speechWolof: "Amul benn affectation de tâche bu nekk ci liste bi. Bëssal « + Affecter une Tâche ».",
          stepCategory: 'info'
        });
      } else {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Registre des Affectations & Travaux d\'Atelier',
          description: `Suivi des ${assignments.length} tâche(s) confiée(s) aux couturiers.`,
          targetAcomId: 'artisans.assignments_list',
          actionToPerform: 'observe',
          speechFr: `Voici le registre des ${assignments.length} affectation(s) d'atelier. Nous allons parcourir chaque attribution de travail de haut en bas, élément par élément.`,
          speechWolof: `Fii yaay guiss registre des ${assignments.length} affectations d'atelier.`,
          stepCategory: 'info'
        });

        assignments.forEach((ass, idx) => {
          const statusTxt = ass.status === 'completed' ? 'Terminée' : ass.status === 'in_progress' ? 'En cours' : 'En attente';
          const priceTxt = ass.assignedPrice ? `${Number(ass.assignedPrice).toLocaleString('fr-FR')} ${currency}` : 'Tarif non fixé';

          steps.push({
            stepNumber: steps.length + 1,
            title: `Tâche n°${idx + 1} — ${ass.orderModel || 'Commande'} (${ass.artisanName || 'Artisan'})`,
            description: `Statut : ${statusTxt} | Main d'œuvre : ${priceTxt} | Échéance : ${ass.dueDate || 'Non définie'}.`,
            targetAcomId: `artisans.assignment_card_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Tâche n°${idx + 1} : Confection « ${ass.orderModel || 'Modèle'} » confiée à ${ass.artisanName || 'Artisan'}. Statut : ${statusTxt}. Tarif convenu : ${priceTxt}.`,
            speechWolof: `Tâche n°${idx + 1} : Confection « ${ass.orderModel || 'Modèle'} » ci loxxo ${ass.artisanName || 'Artisan'}. Statut : ${statusTxt}.`,
            stepCategory: 'info'
          });

          steps.push({
            stepNumber: steps.length + 1,
            title: `Tâche n°${idx + 1} — Marquer comme Terminée`,
            description: 'Mettre à jour l\'état d\'avancement de la confection.',
            targetAcomId: `artisans.assignment_status_btn_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Ce bouton permet de valider la fin de confection de la pièce pour débloquer le paiement de l'artisan.`,
            speechWolof: `Bouton bi dafay valider ne ñaw bi paré na ngir fay artisan bi.`,
            stepCategory: 'action'
          });
        });
      }
    } else if (activeSubTab === 'payments') {
      if (payments.length === 0) {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Historique des Règlements Vide',
          description: 'Aucun versement de salaire enregistré.',
          targetAcomId: 'artisans.payments_empty_state',
          actionToPerform: 'observe',
          speechFr: "Aucun versement de salaire ou acompte n'a encore été enregistré. Cliquez sur « + Effectuer un Paiement » pour saisir un règlement.",
          speechWolof: "Amul benn fayu salaire bu ñu denc ba léegi. Bëssal « + Effectuer un Paiement ».",
          stepCategory: 'info'
        });
      } else {
        steps.push({
          stepNumber: steps.length + 1,
          title: 'Registre Comptable des Paiements d\'Équipe',
          description: `Historique des ${payments.length} versement(s) effectués.`,
          targetAcomId: 'artisans.payments_list',
          actionToPerform: 'observe',
          speechFr: `Voici le livre de paie récapitulant les ${payments.length} règlement(s) de votre atelier. Nous allons examiner chaque fiche de paiement de haut en bas, élément par élément.`,
          speechWolof: `Fii yaay guiss registre des ${payments.length} paiements d'atelier.`,
          stepCategory: 'info'
        });

        payments.forEach((pay, idx) => {
          const amtTxt = `${Number(pay.amount || 0).toLocaleString('fr-FR')} ${currency}`;
          const modeTxt = pay.paymentMode === 'cash' ? 'Espèces' : pay.paymentMode === 'wave' ? 'Wave' : pay.paymentMode === 'om' ? 'Orange Money' : 'Chèque / Virement';

          steps.push({
            stepNumber: steps.length + 1,
            title: `Règlement n°${idx + 1} — ${pay.artisanName || 'Artisan'} (${amtTxt})`,
            description: `Montant : ${amtTxt} | Mode : ${modeTxt} | Date : ${pay.date || 'Aujourd\'hui'}.`,
            targetAcomId: `artisans.payment_card_${idx}`,
            actionToPerform: 'observe',
            speechFr: `Règlement n°${idx + 1} : Montant de ${amtTxt} versé à ${pay.artisanName || 'Artisan'} par ${modeTxt} le ${pay.date || 'Aujourd\'hui'}.`,
            speechWolof: `Règlement n°${idx + 1} : ${amtTxt} versé ci ${pay.artisanName || 'Artisan'} par ${modeTxt}.`,
            stepCategory: 'info'
          });

          steps.push({
            stepNumber: steps.length + 1,
            title: `Règlement n°${idx + 1} — Imprimer le Reçu de Paie`,
            description: 'Télécharger ou imprimer le justificatif de paiement en PDF.',
            targetAcomId: `artisans.payment_receipt_btn_${idx}`,
            actionToPerform: 'observe',
            speechFr: "Ce bouton génère le reçu de paiement officiel en PDF à faire signer par l'artisan ou à envoyer par WhatsApp.",
            speechWolof: "Bouton bi dafay générer reçu de paiement PDF bu leer.",
            stepCategory: 'action'
          });
        });
      }
    } else if (activeSubTab === 'rates') {
      steps.push({
        stepNumber: steps.length + 1,
        title: 'Grille des Tarifs de Main d\'Œuvre par Défaut',
        description: 'Barème standard de rémunération à la tâche de l\'atelier.',
        targetAcomId: 'artisans.rates_grid',
        actionToPerform: 'observe',
        speechFr: "La grille des tarifs définit les montants forfaitaires standards versés aux couturiers par catégorie de vêtement (Boubou, Kaftan, Robe, Costume, Ensemble).",
        speechWolof: "Grille tarif bi dafay teerel prix de main-d'œuvre bu standard ci catégorie vêtement bu nekk.",
        stepCategory: 'info'
      });
    }

    COUTURE_ARTISANS_TUTORIAL.steps = steps;

    if (this.isActive) {
      if (this.currentScenario?.id === 'couture_tutorial_artisans' || this.currentScenario?.id === 'couture.artisans') {
        this.currentScenario.steps = steps;
      }
    }
  }

  public setGalleryModelModalState(context: {
    isEditing: boolean;
    title: string;
    description: string;
    priceMin: number;
    priceMax: number;
    estimatedDays: number;
    difficulty: string;
    fabricType: string;
    yardage: string;
    imageUrl: string;
    tags: string;
    currency?: string;
  }): void {
    const {
      isEditing = false,
      title = '',
      description = '',
      priceMin = 0,
      priceMax = 0,
      estimatedDays = 0,
      difficulty = 'Facile',
      fabricType = '',
      yardage = '',
      imageUrl = '',
      tags = '',
      currency = 'FCFA'
    } = context;

    const modalTitle = isEditing ? 'Modifier le modèle de robe' : 'Ajouter un nouveau modèle';
    const isFormValid = title.trim().length > 0;

    const steps: TutorialStep[] = [
      {
        stepNumber: 1,
        title: `Titre — ${modalTitle}`,
        description: isEditing ? 'Modification d\'une fiche modèle.' : 'Enregistrement d\'un nouveau modèle.',
        targetAcomId: 'inspirations.modal_title',
        actionToPerform: 'observe',
        speechFr: isEditing
          ? "Vous êtes dans la fenêtre Modifier le modèle. Cette fenêtre permet de mettre à jour les caractéristiques techniques, photos et tarifs de cette confection."
          : "Vous êtes dans la fenêtre Ajouter un nouveau modèle. Cette fenêtre permet d'enregistrer un nouveau modèle dans la galerie Couture Design Studio.",
        speechWolof: isEditing
          ? "Yaa ngi ci fenetre Modifier le modèle ngir soppi leralu modèle bi."
          : "Yaa ngi ci fenetre Ajouter un nouveau modèle. Fenetre bi dafay mayé nga duggal modèle bu bees ci sa galerie.",
        stepCategory: 'info'
      },
      {
        stepNumber: 2,
        title: 'Bouton Fermer (X)',
        description: 'Fermer la fenêtre sans enregistrer.',
        targetAcomId: 'inspirations.modal_close_btn',
        actionToPerform: 'observe',
        speechFr: "Cette icône permet de fermer la fenêtre sans poursuivre la création du modèle.",
        speechWolof: "Bouton bi dafay tëj fenetre bi te du denc dara ci li nga bind.",
        stepCategory: 'action'
      },
      {
        stepNumber: 3,
        title: 'Nom du Modèle *',
        description: title ? `Nom actuel : « ${title} » (Obligatoire)` : 'Intitulé commercial du vêtement (Obligatoire).',
        targetAcomId: 'inspirations.modal_title_input',
        actionToPerform: 'observe',
        speechFr: title
          ? `Saisissez ici le nom du modèle. Valeur actuelle : « ${title} ». Ce champ est obligatoire.`
          : "Saisissez ici le nom du nouveau modèle. Ce champ est obligatoire.",
        speechWolof: title
          ? `Turu modèle bi nga bind léegi mooy « ${title} ». Champ bi dafa obligatoire.`
          : "Bindal fi turu modèle bu bees bi. Champ bi dafa obligatoire.",
        stepCategory: 'required'
      },
      {
        stepNumber: 4,
        title: 'Description & Fonctions',
        description: description ? `Détails : « ${description.slice(0, 40)}... »` : 'Description détaillée, coupe et caractéristiques particulières.',
        targetAcomId: 'inspirations.modal_desc_input',
        actionToPerform: 'observe',
        speechFr: description
          ? `Cette zone permet de décrire le modèle, ses caractéristiques et ses fonctions particulières. Description actuelle : « ${description} ».`
          : "Cette zone permet de décrire le modèle, ses caractéristiques et ses fonctions particulières.",
        speechWolof: "Fi nga mën a leralé coupe bi, finitions yi ak mbir yu am solo ci tenue bi.",
        stepCategory: 'info'
      },
      {
        stepNumber: 5,
        title: 'Prix Main d\'Œuvre Min (FCFA)',
        description: `Tarif plancher : ${priceMin.toLocaleString('fr-FR')} ${currency}.`,
        targetAcomId: 'inspirations.modal_pricemin_input',
        actionToPerform: 'observe',
        speechFr: `Ce champ correspond au montant minimum de main-d'œuvre prévu pour le modèle, actuellement fixé à ${priceMin.toLocaleString('fr-FR')} ${currency}.`,
        speechWolof: `Champ bi mooy prix de base bu gën a suufe : ${priceMin.toLocaleString('fr-FR')} ${currency}.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 6,
        title: 'Prix Main d\'Œuvre Max (FCFA)',
        description: `Tarif plafond : ${priceMax.toLocaleString('fr-FR')} ${currency}.`,
        targetAcomId: 'inspirations.modal_pricemax_input',
        actionToPerform: 'observe',
        speechFr: `Ce champ correspond au montant maximum de main-d'œuvre prévu, actuellement fixé à ${priceMax.toLocaleString('fr-FR')} ${currency}.`,
        speechWolof: `Champ bi mooy prix maximum bu ñaw bi mën a tollu : ${priceMax.toLocaleString('fr-FR')} ${currency}.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 7,
        title: 'Temps Estimé (jours)',
        description: `Durée d'atelier : ~${estimatedDays} jours.`,
        targetAcomId: 'inspirations.modal_days_input',
        actionToPerform: 'observe',
        speechFr: `Indiquez ici le temps estimé nécessaire à la confection du modèle, en jours. Estimation actuelle : ~${estimatedDays} jours.`,
        speechWolof: `Bindal fi ñaata fan lañuy am ngir parél ñaw bi ci atelier bi. Léegi mu ngi tollu ci ${estimatedDays} fan.`,
        stepCategory: 'info'
      },
      {
        stepNumber: 8,
        title: 'Difficulté de Travail',
        description: `Niveau sélectionné : ${difficulty}.`,
        targetAcomId: 'inspirations.modal_difficulty_select',
        actionToPerform: 'observe',
        speechFr: `Ce sélecteur permet de définir le niveau de difficulté du modèle. Sélection actuelle : « ${difficulty} ».`,
        speechWolof: `Sélecteur bi dafay tax nga tànn niveau difficulté bi. Léegi mooy « ${difficulty} ».`,
        stepCategory: 'control'
      },
      {
        stepNumber: 9,
        title: 'Matière / Tissu Principal',
        description: fabricType ? `Matière : ${fabricType}` : 'Textile conseillé pour cette confection.',
        targetAcomId: 'inspirations.modal_fabric_input',
        actionToPerform: 'observe',
        speechFr: fabricType
          ? `Sélectionnez ici la matière ou le tissu principal utilisé pour ce modèle. Textile renseigné : « ${fabricType} ».`
          : "Sélectionnez ici la matière ou le tissu principal utilisé pour ce modèle.",
        speechWolof: fabricType
          ? `Sër bi nga bind mooy « ${fabricType} ».`
          : "Bindal fi sër bi gën a baax ci modèle bi.",
        stepCategory: 'info'
      },
      {
        stepNumber: 10,
        title: 'Métrage Requis',
        description: yardage ? `Quantité : ${yardage}` : 'Quantité de tissu nécessaire pour la confection.',
        targetAcomId: 'inspirations.modal_yardage_input',
        actionToPerform: 'observe',
        speechFr: yardage
          ? `Indiquez la quantité de tissu nécessaire à la réalisation du modèle. Métrage actuel : « ${yardage} ».`
          : "Indiquez la quantité de tissu nécessaire à la réalisation du modèle.",
        speechWolof: yardage
          ? `Métrage bi nga bind mooy « ${yardage} ».`
          : "Bindal fi ñaata mètre sër nga soxla ngir ñaw ko.",
        stepCategory: 'info'
      },
      {
        stepNumber: 11,
        title: 'Photo du Modèle *',
        description: 'Zone principale du visuel du vêtement.',
        targetAcomId: 'inspirations.modal_photo_section',
        actionToPerform: 'observe',
        speechFr: "Cette zone interactive permet d'importer le visuel haute définition du modèle.",
        speechWolof: "Wàll bi mooy nataalu modèle bi.",
        stepCategory: 'info'
      },
      {
        stepNumber: 12,
        title: 'Zone d\'Importation de Photo',
        description: imageUrl ? 'Photo chargée avec succès (aperçu disponible).' : 'Déposer une photo ici ou parcourir vos fichiers.',
        targetAcomId: 'inspirations.modal_image_dropzone',
        actionToPerform: 'observe',
        speechFr: imageUrl
          ? "La photo du modèle est bien chargée. Vous pouvez la remplacer ou la supprimer à tout moment."
          : "Vous pouvez déposer directement une image ou parcourir vos fichiers afin d'ajouter la photo du modèle.",
        speechWolof: imageUrl
          ? "Nataalu modèle bi duggu na ci anam bu leer. Mën nga ko soppi wala dindi."
          : "Mën nga duggal nataal bi ci drag-and-drop wala nga tànn ko ci sa appareil.",
        stepCategory: 'action'
      },
      {
        stepNumber: 13,
        title: 'URL de l\'Image (Optionnel)',
        description: 'Adresse web directe d\'une image hébergée.',
        targetAcomId: 'inspirations.modal_image_url_input',
        actionToPerform: 'observe',
        speechFr: "Vous pouvez également renseigner l'adresse d'une image existante.",
        speechWolof: "Mën nga binde itam lien URL nataal bi.",
        stepCategory: 'info'
      },
      {
        stepNumber: 14,
        title: 'Tags (Mots-Clés)',
        description: tags ? `Tags : ${tags}` : 'Mots-clés pour classer et retrouver le modèle.',
        targetAcomId: 'inspirations.modal_tags_input',
        actionToPerform: 'observe',
        speechFr: tags
          ? `Ajoutez ici les mots-clés permettant de classer et retrouver plus facilement le modèle. Tags actuels : « ${tags} ».`
          : "Ajoutez ici les mots-clés permettant de classer et retrouver plus facilement le modèle. Les tags sont séparés par des virgules.",
        speechWolof: "Duggalal fi ay tags yu séddatle ci virgule ngir seet ko ci gaaw.",
        stepCategory: 'info'
      },
      {
        stepNumber: 15,
        title: 'Bouton Annuler',
        description: 'Quitter sans enregistrer les modifications.',
        targetAcomId: 'inspirations.modal_cancel_btn',
        actionToPerform: 'observe',
        speechFr: "Ce bouton permet de quitter la création du modèle sans enregistrer les informations saisies.",
        speechWolof: "Bouton bi dafay dindi sa liggéey te tëj fenetre bi.",
        stepCategory: 'action'
      },
      {
        stepNumber: 16,
        title: 'Bouton Sauvegarder',
        description: isFormValid ? 'Enregistrer le modèle (formulaire complet).' : 'Nom de modèle requis avant enregistrement.',
        targetAcomId: 'inspirations.modal_submit_btn',
        actionToPerform: 'observe',
        speechFr: isFormValid
          ? "Le formulaire est prêt. Cliquez sur « Sauvegarder » pour enregistrer définitivement ce modèle dans votre catalogue."
          : "Ce bouton permet d'enregistrer le nouveau modèle dès que le nom obligatoire est renseigné.",
        speechWolof: isFormValid
          ? "Formulaire bi paré na. Bëssal « Sauvegarder » ngir denc modèle bi ci sa catalogue."
          : "Bouton bi dafay denc modèle bi soo bindee turu modèle bi ba paré.",
        stepCategory: 'action'
      },
      {
        stepNumber: 17,
        title: 'Synthèse — Formulaire Modèle',
        description: 'Fin du parcours de la modale.',
        targetAcomId: 'inspirations.modal_title',
        actionToPerform: 'observe',
        speechFr: "Nous avons parcouru la fenêtre Ajouter un nouveau modèle, de la saisie des informations jusqu'à l'enregistrement.",
        speechWolof: "Saytu nañu mbooleem wàll yi ci fenetre Ajouter un nouveau modèle.",
        stepCategory: 'info'
      }
    ];

    COUTURE_GALLERY_MODEL_FORM_TUTORIAL.steps = steps;

    if (this.isActive && (this.activeModal === 'couture.gallery_model_modal' || this.activeModal === 'inspirations.model_modal' || this.activeModal === 'couture_gallery_model_modal')) {
      if (this.currentScenario?.id === 'couture_tutorial_gallery_model_form') {
        this.currentScenario.steps = steps;
      }
    }
  }

  public setOrdersPageState(context: {
    orderCount: number;
    firstOrder?: any;
    currency?: string;
    filterStatus?: string;
    search?: string;
    viewMode?: 'list' | 'timeline' | 'campaigns';
    urgentOrders?: any[];
    thisWeekOrders?: any[];
    laterOrders?: any[];
    deliveredOrders?: any[];
    selectedCampaignHoliday?: string;
    campaignCustomText?: string;
    selectedCampaignClientsCount?: number;
  }): void {
    const {
      orderCount,
      firstOrder,
      currency = 'FCFA',
      filterStatus = 'all',
      search = '',
      viewMode = 'list',
      urgentOrders = [],
      thisWeekOrders = [],
      laterOrders = [],
      deliveredOrders = []
    } = context;

    if (context.viewMode) {
      this.ordersViewMode = context.viewMode;
    }

    const filterLabels: Record<string, string> = {
      all: 'Tous',
      mesures: 'Mesures',
      coupe: 'Couture',
      retouche: 'Retouche',
      pret: 'Prêts',
      livre: 'Livrés'
    };
    const activeFilterLabel = filterLabels[filterStatus] || filterStatus;

    const activeLabel = this.ordersViewMode === 'list' ? 'Fiches Liste' 
      : this.ordersViewMode === 'timeline' ? 'Planning' 
      : 'Fidélisation 🌟';
      
    const inactiveLabel1 = this.ordersViewMode === 'list' ? 'Planning' : 'Fiches Liste';
    const inactiveLabel2 = this.ordersViewMode === 'campaigns' ? 'Planning' : 'Fidélisation 🌟';

    const viewModesSpeechFr = `Trois contrôles de navigation cliquables et interactifs sont disponibles : Fiches Liste, Planning, et Fidélisation. Actuellement, le sélecteur "${activeLabel}" est actif et affiche son contenu associé, tandis que "${inactiveLabel1}" et "${inactiveLabel2}" sont inactifs mais prêts à être sélectionnés pour changer d'affichage en temps réel.`;
    const viewModesSpeechWo = `Ñetti bouton yu nga mën a bëss ñoo am : Fiches Liste, Planning, ak Fidélisation. Léegi, "${activeLabel}" moo active, yeneen yi dañuy inactifs waaye mën nga leen cuq ngir soppi xët bi.`;

    const isTransitionFichesListe = this.explainedElements.size > 0;
    const fichesListeSpeechFr = isTransitionFichesListe
      ? "Vous êtes maintenant dans l'onglet Fiches Liste. C'est la vue principale de Gestion des Commandes Couture. Elle permet de consulter les commandes enregistrées et leurs informations."
      : "Vous êtes dans l'onglet Fiches Liste. C'est la vue principale de Gestion des Commandes Couture. Elle permet de consulter les commandes enregistrées et leurs informations.";

    const urgentCount = urgentOrders.length;
    const thisWeekCount = thisWeekOrders.length;
    const laterCount = laterOrders.length;
    const deliveredCount = deliveredOrders.length;
    const totalPlanningCount = urgentCount + thisWeekCount + laterCount + deliveredCount;

    const isTransitionPlanning = this.explainedElements.size > 0;
    const planningIntroSpeechFr = isTransitionPlanning
      ? (totalPlanningCount === 0
          ? "Vous êtes maintenant dans l'onglet Planning. Cette vue permet de suivre les commandes selon leur niveau de priorité et leur planification. Je vois ici les catégories En retard / Urgents, Cette semaine, Planifiés plus tard et Livrés / Historique. Les compteurs affichés sont actuellement à zéro, ce qui signifie qu'aucune commande n'est présente dans ces catégories à cet instant."
          : "Vous êtes maintenant dans l'onglet Planning. Cette vue permet de suivre les commandes selon leur niveau de priorité et leur planification. Je vois ici les catégories En retard / Urgents, Cette semaine, Planifiés plus tard et Livrés / Historique, avec des confections actives réparties dans ces différentes colonnes d'atelier.")
      : (totalPlanningCount === 0
          ? "Vous êtes dans l'onglet Planning. Cette vue permet de suivre les commandes selon leur niveau de priorité et leur planification. Je vois ici les catégories En retard / Urgents, Cette semaine, Planifiés plus tard et Livrés / Historique. Les compteurs affichés sont actuellement à zéro, ce qui signifie qu'aucune commande n'est présente dans ces catégories à cet instant."
          : "Vous êtes dans l'onglet Planning. Cette vue permet de suivre les commandes selon leur niveau de priorité et leur planification. Je vois ici les catégories En retard / Urgents, Cette semaine, Planifiés plus tard et Livrés / Historique, avec des confections actives réparties dans ces différentes colonnes d'atelier.");

    const planningIntroSpeechWo = isTransitionPlanning
      ? "Yaa ngi léegi ci vue Planning bu Gestion des Commandes Couture ngir teerel say commandes selon prioritées yi."
      : "Yaa ngi ci onglet Planning. Fi mën nga saytu ak di teerel commandes ñaw yi selon prioritées yi.";

    const isTransitionCampaigns = this.explainedElements.size > 0;
    const campaignsIntroSpeechFr = isTransitionCampaigns
      ? "Vous êtes maintenant dans l'onglet Fidélisation. Cette vue est dédiée aux campagnes de fidélisation et aux communications destinées aux clients. Je vais maintenant vous présenter les éléments disponibles dans cette vue."
      : "Vous êtes dans l'onglet Fidélisation. Cette vue est dédiée aux campagnes de fidélisation et aux communications destinées aux clients. Je vais maintenant vous présenter les éléments disponibles dans cette vue.";
    const campaignsIntroSpeechWo = isTransitionCampaigns
      ? "Yaa ngi léegi ci onglet Fidélisation ngir gérer say campagnes de fidélisation ak communications ak sa clients."
      : "Yaa ngi ci onglet Fidélisation ngir gérer say campagnes de fidélisation ak communications ak sa clients.";

    if (orderCount === 0 || !firstOrder) {
      // ÉTAT A : Aucune commande enregistrée
      COUTURE_ORDERS_TUTORIAL.steps = [
        {
          stepNumber: 1,
          title: '1. Commandes Mesures & Confection',
          description: 'Présentation du module de gestion des commandes et du suivi de confection.',
          targetAcomId: 'orders.title',
          actionToPerform: 'observe',
          speechFr: fichesListeSpeechFr,
          speechWolof: "Dalal ak jàmm ci sa Gestion des Commandes Couture. Fi dafay saytu lepp lu jëm ci ñaw sur-mesure, tàmbli ba kérog ñuy livreur ak di fay.",
          stepCategory: 'info'
        },
        {
          stepNumber: 2,
          title: '2. Compteur des Conceptions en Cours',
          description: 'Indicateur en temps réel du nombre de commandes en cours.',
          targetAcomId: 'orders.counter',
          actionToPerform: 'observe',
          speechFr: "Le compteur indique actuellement qu'aucune commande n'est en cours de confection dans votre atelier.",
          speechWolof: "Compteur bi dafay wone ne amagul benn commande buñuy ñaw léegi ci atelier bi.",
          stepCategory: 'info'
        },
        {
          stepNumber: 3,
          title: '3. Modes d\'Affichage (Liste, Planning, Fidélisation)',
          description: 'Bascule entre Fiches Liste, Planning visuel et Campagnes.',
          targetAcomId: 'orders.view_modes',
          actionToPerform: 'observe',
          speechFr: viewModesSpeechFr,
          speechWolof: viewModesSpeechWo,
          stepCategory: 'control'
        },
        {
          stepNumber: 4,
          title: '4. Synchronisation Cloud & Sécurisation',
          description: 'Sauvegarde des données locales et synchronisation cloud.',
          targetAcomId: 'orders.sync_btn',
          actionToPerform: 'observe',
          speechFr: "Ce bouton assure la synchronisation instantanée de vos fiches de commandes entre votre poste et le cloud sécurisé.",
          speechWolof: "Bouton de synchronisation bi dafay denc sa commandes yi ci serveur bi.",
          stepCategory: 'action'
        },
        {
          stepNumber: 5,
          title: '5. Export Tableur Excel & CSV',
          description: 'Téléchargement de la liste des commandes et acomptes.',
          targetAcomId: 'orders.export_excel_btn',
          actionToPerform: 'observe',
          speechFr: "Ce bouton permet d'exporter l'ensemble de votre carnet de commandes, acomptes et soldes dans un fichier Excel ou CSV.",
          speechWolof: "Bouton bi dafay génne sa liste commandes ci fichier Excel.",
          stepCategory: 'action'
        },
        {
          stepNumber: 6,
          title: '6. Impression & Export PDF',
          description: 'Génération du catalogue imprimable des commandes d\'atelier.',
          targetAcomId: 'orders.export_pdf_btn',
          actionToPerform: 'observe',
          speechFr: "Ce bouton permet d'imprimer ou d'exporter en PDF le récapitulatif global des commandes pour l'atelier.",
          speechWolof: "Bouton bi dafay mayé nga imprimer commandes yëpp ci PDF.",
          stepCategory: 'action'
        },
        {
          stepNumber: 7,
          title: '7. Bouton « + Créer une Commande »',
          description: 'Bouton d\'action pour créer une nouvelle commande de confection.',
          targetAcomId: 'orders.add_btn',
          actionToPerform: 'observe',
          speechFr: "Le bouton principal « + Créer une Commande » permet d'enregistrer une nouvelle confection, de sélectionner le client, le modèle et les acomptes.",
          speechWolof: "Bouton « + Créer une Commande » bi dafay ubbi fiche bi ngir bind commande bu bees.",
          stepCategory: 'action'
        },
        {
          stepNumber: 8,
          title: '8. Recherche Rapide & Filtres d\'Atelier',
          description: 'Recherche par client/modèle et filtres par statut d\'avancement.',
          targetAcomId: 'orders.filters',
          actionToPerform: 'observe',
          speechFr: search.trim()
            ? `La recherche est filtrée sur "${search.trim()}". Les filtres permettent de limiter par étape : Mesures, Couture, Retouche, Prêts ou Livrés.`
            : "La barre de recherche et les filtres de statut permettent de filtrer rapidement : Mesures, Couture, Retouche, Prêts ou Livrés.",
          speechWolof: "Barre de recherche bi ak filtres yi dañuy mayé nga wër commande ci tur wala statut.",
          stepCategory: 'control'
        },
        {
          stepNumber: 9,
          title: '9. Zone d\'État — Aucune Commande Enregistrée',
          description: 'Affichage de l\'état initial sans commandes.',
          targetAcomId: 'orders.empty_state',
          actionToPerform: 'observe',
          speechFr: "Actuellement, la liste est vide car aucune commande n'a encore été créée. Cliquez sur « Créer une Commande » pour lancer votre première confection.",
          speechWolof: "Léegi liste bi dafa vide ndaxte amagul commande. Cuqal ci « Créer une Commande » ngir tàmbli.",
          stepCategory: 'info'
        },
        {
          stepNumber: 10,
          title: '10. Démarrage de la Première Commande',
          description: 'Invitation à lancer la création.',
          targetAcomId: 'orders.add_btn',
          actionToPerform: 'observe',
          speechFr: "Cliquez sur « + Créer une Commande » pour débuter le parcours guidé d'enregistrement de votre première commande sur mesure.",
          speechWolof: "Bëssal ci « Créer une Commande » ngir tàmbli sa commande bu njëkk.",
          stepCategory: 'action'
        }
      ];
    } else {
      // ÉTAT B : Une ou plusieurs commandes existent
      const clientName = firstOrder.clientName || 'Client';
      const orderRef = firstOrder.id ? `CMD-${firstOrder.id.slice(0, 5).toUpperCase()}` : 'CMD-001';
      const modelName = firstOrder.model || 'Création Sur-Mesure';
      const category = firstOrder.category || 'Couture Africaine';
      const gender = firstOrder.gender === 'F' ? 'Femme' : firstOrder.gender === 'E' ? 'Enfant' : 'Homme';
      const price = Number(firstOrder.price || 0);
      const advance = Number(firstOrder.advance || 0);
      const rest = Math.max(0, price - advance);
      const deliveryDate = firstOrder.deliveryDate 
        ? new Date(firstOrder.deliveryDate).toLocaleDateString('fr-FR')
        : 'Indéterminée';
      const fabric = firstOrder.tissuUsed || '';
      const statusLabel = firstOrder.status === 'livre' ? 'Livré' 
        : firstOrder.status === 'pret' ? 'Prêt / Essai' 
        : firstOrder.status === 'retouche' ? 'Retouche' 
        : firstOrder.status === 'coupe' ? 'Couture' 
        : 'Mesures';
      
      const filledMeasurementsCount = firstOrder.measurements 
        ? Object.keys(firstOrder.measurements).filter(k => firstOrder.measurements[k] && firstOrder.measurements[k] !== '').length 
        : (firstOrder.clientMeasurements ? Object.keys(firstOrder.clientMeasurements).filter(k => firstOrder.clientMeasurements[k]).length : 0);

      const steps: TutorialStep[] = [
        {
          stepNumber: 1,
          title: '1. Gestion des Commandes Couture',
          description: 'Tableau de bord de pilotage du flux de fabrication en atelier.',
          targetAcomId: 'orders.title',
          actionToPerform: 'observe',
          speechFr: fichesListeSpeechFr,
          speechWolof: "Dalal ak jàmm ci sa Gestion des Commandes Couture. Fi dafay saytu lepp lu jëm ci ñaw sur-mesure, tàmbli ba kérog ñuy livreur ak di fay.",
          stepCategory: 'info'
        },
        {
          stepNumber: 2,
          title: '2. Compteur des Confections en Cours',
          description: 'Nombre de commandes actives actuellement en atelier.',
          targetAcomId: 'orders.counter',
          actionToPerform: 'observe',
          speechFr: `Le compteur indique actuellement ${orderCount} commande${orderCount > 1 ? 's' : ''} active${orderCount > 1 ? 's' : ''} dans votre atelier.`,
          speechWolof: `Compteur bi dafay wone ne am nga ${orderCount} commande ci sa atelier.`,
          stepCategory: 'info'
        },
        {
          stepNumber: 3,
          title: '3. Modes d\'Affichage (Liste, Planning, Fidélisation)',
          description: 'Bascule entre Fiches Liste, Planning visuel et Campagnes.',
          targetAcomId: 'orders.view_modes',
          actionToPerform: 'observe',
          speechFr: viewModesSpeechFr,
          speechWolof: viewModesSpeechWo,
          stepCategory: 'control'
        },
        {
          stepNumber: 4,
          title: '4. Synchronisation & Sauvegarde Cloud',
          description: 'Sauvegarde instantanée des commandes et synchronisation.',
          targetAcomId: 'orders.sync_btn',
          actionToPerform: 'observe',
          speechFr: "Ce bouton assure la synchronisation de vos commandes et le bon enregistrement de tous les acomptes sur le serveur sécurisé.",
          speechWolof: "Bouton de synchronisation bi dafay denc sa commandes yi ci serveur bi.",
          stepCategory: 'action'
        },
        {
          stepNumber: 5,
          title: '5. Export Tableur Excel & CSV',
          description: 'Exportation de l\'ensemble des commandes et états financiers.',
          targetAcomId: 'orders.export_excel_btn',
          actionToPerform: 'observe',
          speechFr: "Exportez l'ensemble de votre carnet de commandes, acomptes perçus et soldes restants au format tableur Excel ou CSV.",
          speechWolof: "Bouton bi dafay génne sa liste commandes ci fichier Excel.",
          stepCategory: 'action'
        },
        {
          stepNumber: 6,
          title: '6. Impression & Export PDF',
          description: 'Génération du document récapitulatif PDF d\'atelier.',
          targetAcomId: 'orders.export_pdf_btn',
          actionToPerform: 'observe',
          speechFr: "Imprimez ou exportez en PDF le récapitulatif complet de toutes vos commandes pour le suivi d'atelier.",
          speechWolof: "Bouton bi dafay mayé nga imprimer commandes yëpp ci PDF.",
          stepCategory: 'action'
        },
        {
          stepNumber: 7,
          title: '7. Bouton « + Créer une Commande »',
          description: 'Créer une nouvelle commande de confection sur mesure.',
          targetAcomId: 'orders.add_btn',
          actionToPerform: 'observe',
          speechFr: "Cliquez sur « + Créer une Commande » pour enregistrer une nouvelle confection, attribuer un client et synchroniser ses mensurations.",
          speechWolof: "Bouton « + Créer une Commande » bi dafay ubbi assistant bi ngir def commande bu bees.",
          stepCategory: 'action'
        },
        {
          stepNumber: 8,
          title: '8. Barre de Recherche & Filtres par Statut',
          description: 'Recherche instantanée et filtrage par statut d\'avancement.',
          targetAcomId: 'orders.filters',
          actionToPerform: 'observe',
          speechFr: search.trim()
            ? `Recherche active : "${search.trim()}". Filtrez également par étape : Mesures, Couture, Retouche, Prêts ou Livrés.`
            : "Recherchez par nom de client ou modèle, et filtrez par étape : Mesures, Couture, Retouche, Prêts ou Livrés.",
          speechWolof: "Barre de recherche bi da lay may nga wër sa commande tey filtrer ci statut bi nga bëgg.",
          stepCategory: 'control'
        },
        {
          stepNumber: 9,
          title: '9. Fiche de Commande d\'Atelier',
          description: 'Présentation de la fiche synthétique de confection.',
          targetAcomId: 'orders.order_card_0',
          actionToPerform: 'observe',
          speechFr: `Voici la fiche de commande de ${clientName} (${orderRef}). Elle regroupe les caractéristiques du modèle, l'état de confection et la gestion financière.`,
          speechWolof: `Lii mooy fiche commande bu ${clientName}.`,
          stepCategory: 'info'
        },
        {
          stepNumber: 10,
          title: '10. Référence & Client',
          description: 'Numéro de commande, client et date de modification.',
          targetAcomId: 'orders.order_header_0',
          actionToPerform: 'observe',
          speechFr: `La référence ${orderRef} identifie la commande de ${clientName}. Vous suivez sa date de dernière modification en un coup d'œil.`,
          speechWolof: `Référence bi mooy ${orderRef} ngir client ${clientName}.`,
          stepCategory: 'info'
        },
        {
          stepNumber: 11,
          title: '11. Actions Rapides (Urgence, Planning & Modification)',
          description: 'Boutons de priorité, report, édition et suppression.',
          targetAcomId: 'orders.quick_actions_0',
          actionToPerform: 'observe',
          speechFr: "Ces boutons permettent de marquer la commande comme urgente, de la planifier pour plus tard, de modifier ses paramètres ou de la supprimer.",
          speechWolof: "Bouton yii dañuy mayé nga def urgence, planifier, modifier wala supprimer commande bi.",
          stepCategory: 'action'
        },
        {
          stepNumber: 12,
          title: '12. Modèle à Confectionner',
          description: 'Nom du vêtement, catégorie, genre et mesures associées.',
          targetAcomId: 'orders.garment_banner_0',
          actionToPerform: 'observe',
          speechFr: `Cette section présente le modèle à confectionner : ${modelName} (${category} — silhouette ${gender}) avec ${filledMeasurementsCount > 0 ? `${filledMeasurementsCount} mesure(s) associée(s)` : 'mesures synchronisées'}.`,
          speechWolof: `Modèle bi ñu tànn mooy ${modelName} ci wàllu ${category}.`,
          stepCategory: 'info'
        },
        {
          stepNumber: 13,
          title: '13. Date de Livraison, Tissu & Statut',
          description: 'Délai promis, tissu utilisé et sélecteur de statut de confection.',
          targetAcomId: 'orders.workflow_status_0',
          actionToPerform: 'observe',
          speechFr: `Livraison prévue le ${deliveryDate}${fabric ? `, avec le tissu ${fabric}` : ''}. Le menu déroulant permet de faire progresser le statut d'atelier (${statusLabel}) en direct.`,
          speechWolof: `Date livraison : ${deliveryDate}${fabric ? `, tissu : ${fabric}` : ''}. Statut : ${statusLabel}.`,
          stepCategory: 'control'
        },
        {
          stepNumber: 14,
          title: '14. Synthèse Financière (Prix, Acompte & Solde)',
          description: 'Prix total convenu, acompte déjà versé et solde restant.',
          targetAcomId: 'orders.financial_summary_0',
          actionToPerform: 'observe',
          speechFr: `Prix total : ${price.toLocaleString()} ${currency}. Acompte versé : ${advance.toLocaleString()} ${currency}. Solde restant à percevoir : ${rest.toLocaleString()} ${currency}.`,
          speechWolof: `Prix total : ${price.toLocaleString()} ${currency}, Acompte : ${advance.toLocaleString()} ${currency}, Li des : ${rest.toLocaleString()} ${currency}.`,
          stepCategory: 'info'
        },
        {
          stepNumber: 15,
          title: '15. Partager aux Artisans via WhatsApp',
          description: 'Transmission de la fiche technique aux coupeurs et monteurs.',
          targetAcomId: 'orders.action_whatsapp_artisan_0',
          actionToPerform: 'observe',
          speechFr: "Ce bouton transmet la fiche technique complète, le modèle et les mensurations aux artisans et équipes d'atelier par WhatsApp.",
          speechWolof: "Bouton bi dafay yónnee fiche technique bi ak natt yi ci artisans yi ci WhatsApp.",
          stepCategory: 'action'
        }
      ];

      let nextStepNum = 16;

      if (rest > 0) {
        steps.push({
          stepNumber: nextStepNum++,
          title: `${nextStepNum - 1}. Encaisser le Reste`,
          description: 'Encaissement du solde restant dû par le client.',
          targetAcomId: 'orders.action_encaisser_0',
          actionToPerform: 'observe',
          speechFr: `Ce bouton permet d'encaisser le solde restant de ${rest.toLocaleString()} ${currency} lors du retrait ou de la livraison du vêtement.`,
          speechWolof: `Bouton bi dafay mayé nga encaisser solde bi (${rest.toLocaleString()} ${currency}) kérog ñuy joxé yéré bi.`,
          stepCategory: 'action'
        });
      }

      steps.push({
        stepNumber: nextStepNum++,
        title: `${nextStepNum - 1}. Imprimer Fiche A4`,
        description: 'Fiche d\'atelier complète au format A4 avec mesures.',
        targetAcomId: 'orders.action_print_a4_0',
        actionToPerform: 'observe',
        speechFr: "Générez et imprimez une fiche de travail A4 détaillée avec l'ensemble des mensurations pour la table de coupe de l'atelier.",
        speechWolof: "Imprimer fiche A4 bu am natt yëpp ngir table de coupe bi.",
        stepCategory: 'action'
      });

      steps.push({
        stepNumber: nextStepNum++,
        title: `${nextStepNum - 1}. Ticket Thermique 80mm`,
        description: 'Ticket de caisse avec reçu d\'acompte et QR code de suivi.',
        targetAcomId: 'orders.action_print_ticket_0',
        actionToPerform: 'observe',
        speechFr: "Imprimez un ticket thermique 80mm avec reçu d'acompte et QR code permettant au client de suivre sa commande en temps réel.",
        speechWolof: "Imprimer ticket thermique 80mm ak reçu ak QR code de suivi.",
        stepCategory: 'action'
      });

      steps.push({
        stepNumber: nextStepNum++,
        title: `${nextStepNum - 1}. Aviser le Client via WhatsApp`,
        description: 'Envoi d\'un message WhatsApp avec lien de suivi personnalisé.',
        targetAcomId: 'orders.action_whatsapp_client_0',
        actionToPerform: 'observe',
        speechFr: "Ce bouton ouvre un message WhatsApp prêt à envoyer au client avec son lien de suivi pour l'informer de l'avancement ou de la mise à disposition de son vêtement.",
        speechWolof: "Yónnee client bi message WhatsApp ak lien de suivi ngir wax ko fan la ñawam tololu.",
        stepCategory: 'action'
      });

      COUTURE_ORDERS_TUTORIAL.steps = steps;
    }

    // 2. PLANNING DYNAMIC STEPS
    const firstUrgent = urgentOrders[0];
    const firstThisWeek = thisWeekOrders[0];
    const firstLater = laterOrders[0];
    const firstDelivered = deliveredOrders[0];

    let searchSpeechFr = "Utilisez cette recherche pour retrouver rapidement une commande à partir du client ou du modèle.";
    if (search.trim()) {
      searchSpeechFr = `La recherche est actuellement filtrée sur : "${search.trim()}". Utilisez ce champ pour retrouver rapidement une commande à partir du nom du client ou du modèle.`;
    }

    const filterSpeechFr = `Ces filtres permettent de limiter les commandes affichées selon leur état de traitement. Le filtre actuellement sélectionné est : ${activeFilterLabel}.`;

    let counterSpeechFr = "";
    let counterSpeechWo = "";
    if (orderCount === 0) {
      counterSpeechFr = "L'indicateur affiche actuellement 0 conception en cours. Aucune conception n'est actuellement comptabilisée dans cet indicateur.";
      counterSpeechWo = "Compteur bi 0 commande la wone léegi.";
    } else {
      counterSpeechFr = `L'indicateur affiche actuellement ${orderCount} conception${orderCount > 1 ? 's' : ''} en cours de réalisation dans votre atelier.`;
      counterSpeechWo = `Compteur bi dafay wone ne am nga ${orderCount} commande ci sa atelier.`;
    }

    let urgentSpeechFr = "";
    let urgentSpeechWo = "";
    if (urgentCount === 0) {
      urgentSpeechFr = "La colonne En Retard / Urgentes indique un compteur de 0. Aucune commande urgente ou en retard n'est actuellement affichée dans cette catégorie.";
      urgentSpeechWo = "Amul benn commande urgente bu am léegi.";
    } else {
      const urgentDetails = firstUrgent ? `, dont celle de ${firstUrgent.clientName} (${firstUrgent.model})` : '';
      urgentSpeechFr = `La colonne En Retard / Urgentes compte ${urgentCount} commande${urgentCount > 1 ? 's' : ''} prioritaire${urgentCount > 1 ? 's' : ''}${urgentDetails}. Ces pièces nécessitent une attention immédiate sur la table de coupe.`;
      urgentSpeechWo = `Am nga ${urgentCount} commande urgente yu war a gaaw ci table de coupe bi.`;
    }

    let thisWeekSpeechFr = "";
    let thisWeekSpeechWo = "";
    if (thisWeekCount === 0) {
      thisWeekSpeechFr = "La colonne Cette Semaine affiche 0 commande. Rien de planifié cette semaine.";
      thisWeekSpeechWo = "Dara planifiérwul ci semaine bi.";
    } else {
      const thisWeekDetails = firstThisWeek ? `, dont la confection pour ${firstThisWeek.clientName} (${firstThisWeek.model})` : '';
      thisWeekSpeechFr = `La colonne Cette Semaine regroupe ${thisWeekCount} commande${thisWeekCount > 1 ? 's' : ''} dont la livraison est prévue dans les 7 prochains jours${thisWeekDetails}.`;
      thisWeekSpeechWo = `Am nga ${thisWeekCount} commande yu wara paré ci juróom-ñaari fan yii di ñëw.`;
    }

    let laterSpeechFr = "";
    let laterSpeechWo = "";
    if (laterCount === 0) {
      laterSpeechFr = "La colonne Planifiées Plus Tard affiche 0 commande. Aucune commande lointaine.";
      laterSpeechWo = "Amul commande yu ñu planifier plus tard.";
    } else {
      const laterDetails = firstLater ? `, comme la commande de ${firstLater.clientName}` : '';
      laterSpeechFr = `La colonne Planifiées Plus Tard regroupe ${laterCount} commande${laterCount > 1 ? 's' : ''} à échéance plus lointaine ou mises en attente${laterDetails}. Vous pouvez utiliser le bouton « Mettre cette semaine » pour l'avancer à tout moment.`;
      laterSpeechWo = `Am nga ${laterCount} commande yu ñu planifier pour plus tard.`;
    }

    let deliveredSpeechFr = "";
    let deliveredSpeechWo = "";
    if (deliveredCount === 0) {
      deliveredSpeechFr = "La colonne Livrées affiche un compteur de 0. Cette catégorie permet de retrouver les commandes déjà livrées et conservées dans l'historique. Aucun modèle livré récemment.";
      deliveredSpeechWo = "Fi mooy historique bu commandes yi ñu livré ba paré. Amul benn commande bu ñu livré léegi.";
    } else {
      const deliveredDetails = firstDelivered ? `, dont celle de ${firstDelivered.clientName}` : '';
      deliveredSpeechFr = `La colonne Livrées regroupe ${deliveredCount} commande${deliveredCount > 1 ? 's' : ''} déjà remise${deliveredCount > 1 ? 's' : ''} aux clients et archivée${deliveredCount > 1 ? 's' : ''} dans l'historique${deliveredDetails}.`;
      deliveredSpeechWo = `Am nga ${deliveredCount} commande yu ñu livré ba denc leen ci historique bi.`;
    }

    COUTURE_ORDERS_PLANNING_TUTORIAL.steps = [
      {
        stepNumber: 1,
        title: '1. Commandes Mesures — Organisation du Planning',
        description: 'Présentation de la section Commandes Mesures.',
        targetAcomId: 'orders.title',
        actionToPerform: 'observe',
        speechFr: planningIntroSpeechFr,
        speechWolof: planningIntroSpeechWo,
        stepCategory: 'info'
      },
      {
        stepNumber: 2,
        title: '2. Vue Active : Planning d\'Atelier',
        description: 'Organisation temporelle des commandes selon leur situation et état.',
        targetAcomId: 'orders.view_modes',
        actionToPerform: 'observe',
        speechFr: viewModesSpeechFr,
        speechWolof: viewModesSpeechWo,
        stepCategory: 'control'
      },
      {
        stepNumber: 3,
        title: '3. Synchronisation & Exports (SYNC, EXCEL, PDF)',
        description: 'Sauvegarde sécurisée cloud et exportations d\'atelier.',
        targetAcomId: 'orders.sync_btn',
        actionToPerform: 'observe',
        speechFr: "Les boutons SYNC, EXCEL et PDF permettent de synchroniser vos commandes avec le serveur sécurisé et d'exporter l'ensemble de votre carnet d'atelier aux formats Excel ou PDF.",
        speechWolof: "Bouton yii dañuy sync sa données yi tey génne sa carnet d'atelier ci Excel wala PDF.",
        stepCategory: 'action'
      },
      {
        stepNumber: 4,
        title: '4. Bouton « + Créer une Commande »',
        description: 'Créer une nouvelle commande de confection.',
        targetAcomId: 'orders.add_btn',
        actionToPerform: 'observe',
        speechFr: "Ce bouton permet de créer une nouvelle fiche commande couture. Si vous le souhaitez, vous pouvez suivre le parcours dédié à la création d'une commande.",
        speechWolof: "Bouton « + Créer une Commande » bi dafay ubbi création bu commande couture bu bees.",
        stepCategory: 'action'
      },
      {
        stepNumber: 5,
        title: '5. Barre de Recherche Rapide',
        description: 'Recherche instantanée par client ou modèle.',
        targetAcomId: 'orders.filters',
        actionToPerform: 'observe',
        speechFr: searchSpeechFr,
        speechWolof: "Barre de recherche bi da lay may nga wër commande ci turu client bi wala modèle bi.",
        stepCategory: 'control'
      },
      {
        stepNumber: 6,
        title: '6. Filtres par Statut d\'Atelier',
        description: 'Filtrer les commandes selon l\'étape de confection.',
        targetAcomId: 'orders.filters',
        actionToPerform: 'observe',
        speechFr: filterSpeechFr,
        speechWolof: `Filtres yii dañuy limité commandes yi ñuy wone selon statut ñaw bi. Filtre bi actif léegi mooy : ${activeFilterLabel}.`,
        stepCategory: 'control'
      },
      {
        stepNumber: 7,
        title: '7. Indicateur « Conceptions en Cours »',
        description: 'Total des confections actives en cours d\'atelier.',
        targetAcomId: 'orders.counter',
        actionToPerform: 'observe',
        speechFr: counterSpeechFr,
        speechWolof: counterSpeechWo,
        stepCategory: 'info'
      },
      {
        stepNumber: 8,
        title: '8. Colonne « En Retard / Urgentes »',
        description: 'Commandes nécessitant une priorité immédiate.',
        targetAcomId: 'orders.planning_urgent_col',
        actionToPerform: 'observe',
        speechFr: urgentSpeechFr,
        speechWolof: urgentSpeechWo,
        stepCategory: 'info'
      },
      {
        stepNumber: 9,
        title: '9. Colonne « Cette Semaine »',
        description: 'Confections dont la livraison est prévue dans les 7 jours.',
        targetAcomId: 'orders.planning_this_week_col',
        actionToPerform: 'observe',
        speechFr: thisWeekSpeechFr,
        speechWolof: thisWeekSpeechWo,
        stepCategory: 'info'
      },
      {
        stepNumber: 10,
        title: '10. Colonne « Planifiées Plus Tard »',
        description: 'Commandes à échéance lointaine ou en attente.',
        targetAcomId: 'orders.planning_later_col',
        actionToPerform: 'observe',
        speechFr: laterSpeechFr,
        speechWolof: laterSpeechWo,
        stepCategory: 'info'
      },
      {
        stepNumber: 11,
        title: '11. Colonne « Livrées (Historique) »',
        description: 'Historique des confections déjà livrées aux clients.',
        targetAcomId: 'orders.planning_delivered_col',
        actionToPerform: 'observe',
        speechFr: deliveredSpeechFr,
        speechWolof: deliveredSpeechWo,
        stepCategory: 'info'
      },
      {
        stepNumber: 12,
        title: '12. Actions Rapides sur les Cartes d\'Atelier',
        description: 'Changement de statut, boutons contextuels, WhatsApp et impressions.',
        targetAcomId: 'orders.planning_urgent_col',
        actionToPerform: 'observe',
        speechFr: "Chaque carte de commande permet de modifier son statut, d'ajuster son urgence ou son report, d'envoyer un message WhatsApp aux artisans ou au client, et d'imprimer la fiche A4 ou le ticket thermique 80mm.",
        speechWolof: "Carte bu ci nekk dafay mayé nga soppi statut bi, yónnee message WhatsApp ci artisans yi wala client bi, tey imprimer fiche A4 wala ticket.",
        stepCategory: 'final'
      }
    ];

    // 3. CAMPAIGNS DYNAMIC STEPS
    const holiday = context.selectedCampaignHoliday || 'tabaski';
    const customText = context.campaignCustomText || '';
    const selectedClientsCount = context.selectedCampaignClientsCount || 0;

    let holidaySpeechFr = "L'occasion sélectionnée est la Fête de la Tabaski 🐑. Le message est automatiquement pré-rempli pour proposer la confection de Boubous, Bazin et Wax.";
    let holidaySpeechWo = "Occasion bi nga tànn mooy Tabaski 🐑 ngir ñaw Boubous, Bazin ak Wax.";
    if (holiday === 'korite') {
      holidaySpeechFr = "L'occasion sélectionnée est la Fête de la Korité 🌟. Idéal pour proposer des modèles d'élégance et inviter à la prise de mesures.";
      holidaySpeechWo = "Occasion bi mooy Korité 🌟 ngir ñawu fét yi.";
    } else if (holiday === 'ramadan') {
      holidaySpeechFr = "L'occasion sélectionnée est le Mois du Ramadan 🌙. Vous pouvez inviter vos clients à préparer sereinement leurs tenues de fête.";
      holidaySpeechWo = "Occasion bi mooy Ramadan 🌙.";
    } else if (holiday === 'fin_annee') {
      holidaySpeechFr = "L'occasion sélectionnée est les Fêtes de Fin d'Année ✨. Idéal pour proposer des créations sur-mesure uniques.";
      holidaySpeechWo = "Occasion bi mooy Fêtes de fin d'année ✨.";
    }

    let noteSpeechFr = "Saisissez ici une note personnalisée (ex: offre promotionnelle, rappel de délai) qui viendra enrichir automatiquement le message WhatsApp envoyé.";
    if (customText.trim()) {
      noteSpeechFr += ` La note personnalisée actuelle est : "${customText.trim()}".`;
    }

    let selectionSpeechFr = "Aucun destinataire n'est sélectionné actuellement. Cochez au moins un client couture pour activer le lancement de la campagne.";
    let selectionSpeechWo = "Mënagoo yónnee ndax tànnagoo benn client.";
    if (selectedClientsCount === 1) {
      selectionSpeechFr = "Vous avez sélectionné exactement 1 destinataire. Le bouton d'envoi WhatsApp individuel est maintenant actif.";
      selectionSpeechWo = "Am nga 1 destinataire bu nga tànn, mën nga yónnee message bi léegi.";
    } else if (selectedClientsCount > 1) {
      selectionSpeechFr = `Vous avez sélectionné ${selectedClientsCount} destinataires. Les boutons d'envoi individuel pour chaque client de la liste sont actifs.`;
      selectionSpeechWo = `Tànn nga ${selectedClientsCount} destinataires, mën nga yónnee message yi.`;
    }

    COUTURE_ORDERS_CAMPAIGNS_TUTORIAL.steps = [
      {
        stepNumber: 1,
        title: '1. Fidélisation & Fêtes — Relance Client',
        description: 'Présentation de la section Fidélisation et Campagnes.',
        targetAcomId: 'orders.campaigns_title',
        actionToPerform: 'observe',
        speechFr: campaignsIntroSpeechFr,
        speechWolof: campaignsIntroSpeechWo,
        stepCategory: 'info'
      },
      {
        stepNumber: 2,
        title: '2. Choix de l\'Occasion / Fête',
        description: 'Menu déroulant de sélection de l\'occasion ou fête.',
        targetAcomId: 'orders.campaigns_holiday_select',
        actionToPerform: 'observe',
        speechFr: holidaySpeechFr,
        speechWolof: holidaySpeechWo,
        stepCategory: 'control'
      },
      {
        stepNumber: 3,
        title: '3. Note Personnalisée',
        description: 'Champ de saisie pour ajouter une offre ou une note.',
        targetAcomId: 'orders.campaigns_custom_text',
        actionToPerform: 'observe',
        speechFr: noteSpeechFr,
        speechWolof: "Mën nga fi bind note personnalisée (remise wala leneen) bu dafay mottali message WhatsApp bi.",
        stepCategory: 'control'
      },
      {
        stepNumber: 4,
        title: '4. Sélection des Destinataires',
        description: 'Entête des destinataires et sélections groupées.',
        targetAcomId: 'orders.campaigns_destinataires_header',
        actionToPerform: 'observe',
        speechFr: "Choisissez les clients de votre carnet d'adresses couture à qui envoyer la campagne. Utilisez les boutons « Tout sélectionner » et « Tout désélectionner » pour ajuster rapidement la liste.",
        speechWolof: "Tànnal clients yi nga bëgg yónnee message bi. Mën nga bëss Tout sélectionner wala Tout désélectionner.",
        stepCategory: 'action'
      },
      {
        stepNumber: 5,
        title: '5. Sélection Individuelle',
        description: 'Case de sélection individuelle pour chaque client.',
        targetAcomId: 'orders.campaigns_client_row_0',
        actionToPerform: 'observe',
        speechFr: "Cochez individuellement chaque client pour l'ajouter ou le retirer de la liste d'envoi. La case de sélection est interactive et met à jour instantanément vos destinataires.",
        speechWolof: "Cocheal client bu ci nekk ngir doli ko wala jële ko ci liste bi.",
        stepCategory: 'action'
      },
      {
        stepNumber: 6,
        title: '6. Aperçu du Message WhatsApp',
        description: 'Visualisation en direct du message personnalisé à envoyer.',
        targetAcomId: 'orders.campaigns_whatsapp_preview',
        actionToPerform: 'observe',
        speechFr: "Visualisez l'aperçu du message personnalisé qui sera préparé. Le texte intègre dynamiquement le nom du client, le nom de votre atelier et votre note personnalisée.",
        speechWolof: "Fii nga fay gissé message bi ñuy yónnee ci WhatsApp. Dafay doli turu client bi ak sa note.",
        stepCategory: 'info'
      },
      {
        stepNumber: 7,
        title: '7. Destinataires Sélectionnés',
        description: 'Indicateur du nombre de destinataires sélectionnés.',
        targetAcomId: 'orders.campaigns_selected_count',
        actionToPerform: 'observe',
        speechFr: selectionSpeechFr,
        speechWolof: selectionSpeechWo,
        stepCategory: 'info'
      },
      {
        stepNumber: 8,
        title: '8. Lancement Individuel (WhatsApp)',
        description: 'Envoi individuel du message pré-rempli sans spam.',
        targetAcomId: selectedClientsCount === 0 ? 'orders.campaigns_send_button_placeholder' : 'orders.campaigns_send_button_0',
        actionToPerform: 'observe',
        speechFr: selectedClientsCount === 0 
          ? "Le bouton reste désactivé tant qu'aucun destinataire n'est sélectionné dans la liste."
          : "Cliquez sur ce bouton pour ouvrir instantanément WhatsApp avec le message pré-rempli pour ce client. Répétez l'opération pour chaque destinataire de votre liste pour un envoi groupé sans spam.",
        speechWolof: selectedClientsCount === 0 
          ? "Bouton bi dafay désactivé ba nga tànné client."
          : "Bëssal bouton bi ngir ubbi WhatsApp ak message bi ñu pré-remplir ba paré.",
        stepCategory: 'action'
      }
    ];

    if (this.isActive) {
      if (this.ordersViewMode === 'timeline') {
        if (this.currentScenario?.id !== 'couture.orders.planning') {
          COUTURE_ORDERS_PLANNING_TUTORIAL.steps = this.getFilteredCoutureSteps(COUTURE_ORDERS_PLANNING_TUTORIAL.steps);
          this.currentScenario = COUTURE_ORDERS_PLANNING_TUTORIAL;
          this.requestTutorialStep(0, 'immediate');
        } else {
          this.currentScenario.steps = this.getFilteredCoutureSteps(COUTURE_ORDERS_PLANNING_TUTORIAL.steps);
        }
      } else if (this.ordersViewMode === 'campaigns') {
        if (this.currentScenario?.id !== 'couture.orders.campaigns') {
          COUTURE_ORDERS_CAMPAIGNS_TUTORIAL.steps = this.getFilteredCoutureSteps(COUTURE_ORDERS_CAMPAIGNS_TUTORIAL.steps);
          this.currentScenario = COUTURE_ORDERS_CAMPAIGNS_TUTORIAL;
          this.requestTutorialStep(0, 'immediate');
        } else {
          this.currentScenario.steps = this.getFilteredCoutureSteps(COUTURE_ORDERS_CAMPAIGNS_TUTORIAL.steps);
        }
      } else if (this.ordersViewMode === 'list') {
        if (this.currentScenario?.id !== 'couture_tutorial_orders' && this.currentScenario?.id !== 'couture.orders.list') {
          COUTURE_ORDERS_TUTORIAL.steps = this.getFilteredCoutureSteps(COUTURE_ORDERS_TUTORIAL.steps);
          this.currentScenario = COUTURE_ORDERS_TUTORIAL;
          this.requestTutorialStep(0, 'immediate');
        } else {
          this.currentScenario.steps = this.getFilteredCoutureSteps(COUTURE_ORDERS_TUTORIAL.steps);
        }
      }
    }
  }

  public setCreateOrderFormContext(context: {
    clients: any[];
    selectedClientId?: string;
    selectedClient?: any;
    model?: string;
    price?: number | string;
    advance?: number | string;
    deliveryDate?: string;
    status?: string;
    isUrgent?: boolean;
    isLater?: boolean;
    tissus?: any[];
    selectedTissuId?: string;
    tissuLengthUsed?: number | string;
    mercerieItems?: any[];
    selectedMercerieItems?: any[];
    currency?: string;
  }): void {
    const {
      clients = [],
      selectedClientId,
      selectedClient,
      model = '',
      price = '',
      advance = '',
      deliveryDate = '',
      status = 'mesures',
      isUrgent = false,
      isLater = false,
      tissus = [],
      selectedTissuId,
      tissuLengthUsed,
      selectedMercerieItems = [],
      currency = 'FCFA'
    } = context;

    // Status label mapping
    const statusLabels: Record<string, string> = {
      mesures: '🧵 Prise de Mesures',
      coupe: '✂️ Coupe & Couture',
      retouche: '✏️ Retouches',
      pret: '👗 Prêt pour Essai',
      livre: '🤝 Livré'
    };
    const currentStatusLabel = statusLabels[status] || status;

    // Delivery date formatted
    let deliveryDateFormatted = '';
    if (deliveryDate) {
      try {
        const d = new Date(deliveryDate);
        if (!isNaN(d.getTime())) {
          deliveryDateFormatted = d.toLocaleDateString('fr-FR');
        } else {
          deliveryDateFormatted = deliveryDate;
        }
      } catch {
        deliveryDateFormatted = deliveryDate;
      }
    }

    // Fabric label
    let fabricName = '';
    if (selectedTissuId) {
      const fab = tissus.find((t: any) => t.id === selectedTissuId);
      if (fab) {
        fabricName = `${fab.name}${fab.color ? ` (${fab.color})` : ''}`;
      }
    }

    // Client speech
    let clientSpeechFr = '';
    let clientSpeechWolof = '';
    const activeClients = clients.filter((c: any) => !c.isDeleted);
    
    if (activeClients.length === 0) {
      clientSpeechFr = "Sélectionnez le client couture concerné par cette commande. Aucun client n'est actuellement disponible dans votre fichier. La création d'une commande nécessite un client couture disponible. Vous pouvez ajouter un client via l'onglet « Clients Couture ».";
      clientSpeechWolof = "Tànnal client bi concerné ci commande bi. Amul benn client bu am léegi ci sa fichier, kon war nga jëkk a bind client ci onglet Clients Couture.";
    } else if (selectedClient) {
      const name = `${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim();
      clientSpeechFr = `Sélectionnez le client couture concerné par cette commande. Le client sélectionné est actuellement ${name}. La commande et ses mensurations sont synchronisées avec son dossier.`;
      clientSpeechWolof = `Tànnal client bi. Client bi ñu tànn mooy ${name}. Commande bi dafay lëkkaloo ak dossier am.`;
    } else if (selectedClientId) {
      const found = activeClients.find((c: any) => c.id === selectedClientId);
      const name = found ? `${found.firstName} ${found.lastName}` : selectedClientId;
      clientSpeechFr = `Sélectionnez le client couture concerné par cette commande. Le client sélectionné est actuellement ${name}. La commande et ses mensurations sont synchronisées avec son dossier.`;
      clientSpeechWolof = `Tànnal client bi. Client bi ñu tànn mooy ${name}.`;
    } else {
      const sampleNames = activeClients.slice(0, 3).map((c: any) => `${c.firstName} ${c.lastName}`).join(', ');
      const moreText = activeClients.length > 3 ? '...' : '';
      clientSpeechFr = `Sélectionnez le client couture concerné par cette commande. Actuellement, ${activeClients.length} client(s) disponible(s) dans votre fichier (${sampleNames}${moreText}). La commande sera liée à sa fiche client.`;
      clientSpeechWolof = `Tànnal client bi concerné ci commande bi. Am nga ${activeClients.length} clients ci sa fichier.`;
    }

    // Model speech
    let modelSpeechFr = "Indiquez précisément le modèle ou le vêtement commandé. Cette description permet d'identifier ce qui doit être confectionné.";
    if (model && model.trim()) {
      modelSpeechFr += ` Modèle actuellement sélectionné : ${model}.`;
    } else {
      modelSpeechFr += " (Exemple : Grand Boubou Broderie fine blanche, Robe trapèze wax).";
    }

    // Price speech
    let priceSpeechFr = "Saisissez le prix convenu pour la confection, en francs CFA.";
    const numPrice = Number(price);
    if (!isNaN(numPrice) && numPrice > 0) {
      priceSpeechFr += ` Montant actuellement renseigné : ${numPrice.toLocaleString()} ${currency}.`;
    } else {
      priceSpeechFr += " Ce champ obligatoire détermine le montant total de la facture.";
    }

    // Advance speech
    let advanceSpeechFr = "Saisissez le montant déjà versé par le client, en francs CFA. Le prix de confection correspond au coût total, tandis que l'acompte permet de suivre l'avance perçue et le solde restant dû lors de la livraison.";
    const numAdv = Number(advance);
    if (!isNaN(numAdv) && numAdv > 0) {
      advanceSpeechFr += ` Acompte saisi : ${numAdv.toLocaleString()} ${currency}.`;
    }

    // Delivery date speech
    let dateSpeechFr = "Sélectionnez la date à laquelle la commande doit être livrée au client.";
    if (deliveryDateFormatted) {
      dateSpeechFr += ` Date de livraison convenue : ${deliveryDateFormatted}.`;
    }

    // Status speech
    const statusSpeechFr = `Ce champ permet d'indiquer l'état actuel de fabrication de la commande. Les statuts disponibles sont : Prise de Mesures, Coupe et Couture, Retouches, Prêt pour Essai et Livré. Le statut sélectionné est actuellement : ${currentStatusLabel}.`;

    // Urgent speech
    const urgentSpeechFr = `Cette option permet d'identifier la commande comme urgente. Lorsqu'elle est cochée, la commande apparaît en priorité haute avec un indicateur rouge sur le planning et le tableau d'atelier. Actuellement, la case est ${isUrgent ? 'cochée (priorité urgente)' : 'non cochée'}.`;

    // Later speech
    const laterSpeechFr = `Cette option permet d'indiquer que la commande doit être planifiée ultérieurement sans bloquer le planning immédiat de coupe. Actuellement, la case est ${isLater ? 'cochée' : 'non cochée'}.`;

    // Fabric select speech
    const fabricSpeechFr = `Si un tissu du stock de l'atelier est utilisé pour cette commande, sélectionnez le tissu dans la liste déroulante. Actuellement : ${fabricName || 'Ne pas prélever de tissu'}.`;

    // Fabric meters speech
    const metersSpeechFr = `Indiquez le nombre de mètres à déduire du stock pour cette confection${tissuLengthUsed ? ` (${tissuLengthUsed} mètres)` : ''}.`;

    // Mercerie speech
    const mercerieCount = selectedMercerieItems.length;
    const mercerieSpeechFr = `Cette section permet d'ajouter les articles de mercerie utilisés pour cette commande, comme les fils, fermetures, boutons ou entoilages. ${mercerieCount > 0 ? `${mercerieCount} article(s) de mercerie associé(s).` : "Actuellement, aucun article n'est ajouté."}`;

    COUTURE_CREATE_ORDER_TUTORIAL.steps = [
      {
        stepNumber: 1,
        title: '1. Fenêtre : Créer une Fiche Commande',
        description: 'Présentation de la fenêtre de création de commande couture.',
        targetAcomId: 'orders.form_modal_title',
        actionToPerform: 'observe',
        speechFr: "Cette fenêtre permet de créer une commande couture et de la synchroniser avec le dossier du client couture.",
        speechWolof: "Fenetre bi dafay mayé nga def commande couture bu bees te synchroniser ko ak dossier client bi.",
        stepCategory: 'info'
      },
      {
        stepNumber: 2,
        title: '2. Client Couture *',
        description: 'Sélection du client couture dans le fichier.',
        targetAcomId: 'orders.form_client_select',
        actionToPerform: 'click',
        speechFr: clientSpeechFr,
        speechWolof: clientSpeechWolof,
        stepCategory: 'required'
      },
      {
        stepNumber: 3,
        title: '3. Description du Modèle Commandé *',
        description: 'Indication du modèle ou vêtement à confectionner.',
        targetAcomId: 'orders.form_model',
        actionToPerform: 'type',
        speechFr: modelSpeechFr,
        speechWolof: "Bindal fi modèle wala vêtement bi client bi bëgg ñu ñawal ko ko.",
        stepCategory: 'required'
      },
      {
        stepNumber: 4,
        title: `4. Prix de la Confection (${currency}) *`,
        description: 'Montant total convenu pour la réalisation du vêtement.',
        targetAcomId: 'orders.form_price',
        actionToPerform: 'type',
        speechFr: priceSpeechFr,
        speechWolof: "Bindal fi prix total bi ngeen déggoo ci ñaw bi ci FCFA.",
        stepCategory: 'required'
      },
      {
        stepNumber: 5,
        title: `5. Acompte Versé (${currency})`,
        description: 'Montant de l\'avance déjà perçue lors de la commande.',
        targetAcomId: 'orders.form_advance',
        actionToPerform: 'type',
        speechFr: advanceSpeechFr,
        speechWolof: "Bindal fi acompte bi client bi joxe ci xalis bi. Lii dafay mayé nga xam li des kérog livraison bi.",
        stepCategory: 'info'
      },
      {
        stepNumber: 6,
        title: '6. Date Prévue de Livraison *',
        description: 'Date promise au client pour la livraison ou l\'essayage.',
        targetAcomId: 'orders.form_delivery_date',
        actionToPerform: 'type',
        speechFr: dateSpeechFr,
        speechWolof: "Tànnal kérog kañ lañu wara joxé yéré bi client bi.",
        stepCategory: 'required'
      },
      {
        stepNumber: 7,
        title: '7. Statut de Fabrication *',
        description: 'État d\'avancement de la fabrication en atelier.',
        targetAcomId: 'orders.form_status',
        actionToPerform: 'click',
        speechFr: statusSpeechFr,
        speechWolof: "Menu déroulant bi dafay wone statut ñaw bi : Natt, Coupe ak Ñaw, Retouches, Paré pour Essai wala Livré.",
        stepCategory: 'required'
      },
      {
        stepNumber: 8,
        title: '8. Marquer Urgent',
        description: 'Priorisation accélérée de la commande en atelier.',
        targetAcomId: 'orders.form_urgent',
        actionToPerform: 'click',
        speechFr: urgentSpeechFr,
        speechWolof: "Case bi dafay mayé nga def commande bi ci urgence ngir mu jékk ci coupe ak couture bi.",
        stepCategory: 'control'
      },
      {
        stepNumber: 9,
        title: '9. Planifier Plus Tard',
        description: 'Mise en attente sans réservation immédiate du planning.',
        targetAcomId: 'orders.form_later',
        actionToPerform: 'click',
        speechFr: laterSpeechFr,
        speechWolof: "Case bi dafay wone ne commande bi dañu koy planifier ëllëg.",
        stepCategory: 'control'
      },
      {
        stepNumber: 10,
        title: '10. Consommation Tissu Stock Atelier (Optionnel)',
        description: 'Section de prélèvement de coupons de tissu dans le stock.',
        targetAcomId: 'orders.form_fabric_section',
        actionToPerform: 'observe',
        speechFr: "Cette section permet d'associer une consommation de tissu du stock atelier à la commande. Elle reste facultative si le client a lui-même fourni son propre tissu.",
        speechWolof: "Wàll bi dafay mayé nga prélever sër ci stock atelier bi ngir commande bi.",
        stepCategory: 'info'
      },
      {
        stepNumber: 11,
        title: '11. Tissu Sélectionné',
        description: 'Choix du tissu parmi les coupons disponibles.',
        targetAcomId: 'orders.form_fabric_select',
        actionToPerform: 'click',
        speechFr: fabricSpeechFr,
        speechWolof: "Tànnal sër bi ci stock bi su fekkee atelier bi mookoy joxé.",
        stepCategory: 'control'
      },
      {
        stepNumber: 12,
        title: '12. Mètres à Déduire du Stock',
        description: 'Métrage consommé à déduire de l\'inventaire.',
        targetAcomId: 'orders.form_fabric_meters',
        actionToPerform: 'type',
        speechFr: metersSpeechFr,
        speechWolof: "Bindal fi ñaata mètres nga wara waññi ci stock sër bi.",
        stepCategory: 'control'
      },
      {
        stepNumber: 13,
        title: '13. Consommation Mercerie (Optionnel)',
        description: 'Articles de mercerie associés (fils, boutons, zips).',
        targetAcomId: 'orders.form_mercerie_section',
        actionToPerform: 'observe',
        speechFr: mercerieSpeechFr,
        speechWolof: "Wàll bi dafay mayé nga yokk mercerie : wëñ, boutons, fermetures ci commande bi.",
        stepCategory: 'info'
      },
      {
        stepNumber: 14,
        title: '14. Bouton « + Ajouter un article »',
        description: 'Ajout d\'une ligne de mercerie et quantité.',
        targetAcomId: 'orders.form_add_mercerie_btn',
        actionToPerform: 'click',
        speechFr: "Ce bouton permet d'ajouter une nouvelle ligne d'article de mercerie et de choisir la quantité à prélever sur le stock.",
        speechWolof: "Bouton bi dafay yokk benn ligne mercerie bu bees.",
        stepCategory: 'action'
      },
      {
        stepNumber: 15,
        title: '15. Bouton « Annuler »',
        description: 'Fermeture de la fenêtre sans enregistrer.',
        targetAcomId: 'orders.form_cancel_btn',
        actionToPerform: 'click',
        speechFr: "Ce bouton permet de fermer la fenêtre sans enregistrer la fiche commande.",
        speechWolof: "Bouton bi dafay tëj fenetre bi te du denc dara.",
        stepCategory: 'action'
      },
      {
        stepNumber: 16,
        title: '16. Bouton « Enregistrer & Synchroniser »',
        description: 'Validation finale et synchronisation avec le dossier client.',
        targetAcomId: 'orders.form_submit_btn',
        actionToPerform: 'click',
        speechFr: "Lorsque tous les champs obligatoires sont correctement renseignés, cliquez ici pour enregistrer la fiche commande et synchroniser les informations avec le dossier client couture.",
        speechWolof: "Bëssal fi ngir denc commande bi te synchroniser ko ak dossier client bi.",
        stepCategory: 'action'
      }
    ];

    if (this.isActive && (this.currentScenario?.id === 'couture.orders.create-order' || this.currentScenario?.id === 'couture_create_order_modal')) {
      this.currentScenario.steps = COUTURE_CREATE_ORDER_TUTORIAL.steps;
    }
  }

  public setSummaryContext(measurementCount: number): void {
    const measurementsTableStep = COUTURE_ADD_CLIENT_TUTORIAL.steps.find(s => s.targetAcomId === 'add_client.summary_measurements_table');
    
    if (measurementsTableStep) {
       if (measurementCount === 0) {
           measurementsTableStep.speechFr = "Cette section indique les mesures actuellement enregistrées pour ce client. Dans cette capture, aucune mensuration n'est enregistrée.";
       } else {
           measurementsTableStep.speechFr = "Cette section indique les mesures actuellement enregistrées pour ce client.";
       }
    }
  }

  public setClientsMeasurementsContext(count: number): void {
    const baseSteps = COUTURE_CLIENTS_TUTORIAL.steps.filter(s => 
      !s.targetAcomId?.startsWith('clients.measurement_0_') &&
      s.targetAcomId !== 'clients.measurement_count_0' &&
      s.targetAcomId !== 'clients.view_all_measurements_0'
    );
    
    const profileSectionIndex = baseSteps.findIndex(s => s.targetAcomId === 'clients.profile_section_0');
    if (profileSectionIndex === -1) return;

    let currentStepNum = profileSectionIndex + 2; // +1 because index is 0-based, +1 to go after
    const dynamicSteps: TutorialStep[] = [];

    for (let i = 0; i < count; i++) {
      dynamicSteps.push({
        stepNumber: currentStepNum++,
        title: `${currentStepNum - 1}. Mesure Principale ${i + 1}`,
        description: `Présentation de la mesure ${i + 1}.`,
        targetAcomId: `clients.measurement_0_${i}`,
        actionToPerform: 'observe',
        speechFr: `Voici une des mensurations principales enregistrées pour ce client. Elle est structurée en respectant la charte métrique de l'atelier.`,
        speechWolof: `Lii mooy benn ci natt yi nga bind.`,
        stepCategory: 'info'
      });
    }

    dynamicSteps.push({
      stepNumber: currentStepNum++,
      title: `${currentStepNum - 1}. Nombre de Mesures`,
      description: `Présentation du nombre total de mesures.`,
      targetAcomId: `clients.measurement_count_0`,
      actionToPerform: 'observe',
      speechFr: `Cette indication confirme le nombre total de mensurations actuellement enregistrées pour ce profil.`,
      speechWolof: `Lii dafay wone ñaatay natt nga bind ci profil bi.`,
      stepCategory: 'info'
    });

    dynamicSteps.push({
      stepNumber: currentStepNum++,
      title: `${currentStepNum - 1}. Voir toutes les mensurations`,
      description: `Action pour afficher toutes les mesures.`,
      targetAcomId: `clients.view_all_measurements_0`,
      actionToPerform: 'observe',
      speechFr: `Cette action permet d'afficher l'ensemble des mensurations enregistrées pour le client dans un panneau détaillé.`,
      speechWolof: `Bëss bii dafay wone natt yëpp yi nga bind ci client bi.`,
      stepCategory: 'action'
    });

    baseSteps.splice(profileSectionIndex + 1, 0, ...dynamicSteps);
    
    // Update step numbers for any trailing steps (if any existed, though we added to the end)
    for (let i = 0; i < baseSteps.length; i++) {
      baseSteps[i].stepNumber = i + 1;
      baseSteps[i].title = `${i + 1}. ${baseSteps[i].title.split('. ')[1] || baseSteps[i].title}`;
    }
    
    COUTURE_CLIENTS_TUTORIAL.steps = baseSteps;
  }

  public setClientCardContext(clientName: string, updatedAt: string, phone: string, address: string): void {
    const cardStep = COUTURE_CLIENTS_TUTORIAL.steps.find(s => s.targetAcomId === 'clients.client_card_0');
    if (cardStep) {
      cardStep.speechFr = `Voici une fiche client. Pour ce client : ${clientName}. Modifié le ${updatedAt}. Coordonnées : ${phone || 'Non renseigné'}, ${address || 'Non renseignée'}.`;
    }
  }

  public setGarmentContext(garmentName: string, category: string, gender: string, totalMeasurements: number): void {
    const garmentStep = COUTURE_CLIENTS_TUTORIAL.steps.find(s => s.targetAcomId === 'clients.garment_section_0');
    if (garmentStep) {
      garmentStep.speechFr = `Cette section indique le modèle de vêtement sélectionné : ${garmentName}, catégorie ${category}, genre ${gender}, avec ${totalMeasurements} mesure(s).`;
    }
  }

  public setValidationContext(context: {
    missingKeys: string[];
    alerts: any[];
  }): void {
    const alertBannerStep = COUTURE_ADD_CLIENT_TUTORIAL.steps.find(s => s.targetAcomId === 'add_client.validation_alert_banner');
    const returnBtnStep = COUTURE_ADD_CLIENT_TUTORIAL.steps.find(s => s.targetAcomId === 'add_client.btn_return_step3');
    
    if (alertBannerStep) {
       if (context.missingKeys.length === 0 && context.alerts.length === 0) {
           alertBannerStep.speechFr = "Le contrôle qualité est terminé. Toutes les mesures requises sont actuellement valides et cohérentes pour le modèle sélectionné.";
           if (returnBtnStep) {
               returnBtnStep.speechFr = "Cette action est actuellement indisponible, car toutes les mesures requises sont déjà valides et cohérentes.";
           }
       } else if (context.missingKeys.length === 0 && context.alerts.length > 0) {
           alertBannerStep.speechFr = "Les mesures sont présentes, mais le système détecte encore une incohérence. Consultez les recommandations avant de poursuivre.";
           if (returnBtnStep) {
               returnBtnStep.speechFr = "Ce bouton permet de revenir à l'étape Prise de Mesures afin de compléter ou de modifier les mensurations si nécessaire.";
           }
       } else {
           alertBannerStep.speechFr = "Une alerte est actuellement présente. Elle indique que certaines mesures obligatoires du modèle ne sont pas encore complètes.";
           if (returnBtnStep) {
               returnBtnStep.speechFr = "Ce bouton permet de revenir à l'étape Prise de Mesures afin de compléter ou de modifier les mensurations si nécessaire.";
           }
       }
    }

    // Filter out all dynamic validation steps
    const newSteps = COUTURE_ADD_CLIENT_TUTORIAL.steps.filter(s => 
      s.targetAcomId !== 'add_client.missing_measurements_header' &&
      !s.targetAcomId?.startsWith('add_client.missing_measure_') &&
      s.targetAcomId !== 'add_client.warnings_header' &&
      !s.targetAcomId?.startsWith('add_client.warning_')
    );

    // Find insertion index (right after reference_model)
    const refIndex = newSteps.findIndex(s => s.targetAcomId === 'add_client.reference_model');
    
    if (refIndex !== -1) {
      let currentStepNum = 89;
      const dynamicSteps: TutorialStep[] = [];
      
      if (context.missingKeys.length > 0) {
        const count = context.missingKeys.length;
        let countText = count.toString();
        if (count === 1) countText = "Une";
        else if (count === 2) countText = "Deux";
        else if (count === 3) countText = "Trois";
        else if (count === 4) countText = "Quatre";
        else if (count === 5) countText = "Cinq";
        else if (count === 6) countText = "Six";
        else if (count === 7) countText = "Sept";
        else if (count === 8) countText = "Huit";
        else if (count === 9) countText = "Neuf";
        else if (count === 10) countText = "Dix";
        
        dynamicSteps.push({
          stepNumber: currentStepNum++,
          title: `${currentStepNum - 1}. Section « Mesures Manquantes »`,
          description: 'Nombre de mesures manquantes.',
          targetAcomId: 'add_client.missing_measurements_header',
          actionToPerform: 'observe',
          speechFr: `${countText} mesure${count > 1 ? 's' : ''} obligatoire${count > 1 ? 's sont' : ' est'} encore manquante${count > 1 ? 's' : ''}.`,
          speechWolof: `Fi lay wone ñaatay natt yoo wara bind. Fi, ${count} natt ñoo manke.`,
          stepCategory: 'info'
        });

        // Add missing keys
        context.missingKeys.forEach((key, index) => {
          let speechFr = `Voici une mesure manquante requise pour le modèle. Vous pouvez cliquer sur ce bouton pour retourner à sa saisie.`;
          let speechWolof = `Natt bi dafa manke. Mën nga ko bëss ngir dellu bind ko.`;
          
          if (key === 'neck_circumference') {
            speechFr = "Première mesure manquante : le Tour de Cou, également appelé Tour de Cou ou Col. Cette mesure est obligatoire pour le modèle sélectionné. Vous pouvez sélectionner cette mesure pour revenir à son emplacement de saisie et compléter sa valeur.";
            speechWolof = "Natt bu njëkk bi manke mooy Tour de Cou. Mën nga ko bëss ngir dellu bind ko.";
          } else if (key === 'chest_circumference') {
            speechFr = "Deuxième mesure manquante : le Tour de Poitrine. Elle est nécessaire pour déterminer correctement les dimensions du vêtement au niveau du buste.";
            speechWolof = "Natt ñaareel bi manke mooy Tour de Poitrine.";
          } else if (key === 'shoulder_to_shoulder') {
            speechFr = "Troisième mesure manquante : la Carrure, ou mesure Épaule à Épaule.";
            speechWolof = "Natt ñetteel bi mooy Carrure.";
          } else if (key === 'sleeve_length') {
            speechFr = "Quatrième mesure manquante : la Longueur de Manche.";
            speechWolof = "Ñeenteel bi mooy Longueur de Manche.";
          } else if (key === 'shirt_length') {
            speechFr = "Cinquième mesure manquante : la Longueur de Veste ou de Chemise.";
            speechWolof = "Juróomeel bi mooy Longueur de Chemise.";
          } else if (key === 'waist_circumference') {
            speechFr = "Sixième mesure manquante : le Tour de Taille ou Ceinture.";
            speechWolof = "Juróom benneel bi mooy Tour de Taille.";
          } else if (key === 'hip_circumference') {
            speechFr = "Septième mesure manquante : le Tour de Hanches.";
            speechWolof = "Juróom ñaareel bi mooy Tour de Hanches.";
          } else if (key === 'outseam') {
            speechFr = "Huitième mesure manquante : la Longueur de Pantalon ou de Jupe.";
            speechWolof = "Juróom ñetteel bi mooy Longueur de Pantalon.";
          } else if (key === 'inseam') {
            speechFr = "Neuvième mesure manquante : la Longueur Entrejambe.";
            speechWolof = "Juróom ñeenteel bi mooy Longueur Entrejambe.";
          } else {
            speechFr = `Mesure manquante : ${key}. Elle est nécessaire pour la confection.`;
            speechWolof = `Natt bi manke mooy ${key}.`;
          }

          dynamicSteps.push({
            stepNumber: currentStepNum++,
            title: `${currentStepNum - 1}. Mesure manquante : ${key}`,
            description: `Mesure manquante ${index + 1}.`,
            targetAcomId: `add_client.missing_measure_${key}`,
            actionToPerform: 'observe',
            speechFr,
            speechWolof,
            stepCategory: 'info'
          });
        });
      }

      if (context.alerts.length > 0) {
        dynamicSteps.push({
          stepNumber: currentStepNum++,
          title: `${currentStepNum - 1}. Section « Avertissements & Recommandations »`,
          description: 'En-tête des avertissements.',
          targetAcomId: 'add_client.warnings_header',
          actionToPerform: 'observe',
          speechFr: "Cette section détaille les raisons pour lesquelles chaque mesure est considérée comme manquante et indique ce qui doit être corrigé avant de poursuivre.",
          speechWolof: "Section lii dafay wone lu tax natt yi manke.",
          stepCategory: 'info'
        });

        // Add warnings
        context.alerts.forEach((alert, index) => {
          let speechFr = `${alert.message} ${alert.recommendation}`;
          let speechWolof = `Avertissement ngir ${alert.fieldLabel}.`;

          if (alert.fieldKey === 'neck_circumference') {
            speechFr = "Le Tour de Cou est obligatoire et doit être renseigné avant de pouvoir valider l'atelier.";
          } else if (alert.fieldKey === 'chest_circumference') {
            speechFr = "Le Tour de Poitrine est également obligatoire pour ce modèle.";
          } else if (alert.fieldKey === 'shoulder_to_shoulder') {
            speechFr = "La Carrure doit être renseignée pour permettre au système de vérifier correctement le patron et les proportions du vêtement. À l'étape précédente, vous avez saisi les mesures du client. Cette étape vérifie maintenant que toutes les mesures nécessaires au modèle sont présentes et exploitables.";
          }

          dynamicSteps.push({
            stepNumber: currentStepNum++,
            title: `${currentStepNum - 1}. Avertissement ${index + 1}`,
            description: `Avertissement ${index + 1}.`,
            targetAcomId: `add_client.warning_${index}`,
            actionToPerform: 'observe',
            speechFr,
            speechWolof,
            stepCategory: 'info'
          });
        });
      }

      // Insert dynamic steps after reference_model
      newSteps.splice(refIndex + 1, 0, ...dynamicSteps);
      
      // Renumber subsequent steps
      let finalStepNum = currentStepNum;
      for (let i = refIndex + 1 + dynamicSteps.length; i < newSteps.length; i++) {
        // Just increment for all following steps
        newSteps[i].stepNumber = finalStepNum++;
        newSteps[i].title = `${newSteps[i].stepNumber}. ${newSteps[i].title.split('. ')[1] || newSteps[i].title}`;
      }

      COUTURE_ADD_CLIENT_TUTORIAL.steps = newSteps;
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
    // Couture / Tailleur tabs
    if (this.activeModal === 'couture.create_order_modal' || this.activeModal === 'couture_create_order_modal') {
      return COUTURE_CREATE_ORDER_TUTORIAL;
    }
    if (this.activeModal === 'couture.tissu_modal' || this.activeModal === 'couture_tissu_modal') {
      return COUTURE_TEXTILE_FORM_TUTORIAL;
    }
    if (this.activeModal === 'couture.boutique_modal' || this.activeModal === 'couture_boutique_modal') {
      return COUTURE_BOUTIQUE_FORM_TUTORIAL;
    }
    if (this.activeModal === 'couture.gallery_model_modal' || this.activeModal === 'inspirations.model_modal' || this.activeModal === 'couture_gallery_model_modal') {
      return COUTURE_GALLERY_MODEL_FORM_TUTORIAL;
    }
    if (pageId === 'tailleur_clients' || pageId === 'clients-couture' || pageId === 'clients') {
      return COUTURE_CLIENTS_TUTORIAL;
    }
    if (pageId === 'tailleur_orders' || pageId === 'commandes-mesures' || pageId === 'orders') {
      if (this.ordersViewMode === 'timeline') {
        return COUTURE_ORDERS_PLANNING_TUTORIAL;
      }
      if (this.ordersViewMode === 'campaigns') {
        return COUTURE_ORDERS_CAMPAIGNS_TUTORIAL;
      }
      return COUTURE_ORDERS_TUTORIAL;
    }
    if (pageId === 'tailleur_tissus' || pageId === 'tissus-wax' || pageId === 'textiles') {
      return COUTURE_TEXTILES_TUTORIAL;
    }
    if (pageId === 'tailleur_boutique' || pageId === 'boutique-pret-a-porter') {
      return COUTURE_READY_TO_WEAR_TUTORIAL;
    }
    if (pageId === 'tailleur_gallery' || pageId === 'inspirations-moodboards' || pageId === 'moodboards') {
      return COUTURE_INSPIRATIONS_TUTORIAL;
    }
    if (pageId === 'tailleur_artisans' || pageId === 'artisans-equipe' || pageId === 'artisans') {
      return COUTURE_ARTISANS_TUTORIAL;
    }
    return undefined;
  }

  public onModalOpened(modalId: string): void {
    this.activeModal = modalId;
    if (modalId === 'couture.artisan_modal' || modalId === 'couture_artisan_modal') {
      this.currentScenario = COUTURE_ARTISAN_FORM_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    } else if (modalId === 'stock.reorder_modal' || modalId === 'stock_reorder_modal') {
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
    } else if (modalId === 'couture.add_client_modal' || modalId === 'smart_measurement_modal' || modalId === 'couture_add_client_modal') {
      this.currentScenario = COUTURE_ADD_CLIENT_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(1, 'immediate');
    } else if (modalId === 'couture.create_order_modal' || modalId === 'couture_create_order_modal') {
      this.currentScenario = COUTURE_CREATE_ORDER_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    } else if (modalId === 'couture.tissu_modal' || modalId === 'couture_tissu_modal') {
      this.currentScenario = COUTURE_TEXTILE_FORM_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    } else if (modalId === 'couture.boutique_modal' || modalId === 'couture_boutique_modal') {
      this.currentScenario = COUTURE_BOUTIQUE_FORM_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    } else if (modalId === 'couture.gallery_model_modal' || modalId === 'inspirations.model_modal' || modalId === 'couture_gallery_model_modal') {
      this.currentScenario = COUTURE_GALLERY_MODEL_FORM_TUTORIAL;
      this.isActive = true;
      this.isFunctionChooserVisible = false;
      this.requestTutorialStep(0, 'immediate');
    }
  }

  public onModalClosed(modalId: string): void {
    if (this.activeModal === modalId) {
      this.activeModal = null;
    }
    if (modalId === 'couture.create_order_modal' || modalId === 'couture_create_order_modal') {
      if (this.isActive && this.currentScenario?.id === 'couture.orders.create-order') {
        this.currentScenario = COUTURE_ORDERS_TUTORIAL;
        this.requestTutorialStep(0, 'immediate');
      }
    } else if (modalId === 'couture.tissu_modal' || modalId === 'couture_tissu_modal') {
      if (this.isActive && this.currentScenario?.id === 'couture.tissu.form') {
        this.currentScenario = COUTURE_TEXTILES_TUTORIAL;
        this.requestTutorialStep(0, 'immediate');
      }
    } else if (modalId === 'couture.boutique_modal' || modalId === 'couture_boutique_modal') {
      if (this.isActive && this.currentScenario?.id === 'couture_tutorial_boutique_form') {
        this.currentScenario = COUTURE_READY_TO_WEAR_TUTORIAL;
        this.requestTutorialStep(0, 'immediate');
      }
    } else if (modalId === 'couture.gallery_model_modal' || modalId === 'inspirations.model_modal' || modalId === 'couture_gallery_model_modal') {
      if (this.isActive && (this.currentScenario?.id === 'couture_tutorial_gallery_model_form' || this.currentScenario?.id === 'couture.gallery_model_modal')) {
        this.currentScenario = COUTURE_INSPIRATIONS_TUTORIAL;
        this.requestTutorialStep(0, 'immediate');
      }
    } else if (modalId === 'couture.artisan_modal' || modalId === 'couture_artisan_modal') {
      if (this.isActive && this.currentScenario?.id === 'couture_tutorial_artisan_form') {
        this.currentScenario = COUTURE_ARTISANS_TUTORIAL;
        this.requestTutorialStep(0, 'immediate');
      }
    } else if (modalId === 'couture.add_client_modal' || modalId === 'smart_measurement_modal' || modalId === 'couture_add_client_modal') {
      if (this.isActive && this.currentScenario?.id === 'couture.clients.add-client') {
        this.requestTutorialStep(42, 'immediate'); // Jump to step index 42 (Step 43: Confirmation & Fiche Enregistrée)
      }
    } else if (modalId === 'stock.reorder_modal' || modalId === 'stock_reorder_modal') {
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
    const activeSaas = ContextEngine.getContext().activeSaaS || 'couture';
    const scenario = this.getScenarioForPage(pageId, activeSaas);

    if (scenario) {
      this.isWaitingForTab = false;
      this.waitingMessage = null;
      // If tutorial is active or scenario changes, switch to it seamlessly
      if (this.currentScenario?.id !== scenario.id || this.isActive) {
        this.startTutorial(scenario, 0);
      }
    } else if (this.isWaitingForTab) {
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
    this.explainedElements.clear();

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
    if (targetAcomId.startsWith('inspirations.modal_') || targetAcomId === 'inspirations.modal_title' || targetAcomId === 'inspirations.modal_photo_section' || targetAcomId === 'inspirations.modal_image_dropzone') {
      this.currentScenario = COUTURE_GALLERY_MODEL_FORM_TUTORIAL;
      this.isActive = true;
      const modalIdx = COUTURE_GALLERY_MODEL_FORM_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(modalIdx !== -1 ? modalIdx : 0);
      return;
    }

    if (targetAcomId.startsWith('inspirations.')) {
      this.currentScenario = COUTURE_INSPIRATIONS_TUTORIAL;
      this.isActive = true;
      const inspIdx = COUTURE_INSPIRATIONS_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(inspIdx !== -1 ? inspIdx : 0);
      return;
    }

    if (targetAcomId.startsWith('boutique.modal_') || targetAcomId === 'boutique.modal_title') {
      this.currentScenario = COUTURE_BOUTIQUE_FORM_TUTORIAL;
      this.isActive = true;
      const modalIdx = COUTURE_BOUTIQUE_FORM_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(modalIdx !== -1 ? modalIdx : 0);
      return;
    }

    if (targetAcomId.startsWith('boutique.')) {
      this.currentScenario = COUTURE_READY_TO_WEAR_TUTORIAL;
      this.isActive = true;
      const bIdx = COUTURE_READY_TO_WEAR_TUTORIAL.steps.findIndex(s => s.targetAcomId === targetAcomId);
      this.jumpToStepIndex(bIdx !== -1 ? bIdx : 0);
      return;
    }

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

  public onSmartAssistantStepChange(stepNumber: number): void {
    if (!this.isActive || this.currentScenario?.id !== 'couture.clients.add-client') return;
    
    // Find the step where targetAcomId matches the step_tab
    const targetAcomId = `add_client.step_tab_${stepNumber}`;
    const targetIndex = this.currentScenario.steps.findIndex(s => s.targetAcomId === targetAcomId);
    
    if (targetIndex !== -1) {
      this.jumpToStepIndex(targetIndex);
    }
  }

  public onGarmentSelected(garmentName: string, category: string, mandatoryCount: number, optionalCount: number): void {
    if (!this.isActive || this.currentScenario?.id !== 'couture.clients.add-client') return;
    const narrationText = `Vous avez sélectionné le modèle ${garmentName} (${category}). Ce vêtement nécessite ${mandatoryCount} mesures obligatoires et ${optionalCount} mesures optionnelles.`;
    this.enqueueNarration({
      id: `garment_selected_${garmentName}`,
      text: narrationText,
      lang: 'fr',
      priority: 'immediate',
      targetAcomId: 'add_client.garment_selector'
    });
  }

  public onMeasurementSelected(fieldKey: string, fieldLabel: string, isMandatory: boolean): void {
    if (!this.isActive || this.currentScenario?.id !== 'couture.clients.add-client') return;
    const targetAcomId = `measurement.${fieldKey}`;
    const statusText = isMandatory ? 'Mesure obligatoire pour la coupe exacte de cette tenue.' : 'Mesure optionnelle pour ajustement de confort.';
    const narrationText = `Saisie de la mesure : ${fieldLabel}. ${statusText} Renseignez la valeur en centimètres.`;
    this.enqueueNarration({
      id: `measurement_focus_${fieldKey}`,
      text: narrationText,
      lang: 'fr',
      priority: 'immediate',
      targetAcomId
    });
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
