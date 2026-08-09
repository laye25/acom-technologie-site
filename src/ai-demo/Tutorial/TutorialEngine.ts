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
  description: 'Supervision journalière, rapprochement financier et clôture définitive de caisse avec notification automatique.',
  saasModule: 'pressing',
  estimatedDurationSec: 180,
  steps: [
    {
      stepNumber: 1,
      title: '1. Clôture de Caisse & Rapport Journalier',
      description: 'Supervision journalière & rapprochement financier. Nous allons effectuer la clôture de caisse de la journée. Vérifiez les informations affichées avant de valider définitivement la caisse.',
      targetAcomId: 'pressing.cash_closure.header',
      actionToPerform: 'observe',
      speechFr: 'Nous allons effectuer la clôture de caisse de la journée. Vérifiez les informations affichées avant de valider définitivement la caisse.',
      speechWolof: 'Dalal ak jamm ci clôture de caisse bi. Saytul xibaar yi laata ngay verrouillé caisse bi.',
      stepCategory: 'info'
    },
    {
      stepNumber: 2,
      title: '2. Date de Clôture',
      description: 'Vérifiez la date de la clôture. Elle doit correspondre à la journée que vous souhaitez clôturer.',
      targetAcomId: 'pressing.cash_closure.date',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez la date de la clôture. Elle doit correspondre à la journée que vous souhaitez clôturer.',
      speechWolof: 'Séétal date bi mu méngook biss bi nga bëgg clôturer.',
      stepCategory: 'control'
    },
    {
      stepNumber: 3,
      title: '3. Recettes Pressing (+)',
      description: 'Cette zone présente les recettes générées par l\'activité pressing pour la journée. Vérifiez le montant affiché.',
      targetAcomId: 'pressing.cash_closure.press_value',
      actionToPerform: 'observe',
      speechFr: 'Cette zone présente les recettes générées par l\'activité pressing pour la journée. Vérifiez le montant affiché.',
      speechWolof: 'Fi mooy xaalis bi activité pressing bi indi ci biss bi. Xoolal montant bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 4,
      title: '4. Ventes Produits (+)',
      description: 'Cette zone présente les ventes de produits réalisées pendant la journée. Vérifiez le montant et le nombre de ventes affichés.',
      targetAcomId: 'pressing.cash_closure.product_sales',
      actionToPerform: 'observe',
      speechFr: 'Cette zone présente les ventes de produits réalisées pendant la journée. Vérifiez le montant et le nombre de ventes affichés.',
      speechWolof: 'Fi mooy jaay détergent ak produit yi ci boutique bi. Saytul montant bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 5,
      title: '5. Dépenses du Jour (-)',
      description: 'Vérifiez les dépenses enregistrées pour la journée ainsi que les justificatifs associés.',
      targetAcomId: 'pressing.cash_closure.expenses',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez les dépenses enregistrées pour la journée ainsi que les justificatifs associés.',
      speechWolof: 'Xoolal dépense yi ngeen bind tay ak justificatif yi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 6,
      title: '6. Chiffre d\'Affaires Théorique Attendu',
      description: 'Vérifiez le chiffre d\'affaires théorique attendu avant de compter les espèces présentes dans la caisse.',
      targetAcomId: 'pressing.cash_closure.expected_revenue',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez le chiffre d\'affaires théorique attendu avant de compter les espèces présentes dans la caisse.',
      speechWolof: 'Saytul chiffre d\'affaires théorique bi attendu laata ngay compté xaliss bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 7,
      title: '7. Nom du Caissier / Opérateur',
      description: 'Renseignez le nom du caissier ou de l\'opérateur responsable de cette caisse.',
      targetAcomId: 'pressing.cash_closure.cashier',
      actionToPerform: 'type',
      inputValue: 'Kouamé Marc',
      speechFr: 'Renseignez le nom du caissier ou de l\'opérateur responsable de cette caisse.',
      speechWolof: 'Bindal touru caissier bi wala opérateur bi responsable ci caisse bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: '8. Espèces Réelles Comptées (+ FCFA)',
      description: 'Comptez physiquement les espèces présentes dans la caisse, puis saisissez le montant réel compté en francs CFA.',
      targetAcomId: 'pressing.cash_closure.real_cash',
      actionToPerform: 'type',
      inputValue: '10500',
      speechFr: 'Comptez physiquement les espèces présentes dans la caisse, puis saisissez le montant réel compté en francs CFA.',
      speechWolof: 'Waññal xaliss bi nekk ci caisse bi, nga bind montant réel bi fi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 9,
      title: '9. Observations / Justificatifs',
      description: 'Ajoutez ici une observation ou un justificatif si vous devez expliquer un écart ou une dépense particulière.',
      targetAcomId: 'pressing.cash_closure.observations',
      actionToPerform: 'type',
      inputValue: 'Écart de caisse justifié par la petite monnaie',
      speechFr: 'Ajoutez ici une observation ou un justificatif si vous devez expliquer un écart ou une dépense particulière.',
      speechWolof: 'Yokkal observation wala explication bu fekké am na écart wala dépense.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 10,
      title: '10. Contrôle Final & Rapprochement',
      description: 'Vérifiez la date, le caissier, le montant théorique, les espèces réellement comptées et les éventuelles observations avant de verrouiller la caisse.',
      targetAcomId: 'pressing.cash_closure.form_card',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez la date, le caissier, le montant théorique, les espèces réellement comptées et les éventuelles observations avant de verrouiller la caisse.',
      speechWolof: 'Saytul date bi, caissier bi, montant attendu bi ak xaliss réel bi laata ngay tëj caisse bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 11,
      title: '11. Valider & Verrouiller la Caisse',
      description: 'Lorsque toutes les informations sont correctes, cliquez sur Valider et verrouiller la caisse pour clôturer définitivement la journée.',
      targetAcomId: 'pressing.cash_closure.validate',
      actionToPerform: 'click',
      speechFr: 'Lorsque toutes les informations sont correctes, cliquez sur Valider et verrouiller la caisse pour clôturer définitivement la journée.',
      speechWolof: 'Soo paré, bëssal ci Valider & Verrouiller la Caisse ngir tëj caisse bi.',
      expectedEvent: 'CASH_REGISTER_CLOSED',
      stepCategory: 'final'
    },
    {
      stepNumber: 12,
      title: '12. Clôture Validée — E-mail & WhatsApp',
      description: 'La clôture de caisse a été validée et le rapport transmis par e-mail au Gérant. Cliquez sur D\'accord pour terminer le tutoriel.',
      targetAcomId: 'alert-confirm-btn',
      actionToPerform: 'click',
      speechFr: 'La clôture de caisse est validée. Cliquez sur D\'accord pour terminer le tutoriel.',
      speechWolof: 'Clôture de caisse bi validé na. Bëssal ci D\'ACCORD ci alerte bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 13,
      title: '13. Historique des Clôtures Journalières',
      description: 'L\'historique permet de retrouver les clôtures journalières précédemment enregistrées.',
      targetAcomId: 'pressing.cash_closure.history',
      actionToPerform: 'observe',
      speechFr: 'L\'historique permet de retrouver les clôtures journalières précédemment enregistrées.',
      speechWolof: 'Ci historique bi mën nga fi giss yeneen clôture journalière yi passée.',
      isOptional: true,
      stepCategory: 'info'
    }
  ]
};

/**
 * Golden Reference: Pressing - Comptabilité / Nouvelle Dépense
 */
export const PRESSING_ACCOUNTING_TUTORIAL: TutorialScenario = {
  id: 'pressing_tutorial_accounting',
  title: 'Comptabilité / Nouvelle Dépense',
  description: 'Enregistrement d\'une nouvelle dépense manuelle, notification au gérant et intégration dans les données comptables et le flux de trésorerie de l\'atelier.',
  saasModule: 'pressing',
  estimatedDurationSec: 180,
  steps: [
    {
      stepNumber: 1,
      title: '1. Comptabilité & Nouvelle Dépense',
      description: 'Nous allons enregistrer une nouvelle dépense. Cliquez sur le bouton Nouvelle dépense pour ouvrir le formulaire.',
      targetAcomId: 'accounting.btn.new_expense',
      actionToPerform: 'click',
      speechFr: 'Nous allons enregistrer une nouvelle dépense. Cliquez sur le bouton Nouvelle dépense pour ouvrir le formulaire.',
      speechWolof: 'Ñu ngi waaj a bind dépense bu bees. Bëssal ci bouton Nouvelle dépense ngir ubbi formulaire bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 2,
      title: '2. Description / Intitulé',
      description: 'Saisissez la description ou l\'intitulé de la dépense. Par exemple : facture Senelec, loyer de l\'atelier ou transport coursier.',
      targetAcomId: 'accounting.expense.title',
      actionToPerform: 'type',
      inputValue: 'Facture Senelec Janvier',
      speechFr: 'Saisissez la description ou l\'intitulé de la dépense. Par exemple : facture Senelec, loyer de l\'atelier ou transport coursier.',
      speechWolof: 'Bindal description bi wala turu dépense bi. Misaal : facture Senelec, loyer atelier bi wala transport.',
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Montant (FCFA)',
      description: 'Saisissez le montant de la dépense en francs CFA.',
      targetAcomId: 'accounting.expense.amount',
      actionToPerform: 'type',
      inputValue: '42500',
      speechFr: 'Saisissez le montant de la dépense en francs CFA.',
      speechWolof: 'Bindal montant dépense bi ci francs CFA.',
      stepCategory: 'required'
    },
    {
      stepNumber: 4,
      title: '4. Date de Dépense',
      description: 'Vérifiez ou sélectionnez la date à laquelle la dépense a été effectuée.',
      targetAcomId: 'accounting.expense.date',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez ou sélectionnez la date à laquelle la dépense a été effectuée.',
      speechWolof: 'Saytul wala nga tànn date bi dépense bi amé.',
      stepCategory: 'required'
    },
    {
      stepNumber: 5,
      title: '5. Catégorie Comptable',
      description: 'Sélectionnez la catégorie comptable correspondant à la dépense.',
      targetAcomId: 'accounting.expense.category_grid',
      actionToPerform: 'observe',
      speechFr: 'Sélectionnez la catégorie comptable correspondant à la dépense.',
      speechWolof: 'Tànnal catégorie comptable bi méngook dépense bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 6,
      title: '6. Mode de Paiement',
      description: 'Sélectionnez le mode de paiement utilisé pour cette dépense.',
      targetAcomId: 'accounting.expense.payment_methods',
      actionToPerform: 'observe',
      speechFr: 'Sélectionnez le mode de paiement utilisé pour cette dépense.',
      speechWolof: 'Tànnal ni nga fayé dépense bi (espèces, mobile money, carte, virement wala chèque).',
      stepCategory: 'required'
    },
    {
      stepNumber: 7,
      title: '7. Référence / Justificatif (Optionnel)',
      description: 'Si vous disposez d\'une référence ou d\'un justificatif, vous pouvez l\'indiquer ici.',
      targetAcomId: 'accounting.expense.reference',
      actionToPerform: 'type',
      inputValue: 'REC-2026-08',
      isOptional: true,
      speechFr: 'Si vous disposez d\'une référence ou d\'un justificatif, vous pouvez l\'indiquer ici.',
      speechWolof: 'Soo amé numéro référence wala reçu, mën nga ko bind fi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 8,
      title: '8. Description / Justification (Optionnel)',
      description: 'Ajoutez ici, si nécessaire, des détails permettant d\'expliquer ou de justifier la dépense.',
      targetAcomId: 'accounting.expense.description',
      actionToPerform: 'type',
      inputValue: 'Règlement consommation compteur atelier',
      isOptional: true,
      speechFr: 'Ajoutez ici, si nécessaire, des détails permettant d\'expliquer ou de justifier la dépense.',
      speechWolof: 'Yokkal fi ay leral wala explication ngir justifier dépense bi.',
      stepCategory: 'optional'
    },
    {
      stepNumber: 9,
      title: '9. Contrôle Final & Vérification',
      description: 'Vérifiez les informations saisies avant d\'enregistrer la dépense et de notifier le gérant.',
      targetAcomId: 'accounting.expense.form_card',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez les informations saisies avant d\'enregistrer la dépense et de notifier le gérant.',
      speechWolof: 'Saytul lepp loo bind laata ngay valider dépense bi ak yëgle gérant bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 10,
      title: '10. Enregistrer la Dépense & Notifier',
      description: 'Cliquez sur Enregistrer la dépense et Notifier pour enregistrer cette dépense et transmettre l\'information au gérant.',
      targetAcomId: 'accounting.expense.submit_btn',
      actionToPerform: 'click',
      speechFr: 'Cliquez sur Enregistrer la dépense et Notifier pour enregistrer cette dépense et transmettre l\'information au gérant.',
      speechWolof: 'Bëssal ci Enregistrer la dépense & Notifier ngir denc dépense bi te yëgle ko gérant bi.',
      expectedEvent: 'EXPENSE_CREATED',
      stepCategory: 'final'
    },
    {
      stepNumber: 11,
      title: '11. Dépense Enregistrée — Suivi Gérant',
      description: 'La dépense a été enregistrée et le suivi du gérant a été déclenché. Cliquez sur D\'accord pour continuer.',
      targetAcomId: 'alert-confirm-btn',
      actionToPerform: 'click',
      speechFr: 'La dépense a été enregistrée et le suivi du gérant a été déclenché. Cliquez sur D\'accord pour continuer.',
      speechWolof: 'Dépense bi denc nañu ko te yëgle nañu gérant bi. Bëssal ci D\'accord ngir wéy.',
      stepCategory: 'control'
    },
    {
      stepNumber: 12,
      title: '12. Charges Totales & Dépenses Générales',
      description: 'La dépense enregistrée est maintenant intégrée aux données comptables de l\'atelier.',
      targetAcomId: 'accounting.kpi.charges_totales',
      actionToPerform: 'observe',
      speechFr: 'La dépense enregistrée est maintenant intégrée aux données comptables de l\'atelier.',
      speechWolof: 'Dépense bi nga bind duggu na léegi ci comptabilité ak bilan atelier bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 13,
      title: '13. Flux de Trésorerie & Filtres',
      description: 'Vous pouvez consulter toutes les opérations de trésorerie ou filtrer uniquement les dépenses générales.',
      targetAcomId: 'accounting.filters_row',
      actionToPerform: 'observe',
      speechFr: 'Vous pouvez consulter toutes les opérations de trésorerie ou filtrer uniquement les dépenses générales.',
      speechWolof: 'Mën nga seet lepp lu ëpp ci trésorerie bi wala nga filtre dépenses générales rekk.',
      stepCategory: 'info'
    },
    {
      stepNumber: 14,
      title: '14. Tableau des Dépenses & Ligne Enregistrée',
      description: 'Vérifiez que la dépense apparaît bien dans le tableau avec sa description, sa catégorie, sa date et son montant.',
      targetAcomId: 'accounting.outflows_table',
      actionToPerform: 'observe',
      speechFr: 'Vérifiez que la dépense apparaît bien dans le tableau avec sa description, sa catégorie, sa date et son montant.',
      speechWolof: 'Saytul ni dépense bi fésé ci tableau bi ak turam, catégorie bi, date bi ak montant bi.',
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

class TutorialEngineService {
  private currentScenario: TutorialScenario | null = null;
  private currentStepIndex = -1;
  private isActive = false;
  private isWaitingForTab = false;
  private waitingMessage: string | null = null;
  private waitingSaas = 'pressing';
  private unsubscribeEventBus: (() => void) | null = null;
  private listeners: Set<() => void> = new Set();

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

  public startTutorialSelection(saasModule: string = 'pressing'): void {
    if (this.isActive) {
      this.stopTutorial();
    }
    this.isWaitingForTab = true;
    this.waitingSaas = saasModule;
    this.waitingMessage = "Sélectionnez l'onglet de la page sur laquelle vous souhaitez lancer le tutoriel.";

    LanguageEngine.speak(this.waitingMessage, 'fr');
    this.notify();
  }

  public cancelTabSelection(): void {
    this.isWaitingForTab = false;
    this.waitingMessage = null;
    LanguageEngine.stopSpeech();
    this.notify();
  }

  public isWaitingForTabSelection(): boolean {
    return this.isWaitingForTab;
  }

  public getWaitingMessage(): string | null {
    return this.waitingMessage;
  }

  public getScenarioForPage(pageId: string): TutorialScenario | undefined {
    if (pageId === 'dashboard' || pageId === 'apercu' || pageId === 'pressing_dashboard') {
      return PRESSING_DASHBOARD_TUTORIAL;
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
    if (pageId === 'pressing_closure') {
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
    return undefined;
  }

  public async onPageSelected(pageId: string): Promise<void> {
    if (!this.isWaitingForTab) return;

    const pageDef = SaaSPageRegistry.getPage(pageId);
    if (pageDef) {
      const scenario = this.getScenarioForPage(pageId);
      if (scenario) {
        this.isWaitingForTab = false;
        this.waitingMessage = null;
        this.notify();

        const annonce = `${pageDef.name} détectée. Le tutoriel va commencer.`;
        try {
          await LanguageEngine.speak(annonce, 'fr');
        } catch {}

        this.startTutorial(scenario);
      } else {
        const msg = "Cette page est bien reconnue, mais son tutoriel n'est pas encore disponible. Sélectionnez un autre onglet.";
        this.waitingMessage = msg;
        LanguageEngine.speak(msg, 'fr');
        this.notify();
      }
    } else {
      const msg = "Cette page n'est pas encore reconnue pour le tutoriel. Sélectionnez un autre onglet.";
      this.waitingMessage = msg;
      LanguageEngine.speak(msg, 'fr');
      this.notify();
    }
  }

  public startTutorial(scenario: TutorialScenario = PRESSING_GOLDEN_TUTORIAL): void {
    this.isWaitingForTab = false;
    this.waitingMessage = null;
    this.currentScenario = scenario;
    this.currentStepIndex = 0;
    this.isActive = true;

    // Listen to business events
    if (this.unsubscribeEventBus) this.unsubscribeEventBus();
    this.unsubscribeEventBus = EventBus.subscribe('*', (event) => {
      this.handleBusinessEvent(event.type);
    });

    this.speakCurrentStep();
    this.notify();
  }

  public stopTutorial(): void {
    this.isActive = false;
    this.isWaitingForTab = false;
    this.waitingMessage = null;
    this.currentStepIndex = -1;
    this.currentScenario = null;
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
      this.currentStepIndex++;
      this.speakCurrentStep();
      this.notify();
    } else {
      // Completed!
      LanguageEngine.speak("Félicitations ! Vous avez terminé le tutoriel guidé Acom IA.", "fr");
      this.stopTutorial();
    }
  }

  public prevStep(): void {
    if (!this.currentScenario || !this.isActive) return;
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.speakCurrentStep();
      this.notify();
    }
  }

  public skipStep(): void {
    this.nextStep();
  }

  private handleBusinessEvent(eventType: string): void {
    const currentStep = this.getCurrentStep();
    if (currentStep && currentStep.expectedEvent === eventType) {
      // Event matched expected step! Automatically progress to next step
      setTimeout(() => {
        this.nextStep();
      }, 1000);
    }
  }

  private speakCurrentStep(): void {
    const step = this.getCurrentStep();
    if (step) {
      LanguageEngine.speak(step.speechFr, 'fr');
    }
  }
}

export const TutorialEngine = new TutorialEngineService();
