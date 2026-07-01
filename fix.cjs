const fs = require('fs');
const content = `600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition">
                  Enregistrer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {filteredTissus.length === 0 ? (
        <div className="bg-white py-16 text-center rounded-[2rem] border border-gray-150 shadow-sm flex flex-col items-center justify-center text-left">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4 border border-violet-100 border-dashed">
            <Palette className="w-8 h-8 text-violet-400" />
          </div>
          <p className="text-gray-500 font-bold mb-1">Aucun rouleau de tissu répertorié</p>
          <p className="text-xs text-gray-400">Enregistrez vos tissus disponibles et leurs métrages.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
          {filteredTissus.map((t) => {
            const qty = Number(t.quantity || 0);
            return (
              <div key={t.id} className="bg-white p-5 rounded-[2rem] border border-black/5 shadow-sm text-left flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-black text-ink">{t.name}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.supplier || 'Fournisseur inconnu'}</p>
                    </div>
                    <button onClick={() => handleDelete(t.id)} className="w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Métrage Restant:</span>
                      <span className="font-bold text-ink font-mono">{t.quantity} m</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Prix de reviens/m:</span>
                      <span className="font-bold text-rose-600 font-mono">{Number(t.costPricePerMeter || 0).toLocaleString()} {merchant.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Prix de vente/m:</span>
                      <span className="font-bold text-emerald-600 font-mono">{Number(t.pricePerMeter || 0).toLocaleString()} {merchant.currency}</span>
                    </div>
                    {t.color && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Couleur:</span>
                        <span className="font-medium text-ink">{t.color}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                  <button 
                    onClick={() => {
                      setCurrentTissu(t);
                      setIsFormOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Éditer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default MerchantSaaS;
`;
fs.appendFileSync('src/pages/MerchantSaaS.tsx', content);
