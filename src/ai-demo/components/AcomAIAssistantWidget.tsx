// src/ai-demo/components/AcomAIAssistantWidget.tsx
// Embedded & Floating AI Copilot Widget for Acom SaaS Management

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntentEngine } from '../Intelligence/IntentEngine';
import { ActionRouter } from '../SaaSGateway/ActionRouter';
import { ContextEngine } from '../Intelligence/ContextEngine';
import { LanguageEngine } from '../Assistant/LanguageEngine';
import { ConversationContext, ChatMessage } from '../Assistant/ConversationContext';
import { VoiceSessionManager, VoiceSessionInfo } from '../Assistant/VoiceSessionManager';
import { VoiceOrbIndicator } from './VoiceOrbIndicator';
import { TutorialEngine, COMMERCE_OVERVIEW_TUTORIAL } from '../Tutorial/TutorialEngine';
import { Mic, MicOff, Send, Sparkles, Volume2, Globe, Shield, RefreshCw, X, MessageSquare, Radio } from 'lucide-react';

interface WidgetProps {
  embedded?: boolean;
  onClose?: () => void;
}

export const AcomAIAssistantWidget: React.FC<WidgetProps> = ({ embedded = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [language, setLanguage] = useState<'fr' | 'wo'>('fr');
  const [voiceInfo, setVoiceInfo] = useState<VoiceSessionInfo>(VoiceSessionManager.getInfo());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = ConversationContext.subscribe(() => {
      setMessages(ConversationContext.getMessages());
      setLanguage(ConversationContext.getLanguage());
    });
    setMessages(ConversationContext.getMessages());
    setLanguage(ConversationContext.getLanguage());

    const unsubVoice = VoiceSessionManager.subscribe((info) => {
      setVoiceInfo(info);
    });

    return () => {
      unsub();
      unsubVoice();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendPrompt = async (promptToUse?: string) => {
    const text = (promptToUse || inputText).trim();
    if (!text || isProcessing) return;

    setInputText('');
    ConversationContext.addUserMessage(text);
    setIsProcessing(true);

    try {
      const context = ContextEngine.getContext();
      const lowerText = text.toLowerCase().trim();

      // Contextual Question 1: Where am I? ("Où suis-je ?")
      if (lowerText.includes('où suis-je') || lowerText.includes('ou suis je') || lowerText.includes('ou suis-je')) {
        const pageDef = ContextEngine.getActivePageDefinition();
        const msgFr = `Vous êtes actuellement dans le SaaS ${context.merchantName} (${context.activeSaaS.toUpperCase()}), sur la page "${pageDef?.name || context.currentPage}". Purpose: ${pageDef?.purpose || 'Gestion opérationnelle'}.`;
        const msgWo = `Yangi nekk ci SaaS ${context.merchantName} (${context.activeSaaS.toUpperCase()}), ci xët "${pageDef?.name || context.currentPage}".`;
        
        ConversationContext.addAssistantMessage(msgFr, msgWo, 'context.whereAmI', 'success');
        LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
        setIsProcessing(false);
        return;
      }

      // Global Voice Controls for Active Tutorial
      if (TutorialEngine.isTutorialActive()) {
        if (lowerText === 'pause' || lowerText.includes('mettre en pause')) {
          TutorialEngine.pauseNarration();
          const msgFr = "Narration vocale mise en pause.";
          const msgWo = "Narration vocale paused.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.pause', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('reprends') || lowerText.includes('reprendre') || lowerText.includes('continuer')) {
          TutorialEngine.resumeNarration();
          const msgFr = "Reprise de la narration vocale.";
          const msgWo = "Reprise de la narration vocale.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.resume', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('répète') || lowerText.includes('repete') || lowerText.includes('répéter') || lowerText.includes('repeter') || lowerText.includes('explique encore')) {
          TutorialEngine.repeatCurrentStep();
          const msgFr = "Répétition de l'explication vocale.";
          const msgWo = "Répétition de l'explication vocale.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.repeat', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('plus lentement') || lowerText.includes('lentement')) {
          LanguageEngine.setSpeechRate(0.85);
          TutorialEngine.repeatCurrentStep();
          const msgFr = "Lecture de l'explication avec vitesse réduite.";
          const msgWo = "Lecture avec vitesse réduite.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.slower', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('suivant') || lowerText.includes('suite') || lowerText.includes('passe à la suite') || lowerText.includes('étape suivante')) {
          TutorialEngine.nextStep();
          const msgFr = "Passage à l'étape suivante.";
          const msgWo = "Dem ci étape bi ci téweul.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.next', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('précédent') || lowerText.includes('precedent') || lowerText.includes('étape précédente')) {
          TutorialEngine.prevStep();
          const msgFr = "Retour à l'étape précédente.";
          const msgWo = "Delu ci étape bi passé.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.prev', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('arrête la présentation') || lowerText.includes('arrete la presentation') || lowerText.includes('quitter le tutoriel')) {
          TutorialEngine.stopTutorial();
          const msgFr = "Tutoriel guidé arrêté.";
          const msgWo = "Tutoriel arrēté.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.stop', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText === 'arrête' || lowerText === 'arrete' || lowerText === 'stop') {
          TutorialEngine.stopNarration();
          const msgFr = "Narration vocale arrêtée.";
          const msgWo = "Narration arrêtée.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.stopNarration', 'success');
          setIsProcessing(false);
          return;
        }
      }

      // Contextual Stock & Billing Tutorial Intents
      const currentScenario = TutorialEngine.getCurrentScenario();
      const isReorderModalActive = currentScenario?.id === 'commerce_reorder_po_tutorial' || TutorialEngine.getActiveModal() === 'stock.reorder_modal' || TutorialEngine.getActiveModal() === 'stock_reorder_modal';
      const isInventorySheetModalActive = currentScenario?.id === 'commerce_inventory_sheet_tutorial';
      const isAdjustmentModalActive = currentScenario?.id === 'commerce_stock_adjustment_tutorial';
      const isSupplierModalActive = currentScenario?.id === 'commerce_new_supplier_modal_tutorial' || TutorialEngine.getActiveModal() === 'supplier.new_supplier_modal';
      const isQuoteModalActive = currentScenario?.id === 'commerce_billing_quote_modal_tutorial' || TutorialEngine.getActiveModal() === 'billing.quote_modal' || TutorialEngine.getActiveModal() === 'quote_modal';
      const isPrintModalActive = currentScenario?.id === 'commerce_billing_print_modal_tutorial' || TutorialEngine.getActiveModal() === 'billing.print_modal';

      if (isQuoteModalActive) {
        if (lowerText.includes('choisir un élément') || lowerText.includes('choisir un element') || lowerText.includes('choisir une fonction') || lowerText.includes('liste des fonctions')) {
          TutorialEngine.openFunctionChooser();
          const msgFr = "Menu des éléments de la fenêtre Nouveau Devis ouvert. Choisissez l'élément à découvrir.";
          const msgWo = "Menu u Nouveau Devis ubbeu na. Tannal élément bi nga bëgg xam.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.chooseFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('présentation complète') || lowerText.includes('presentation complete') || lowerText.includes('présenter cette fenêtre') || lowerText.includes('presenter cette fenetre') || lowerText.includes('présenter le devis') || lowerText.includes('presenter le devis') || lowerText.includes('tutoriel devis')) {
          TutorialEngine.startBillingQuoteModalTutorial(0);
          const msgFr = "Cette fenêtre permet de créer un nouveau devis commercial. Elle regroupe les informations du client, la durée de validité et les lignes d'articles.";
          const msgWo = "Fenêtre bi dafay mayé nga defar nouveau devis commercial bu bees.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.fullPresentation', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('titre') || lowerText.includes('nouveau devis')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.title');
          const msgFr = "Orientation vers le titre : Nouveau Devis (Étape 1).";
          const msgWo = "Dem nañu ci Titre Nouveau Devis.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('nom du client') || lowerText.includes('nom client') || (lowerText.includes('client') && !lowerText.includes('adresse'))) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.customer_name');
          const msgFr = "Orientation vers le champ : Nom complet du client (Étape 2).";
          const msgWo = "Dem nañu ci Nom complet client.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('téléphone') || lowerText.includes('telephone') || lowerText.includes('phone') || lowerText.includes('numéro') || lowerText.includes('numero')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.customer_phone');
          const msgFr = "Orientation vers le champ : Numéro de Téléphone (Étape 3).";
          const msgWo = "Dem nañu ci Numéro Téléphone.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('email') || lowerText.includes('mail') || lowerText.includes('courriel')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.customer_email');
          const msgFr = "Orientation vers le champ : Adresse Email (Étape 4).";
          const msgWo = "Dem nañu ci Adresse Email.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('adresse') || lowerText.includes('livraison') || lowerText.includes('localisation')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.customer_address');
          const msgFr = "Orientation vers le champ : Adresse / Localisation (Étape 5).";
          const msgWo = "Dem nañu ci Adresse client.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('validité') || lowerText.includes('validite') || lowerText.includes('jours') || lowerText.includes('durée') || lowerText.includes('duree')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.validity_days');
          const msgFr = "Orientation vers le champ : Validité de l'offre en jours (Étape 6).";
          const msgWo = "Dem nañu ci Validité de l'offre.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('articles') || lowerText.includes('lignes') || lowerText.includes('section articles') || lowerText.includes('tableau')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.items_section');
          const msgFr = "Orientation vers la section : Articles & Prestations du devis (Étape 7).";
          const msgWo = "Dem nañu ci Articles & Prestations.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('ajouter une ligne') || lowerText.includes('ajouter ligne') || lowerText.includes('ajouter un article') || lowerText.includes('bouton ajouter')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.add_item_btn');
          const msgFr = "Orientation vers le bouton : Ajouter une ligne (Étape 8).";
          const msgWo = "Dem nañu ci Bouton Ajouter une ligne.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('désignation') || lowerText.includes('designation') || lowerText.includes('première ligne') || lowerText.includes('premiere ligne') || lowerText.includes('prix unitaire') || lowerText.includes('quantité') || lowerText.includes('quantite')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.first_item_row');
          const msgFr = "Orientation vers : Ligne d'article détaillée (Étape 9).";
          const msgWo = "Dem nañu ci Ligne d'article.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('notes') || lowerText.includes('conditions') || lowerText.includes('modalités') || lowerText.includes('modalites') || lowerText.includes('remarques')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.notes_input');
          const msgFr = "Orientation vers le champ : Notes & Conditions particulières (Étape 10).";
          const msgWo = "Dem nañu ci Notes & Conditions particulières.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('total') || lowerText.includes('montant') || lowerText.includes('somme') || lowerText.includes('net à payer')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.total_card');
          const msgFr = "Orientation vers : Montant Total Estimé (Étape 11).";
          const msgWo = "Dem nañu ci Montant Total Estimé.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('annuler') || lowerText.includes('quitter') || lowerText.includes('fermer')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.cancel_btn');
          const msgFr = "Orientation vers le bouton : Annuler / Fermer (Étape 12).";
          const msgWo = "Dem nañu ci Bouton Annuler.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('enregistrer') || lowerText.includes('sauvegarder') || lowerText.includes('créer') || lowerText.includes('creer') || lowerText.includes('valider')) {
          TutorialEngine.jumpToAcomId('billing.quote_modal.save_btn');
          const msgFr = "Orientation vers le bouton : Enregistrer le devis (Étape 13).";
          const msgWo = "Dem nañu ci Enregistrer le devis.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }
      }

      if (isSupplierModalActive) {
        if (lowerText.includes('choisir un élément') || lowerText.includes('choisir un element') || lowerText.includes('choisir une fonction') || lowerText.includes('liste des fonctions')) {
          TutorialEngine.openFunctionChooser();
          const msgFr = "Menu des éléments de la fenêtre Nouveau Fournisseur ouvert. Choisissez l'élément à découvrir.";
          const msgWo = "Menu u Nouveau Fournisseur ubbeu na. Tannal élément bi nga bëgg xam.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.chooseFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('présentation complète') || lowerText.includes('presentation complete') || lowerText.includes('présenter cette fenêtre') || lowerText.includes('presenter cette fenetre') || lowerText.includes('présenter le formulaire') || lowerText.includes('presenter le formulaire')) {
          TutorialEngine.startNewSupplierModalTutorial(0);
          const msgFr = "Cette fenêtre permet de saisir les informations complètes d'un nouveau partenaire ou fournisseur logistique.";
          const msgWo = "Fenêtre bi dafay mayé nga bind leep lu jëm ci nouveau fournisseur wala partenaire logistique.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.fullPresentation', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('entreprise') || lowerText.includes('nom')) {
          TutorialEngine.jumpToAcomId('supplier.modal.name_input');
          const msgFr = "Orientation vers le champ : Nom de l'entreprise (Étape 2).";
          const msgWo = "Dem nañu ci Nom de l'entreprise.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('contact') || lowerText.includes('personne') || lowerText.includes('interlocuteur')) {
          TutorialEngine.jumpToAcomId('supplier.modal.contact_input');
          const msgFr = "Orientation vers le champ : Personne de contact (Étape 3).";
          const msgWo = "Dem nañu ci Personne de contact.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('téléphone') || lowerText.includes('telephone') || lowerText.includes('numéro') || lowerText.includes('numero') || lowerText.includes('phone')) {
          TutorialEngine.jumpToAcomId('supplier.modal.phone_input');
          const msgFr = "Orientation vers le champ : Téléphone (Étape 4).";
          const msgWo = "Dem nañu ci Numéro Téléphone.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('email') || lowerText.includes('mail') || lowerText.includes('courriel')) {
          TutorialEngine.jumpToAcomId('supplier.modal.email_input');
          const msgFr = "Orientation vers le champ : Email (Étape 5).";
          const msgWo = "Dem nañu ci Email.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('catégorie') || lowerText.includes('categorie') || lowerText.includes('secteur') || lowerText.includes('type')) {
          TutorialEngine.jumpToAcomId('supplier.modal.category_input');
          const msgFr = "Orientation vers le champ : Catégorie (Étape 6).";
          const msgWo = "Dem nañu ci Catégorie.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('annuler') || lowerText.includes('quitter') || lowerText.includes('fermer')) {
          TutorialEngine.jumpToAcomId('supplier.modal.cancel_btn');
          const msgFr = "Orientation vers le bouton : Annuler (Étape 7).";
          const msgWo = "Dem nañu ci Bouton Annuler.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('enregistrer') || lowerText.includes('sauvegarder') || lowerText.includes('valider') || lowerText.includes('ajouter')) {
          TutorialEngine.jumpToAcomId('supplier.modal.submit_btn');
          const msgFr = "Orientation vers le bouton : Enregistrer le fournisseur (Étape 8).";
          const msgWo = "Dem nañu ci Enregistrer le fournisseur.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }
      }

      if (isReorderModalActive) {
        if (lowerText.includes('choisir un élément') || lowerText.includes('choisir un element') || lowerText.includes('choisir une fonction') || lowerText.includes('liste des fonctions')) {
          TutorialEngine.openFunctionChooser();
          const msgFr = "Menu des éléments du Bon de Commande Fournisseur ouvert. Choisissez l'élément à découvrir.";
          const msgWo = "Menu u Bon de Commande Fournisseur ubbeu na. Tannal élément bi nga bëgg xam.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.chooseFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('présentation complète') || lowerText.includes('presentation complete') || lowerText.includes('présenter cette fenêtre') || lowerText.includes('presenter cette fenetre') || lowerText.includes('présenter le réassort') || lowerText.includes('presenter le reassort') || lowerText.includes('bon de commande')) {
          TutorialEngine.startReorderTutorial(0);
          const msgFr = "Cette fenêtre permet de préparer un bon de commande fournisseur pour réapprovisionner les articles en alerte ou en rupture de stock.";
          const msgWo = "Fenêtre bi dafay mayé nga defar bon de commande fournisseur pour réapprovisionner produit yi nek ci alerte wala rupture.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.fullPresentation', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('fournisseur') || lowerText.includes('fournisseurs')) {
          TutorialEngine.jumpToAcomId('stock.reorder_modal.supplier');
          const msgFr = "Orientation vers le cadre : Fournisseur (Étape 2).";
          const msgWo = "Dem nañu ci Fournisseur.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('alerte') || lowerText.includes('seuil') || lowerText.includes('message') || lowerText.includes('information')) {
          TutorialEngine.jumpToAcomId('stock.reorder_modal.alert_notice');
          const msgFr = "Orientation vers : Message d'information & Seuil d'alerte (Étape 3).";
          const msgWo = "Dem nañu ci Message d'information ak Seuil d'alerte.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('article') || lowerText.includes('articles') || lowerText.includes('liste')) {
          TutorialEngine.jumpToAcomId('stock.reorder_modal.section_articles');
          const msgFr = "Orientation vers la section : Articles à Commander (Étape 4).";
          const msgWo = "Dem nañu ci Articles à Commander.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('case') || lowerText.includes('cocher') || lowerText.includes('sélection') || lowerText.includes('selection')) {
          TutorialEngine.jumpToAcomId('stock.reorder_modal.checkbox');
          const msgFr = "Orientation vers : Sélection de l'article (Case à cocher) (Étape 5).";
          const msgWo = "Dem nañu ci Case à cocher.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('stock actuel') || lowerText.includes('stock info') || lowerText.includes('situation')) {
          TutorialEngine.jumpToAcomId('stock.reorder_modal.article_row');
          const msgFr = "Orientation vers : Informations de Stock & Seuil (Étape 6).";
          const msgWo = "Dem nañu ci Informations de Stock.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('quantité') || lowerText.includes('quantite') || lowerText.includes('commander')) {
          TutorialEngine.jumpToAcomId('stock.reorder_modal.quantity_input');
          const msgFr = "Orientation vers le champ : Quantité à Commander (Étape 7).";
          const msgWo = "Dem nañu ci Quantité à Commander.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('annuler') || lowerText.includes('quitter') || lowerText.includes('fermer')) {
          TutorialEngine.jumpToAcomId('stock.reorder_modal.cancel_btn');
          const msgFr = "Orientation vers le bouton : Annuler (Étape 8).";
          const msgWo = "Dem nañu ci Bouton Annuler.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('générer') || lowerText.includes('generer') || lowerText.includes('pdf') || lowerText.includes('imprimer')) {
          TutorialEngine.jumpToAcomId('stock.reorder_modal.generate_btn');
          const msgFr = "Orientation vers le bouton : Générer le document PDF/Imprimable (Étape 9).";
          const msgWo = "Dem nañu ci Générer le document.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('succès') || lowerText.includes('succes') || lowerText.includes('document généré') || lowerText.includes('résultat') || lowerText.includes('resultat')) {
          TutorialEngine.jumpToAcomId('stock.reorder_modal.generated_doc');
          const msgFr = "Orientation vers : Document généré avec succès (Étape 10).";
          const msgWo = "Dem nañu ci Document généré.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }
      }

      if (isInventorySheetModalActive) {
        if (lowerText.includes('choisir un élément') || lowerText.includes('choisir un element') || lowerText.includes('choisir une fonction') || lowerText.includes('liste des fonctions')) {
          TutorialEngine.openFunctionChooser();
          const msgFr = "Menu des éléments de la Fiche de Comptage Physique ouvert. Choisissez l'élément à découvrir.";
          const msgWo = "Menu u Fiche de Comptage ubbeu na. Tannal élément bi nga bëgg xam.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.chooseFunction', 'success');
          LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('présentation complète') || lowerText.includes('presentation complete') || lowerText.includes('présenter cette fenêtre') || lowerText.includes('presenter cette fenetre') || lowerText.includes('présenter la fiche') || lowerText.includes('presenter la fiche')) {
          TutorialEngine.startInventorySheetTutorial(0);
          const msgFr = "Cette fiche sert à réaliser un comptage physique du stock pour relever les quantités réellement présentes et les comparer avec le stock enregistré dans le système afin d'identifier les écarts.";
          const msgWo = "Fiche bi dafay mayé nga def comptage physique bu stock bi ngir comparer ko ak stock système bi.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.fullPresentation', 'success');
          LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('instruction') || lowerText.includes('message')) {
          TutorialEngine.jumpToAcomId('stock.inventory_sheet_modal.instruction');
          const msgFr = "Orientation vers le cadre : Instruction d'inventaire (Étape 2).";
          const msgWo = "Dem nañu ci Instruction d'inventaire.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('date')) {
          TutorialEngine.jumpToAcomId('stock.inventory_sheet_modal.date');
          const msgFr = "Orientation vers le champ : Date d'inventaire (Étape 3).";
          const msgWo = "Dem nañu ci Date d'inventaire.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('tableau') || lowerText.includes('colonnes') || lowerText.includes('liste')) {
          TutorialEngine.jumpToAcomId('stock.inventory_sheet_modal.table');
          const msgFr = "Orientation vers le : Tableau de comptage physique (Étape 4).";
          const msgWo = "Dem nañu ci Tableau de comptage.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('réel') || lowerText.includes('reel')) {
          TutorialEngine.jumpToAcomId('stock.inventory_sheet_modal.col_real_count');
          const msgFr = "Orientation vers la colonne : Comptage Réel (Étape 9).";
          const msgWo = "Dem nañu ci Comptage Réel.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('écart') || lowerText.includes('ecart') || lowerText.includes('variance') || lowerText.includes('différence')) {
          TutorialEngine.jumpToAcomId('stock.inventory_sheet_modal.col_variance');
          const msgFr = "Orientation vers la colonne : Écart (+/-) (Étape 10).";
          const msgWo = "Dem nañu ci Écart.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('visa') || lowerText.includes('signature') || lowerText.includes('opérateur') || lowerText.includes('direction')) {
          TutorialEngine.jumpToAcomId('stock.inventory_sheet_modal.visa_operator');
          const msgFr = "Orientation vers la zone : Visas de l'opérateur et de la direction (Étape 11).";
          const msgWo = "Dem nañu ci Visas.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('imprimer') || lowerText.includes('impression') || lowerText.includes('imprime')) {
          TutorialEngine.jumpToAcomId('stock.inventory_sheet_modal.print_btn');
          const msgFr = "Orientation vers le bouton : Imprimer Fiche (Étape 14).";
          const msgWo = "Dem nañu ci Imprimer Fiche.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('fermer') || lowerText.includes('quitter')) {
          TutorialEngine.jumpToAcomId('stock.inventory_sheet_modal.close_btn');
          const msgFr = "Orientation vers le bouton : Fermer la fiche (Étape 13).";
          const msgWo = "Dem nañu ci Fermer la fiche.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }
      }

      if (isAdjustmentModalActive) {
        if (lowerText.includes('choisir un élément') || lowerText.includes('choisir un element') || lowerText.includes('choisir une fonction') || lowerText.includes('liste des fonctions')) {
          TutorialEngine.openFunctionChooser();
          const msgFr = "Menu des éléments de la fenêtre Ajustement Manuel ouvert. Choisissez l'élément à découvrir.";
          const msgWo = "Menu u Ajustement ubbeu na. Tannal élément bi nga bëgg xam.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.chooseFunction', 'success');
          LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('présentation complète') || lowerText.includes('presentation complete') || lowerText.includes('présenter cette fenêtre') || lowerText.includes('presenter cette fenetre')) {
          TutorialEngine.startStockAdjustmentTutorial(0);
          const msgFr = "Cette fenêtre permet de corriger manuellement le stock d'un article lorsqu'une entrée ou une sortie doit être enregistrée, avec un motif et une quantité associés.";
          const msgWo = "Burewo bi dafay may nga corriger limu stock bu produit, bu amé entrée wala sortie, ak motif ak quantité.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.fullPresentation', 'success');
          LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('article') || lowerText.includes('produit')) {
          TutorialEngine.jumpToAcomId('stock.adjustment_modal.product');
          const msgFr = "Orientation vers le champ : Sélectionner l'article (Étape 2).";
          const msgWo = "Dem nañu ci Sélectionner l'article.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('entrée') || lowerText.includes('entree') || lowerText.includes('sortie') || lowerText.includes('opération') || lowerText.includes('operation')) {
          TutorialEngine.jumpToAcomId('stock.adjustment_modal.operation_type');
          const msgFr = "Orientation vers : Type d'opération (Entrée (+) / Sortie (-)) (Étape 3).";
          const msgWo = "Dem nañu ci Type d'opération.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('quantité') || lowerText.includes('quantite')) {
          TutorialEngine.jumpToAcomId('stock.adjustment_modal.quantity');
          const msgFr = "Orientation vers le champ : Quantité (Étape 4).";
          const msgWo = "Dem nañu ci Quantité.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('motif') || lowerText.includes('raison')) {
          TutorialEngine.jumpToAcomId('stock.adjustment_modal.reason');
          const msgFr = "Orientation vers le champ : Motif prédéfini (Étape 5).";
          const msgWo = "Dem nañu ci Motif prédéfini.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('notes') || lowerText.includes('note')) {
          TutorialEngine.jumpToAcomId('stock.adjustment_modal.notes');
          const msgFr = "Orientation vers le champ : Notes supplémentaires (Étape 6).";
          const msgWo = "Dem nañu ci Notes supplémentaires.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('opérateur') || lowerText.includes('operateur') || lowerText.includes('nom')) {
          TutorialEngine.jumpToAcomId('stock.adjustment_modal.operator');
          const msgFr = "Orientation vers le champ : Nom de l'opérateur (Étape 7).";
          const msgWo = "Dem nañu ci Nom de l'opérateur.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('validation') || lowerText.includes('enregistrer') || lowerText.includes('annuler')) {
          TutorialEngine.jumpToAcomId('stock.adjustment_modal.actions');
          const msgFr = "Orientation vers les boutons d'action : Annuler & Validation (Étape 8).";
          const msgWo = "Dem nañu ci Validation.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }
      }

      // Contextual Tutorial Trigger: Page Aperçu / Dashboard
      if (
        lowerText.includes('présentation aperçu') || 
        lowerText.includes('presentation apercu') || 
        lowerText.includes('présentation de la page aperçu') || 
        lowerText.includes('presentation de la page apercu') || 
        lowerText.includes('présentation complète de la page aperçu') || 
        lowerText.includes('tutoriel aperçu') || 
        lowerText.includes('tutoriel apercu') || 
        lowerText.includes('présentation atelier de couture') || 
        lowerText.includes('presentation atelier de couture') || 
        lowerText.includes('présentation atelier couture') || 
        lowerText.includes('presentation atelier couture') || 
        lowerText.includes('présentation ateliers de couture') || 
        lowerText.includes('presentation ateliers de couture') || 
        lowerText.includes('présentation couture') || 
        lowerText.includes('presentation couture') || 
        lowerText.includes('tutoriel couture') || 
        lowerText.includes('tutoriel atelier') || 
        lowerText.includes('présentation management commerce') || 
        lowerText.includes('presentation management commerce') || 
        lowerText.includes('présente-moi toute la page aperçu') || 
        lowerText.includes('presente-moi toute la page apercu') ||
        lowerText.includes('découverte aperçu') ||
        lowerText.includes('decouverte apercu') ||
        lowerText.includes('visite guidée') ||
        lowerText.includes('visite guidee') ||
        (lowerText.includes('présentation') && lowerText.includes('aperçu')) ||
        (lowerText.includes('tutoriel') && lowerText.includes('aperçu'))
      ) {
        const saas = context.activeSaaS || 'boutique';
        const scenario = TutorialEngine.getOverviewScenarioForSaas(saas);
        TutorialEngine.startTutorial(scenario);
        const count = scenario.steps.length;
        const msgFr = `Démarrage de la présentation complète et interactive de la page Aperçu (${count} étapes) : ${scenario.title}.`;
        const msgWo = `Tambali présentation complète bu xët u Aperçu bi (${count} étapes).`;
        ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.overview.start', 'success');
        LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
        setIsProcessing(false);
        return;
      }

      if (lowerText.includes('stock') || lowerText.includes('inventaire') || context.currentPage === 'inventory') {
        if (lowerText.includes('choisir une fonction') || lowerText.includes('choisir fonction') || lowerText.includes('liste des fonctions')) {
          TutorialEngine.startStockTutorial(0);
          TutorialEngine.openFunctionChooser();
          const msgFr = "Menu des fonctions du Stock ouvert. Choisissez l'élément que vous souhaitez découvrir.";
          const msgWo = "Menu des fonctions u Stock bi ubbeu na. Tannal li nga bëgg xam.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.chooseFunction', 'success');
          LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('présentation complète') || lowerText.includes('presentation complete') || lowerText.includes('présente-moi toute la page') || lowerText.includes('tutoriel stock')) {
          TutorialEngine.startStockTutorial(0);
          const msgFr = "Démarrage de la présentation complète du Stock (43 étapes).";
          const msgWo = "Tambali présentation complète bu Stock bi.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.fullPresentation', 'success');
          LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('nouveau produit') || lowerText.includes('créer un produit') || lowerText.includes('creer produit')) {
          TutorialEngine.jumpToAcomId('stock.btn.new_product');
          const msgFr = "Orientation vers la fonction : Nouveau Produit (Étape 10).";
          const msgWo = "Dem nañu ci Nouveau Produit.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('ajustement') || lowerText.includes('ajuster')) {
          TutorialEngine.jumpToAcomId('stock.btn.adjust_stock');
          const msgFr = "Orientation vers la fonction : Ajustement Manuel de Stock (Étape 11).";
          const msgWo = "Dem nañu ci Ajustement Stock.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('comptage') || lowerText.includes('fiche d\'inventaire')) {
          TutorialEngine.jumpToAcomId('stock.btn.inventory_sheet');
          const msgFr = "Orientation vers la fonction : Fiche de Comptage Physique (Étape 12).";
          const msgWo = "Dem nañu ci Fiche de Comptage.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('journal') || lowerText.includes('mouvements') || lowerText.includes('historique')) {
          TutorialEngine.jumpToAcomId('stock.movements_journal');
          const msgFr = "Orientation vers la fonction : Journal des Mouvements (Étape 34).";
          const msgWo = "Dem nañu ci Journal des Mouvements.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }
      }

      if (lowerText.includes('audit') || context.currentPage === 'audit' || context.currentPage === 'journal_audit' || context.currentPage === 'merchant_audit') {
        if (lowerText.includes('choisir une fonction') || lowerText.includes('choisir fonction') || lowerText.includes('liste des fonctions') || lowerText.includes('choisir un élément')) {
          TutorialEngine.startAuditLogTutorial(0);
          TutorialEngine.openFunctionChooser();
          const msgFr = "Menu des fonctions du Journal d'Audit ouvert. Choisissez l'élément à découvrir.";
          const msgWo = "Menu u Journal d'Audit ubbeu na. Tannal li nga bëgg xam.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.chooseFunction', 'success');
          LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('présentation') || lowerText.includes('presentation') || lowerText.includes('explique') || lowerText.includes('présente') || lowerText.includes('tutoriel') || lowerText.includes('audit')) {
          TutorialEngine.startAuditLogTutorial(0);
          const msgFr = "Démarrage du tutoriel interactif du Journal d'Audit.";
          const msgWo = "Tambali présentation bu Journal d'Audit.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.startAudit', 'success');
          LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
          setIsProcessing(false);
          return;
        }
      }

      if (lowerText.includes('fournisseur') || lowerText.includes('partenaire') || context.currentPage === 'suppliers' || context.currentPage === 'fournisseurs') {
        if (lowerText.includes('choisir une fonction') || lowerText.includes('choisir fonction') || lowerText.includes('liste des fonctions') || lowerText.includes('choisir un élément')) {
          TutorialEngine.startSuppliersTutorial(0);
          TutorialEngine.openFunctionChooser();
          const msgFr = "Menu des fonctions de la page Partenaires Logistiques ouvert. Choisissez l'élément à découvrir.";
          const msgWo = "Menu des fonctions u Partenaires Logistiques ubbeu na. Tannal li nga bëgg xam.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.chooseFunction', 'success');
          LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('présentation') || lowerText.includes('presentation') || lowerText.includes('explique cette page') || lowerText.includes('présente la page') || lowerText.includes('presente la page') || lowerText.includes('tutoriel') || lowerText.includes('partenaires logistiques')) {
          TutorialEngine.startSuppliersTutorial(0);
          const msgFr = "Démarrage du tutoriel vocal interactif de la page Partenaires Logistiques.";
          const msgWo = "Tambali présentation bu Partenaires Logistiques.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.fullPresentation', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('nouveau fournisseur') || lowerText.includes('ajouter fournisseur') || lowerText.includes('créer fournisseur') || lowerText.includes('bouton') || lowerText.includes('ajouter un partenaire')) {
          TutorialEngine.jumpToAcomId('supplier.new_supplier_btn');
          const msgFr = "Le bouton Nouveau fournisseur permet d'ajouter un nouveau partenaire logistique dans votre système. Il ouvre une fenêtre permettant de renseigner les informations du fournisseur.";
          const msgWo = "Bouton Nouveau fournisseur bi dafay mayé nga yokk partenaire logistique bu bees ci sa système bi. Dafay ubbi fenêtre ngir bind ay xibaar.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('carte') || lowerText.includes('fiche') || lowerText.includes('premier fournisseur') || lowerText.includes('entreprise')) {
          TutorialEngine.jumpToAcomId('supplier.card.first');
          const msgFr = "Cette carte présente un fournisseur enregistré dans le système. Elle affiche son nom ainsi que sa catégorie.";
          const msgWo = "Carte bi dafay wone fournisseur bu bindu ci système bi. Dafay wone turam ak catégorie bi.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('données') || lowerText.includes('donnees') || lowerText.includes('contact') || lowerText.includes('téléphone') || lowerText.includes('telephone') || lowerText.includes('email') || lowerText.includes('mail')) {
          TutorialEngine.jumpToAcomId('supplier.card.details');
          const msgFr = "La carte détaille également la personne de contact, le numéro de téléphone et l'adresse email pour joindre rapidement ce partenaire.";
          const msgWo = "Carte bi dafay wone tamit ki ngay waxtaanal, numéro téléphone bi ak email bi ngir jokkoo ak moom.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('compteur') || lowerText.includes('combien') || lowerText.includes('nombre') || lowerText.includes('actifs')) {
          TutorialEngine.jumpToAcomId('supplier.count');
          const msgFr = "Ce compteur indique en direct le nombre de fournisseurs et partenaires logistiques actuellement enregistrés.";
          const msgWo = "Compteur bi dafay wone limu fournisseurs yi actif te bindu ci système bi.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('titre') || lowerText.includes('en-tête') || lowerText.includes('entete')) {
          TutorialEngine.jumpToAcomId('supplier.title');
          const msgFr = "Cette page est consacrée à la gestion de vos partenaires logistiques et fournisseurs.";
          const msgWo = "Xët wii dafa jagleel gestion u sa partenaires logistiques ak fournisseurs yi.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }

        if (lowerText.includes('navigation') || lowerText.includes('onglet') || lowerText.includes('menu') || lowerText.includes('barre')) {
          TutorialEngine.jumpToAcomId('supplier.navbar');
          const msgFr = "La barre de navigation vous permet de passer entre les différents modules de l'application. Le module Fournisseurs est actuellement sélectionné.";
          const msgWo = "Barre de navigation bi dafay mayé nga changé fexe entre modules yi ci application bi. Module Fournisseurs bi moo actif léegi.";
          ConversationContext.addAssistantMessage(msgFr, msgWo, 'tutorial.jumpToFunction', 'success');
          setIsProcessing(false);
          return;
        }
      }
      if (lowerText.includes('a quoi sert') || lowerText.includes('à quoi sert') || lowerText.includes('que permet')) {
        const pageDef = ContextEngine.getActivePageDefinition();
        if (pageDef) {
          const zoneList = pageDef.zones.map(z => z.name).join(', ');
          const msgFr = `La page "${pageDef.name}" permet de : ${pageDef.purpose}. Elle comprend les zones : ${zoneList}.`;
          const msgWo = `Xët bi "${pageDef.name}" dafa am : ${pageDef.purpose}. Zones yi am na : ${zoneList}.`;

          ConversationContext.addAssistantMessage(msgFr, msgWo, 'context.pagePurpose', 'success');
          LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
          setIsProcessing(false);
          return;
        }
      }

      // Contextual Question 3: Which field corresponds to X?
      if (lowerText.includes('quel champ') || lowerText.includes('ou se trouve') || lowerText.includes('où se trouve')) {
        const pageDef = ContextEngine.getActivePageDefinition();
        if (pageDef) {
          let foundEl: any = null;
          let foundZone = '';
          for (const z of pageDef.zones) {
            for (const el of z.elements) {
              if (lowerText.includes('téléphone') || lowerText.includes('phone') || lowerText.includes('telephone')) {
                if (el.semanticId === 'client.phone') {
                  foundEl = el;
                  foundZone = z.name;
                  break;
                }
              } else if (lowerText.includes('nom')) {
                if (el.semanticId === 'client.fullName') {
                  foundEl = el;
                  foundZone = z.name;
                  break;
                }
              }
            }
            if (foundEl) break;
          }

          if (foundEl) {
            const msgFr = `Le champ recherché est "${foundEl.label}" (Identifiant: ${foundEl.acomId}), situé dans la zone "${foundZone}".`;
            const msgWo = `Champ bi mu ngi ci zone "${foundZone}" : "${foundEl.label}" (ID: ${foundEl.acomId}).`;

            ConversationContext.addAssistantMessage(msgFr, msgWo, 'context.fieldQuery', 'success', foundEl);
            LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
            setIsProcessing(false);
            return;
          }
        }
      }
      
      // 1. NLU Intent Parsing
      const intentResult = await IntentEngine.parseIntent(text, context);

      // 2. Business Execution
      const actionResult = await ActionRouter.dispatchIntent(intentResult, context);

      // 3. Add Assistant Message
      ConversationContext.addAssistantMessage(
        actionResult.messageFr,
        actionResult.messageWolof,
        actionResult.actionId,
        actionResult.success ? 'success' : actionResult.error === 'USER_CANCELLED' ? 'pending_confirmation' : 'failed',
        actionResult.data
      );

      // 4. Spoken Narration
      const speechText = language === 'wo' ? actionResult.messageWolof : actionResult.messageFr;
      LanguageEngine.speak(speechText, language);

    } catch (err: any) {
      console.error('[AcomAIWidget] Error handling prompt:', err);
      ConversationContext.addAssistantMessage(
        `Une erreur s'est produite : ${err?.message || 'Erreur inconnue'}`,
        `Am na erreur bu ngen fi am : ${err?.message || 'Erreur'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleVoiceMode = () => {
    if (voiceInfo.active) {
      VoiceSessionManager.stopSession();
    } else {
      VoiceSessionManager.startSession(language);
    }
  };

  const toggleLanguage = () => {
    const next = language === 'fr' ? 'wo' : 'fr';
    ConversationContext.setLanguage(next);
  };

  const currentContext = ContextEngine.getContext();
  const activePage = currentContext.currentPage || '';
  const isStockPage = activePage === 'inventory' || currentContext.activeSaaS === 'stock';
  const isAuditPage = activePage === 'audit' || activePage === 'journal_audit' || activePage === 'merchant_audit' || activePage === 'audit_log';
  const isBillingPage = activePage === 'billing' || activePage === 'facturation';
  const currentScenario = TutorialEngine.getCurrentScenario();
  const isReorderModal = currentScenario?.id === 'commerce_reorder_po_tutorial' || TutorialEngine.getActiveModal() === 'stock.reorder_modal' || TutorialEngine.getActiveModal() === 'stock_reorder_modal';
  const isInventorySheetModal = currentScenario?.id === 'commerce_inventory_sheet_tutorial';
  const isAdjustmentModal = currentScenario?.id === 'commerce_stock_adjustment_tutorial';
  const isQuoteModal = currentScenario?.id === 'commerce_billing_quote_modal_tutorial' || TutorialEngine.getActiveModal() === 'billing.quote_modal' || TutorialEngine.getActiveModal() === 'quote_modal';
  const isPrintModal = currentScenario?.id === 'commerce_billing_print_modal_tutorial' || TutorialEngine.getActiveModal() === 'billing.print_modal';

  const PRESET_PROMPTS = isQuoteModal ? [
    { label: '🎓 Présentation (13 étapes)', promptFr: 'Présentation complète de la fenêtre Nouveau Devis', promptWo: 'Présentation complète u Nouveau Devis' },
    { label: '📋 Choisir un élément', promptFr: 'Choisir un élément du devis', promptWo: 'Tannal benn élément ci devis' },
    { label: '👤 Nom du Client', promptFr: 'Explique-moi le champ Nom complet du client', promptWo: 'Wane ma Nom client' },
    { label: '📞 Téléphone', promptFr: 'Explique-moi le champ Téléphone', promptWo: 'Wane ma Téléphone client' },
    { label: '📅 Validité de l\'Offre', promptFr: 'Explique-moi la validité de l\'offre en jours', promptWo: 'Wane ma validité offre' },
    { label: '➕ Ajouter une Ligne', promptFr: 'Explique-moi le bouton Ajouter une ligne', promptWo: 'Wane ma bouton Ajouter une ligne' },
    { label: '📝 Notes & Conditions', promptFr: 'Explique-moi les notes et conditions', promptWo: 'Wane ma notes ak conditions' },
    { label: '💰 Total Estimé', promptFr: 'Explique-moi le total estimé', promptWo: 'Wane ma montant total estimé' },
    { label: '💾 Enregistrer Devis', promptFr: 'Explique-moi comment enregistrer le devis', promptWo: 'Wane ma bouton enregistrer' }
  ] : isPrintModal ? [
    { label: '🎓 Présentation Impression', promptFr: 'Présentation complète du Centre d\'Impression', promptWo: 'Présentation complète u Centre d\'Impression' },
    { label: '📋 Format Ticket 80mm', promptFr: 'Explique-moi l\'impression Reçu thermique 80mm', promptWo: 'Wane ma reçu thermique' },
    { label: '📄 Facture A4', promptFr: 'Explique-moi la Facture officielle A4', promptWo: 'Wane ma Facture A4' },
    { label: '📑 Devis Proforma A4', promptFr: 'Explique-moi le Devis Proforma A4', promptWo: 'Wane ma Devis Proforma' }
  ] : isBillingPage ? [
    { label: '🧾 Factures (11 étapes)', promptFr: 'Présente-moi l\'onglet Factures', promptWo: 'Wane ma onglet Factures' },
    { label: '⚠️ Impayés (10 étapes)', promptFr: 'Présente-moi l\'onglet Impayés', promptWo: 'Wane ma onglet Impayés' },
    { label: '📄 Devis (11 étapes)', promptFr: 'Présente-moi l\'onglet Devis', promptWo: 'Wane ma onglet Devis' },
    { label: '➕ Nouveau Devis', promptFr: 'Explique-moi comment créer un devis', promptWo: 'Wane ma naka lañuy defar devis' },
    { label: '📋 Choisir une fonction', promptFr: 'Choisir une fonction de Facturation', promptWo: 'Tannal fonction facturation' }
  ] : isReorderModal ? [
    { label: '🎓 Présentation complète', promptFr: 'Présentation complète du Bon de Commande Fournisseur (Réassort)', promptWo: 'Présentation complète u Bon de Commande' },
    { label: '📋 Choisir un élément', promptFr: 'Choisir un élément du Bon de Commande Fournisseur', promptWo: 'Tannal benn élément' },
    { label: '🏭 Fournisseur', promptFr: 'Explique-moi le fournisseur', promptWo: 'Wane ma fournisseur bi' },
    { label: '⚠️ Alerte & Seuil', promptFr: 'Explique-moi le message d\'alerte et seuil', promptWo: 'Wane ma message alerte bi' },
    { label: '📦 Articles', promptFr: 'Explique-moi les articles à commander', promptWo: 'Wane ma articles à commander' },
    { label: '☑️ Sélection (Case)', promptFr: 'Explique-moi la case à cocher pour sélectionner l\'article', promptWo: 'Wane ma case à cocher bi' },
    { label: '🔢 Quantité à Commander', promptFr: 'Explique-moi la quantité à commander', promptWo: 'Wane ma quantité à commander' },
    { label: '📄 Générer PDF', promptFr: 'Explique-moi le bouton Générer le document', promptWo: 'Wane ma bouton générer document bi' },
    { label: '❌ Annuler', promptFr: 'Explique-moi le bouton Annuler', promptWo: 'Wane ma bouton annuler bi' }
  ] : isInventorySheetModal ? [
    { label: '🎓 Présentation complète', promptFr: 'Présentation complète de la Fiche de Comptage d\'Inventaire Physique', promptWo: 'Présentation complète u Fiche de Comptage' },
    { label: '📋 Choisir un élément', promptFr: 'Choisir un élément de la Fiche de Comptage', promptWo: 'Tannal benn élément' },
    { label: 'ℹ️ Instruction', promptFr: 'Explique-moi l\'instruction d\'inventaire', promptWo: 'Wane ma instruction d\'inventaire' },
    { label: '📅 Date', promptFr: 'Explique-moi la date d\'inventaire', promptWo: 'Wane ma date d\'inventaire' },
    { label: '📊 Tableau', promptFr: 'Explique-moi le tableau de comptage physique', promptWo: 'Wane ma tableau de comptage' },
    { label: '🔢 Comptage Réel', promptFr: 'Explique-moi le comptage réel', promptWo: 'Wane ma comptage réel' },
    { label: '⚖️ Écart (+/-)', promptFr: 'Explique-moi l\'écart entre le comptage et le stock système', promptWo: 'Wane ma écart bi' },
    { label: '✍️ Visas', promptFr: 'Explique-moi les visas de l\'opérateur et de la direction', promptWo: 'Wane ma visas yi' },
    { label: '🖨️ Imprimer Fiche', promptFr: 'Explique-moi l\'impression de la fiche', promptWo: 'Wane ma impression fiche bi' }
  ] : isAdjustmentModal ? [
    { label: '🎓 Présentation complète', promptFr: 'Présentation complète de la fenêtre Ajustement Manuel du Stock', promptWo: 'Présentation complète u Ajustement' },
    { label: '📋 Choisir un élément', promptFr: 'Choisir un élément de la fenêtre Ajustement', promptWo: 'Tannal benn élément' },
    { label: '📦 Article', promptFr: 'Explique-moi la sélection de l\'article', promptWo: 'Wane ma choix article' },
    { label: '🔄 Entrée / Sortie', promptFr: 'Explique-moi le type d\'opération Entrée ou Sortie', promptWo: 'Wane ma Entrée walla Sortie' },
    { label: '🔢 Quantité', promptFr: 'Explique-moi le champ Quantité', promptWo: 'Wane ma Quantité' },
    { label: '🏷️ Motif', promptFr: 'Explique-moi le motif prédéfini', promptWo: 'Wane ma Motif' },
    { label: '📝 Notes', promptFr: 'Explique-moi les notes supplémentaires', promptWo: 'Wane ma Notes' },
    { label: '👤 Opérateur', promptFr: 'Explique-moi le nom de l\'opérateur', promptWo: 'Wane ma Opérateur' },
    { label: '✅ Validation', promptFr: 'Explique-moi la validation de l\'ajustement', promptWo: 'Wane ma Validation' }
  ] : isAuditPage ? [
    { label: '🎓 Présentation complète', promptFr: 'Présentation complète du Journal d\'Audit', promptWo: 'Présentation complète u Journal d\'Audit' },
    { label: '📋 Choisir une fonction', promptFr: 'Choisir une fonction du Journal d\'Audit', promptWo: 'Tannal benn fonction u Journal d\'Audit' },
    { label: '⏱️ Temps Réel', promptFr: 'Explique-moi l\'indicateur Temps Réel', promptWo: 'Wane ma Temps Réel' },
    { label: '📊 Tableau d\'Audit', promptFr: 'Explique-moi le Tableau d\'Audit', promptWo: 'Wane ma Tableau d\'Audit' },
    { label: '📅 Horodatage', promptFr: 'Explique-moi l\'Horodatage', promptWo: 'Wane ma Horodatage' },
    { label: '📦 Type de Flux & Delta', promptFr: 'Explique-moi le Type de Flux et Delta Stock', promptWo: 'Wane ma Type de Flux ak Delta' }
  ] : isStockPage ? [
    { label: '🎓 Présentation complète', promptFr: 'Présentation complète du Stock', promptWo: 'Présentation complète u Stock bi' },
    { label: '📋 Choisir une fonction', promptFr: 'Choisir une fonction du Stock', promptWo: 'Tannal benn fonction u Stock' },
    { label: '➕ Nouveau Produit', promptFr: 'Explique-moi la fonction Nouveau Produit', promptWo: 'Wane ma Nouveau Produit' },
    { label: '⚖️ Ajustement Stock', promptFr: 'Explique-moi l\'ajustement de stock', promptWo: 'Wane ma Ajustement Stock' },
    { label: '📄 Fiche Comptage', promptFr: 'Explique-moi la fiche de comptage', promptWo: 'Wane ma Fiche de Comptage' },
    { label: '📜 Journal Mouvements', promptFr: 'Explique-moi le journal des mouvements', promptWo: 'Wane ma Journal Mouvements' }
  ] : [
    { label: '🎓 Présentation Aperçu (50 étapes)', promptFr: 'Présentation complète de la page Aperçu', promptWo: 'Présentation complète u Aperçu bi' },
    { label: '📊 Flux Financiers', promptFr: 'Explique-moi la section Flux Financiers', promptWo: 'Wane ma wàllu Flux Financiers' },
    { label: '⚠️ Articles en Rupture', promptFr: 'Explique-moi la section Articles en Rupture', promptWo: 'Wane ma wàllu Articles en Rupture' },
    { label: '📥 Nouveau Dépôt Client', promptFr: 'Ajoute un dépôt pour le client Ibou avec un acompte de 2 000 FCFA', promptWo: 'Bindal dépôt bu client Ibou acompte 2 000 FCFA' },
    { label: '📊 Clôturer la Caisse', promptFr: 'Clôture la caisse avec 15 000 FCFA comptés', promptWo: 'Tëjal caisse bi ak 15 000 FCFA' }
  ];

  const contentMarkup = (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Acom IA Démo</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
                Couche Commune
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pilotez vos SaaS en langage naturel (FR / Wolof)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Continuous Voice Mode Toggle Header Button */}
          <button
            onClick={toggleVoiceMode}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
              voiceInfo.active
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title={voiceInfo.active ? 'Arrêter la conversation vocale' : 'Lancer le Mode Conversation Vocale Continu'}
          >
            <Radio className={`w-3.5 h-3.5 ${voiceInfo.active ? 'text-cyan-400 animate-spin' : 'text-slate-400'}`} />
            <span>{voiceInfo.active ? 'Vocal Actif' : 'Mode Vocal'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition flex items-center gap-1.5"
            title="Changer de langue (Français / Wolof)"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === 'fr' ? '🇫🇷 FR' : '🇸🇳 WOLOF'}</span>
          </button>

          <button
            onClick={() => {
              if (voiceInfo.active) VoiceSessionManager.stopSession();
              if (onClose) onClose();
              setIsOpen(false);
            }}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Fermer la fenêtre Acom IA"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Orb Indicator when Continuous Voice Mode is Active */}
      {voiceInfo.active && (
        <div className="px-4 pt-2">
          <VoiceOrbIndicator
            sessionInfo={voiceInfo}
            onStop={() => VoiceSessionManager.stopSession()}
          />
        </div>
      )}

      {/* Quick Preset Buttons */}
      <div className="p-3 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 uppercase shrink-0">
          Raccourcis :
        </span>
        {PRESET_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendPrompt(language === 'wo' ? p.promptWo : p.promptFr)}
            disabled={isProcessing}
            className="shrink-0 text-xs bg-slate-800/90 hover:bg-indigo-900/40 text-slate-200 hover:text-indigo-300 border border-slate-700/60 hover:border-indigo-500/40 px-3 py-1.5 rounded-xl transition font-medium"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSystem = msg.sender === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center my-2">
                <span className="text-xs bg-slate-800/80 border border-slate-700/50 text-slate-300 px-3 py-1 rounded-full inline-block">
                  {language === 'wo' && msg.textWolof ? msg.textWolof : msg.textFr}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Acom IA</span>
                  </div>
                )}

                <p className="whitespace-pre-line text-sm">
                  {language === 'wo' && msg.textWolof ? msg.textWolof : msg.textFr}
                </p>

                {msg.actionId && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Action : {msg.actionId}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold ${
                        msg.actionStatus === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : msg.actionStatus === 'pending_confirmation'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {msg.actionStatus === 'success' ? 'EXÉCUTÉE' : msg.actionStatus === 'pending_confirmation' ? 'REQUIS' : 'ÉCHEC'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs text-indigo-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyse NLU et exécution métier en cours...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="flex items-center gap-2"
        >
          {/* Mic Button toggles continuous voice conversation mode */}
          <button
            type="button"
            onClick={toggleVoiceMode}
            className={`p-2.5 rounded-xl transition border ${
              voiceInfo.active
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-400 border-slate-700'
            }`}
            title={voiceInfo.active ? 'Mode Vocal Actif - Appuyez pour arrêter' : 'Démarrer le Mode Conversation Vocale Continu'}
          >
            {voiceInfo.active ? <MicOff className="w-4 h-4 text-cyan-200" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === 'wo'
                ? 'Bindal fi ne: "Ajoute un produit...", "Vends 5 Senat"...'
                : 'Saisissez votre commande en langage naturel...'
            }
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md transition font-semibold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  if (embedded) {
    return <div className="w-full h-[520px]">{contentMarkup}</div>;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9000]">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-96 h-[520px] shadow-2xl"
          >
            {contentMarkup}
          </motion.div>
        ) : (
          <motion.button
            data-acom-id="dashboard.assistant_floating_btn"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-full shadow-2xl border-2 border-indigo-400/50 hover:scale-105 transition group"
            title="Ouvrir l'Assistant IA Acom (FR / Wolof)"
          >
            <div className="p-1.5 bg-indigo-500/30 rounded-full text-amber-300 group-hover:rotate-12 transition">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <span>Acom IA</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping ml-1" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
