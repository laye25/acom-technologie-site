/**
 * WhatsAppCommandeMesureService.ts
 * Module indépendant de gestion des partages de Commandes Mesures aux Artisans & Équipes via WhatsApp
 * Conçu selon l'architecture d'Acom Technologie (Extensible pour Telegram, Email, SMS, PDF Export, etc.)
 */

export interface ArtisanRecipient {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  whatsApp?: string;
  specialty: string;
  functionRole?: string;
  atelier?: string;
  team?: string;
  status: 'Disponible' | 'Occupé' | 'En congé' | string;
  isValidNumber: boolean;
  formattedNumber: string;
  validationError?: string;
}

export interface ArtisanTeam {
  id: string;
  name: string;
  atelier?: string;
  artisans: ArtisanRecipient[];
}

export interface ShareHistoryItem {
  id: string;
  orderId: string;
  orderRef: string;
  date: string; // ISO string
  timestamp: number;
  userName: string;
  artisanId: string;
  artisanName: string;
  artisanRole?: string;
  whatsAppNumber: string;
  filesCount: number;
  attachedFilesSummary?: string[];
  channel: 'WhatsApp' | 'Telegram' | 'Email' | 'SMS' | 'Signal' | 'PDF';
  status: 'Envoyé' | 'Échec' | 'Annulé';
  errorMessage?: string;
}

export interface OrderAttachment {
  id: string;
  name: string;
  type: 'image' | 'sketch' | 'pattern' | 'pdf' | 'document';
  url: string;
}

const MEASUREMENT_LABELS: Record<string, string> = {
  cou: 'Tour de Cou (Col)',
  poitrine: 'Tour de Poitrine',
  epaule: 'Carrure / Dos (Épaule à Épaule)',
  manche: 'Longueur Manche',
  tourBras: 'Tour de Bras',
  taille: 'Tour de Taille',
  hanches: 'Tour de Hanches',
  pantalon: 'Longueur Pantalon / Jupe',
  cuisse: 'Tour de Cuisse',
  boubou: 'Longueur Grand Boubou',
  poignet: 'Tour de Poignet',
  entrejambe: 'Longueur Entrejambe',
  basPantalon: 'Bas Pantalon',
  hauteurPoitrine: 'Hauteur Poitrine',
  ecartPoitrine: 'Écart Poitrine',
  longueurRobe: 'Longueur Robe',
  longueurVeste: 'Longueur Veste'
};

export class WhatsAppCommandeMesureService {
  /**
   * Valide et formate un numéro de téléphone au format E.164 (international)
   * Prrend en compte les numéros d'Afrique de l'Ouest (ex: Sénégal +221, Côte d'Ivoire +225, etc.)
   */
  public static formatToE164(phone: string, defaultCountryCode: string = '221'): { cleanNumber: string; isValid: boolean; formattedDisplay: string; error?: string } {
    if (!phone || typeof phone !== 'string') {
      return { cleanNumber: '', isValid: false, formattedDisplay: 'Non renseigné', error: 'Aucun numéro de téléphone disponible' };
    }

    // Retirer tout sauf les chiffres et le '+'
    const rawDigits = phone.replace(/[^0-9]/g, '');

    if (rawDigits.length < 8) {
      return { cleanNumber: rawDigits, isValid: false, formattedDisplay: phone, error: 'Numéro trop court (minimum 8 chiffres requis)' };
    }

    let clean = rawDigits;
    // Si commence par 00, remplacer par rien
    if (clean.startsWith('00')) {
      clean = clean.substring(2);
    }

    // Si le numéro commence par 77, 78, 70, 76, 75, 33 (Sénégal) et a 9 chiffres, ajouter l'indicatif 221
    if (clean.length === 9 && ['77', '78', '70', '76', '75', '33'].some(prefix => clean.startsWith(prefix))) {
      clean = `${defaultCountryCode}${clean}`;
    }

    // Vérification longueur E.164 valide (entre 8 et 15 chiffres)
    if (clean.length < 8 || clean.length > 15) {
      return { cleanNumber: clean, isValid: false, formattedDisplay: `+${clean}`, error: 'Format de numéro international invalide' };
    }

    return {
      cleanNumber: clean,
      isValid: true,
      formattedDisplay: `+${clean}`
    };
  }

  /**
   * Récupère la liste des artisans pour un commerçant donné
   */
  public static getArtisans(merchantId: string): ArtisanRecipient[] {
    try {
      const saved = localStorage.getItem(`tailleur_artisans_${merchantId}`);
      let rawArtisans: any[] = saved ? JSON.parse(saved) : [];

      if (!rawArtisans || rawArtisans.length === 0) {
        // Mock par défaut pour une démo immédiate si vide
        rawArtisans = [
          {
            id: 'art-1',
            name: 'Moustapha Diop',
            phone: '+221 77 543 21 09',
            whatsApp: '+221 77 543 21 09',
            specialty: 'Couturier Principal',
            team: 'Équipe Haute Couture',
            atelier: 'Atelier Central',
            status: 'Disponible'
          },
          {
            id: 'art-2',
            name: 'Fatou Sow',
            phone: '+221 78 123 45 67',
            whatsApp: '+221 78 123 45 67',
            specialty: 'Brodeur',
            team: 'Équipe Broderie Fine',
            atelier: 'Atelier Broderie',
            status: 'Occupé'
          },
          {
            id: 'art-3',
            name: 'Ibrahima Ndiaye',
            phone: '+221 70 876 54 32',
            specialty: 'Apprenti Coupeur',
            team: 'Équipe Coupe & Patron',
            atelier: 'Atelier Central',
            status: 'Disponible'
          },
          {
            id: 'art-4',
            name: 'Aminata Diallo',
            phone: '+221 76 998 88 77',
            specialty: 'Finisseuse',
            team: 'Équipe Finitions & Repassage',
            atelier: 'Atelier Central',
            status: 'Disponible'
          }
        ];
      }

      return rawArtisans.map((art: any) => {
        const phoneToUse = art.whatsApp || art.whatsapp || art.phone || '';
        const validation = this.formatToE164(phoneToUse);

        const fullName = art.name || `${art.firstName || ''} ${art.lastName || ''}`.trim() || 'Artisan';

        return {
          id: art.id || crypto.randomUUID(),
          name: fullName,
          firstName: art.firstName || fullName.split(' ')[0] || '',
          lastName: art.lastName || fullName.split(' ').slice(1).join(' ') || '',
          phone: art.phone || '',
          whatsApp: art.whatsApp || art.whatsapp || art.phone || '',
          specialty: art.specialty || art.functionRole || 'Couturier',
          functionRole: art.functionRole || art.specialty || 'Couturier',
          atelier: art.atelier || 'Atelier Principal',
          team: art.team || art.equipe || art.specialty || 'Équipe Couture',
          status: art.status || 'Disponible',
          isValidNumber: validation.isValid,
          formattedNumber: validation.cleanNumber,
          validationError: validation.error
        };
      });
    } catch (error) {
      console.error('Erreur de chargement des artisans:', error);
      return [];
    }
  }

  /**
   * Regroupe les artisans par équipes
   */
  public static getTeams(merchantId: string): ArtisanTeam[] {
    const artisans = this.getArtisans(merchantId);
    const teamsMap = new Map<string, ArtisanRecipient[]>();

    artisans.forEach((art) => {
      const teamName = art.team || 'Équipe Générale';
      if (!teamsMap.has(teamName)) {
        teamsMap.set(teamName, []);
      }
      teamsMap.get(teamName)!.push(art);
    });

    const teams: ArtisanTeam[] = [];
    let idx = 1;
    teamsMap.forEach((artList, teamName) => {
      teams.push({
        id: `team-${idx++}`,
        name: teamName,
        atelier: artList[0]?.atelier || 'Atelier Principal',
        artisans: artList
      });
    });

    return teams;
  }

  /**
   * Extrait la liste des pièces jointes d'une commande
   */
  public static extractAttachments(order: any): OrderAttachment[] {
    const attachments: OrderAttachment[] = [];

    if (order?.inspirationImage) {
      attachments.push({
        id: 'att-inspiration',
        name: 'Photo d\'inspiration / Modèle',
        type: 'image',
        url: order.inspirationImage
      });
    }

    if (order?.sketchImage || order?.croquis) {
      attachments.push({
        id: 'att-sketch',
        name: 'Croquis / Dessin technique',
        type: 'sketch',
        url: order.sketchImage || order.croquis
      });
    }

    if (order?.patternImage || order?.patron) {
      attachments.push({
        id: 'att-pattern',
        name: 'Patron de couture',
        type: 'pattern',
        url: order.patternImage || order.patron
      });
    }

    if (Array.isArray(order?.attachments)) {
      order.attachments.forEach((att: any, index: number) => {
        attachments.push({
          id: `att-custom-${index}`,
          name: att.name || `Document joint ${index + 1}`,
          type: att.type || 'document',
          url: att.url || att
        });
      });
    }

    return attachments;
  }

  /**
   * Génère le message WhatsApp structuré et professionnel pour un artisan
   */
  public static generateWhatsAppMessage(params: {
    order: any;
    merchant: any;
    artisan?: ArtisanRecipient;
    customNote?: string;
  }): string {
    const { order, merchant, artisan, customNote } = params;

    const orderId = order.id ? `CMD-${order.id.slice(0, 8).toUpperCase()}` : 'N/A';
    const clientName = order.clientName || 'Client';
    const creationDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('fr-FR') : 'Non définie';
    const priority = order.isUrgent ? '🔴 HAUTE (URGENT)' : '🟢 Normale';

    let statusText = 'Mesures prises';
    if (order.status === 'coupe') statusText = 'Coupe & Couture';
    else if (order.status === 'retouche') statusText = 'Retouches & Broderie';
    else if (order.status === 'pret') statusText = 'Prêt pour essayage';
    else if (order.status === 'livre') statusText = 'Livré';

    const model = order.model || 'Modèle Sur Mesure';
    const category = order.category || order.typeVetement || 'Couture';
    const fabric = order.tissuUsed || order.tissu || 'Tissu client / Atelier';
    const color = order.color || order.couleur || 'Selon échantillon';
    const size = order.size || order.taille || 'Sur-mesure';
    const quantity = order.quantity || order.quantite || 1;
    const description = order.notes || order.description || 'Voir fiche technique.';

    // Extraction des mensurations
    const measurements = order.clientMeasurements || order.measurements || {};
    const measurementLines: string[] = [];

    Object.entries(measurements).forEach(([key, value]) => {
      if (value && value !== '' && value !== '0') {
        const label = MEASUREMENT_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
        measurementLines.push(`• *${label}* : ${value} cm`);
      }
    });

    const attachments = this.extractAttachments(order);

    let msg = `📋 *COMMANDE COUTURE - ATELIER ${merchant.name.toUpperCase()}*\n`;
    msg += `----------------------------------------\n`;
    msg += `📌 *Référence* : ${orderId}\n`;
    if (artisan) {
      msg += `👔 *Artisan Destinataire* : ${artisan.name} (${artisan.specialty})\n`;
    }
    msg += `👤 *Client* : ${clientName}\n`;
    msg += `📅 *Création* : ${creationDate}\n`;
    msg += `🎯 *Livraison Prévue* : *${deliveryDate}*\n`;
    msg += `⚡ *Priorité* : ${priority}\n`;
    msg += `📊 *Statut Actuel* : ${statusText}\n\n`;

    msg += `✂️ *DÉTAILS DU VÊTEMENT*\n`;
    msg += `----------------------------------------\n`;
    msg += `• *Modèle* : ${model}\n`;
    msg += `• *Catégorie* : ${category}\n`;
    msg += `• *Tissu* : ${fabric}\n`;
    if (color !== 'Selon échantillon') msg += `• *Couleur* : ${color}\n`;
    msg += `• *Quantité* : ${quantity}\n`;
    msg += `• *Taille / Coupe* : ${size}\n`;

    if (description) {
      msg += `\n📝 *INSTRUCTIONS DE FABRICATION*\n`;
      msg += `${description}\n`;
    }

    if (customNote && customNote.trim() !== '') {
      msg += `\n⚠️ *NOTE PARTICULIÈRE ATELIER*\n`;
      msg += `${customNote.trim()}\n`;
    }

    msg += `\n📏 *MENSURATIONS CLIENT*\n`;
    msg += `----------------------------------------\n`;
    if (measurementLines.length > 0) {
      msg += measurementLines.join('\n') + '\n';
    } else {
      msg += `_Aucune mesure spécifique saisie. Se référer à la fiche papier._\n`;
    }

    if (attachments.length > 0) {
      msg += `\n🖼️ *PIÈCES JOINTES & VISUELS* (${attachments.length})\n`;
      msg += `----------------------------------------\n`;
      attachments.forEach((att, idx) => {
        msg += `${idx + 1}. *${att.name}* : ${att.url}\n`;
      });
      msg += `\n_Veuillez télécharger et examiner les images ci-dessus pour la confection._\n`;
    }

    msg += `\n----------------------------------------\n`;
    msg += `⚙️ _Envoyé via ${merchant.name} (Acom Technologie SaaS)_`;

    return msg;
  }

  /**
   * Ouvre la conversation WhatsApp pour un numéro de téléphone donné
   */
  public static openWhatsAppChat(phoneNumber: string, message: string): boolean {
    const validation = this.formatToE164(phoneNumber);
    if (!validation.isValid) {
      return false;
    }

    const encodedText = encodeURIComponent(message);
    
    // Détection de la plateforme (Electron Desktop / Web / Mobile)
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
    
    let url = `https://api.whatsapp.com/send?phone=${validation.cleanNumber}&text=${encodedText}`;

    if (isElectron) {
      // Tenter d'ouvrir l'application native ou le navigateur web sécurisé
      if ((window as any).electronAPI.openExternal) {
        (window as any).electronAPI.openExternal(url);
        return true;
      }
    }

    // Comportement standard pour le SaaS Web
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }

  /**
   * Enregistre un historique d'envoi dans le stockage local / sync
   */
  public static saveShareHistory(merchantId: string, item: Omit<ShareHistoryItem, 'id' | 'timestamp' | 'date'>): ShareHistoryItem {
    const historyKey = `tailleur_share_history_${merchantId}`;
    const saved = localStorage.getItem(historyKey);
    const existingHistory: ShareHistoryItem[] = saved ? JSON.parse(saved) : [];

    const newItem: ShareHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      timestamp: Date.now()
    };

    const updatedHistory = [newItem, ...existingHistory];
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));

    return newItem;
  }

  /**
   * Récupère l'historique des partages pour une commande spécifique
   */
  public static getShareHistoryForOrder(merchantId: string, orderId: string): ShareHistoryItem[] {
    try {
      const historyKey = `tailleur_share_history_${merchantId}`;
      const saved = localStorage.getItem(historyKey);
      const history: ShareHistoryItem[] = saved ? JSON.parse(saved) : [];
      return history.filter(h => h.orderId === orderId);
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  /**
   * Récupère tout l'historique des partages pour le marchand
   */
  public static getAllShareHistory(merchantId: string): ShareHistoryItem[] {
    try {
      const historyKey = `tailleur_share_history_${merchantId}`;
      const saved = localStorage.getItem(historyKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }
}
