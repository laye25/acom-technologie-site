import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  X, Search, Users, UserCheck, CheckCircle2, AlertCircle, 
  Send, FileText, Image as ImageIcon, MessageSquare, History, 
  Clock, Check, Eye, AlertTriangle, ChevronRight, Scissors, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { 
  WhatsAppCommandeMesureService, 
  ArtisanRecipient, 
  ArtisanTeam, 
  ShareHistoryItem, 
  OrderAttachment 
} from '../services/WhatsAppCommandeMesureService';

interface Merchant {
  id: string;
  name: string;
  phone?: string;
  currency?: string;
}

interface WhatsAppShareModalProps {
  order: any;
  merchant: Merchant;
  currentUser?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  order,
  merchant,
  currentUser = 'Atelier',
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'recipients' | 'preview' | 'history'>('recipients');
  const [recipientType, setRecipientType] = useState<'artisans' | 'teams'>('artisans');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [artisans, setArtisans] = useState<ArtisanRecipient[]>([]);
  const [teams, setTeams] = useState<ArtisanTeam[]>([]);
  const [selectedArtisanIds, setSelectedArtisanIds] = useState<string[]>([]);
  
  const [customNote, setCustomNote] = useState('');
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [history, setHistory] = useState<ShareHistoryItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showPreviewText, setShowPreviewText] = useState(false);

  // Charger les données
  useEffect(() => {
    if (isOpen && order) {
      const fetchedArtisans = WhatsAppCommandeMesureService.getArtisans(merchant.id);
      const fetchedTeams = WhatsAppCommandeMesureService.getTeams(merchant.id);
      const extractedAtt = WhatsAppCommandeMesureService.extractAttachments(order);
      const fetchedHistory = WhatsAppCommandeMesureService.getShareHistoryForOrder(merchant.id, order.id);

      setArtisans(fetchedArtisans);
      setTeams(fetchedTeams);
      setAttachments(extractedAtt);
      setHistory(fetchedHistory);
      setSelectedArtisanIds([]);
      setCustomNote('');
      setActiveTab('recipients');
    }
  }, [isOpen, order, merchant.id]);

  // Filtrer les artisans selon la recherche
  const filteredArtisans = useMemo(() => {
    return artisans.filter(art => {
      const q = searchQuery.toLowerCase();
      return (
        art.name.toLowerCase().includes(q) ||
        art.specialty.toLowerCase().includes(q) ||
        (art.team && art.team.toLowerCase().includes(q)) ||
        (art.atelier && art.atelier.toLowerCase().includes(q))
      );
    });
  }, [artisans, searchQuery]);

  // Modèle du message généré pour le premier artisan sélectionné (ou exemple)
  const sampleArtisan = useMemo(() => {
    return artisans.find(a => selectedArtisanIds.includes(a.id)) || artisans[0];
  }, [artisans, selectedArtisanIds]);

  const generatedMessage = useMemo(() => {
    if (!order) return '';
    return WhatsAppCommandeMesureService.generateWhatsAppMessage({
      order,
      merchant,
      artisan: sampleArtisan,
      customNote
    });
  }, [order, merchant, sampleArtisan, customNote]);

  // Gestion de la sélection d'un artisan
  const toggleSelectArtisan = (artisanId: string) => {
    const art = artisans.find(a => a.id === artisanId);
    if (art && !art.isValidNumber) {
      toast.error(`Numéro invalide pour ${art.name}: ${art.validationError || 'Vérifiez les coordonnées'}`);
      return;
    }

    if (selectedArtisanIds.includes(artisanId)) {
      setSelectedArtisanIds(selectedArtisanIds.filter(id => id !== artisanId));
    } else {
      setSelectedArtisanIds([...selectedArtisanIds, artisanId]);
    }
  };

  // Sélectionner / désélectionner tous les artisans d'une équipe
  const toggleSelectTeam = (team: ArtisanTeam) => {
    const validTeamArtisanIds = team.artisans.filter(a => a.isValidNumber).map(a => a.id);
    const allSelected = validTeamArtisanIds.every(id => selectedArtisanIds.includes(id));

    if (allSelected) {
      setSelectedArtisanIds(selectedArtisanIds.filter(id => !validTeamArtisanIds.includes(id)));
    } else {
      const newSelected = Array.from(new Set([...selectedArtisanIds, ...validTeamArtisanIds]));
      setSelectedArtisanIds(newSelected);
      if (validTeamArtisanIds.length < team.artisans.length) {
        toast.error(`Certains membres de l'équipe "${team.name}" n'ont pas de numéro valide.`);
      }
    }
  };

  // Sélectionner tous les artisans valides
  const handleSelectAll = () => {
    const validIds = artisans.filter(a => a.isValidNumber).map(a => a.id);
    setSelectedArtisanIds(validIds);
  };

  const handleDeselectAll = () => {
    setSelectedArtisanIds([]);
  };

  // Exécution de l'envoi WhatsApp
  const handleSendWhatsApp = async () => {
    if (selectedArtisanIds.length === 0) {
      toast.error('Veuillez sélectionner au moins un artisan ou une équipe.');
      return;
    }

    setIsSending(true);
    let successCount = 0;
    let failCount = 0;

    const selectedArtisans = artisans.filter(a => selectedArtisanIds.includes(a.id));

    for (const artisan of selectedArtisans) {
      try {
        const msg = WhatsAppCommandeMesureService.generateWhatsAppMessage({
          order,
          merchant,
          artisan,
          customNote
        });

        const success = WhatsAppCommandeMesureService.openWhatsAppChat(artisan.whatsApp || artisan.phone, msg);

        if (success) {
          successCount++;
          WhatsAppCommandeMesureService.saveShareHistory(merchant.id, {
            orderId: order.id,
            orderRef: `CMD-${order.id?.slice(0, 8).toUpperCase()}`,
            userName: currentUser,
            artisanId: artisan.id,
            artisanName: artisan.name,
            artisanRole: artisan.specialty,
            whatsAppNumber: artisan.formattedNumber,
            filesCount: attachments.length,
            attachedFilesSummary: attachments.map(a => a.name),
            channel: 'WhatsApp',
            status: 'Envoyé'
          });
        } else {
          failCount++;
          WhatsAppCommandeMesureService.saveShareHistory(merchant.id, {
            orderId: order.id,
            orderRef: `CMD-${order.id?.slice(0, 8).toUpperCase()}`,
            userName: currentUser,
            artisanId: artisan.id,
            artisanName: artisan.name,
            artisanRole: artisan.specialty,
            whatsAppNumber: artisan.formattedNumber,
            filesCount: attachments.length,
            channel: 'WhatsApp',
            status: 'Échec',
            errorMessage: 'Numéro invalide ou échec du navigateur'
          });
        }
      } catch (err: any) {
        failCount++;
        console.error(err);
      }
    }

    setIsSending(false);

    if (successCount > 0) {
      toast.success(`Partage WhatsApp initié pour ${successCount} artisan(s) ! 🚀`);
      // Recharger l'historique
      const updatedHistory = WhatsAppCommandeMesureService.getShareHistoryForOrder(merchant.id, order.id);
      setHistory(updatedHistory);
      if (onSuccess) onSuccess();
    }

    if (failCount > 0) {
      toast.error(`Échec pour ${failCount} destinataire(s). Vérifiez les numéros.`);
    }
  };

  if (!isOpen || !order) return null;

  const orderRef = `CMD-${order.id?.slice(0, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 text-left"
      >
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Partager la Commande aux Artisans</h3>
                <span className="bg-emerald-500/40 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-white/20 uppercase">
                  WhatsApp
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium mt-0.5 flex items-center gap-2">
                <span>Réf : <strong className="font-mono text-white">{orderRef}</strong></span>
                <span>•</span>
                <span>Client : <strong>{order.clientName}</strong></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details Quick Header Bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-emerald-600" />
              {order.model}
            </span>
            {order.tissuUsed && (
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 font-semibold text-[11px]">
                🧵 {order.tissuUsed}
              </span>
            )}
            <span className="text-slate-500 font-medium">
              📅 Livraison : <strong className="text-slate-800">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('fr-FR') : 'Non définie'}</strong>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {order.isUrgent ? (
              <span className="bg-rose-100 text-rose-700 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                🚨 Urgent
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-700 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Priorité Normale
              </span>
            )}
            <span className="bg-violet-100 text-violet-700 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase">
              {attachments.length} Fichier(s) joint(s)
            </span>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="px-6 pt-3 bg-white border-b border-slate-100 flex gap-2">
          <button
            onClick={() => setActiveTab('recipients')}
            className={`pb-3 px-4 text-xs font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'recipients'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Sélection Destinataires ({selectedArtisanIds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-3 px-4 text-xs font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'preview'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Aperçu du Message & Mesures</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-xs font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historique des Partages ({history.length})</span>
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'recipients' && (
            <div className="space-y-5">
              {/* Type Switcher & Search */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="bg-slate-100 p-1 rounded-2xl flex border border-slate-200 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setRecipientType('artisans')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      recipientType === 'artisans'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Artisans Individuels ({artisans.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('teams')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      recipientType === 'teams'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Équipes & Ateliers ({teams.length})
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Rechercher un artisan ou spécialité..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-transparent text-xs font-medium text-slate-800 outline-none w-full"
                    />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-2 rounded-xl cursor-pointer"
                    >
                      Tout
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-[10px] font-extrabold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-2 rounded-xl cursor-pointer"
                    >
                      Aucun
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions ou Note Personnalisée */}
              <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl space-y-2">
                <label className="block text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Consignes / Instructions d'atelier spécifiques (Optionnel)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex : Attention à bien respecter la découpe de la broderie sur l'épaule gauche et vérifier le repassage..."
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* View 1: Artisans List */}
              {recipientType === 'artisans' && (
                <div className="space-y-3">
                  {filteredArtisans.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600">Aucun artisan trouvé</p>
                      <p className="text-[11px] text-slate-400">Ajoutez des artisans dans l'onglet 'Artisans & Équipes'</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                      {filteredArtisans.map((art) => {
                        const isSelected = selectedArtisanIds.includes(art.id);
                        
                        return (
                          <div
                            key={art.id}
                            onClick={() => toggleSelectArtisan(art.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              !art.isValidNumber
                                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                                : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!art.isValidNumber}
                                onChange={() => {}} // Handled by container onClick
                                className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 text-xs truncate leading-snug">
                                  {art.name}
                                </p>
                                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                  {art.specialty}
                                </p>
                                <p className="text-[11px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                                  <span>📞 {art.formattedNumber || art.phone || 'Aucun numéro'}</span>
                                </p>
                                {art.team && (
                                  <span className="inline-block mt-1 text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                                    {art.team}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                  art.status === 'Disponible'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : art.status === 'Occupé'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {art.status}
                              </span>

                              {!art.isValidNumber && (
                                <span className="text-[9px] text-rose-600 font-bold flex items-center gap-0.5 mt-1">
                                  <AlertCircle className="w-3 h-3" /> Numéro invalide
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* View 2: Teams List */}
              {recipientType === 'teams' && (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {teams.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600">Aucune équipe définie</p>
                    </div>
                  ) : (
                    teams.map((team) => {
                      const validArtisanIds = team.artisans.filter(a => a.isValidNumber).map(a => a.id);
                      const isTeamFullySelected = validArtisanIds.length > 0 && validArtisanIds.every(id => selectedArtisanIds.includes(id));
                      const isTeamPartiallySelected = validArtisanIds.some(id => selectedArtisanIds.includes(id)) && !isTeamFullySelected;

                      return (
                        <div key={team.id} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                                <Layers className="w-4 h-4 text-emerald-600" />
                                {team.name}
                                <span className="text-[10px] text-slate-500 font-mono">({team.artisans.length} membres)</span>
                              </h4>
                              <p className="text-[10px] text-slate-400">{team.atelier}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleSelectTeam(team)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                isTeamFullySelected
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : isTeamPartiallySelected
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isTeamFullySelected ? 'Équipe sélectionnée' : 'Sélectionner l\'équipe'}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {team.artisans.map((art) => {
                              const isArtSelected = selectedArtisanIds.includes(art.id);
                              return (
                                <div
                                  key={art.id}
                                  onClick={() => toggleSelectArtisan(art.id)}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer ${
                                    isArtSelected
                                      ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950'
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <input
                                      type="checkbox"
                                      checked={isArtSelected}
                                      onChange={() => {}}
                                      className="w-3.5 h-3.5 text-emerald-600 rounded"
                                    />
                                    <span className="truncate">{art.name} ({art.specialty})</span>
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-400 shrink-0">{art.formattedNumber}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Preview Message */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Message WhatsApp Formaté & Structured
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedMessage);
                    toast.success('Texte copié dans le presse-papier !');
                  }}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
                >
                  Copier le texte
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto border border-slate-800 shadow-inner">
                {generatedMessage}
              </div>

              {/* Visuels et Fichiers joints de la commande */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Pièces Jointes & Fichiers Associés ({attachments.length})
                </h4>

                {attachments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucune image ou croquis directement joint à cette commande.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((att) => (
                      <div key={att.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
                        {att.type === 'image' || att.type === 'sketch' ? (
                          <img src={att.url} alt={att.name} className="w-12 h-12 rounded-lg object-cover border shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-slate-800 truncate">{att.name}</p>
                          <a href={att.url} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 font-bold hover:underline truncate block">
                            Ouvrir le fichier
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Share History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Historique des Envois pour la commande {orderRef}
                </h4>
                <span className="text-xs font-mono text-slate-400">{history.length} envoi(s)</span>
              </div>

              {history.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Aucun historique de partage pour l'instant</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sélectionnez des artisans et cliquez sur 'Partager via WhatsApp' pour effectuer le premier envoi.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          item.status === 'Envoyé' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">
                            Envoyé à : <strong className="text-emerald-700">{item.artisanName}</strong>
                            {item.artisanRole && <span className="text-slate-400 font-normal"> ({item.artisanRole})</span>}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                            N° : {item.whatsAppNumber} • {item.filesCount} fichier(s) joint(s) • Par {item.userName}
                          </p>
                          {item.errorMessage && (
                            <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                              ⚠️ {item.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                          item.status === 'Envoyé' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(item.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {selectedArtisanIds.length > 0 ? (
              <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {selectedArtisanIds.length} artisan(s) sélectionné(s) prêt(s) pour envoi.
              </span>
            ) : (
              <span>Choisissez un ou plusieurs artisans destinataires pour continuer.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              Fermer
            </button>

            <button
              type="button"
              disabled={selectedArtisanIds.length === 0 || isSending}
              onClick={handleSendWhatsApp}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                selectedArtisanIds.length === 0 || isSending
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 hover:scale-[1.02]'
              }`}
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Partager via WhatsApp ({selectedArtisanIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
