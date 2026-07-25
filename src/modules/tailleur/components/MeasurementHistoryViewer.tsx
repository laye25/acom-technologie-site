import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  History, Clock, Calendar, Plus, Trash2, 
  TrendingUp, TrendingDown, Minus, ArrowRightLeft, Sparkles, User
} from 'lucide-react';
import { 
  MeasurementHistoryService, 
  MeasurementProfile, 
  MeasurementComparisonItem 
} from '../services/MeasurementHistoryService';
import { MeasurementLibraryService } from '../services/MeasurementLibraryService';

interface MeasurementHistoryViewerProps {
  merchantId: string;
  clientId: string;
  clientName: string;
  gender: 'Homme' | 'Femme';
  currentMeasurements: Record<string, number | string>;
  onLoadProfile: (profile: MeasurementProfile) => void;
}

export const MeasurementHistoryViewer: React.FC<MeasurementHistoryViewerProps> = ({
  merchantId,
  clientId,
  clientName,
  gender,
  currentMeasurements,
  onLoadProfile
}) => {
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Profile comparison selection
  const [compareProfile1, setCompareProfile1] = useState<MeasurementProfile | null>(null);
  const [compareProfile2, setCompareProfile2] = useState<MeasurementProfile | null>(null);

  useEffect(() => {
    if (merchantId && clientId) {
      const fetched = MeasurementHistoryService.getProfilesForClient(merchantId, clientId);
      setProfiles(fetched);
    }
  }, [merchantId, clientId]);

  const handleSaveSnapshot = () => {
    if (!newProfileName.trim()) {
      toast.error('Entrez un nom de profil (ex: Tenue Tabaski 2026, Costume).');
      return;
    }

    // Sanitize numeric values
    const numeric: Record<string, number> = {};
    Object.entries(currentMeasurements).forEach(([k, v]) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
      if (!isNaN(num) && num > 0) {
        numeric[k] = num;
      }
    });

    if (Object.keys(numeric).length === 0) {
      toast.error('Aucune mesure valide à enregistrer dans l’historique.');
      return;
    }

    setIsSaving(true);

    const saved = MeasurementHistoryService.saveProfile(merchantId, {
      clientId,
      clientName,
      profileName: newProfileName.trim(),
      gender,
      measurements: numeric
    });

    const updated = MeasurementHistoryService.getProfilesForClient(merchantId, clientId);
    setProfiles(updated);
    setNewProfileName('');
    setIsSaving(false);
    toast.success(`Profil "${saved.profileName}" archivé dans l’historique ! 📜`);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (window.confirm('Supprimer ce profil d’historique ?')) {
      MeasurementHistoryService.deleteProfile(merchantId, profileId);
      const updated = MeasurementHistoryService.getProfilesForClient(merchantId, clientId);
      setProfiles(updated);
      toast.success('Profil archivé supprimé.');
    }
  };

  // Measurement Labels map for comparison
  const measurementLabels = React.useMemo(() => {
    const map: Record<string, string> = {};
    MeasurementLibraryService.getAllMeasurements().forEach((m) => {
      map[m.key] = m.label;
    });
    return map;
  }, []);

  const comparisonItems: MeasurementComparisonItem[] = React.useMemo(() => {
    if (!compareProfile1 || !compareProfile2) return [];
    return MeasurementHistoryService.compareProfiles(
      compareProfile1,
      compareProfile2,
      measurementLabels
    );
  }, [compareProfile1, compareProfile2, measurementLabels]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-5 text-left shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">
            Historique & Évolution des Mesures
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500 font-bold">
          {profiles.length} profil(s) enregistré(s)
        </span>
      </div>

      {/* Form: Archiver les mesures actuelles */}
      <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center gap-2.5">
        <input
          type="text"
          placeholder="Ex : Tenue Aïd / Tabaski 2026, Costume..."
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          className="flex-1 p-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-800 outline-none w-full"
        />
        <button
          type="button"
          onClick={handleSaveSnapshot}
          disabled={isSaving}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shrink-0 w-full sm:w-auto shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 inline mr-1" />
          Archiver ces Mesures
        </button>
      </div>

      {/* Timeline of profiles */}
      {profiles.length === 0 ? (
        <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
          Aucun historique de prise de mesure pour ce client. Entrez un nom ci-dessus pour archiver la première fiche.
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
            Profils Antérieurs
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-2 hover:border-emerald-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs">{p.profileName}</h5>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.date).toLocaleDateString('fr-FR')} à {new Date(p.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteProfile(p.id)}
                    className="p-1 hover:bg-rose-100 text-rose-500 rounded-lg transition"
                    title="Supprimer ce profil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                  <span className="font-mono text-[11px] text-slate-500">
                    {Object.keys(p.measurements || {}).length} mesures
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onLoadProfile(p)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer"
                    >
                      Charger
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!compareProfile1) setCompareProfile1(p);
                        else setCompareProfile2(p);
                      }}
                      className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Comparer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Drawer / Panel */}
      {compareProfile1 && compareProfile2 && (
        <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h4 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4" />
              Comparaison : {compareProfile1.profileName} VS {compareProfile2.profileName}
            </h4>
            <button
              type="button"
              onClick={() => {
                setCompareProfile1(null);
                setCompareProfile2(null);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white"
            >
              Fermer
            </button>
          </div>

          <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
            {comparisonItems.map((item) => (
              <div
                key={item.key}
                className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px]"
              >
                <span className="font-sans font-bold text-slate-200">{item.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{item.oldValue ?? '—'} cm</span>
                  <span className="text-slate-600">➔</span>
                  <span className="text-white font-bold">{item.newValue ?? '—'} cm</span>

                  {item.delta !== null && item.delta !== 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                        item.delta > 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {item.delta > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {item.delta > 0 ? `+${item.delta}` : item.delta} cm
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
