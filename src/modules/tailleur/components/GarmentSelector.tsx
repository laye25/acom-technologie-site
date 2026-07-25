import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  Plus, Scissors, Layers, Check, Trash2, 
  Sparkles, X, ChevronRight, CheckCircle2, Bookmark
} from 'lucide-react';
import { 
  GarmentLibraryService, 
  GarmentDefinition, 
  GarmentCategory 
} from '../services/GarmentLibraryService';
import { MeasurementLibraryService } from '../services/MeasurementLibraryService';
import { GarmentVectorIcon } from './GarmentVectorIcon';

interface GarmentSelectorProps {
  merchantId: string;
  selectedGarmentId: string;
  onSelectGarment: (garment: GarmentDefinition) => void;
}

export const GarmentSelector: React.FC<GarmentSelectorProps> = ({
  merchantId,
  selectedGarmentId,
  onSelectGarment
}) => {
  const [garments, setGarments] = useState<GarmentDefinition[]>(() =>
    GarmentLibraryService.getGarments(merchantId)
  );

  const [activeCategory, setActiveCategory] = useState<string>('Toutes');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state pour la création d'un vêtement
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<GarmentCategory>('Couture Africaine');
  const [newGender, setNewGender] = useState<'Homme' | 'Femme' | 'Mixte'>('Mixte');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('✂️');
  const [selectedMandatoryKeys, setSelectedMandatoryKeys] = useState<string[]>(['poitrine', 'taille', 'epaule']);
  const [selectedOptionalKeys, setSelectedOptionalKeys] = useState<string[]>(['tourBras', 'poignet']);

  const allMeasurements = MeasurementLibraryService.getAllMeasurements();

  const categories = ['Toutes', 'Couture Africaine', 'Femme', 'Enfant', 'Couture Internationale'];

  const filteredGarments = garments.filter((g) => {
    if (activeCategory === 'Toutes') return true;
    return g.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const handleSelect = (garment: GarmentDefinition) => {
    onSelectGarment(garment);
  };

  const handleToggleMandatoryKey = (key: string) => {
    if (selectedMandatoryKeys.includes(key)) {
      setSelectedMandatoryKeys(selectedMandatoryKeys.filter((k) => k !== key));
    } else {
      setSelectedMandatoryKeys([...selectedMandatoryKeys, key]);
      // Retirer des optionnels si présent
      setSelectedOptionalKeys(selectedOptionalKeys.filter((k) => k !== key));
    }
  };

  const handleToggleOptionalKey = (key: string) => {
    if (selectedOptionalKeys.includes(key)) {
      setSelectedOptionalKeys(selectedOptionalKeys.filter((k) => k !== key));
    } else {
      setSelectedOptionalKeys([...selectedOptionalKeys, key]);
      // Retirer des obligatoires si présent
      setSelectedMandatoryKeys(selectedMandatoryKeys.filter((k) => k !== key));
    }
  };

  const handleSaveCustomGarment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Veuillez entrer le nom du vêtement.');
      return;
    }
    if (selectedMandatoryKeys.length === 0) {
      toast.error('Sélectionnez au moins une mesure obligatoire.');
      return;
    }

    const created = GarmentLibraryService.createCustomGarment(merchantId, {
      name: newName.trim(),
      category: newCategory,
      gender: newGender,
      description: newDescription.trim() || 'Modèle personnalisé créé par l’atelier.',
      mandatoryMeasurements: selectedMandatoryKeys,
      optionalMeasurements: selectedOptionalKeys,
      icon: newIcon || '✂️'
    });

    const updatedList = GarmentLibraryService.getGarments(merchantId);
    setGarments(updatedList);
    onSelectGarment(created);

    setIsCreateModalOpen(false);
    toast.success(`Nouveau modèle "${created.name}" créé avec succès ! 🚀`);

    // Reset
    setNewName('');
    setNewDescription('');
  };

  const handleDeleteCustomGarment = (garmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Voulez-vous vraiment supprimer ce vêtement personnalisé ?')) {
      GarmentLibraryService.deleteCustomGarment(merchantId, garmentId);
      const updatedList = GarmentLibraryService.getGarments(merchantId);
      setGarments(updatedList);
      if (selectedGarmentId === garmentId && updatedList.length > 0) {
        onSelectGarment(updatedList[0]);
      }
      toast.success('Vêtement personnalisé supprimé.');
    }
  };

  return (
    <div className="space-y-3 text-left">
      <div className="flex justify-between items-center">
        <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Scissors className="w-4 h-4 text-emerald-600" />
          Modèle / Vêtement à Confectionner
        </label>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="text-xs font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Créer un Vêtement</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
              activeCategory === cat
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid des Vêtements Filtrés */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
        {filteredGarments.map((g) => {
          const isSelected = g.id === selectedGarmentId;
          return (
            <div
              key={g.id}
              onClick={() => handleSelect(g)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                    <GarmentVectorIcon id={g.id} name={g.name} category={g.category} className="w-5 h-5" />
                  </div>
                  {g.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustomGarment(g.id, e)}
                      className={`p-1 rounded-md transition ${
                        isSelected ? 'hover:bg-emerald-700 text-white/80' : 'hover:bg-rose-50 text-rose-500'
                      }`}
                      title="Supprimer ce vêtement"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <h4 className="text-xs font-extrabold leading-snug line-clamp-2">{g.name}</h4>
              </div>

              <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-[10px] font-medium opacity-90">
                <span className="truncate">{g.category}</span>
                <span className="font-mono font-bold shrink-0">{g.mandatoryMeasurements.length} mes.</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Création de Vêtement Personnalisé */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="text-base font-black">Créer un Nouveau Modèle de Vêtement</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition text-white/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomGarment} className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Vêtement *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : Boubou Prestige 3 Pièces"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as GarmentCategory)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                    >
                      <option value="Boubou">Boubou</option>
                      <option value="Robe">Robe</option>
                      <option value="Costume">Costume</option>
                      <option value="Ensemble">Ensemble</option>
                      <option value="Haut">Haut</option>
                      <option value="Bas">Bas</option>
                      <option value="Traditionnel">Traditionnel</option>
                      <option value="Sur-Mesure">Sur-Mesure</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Genre Cible</label>
                    <div className="flex gap-2">
                      {(['Homme', 'Femme', 'Mixte'] as const).map((gen) => (
                        <button
                          key={gen}
                          type="button"
                          onClick={() => setNewGender(gen)}
                          className={`flex-1 py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${
                            newGender === gen
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {gen}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Icône Emoji</label>
                    <input
                      type="text"
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      placeholder="Ex : 👑, 👗, 👔"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Choix des Mesures Requis */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-black uppercase text-slate-800">
                    Sélectionnez les Mesures Nécessaires
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Cochez les mesures à exiger pour ce modèle (Vert = Obligatoire, Bleu = Optionnelle).
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    {allMeasurements.map((m) => {
                      const isMandatory = selectedMandatoryKeys.includes(m.key);
                      const isOptional = selectedOptionalKeys.includes(m.key);

                      return (
                        <div
                          key={m.key}
                          className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-slate-800 truncate">{m.label}</span>
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleMandatoryKey(m.key)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                isMandatory
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                              title="Rendre Obligatoire"
                            >
                              Req
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleOptionalKey(m.key)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                isOptional
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                              title="Rendre Optionnel"
                            >
                              Opt
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                  >
                    Enregistrer le Modèle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
