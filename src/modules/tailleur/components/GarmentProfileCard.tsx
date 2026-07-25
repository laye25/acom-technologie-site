import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, Shirt, Layers, Ruler, Sparkles, CheckCircle2, 
  ChevronDown, UserCheck, Plus, BookmarkCheck
} from 'lucide-react';
import { 
  GarmentProfileDisplayService, 
  GarmentProfileDisplaySummary, 
  ClientGarmentProfileData 
} from '../services/GarmentProfileDisplayService';
import { useClientGarment } from '../hooks/useClientGarment';
import { GarmentVectorIcon } from './GarmentVectorIcon';
import { MeasurementSummaryCard } from './MeasurementSummaryCard';

interface GarmentProfileCardProps {
  clientData: any;
  merchantId?: string;
  onOpenSmartAssistant?: (garmentName?: string) => void;
  onProfileChange?: (profileId: string) => void;
  className?: string;
}

export const GarmentProfileCard: React.FC<GarmentProfileCardProps> = ({
  clientData,
  merchantId = 'default',
  onOpenSmartAssistant,
  onProfileChange,
  className = ''
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(undefined);
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  // Hook unique et réactif pour la résolution du vêtement
  const resolvedGarment = useClientGarment(clientData, merchantId, selectedProfileId);

  const summary: GarmentProfileDisplaySummary = GarmentProfileDisplayService.getProfileSummary(
    clientData,
    merchantId,
    selectedProfileId
  );

  const {
    activeProfile,
    availableProfiles,
    categoryBadgeColor
  } = summary;

  const garmentDefinition = resolvedGarment.definition;
  const totalFilledMeasurements = resolvedGarment.filledMeasurementsCount;

  const handleSwitchProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    setShowProfileSelector(false);
    if (onProfileChange) {
      onProfileChange(profileId);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-left ${className}`}>
      {/* Header Banner: Modèle & Vêtement à Confectionner */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Scissors className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
              Modèle à Confectionner
            </span>
          </div>

          {/* Profile Switcher Trigger */}
          {availableProfiles.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileSelector(!showProfileSelector)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[10px] font-bold transition flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>Profils ({availableProfiles.length})</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Profiles Dropdown Menu */}
              <AnimatePresence>
                {showProfileSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl z-30 p-1.5"
                  >
                    <span className="block px-2.5 py-1 text-[9px] font-mono text-slate-400 uppercase font-bold border-b border-slate-800 mb-1">
                      Choisir le profil actif
                    </span>
                    {availableProfiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSwitchProfile(p.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                          p.id === activeProfile.id
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate">
                          <span className="block truncate">{p.garmentName}</span>
                          <span className="text-[9px] text-slate-400 font-mono font-normal">
                            {p.category}
                          </span>
                        </div>
                        {p.id === activeProfile.id && (
                          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Main Garment Information Row */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 text-emerald-400 shrink-0 shadow-inner">
              <GarmentVectorIcon
                id={garmentDefinition.id}
                name={garmentDefinition.name}
                category={garmentDefinition.category}
                className="w-6 h-6"
              />
            </div>
            <div className="min-w-0 text-left">
              <h3 className="text-sm font-black text-white truncate tracking-tight">
                {garmentDefinition.name}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {/* Category Badge */}
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${categoryBadgeColor.bg} ${categoryBadgeColor.text} ${categoryBadgeColor.border}`}>
                  🏷️ {garmentDefinition.category}
                </span>

                {/* Target Gender Badge */}
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-[9px] font-bold border border-slate-700">
                  👤 {garmentDefinition.gender}
                </span>
              </div>
            </div>
          </div>

          {/* Measurements Counter Badge */}
          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-2xl text-right shrink-0">
            <span className="text-xs font-mono font-black block">
              📏 {totalFilledMeasurements}
            </span>
            <span className="text-[9px] font-mono text-emerald-300 font-medium block">
              mesure(s)
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Measurements Display Card Body */}
      <div className="p-3">
        <MeasurementSummaryCard
          clientMeasurements={activeProfile.measurements}
          merchantId={merchantId}
          preferredGarmentName={activeProfile.garmentName}
          onOpenSmartAssistant={() => {
            if (onOpenSmartAssistant) {
              onOpenSmartAssistant(activeProfile.garmentName);
            }
          }}
        />
      </div>
    </div>
  );
};
