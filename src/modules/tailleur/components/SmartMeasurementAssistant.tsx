import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  Ruler, Sparkles, X, Check, Save, User, Shirt, 
  ChevronRight, ChevronLeft, ShieldCheck, CheckCircle2,
  Phone, Mail, MapPin, FileText, Scissors, AlertCircle, BookmarkCheck
} from 'lucide-react';
import { GenderType, MeasurementLibraryService } from '../services/MeasurementLibraryService';
import { GarmentLibraryService, GarmentDefinition } from '../services/GarmentLibraryService';
import { GarmentResolverService } from '../services/GarmentResolverService';
import { MeasurementValidationService, ValidationResult } from '../services/MeasurementValidationService';
import { MeasurementGuideViewer, ExtendedGenderType } from './MeasurementGuideViewer';
import { MeasurementForm } from './MeasurementForm';
import { GarmentSelector } from './GarmentSelector';
import { GarmentVectorIcon } from './GarmentVectorIcon';

export interface SmartMeasurementAssistantProps {
  merchantId: string;
  initialClientData?: any;
  isOpen?: boolean;
  onClose?: () => void;
  onSaveClient?: (savedClientData: any) => void;
}

export const SmartMeasurementAssistant: React.FC<SmartMeasurementAssistantProps> = ({
  merchantId,
  initialClientData = null,
  isOpen = true,
  onClose,
  onSaveClient
}) => {
  // 1. Current Step State (1: Client Info, 2: Garment Model, 3: Measurements & Silhouette, 4: Quality Check, 5: Summary)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // 2. Client General Information State
  const [clientInfo, setClientInfo] = useState({
    id: initialClientData?.id || '',
    firstName: initialClientData?.firstName || '',
    lastName: initialClientData?.lastName || '',
    gender: (initialClientData?.gender === 'F' ? 'F' : initialClientData?.gender === 'E' ? 'E' : 'M') as 'M' | 'F' | 'E',
    phone: initialClientData?.phone || '',
    email: initialClientData?.email || '',
    address: initialClientData?.address || '',
    notes: initialClientData?.notes || ''
  });

  // 3. Selected Garment Model State
  const [selectedGarment, setSelectedGarment] = useState<GarmentDefinition>(() => {
    if (initialClientData) {
      const resolved = GarmentResolverService.resolveClientGarment(initialClientData, merchantId);
      return resolved.definition;
    }
    const list = GarmentLibraryService.getGarments(merchantId);
    return list.find((g) => g.id === 'garment-ensemble-africain') || list[0];
  });

  // 4. Measurements State
  const [currentMeasurements, setCurrentMeasurements] = useState<Record<string, number | string>>(() => {
    return initialClientData?.measurements || {};
  });

  // Active field key for silhouette sync
  const [activeMeasurementKey, setActiveMeasurementKey] = useState<string | null>('poitrine');

  // Sync initialClientData when prop changes
  useEffect(() => {
    if (initialClientData) {
      setClientInfo({
        id: initialClientData.id || '',
        firstName: initialClientData.firstName || '',
        lastName: initialClientData.lastName || '',
        gender: initialClientData.gender === 'F' ? 'F' : initialClientData.gender === 'E' ? 'E' : 'M',
        phone: initialClientData.phone || '',
        email: initialClientData.email || '',
        address: initialClientData.address || '',
        notes: initialClientData.notes || ''
      });

      const resolved = GarmentResolverService.resolveClientGarment(initialClientData, merchantId);
      setSelectedGarment(resolved.definition);
      setCurrentMeasurements(initialClientData.measurements || {});
    }
  }, [initialClientData, merchantId]);

  // Extended gender for Silhouette SVG mapping
  const extendedGender: ExtendedGenderType = useMemo(() => {
    if (clientInfo.gender === 'F') return 'Femme';
    if (clientInfo.gender === 'E') return 'Enfant';
    return 'Homme';
  }, [clientInfo.gender]);

  // Real-time measurement validation
  const validationResult: ValidationResult = useMemo(() => {
    return MeasurementValidationService.validate(currentMeasurements, selectedGarment);
  }, [currentMeasurements, selectedGarment]);

  if (!isOpen) return null;

  // Final submit handler
  const handleFinalSave = () => {
    if (!clientInfo.firstName.trim() || !clientInfo.lastName.trim()) {
      toast.error('Veuillez renseigner au moins le prénom et le nom du client.');
      setCurrentStep(1);
      return;
    }

    const clientPayload = {
      id: clientInfo.id || `client-${Date.now()}`,
      firstName: clientInfo.firstName.trim(),
      lastName: clientInfo.lastName.trim(),
      gender: clientInfo.gender,
      phone: clientInfo.phone.trim(),
      email: clientInfo.email.trim(),
      address: clientInfo.address.trim(),
      preferredGarment: selectedGarment.name,
      garmentId: selectedGarment.id,
      garmentName: selectedGarment.name,
      category: selectedGarment.category,
      measurements: currentMeasurements,
      notes: clientInfo.notes.trim(),
      updatedAt: new Date().toISOString()
    };

    if (onSaveClient) {
      onSaveClient(clientPayload);
    }
    toast.success(`Fiche client pour ${clientPayload.firstName} ${clientPayload.lastName} enregistrée avec succès ! ✂️`);
    if (onClose) onClose();
  };

  const stepsConfig = [
    { id: 1, label: 'Informations Client', icon: User },
    { id: 2, label: 'Choix du Vêtement', icon: Shirt },
    { id: 3, label: 'Prise de Mesures', icon: Ruler },
    { id: 4, label: 'Validation Atelier', icon: ShieldCheck },
    { id: 5, label: 'Résumé & Finalisation', icon: CheckCircle2 }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col h-screen w-screen overflow-hidden text-left">
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.99 }}
        className="bg-slate-900 text-slate-100 w-full h-full flex flex-col overflow-hidden"
      >
        {/* Fullscreen Top Header */}
        <div className="px-6 py-3.5 bg-slate-950 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
              <Scissors className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Moteur Intelligent de Prise de Mesures
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border border-emerald-500/30">
                  Acom Tailleur v2.5
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Parcours unifié : {clientInfo.firstName || clientInfo.lastName ? `${clientInfo.firstName} ${clientInfo.lastName}` : 'Nouveau Client Sur-Mesure'}
              </p>
            </div>
          </div>

          {/* Navigation Steps Tabs Header */}
          <div className="hidden md:flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {stepsConfig.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                      : isCompleted
                      ? 'text-emerald-400 hover:text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{step.id}. {step.label}</span>
                  {isCompleted && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 5 ? (
              <button
                type="button"
                onClick={handleFinalSave}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer la Fiche Client</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1) as any)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Étape Suivante</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer border border-slate-700"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Indicator */}
        <div className="md:hidden bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-bold">
          <span>Étape {currentStep} sur 5 : {stepsConfig[currentStep - 1].label}</span>
          <div className="flex gap-1">
            {currentStep > 1 && (
              <button onClick={() => setCurrentStep((prev) => (prev - 1) as any)} className="px-2 py-1 bg-slate-800 text-white rounded-lg">Précédent</button>
            )}
            {currentStep < 5 && (
              <button onClick={() => setCurrentStep((prev) => (prev + 1) as any)} className="px-2 py-1 bg-emerald-500 text-slate-950 rounded-lg">Suivant</button>
            )}
          </div>
        </div>

        {/* Fullscreen Body Content per Step */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/80">
          <AnimatePresence mode="wait">
            {/* STEP 1: INFORMATIONS CLIENT */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="max-w-3xl mx-auto bg-slate-950/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6"
              >
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                    Étape 1 sur 5
                  </span>
                  <h3 className="text-xl font-black text-white flex items-center gap-2 mt-1">
                    <User className="w-6 h-6 text-emerald-400" />
                    Informations Générales du Client
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Renseignez les coordonnées de la personne pour l'attribution des mensurations et le suivi d'atelier.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Prénom *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Amadou"
                      value={clientInfo.firstName}
                      onChange={(e) => setClientInfo({ ...clientInfo, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-medium text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Nom de Famille *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Diallo"
                      value={clientInfo.lastName}
                      onChange={(e) => setClientInfo({ ...clientInfo, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-medium text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Sexe Selection - Synchronizes Silhouette in Step 3! */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Genre / Silhouette d'Atelier *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setClientInfo({ ...clientInfo, gender: 'M' })}
                        className={`p-3.5 rounded-2xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                          clientInfo.gender === 'M'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-base">👨</span>
                        <span>Homme</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setClientInfo({ ...clientInfo, gender: 'F' })}
                        className={`p-3.5 rounded-2xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                          clientInfo.gender === 'F'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-base">👩</span>
                        <span>Femme</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setClientInfo({ ...clientInfo, gender: 'E' })}
                        className={`p-3.5 rounded-2xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                          clientInfo.gender === 'E'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-base">🧒</span>
                        <span>Enfant</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: +221 77 000 00 00"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-medium text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      Adresse Email
                    </label>
                    <input
                      type="email"
                      placeholder="Ex: client@example.com"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-medium text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      Adresse de livraison / Quartier
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Dakar, Mermoz Pyrotechnie VDN"
                      value={clientInfo.address}
                      onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-medium text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      Notes & Préférences Morphologiques
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Préfère les vêtements amples au niveau de la taille, tissu Bazin riche..."
                      value={clientInfo.notes}
                      onChange={(e) => setClientInfo({ ...clientInfo, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-medium text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!clientInfo.firstName.trim() || !clientInfo.lastName.trim()) {
                        toast.error('Veuillez renseigner le prénom et le nom.');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <span>Continuer : Choix du Vêtement</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: CHOIX DU VÊTEMENT & MODÈLE */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="max-w-4xl mx-auto bg-slate-950/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6"
              >
                <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                      Étape 2 sur 5
                    </span>
                    <h3 className="text-xl font-black text-white flex items-center gap-2 mt-1">
                      <Shirt className="w-6 h-6 text-emerald-400" />
                      Modèle & Vêtement à Confectionner
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Sélectionnez le modèle cible pour charger automatiquement son profil de mesures d'atelier.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
                    <GarmentVectorIcon
                      id={selectedGarment.id}
                      name={selectedGarment.name}
                      category={selectedGarment.category}
                      className="w-8 h-8 text-emerald-400"
                    />
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                        Modèle Actif
                      </span>
                      <span className="text-xs font-black text-white">{selectedGarment.name}</span>
                    </div>
                  </div>
                </div>

                {/* Garment Selector Component */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
                  <GarmentSelector
                    merchantId={merchantId}
                    selectedGarmentId={selectedGarment.id}
                    onSelectGarment={(g) => {
                      setSelectedGarment(g);
                      toast.success(`Modèle sélectionné : ${g.name}`);
                    }}
                  />
                </div>

                {/* Selected Garment Details Card */}
                <div className="bg-emerald-950/30 border border-emerald-800/50 p-4 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30">
                        🏷️ {selectedGarment.category}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700">
                        👤 {selectedGarment.gender}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 pt-1">
                      Profil de mesures chargé : <strong className="text-white font-mono">{selectedGarment.mandatoryMeasurements.length}</strong> mesures requises et <strong className="text-white font-mono">{selectedGarment.optionalMeasurements.length}</strong> facultatives.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <span>Lancer la Prise de Mesures</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PRISE DE MESURES & SILHOUETTE DYNAMIQUE */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px]"
              >
                {/* Left Column: Interactive Vector Silhouette + Technique Guide (5 Cols) */}
                <div className="lg:col-span-5 h-full overflow-y-auto pr-1">
                  <MeasurementGuideViewer
                    gender={extendedGender === 'Enfant' ? 'Mixte' : extendedGender}
                    onGenderChange={(g) => {
                      setClientInfo({ ...clientInfo, gender: g === 'Femme' ? 'F' : 'M' });
                    }}
                    activeMeasurementKey={activeMeasurementKey}
                    onSelectMeasurementKey={(key) => setActiveMeasurementKey(key)}
                    currentValues={currentMeasurements}
                    selectedGarment={selectedGarment}
                  />
                </div>

                {/* Right Column: Dynamic Form Inputs + Realtime Validation (7 Cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto h-full text-slate-900 dark:text-slate-100">
                  <MeasurementForm
                    merchantId={merchantId}
                    clientId={clientInfo.id}
                    clientName={`${clientInfo.firstName} ${clientInfo.lastName}`.trim() || 'Client Sur-Mesure'}
                    initialGender={extendedGender === 'Enfant' ? 'Mixte' : extendedGender}
                    initialMeasurements={currentMeasurements}
                    selectedGarment={selectedGarment}
                    onSelectGarment={(garment) => setSelectedGarment(garment)}
                    onChangeGarmentRequested={() => setCurrentStep(2)}
                    activeMeasurementKey={activeMeasurementKey}
                    onActiveFieldChange={(key) => setActiveMeasurementKey(key)}
                    onMeasurementsChange={(newVals) => {
                      setCurrentMeasurements(newVals);
                    }}
                  />

                  <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Changer de Vêtement</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-900/20"
                    >
                      <span>Vérification & Validation</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: VALIDATION ATELIER & CONTRÔLE QUALITÉ */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="max-w-3xl mx-auto bg-slate-950/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6"
              >
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                    Étape 4 sur 5
                  </span>
                  <h3 className="text-xl font-black text-white flex items-center gap-2 mt-1">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    Contrôle Qualité & Conformité Atelier
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Le moteur intelligent vérifie la complétude des mesures et détecte d'éventuelles incohérences anatomiques.
                  </p>
                </div>

                {/* Validation Status Card */}
                <div className={`p-6 rounded-2xl border ${
                  validationResult.isValid
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-100'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-2xl border ${
                      validationResult.isValid
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {validationResult.isValid ? (
                        <CheckCircle2 className="w-8 h-8 animate-bounce" />
                      ) : (
                        <AlertCircle className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">
                        {validationResult.isValid
                          ? '✓ Toutes les mesures requis sont valides et cohérentes'
                          : 'Attention : Des mesures requises sont manquantes ou incomplètes'}
                      </h4>
                      <p className="text-xs text-slate-300">
                        Modèle de référence : <strong className="text-white">{selectedGarment.name}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Missing Mandatory Fields List */}
                  {validationResult.missingMandatoryKeys.length > 0 && (
                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 mt-3">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                        Mesures Manquantes ({validationResult.missingMandatoryKeys.length}) :
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {validationResult.missingMandatoryKeys.map((key) => {
                          const def = MeasurementLibraryService.getByKey(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setActiveMeasurementKey(key);
                                setCurrentStep(3);
                              }}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <span>{def?.label || key}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Warnings & Suggestions */}
                  {validationResult.alerts.length > 0 && (
                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 mt-3">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                        Avertissements & Recommandations :
                      </span>
                      <ul className="space-y-1 text-xs text-amber-200/90">
                        {validationResult.alerts.map((a) => (
                          <li key={a.id} className="flex items-start gap-2">
                            <span>•</span>
                            <span><strong>{a.fieldLabel}:</strong> {a.message} {a.recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Compléter dans la Prise de Mesures</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <span>Voir le Résumé Final</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: RÉSUMÉ & FINALISATION FICHE CLIENT */}
            {currentStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="max-w-4xl mx-auto bg-slate-950/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6"
              >
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                    Étape 5 sur 5 — Résumé
                  </span>
                  <h3 className="text-xl font-black text-white flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    Synthèse & Création de la Fiche Client
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Vérifiez le résumé des informations avant la sauvegarde définitive.
                  </p>
                </div>

                {/* Recap Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Client Recap */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Identité Client
                    </h4>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <p className="text-base font-black text-white">
                        {clientInfo.firstName} {clientInfo.lastName}
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-400">
                        <span>Genre :</span>
                        <strong className="text-white">
                          {clientInfo.gender === 'F' ? 'Femme' : clientInfo.gender === 'E' ? 'Enfant' : 'Homme'}
                        </strong>
                      </p>
                      {clientInfo.phone && <p>📞 {clientInfo.phone}</p>}
                      {clientInfo.email && <p>✉️ {clientInfo.email}</p>}
                      {clientInfo.address && <p>📍 {clientInfo.address}</p>}
                    </div>
                  </div>

                  {/* Garment Model Recap */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                      <Shirt className="w-4 h-4" />
                      Vêtement Sélectionné
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-400 border border-slate-700">
                        <GarmentVectorIcon
                          id={selectedGarment.id}
                          name={selectedGarment.name}
                          category={selectedGarment.category}
                          className="w-7 h-7"
                        />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-white">{selectedGarment.name}</h5>
                        <p className="text-xs text-slate-400">{selectedGarment.category} — {selectedGarment.gender}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Measurements Summary Table */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      Mensurations Enregistrées ({Object.keys(currentMeasurements).length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-xs font-bold text-emerald-400 hover:underline"
                    >
                      Modifier les mesures
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {Object.keys(currentMeasurements).map((key) => {
                      const val = currentMeasurements[key];
                      if (val === '' || val === undefined || val === null) return null;

                      return (
                        <div key={key} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-center">
                          <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold">{key}</span>
                          <span className="font-mono text-xs font-black text-emerald-400">{val} cm</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Submit Button */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition cursor-pointer"
                  >
                    Retour
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalSave}
                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-xl shadow-emerald-900/40 flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                  >
                    <Save className="w-5 h-5" />
                    <span>✓ Enregistrer la Fiche Client & Mesures</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
