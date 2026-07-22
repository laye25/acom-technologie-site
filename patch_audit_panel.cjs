const fs = require('fs');
let code = fs.readFileSync('src/modules/pressing/components/PressingClosureManager.tsx', 'utf8');

const targetSnippet = `              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">📊 Chiffre d'Affaires Théorique Attendu</span>
                <strong className="text-2xl font-black text-ink mt-1 block">
                  {totalTheoreticalRevenue.toLocaleString()} <span className="text-sm font-medium">{merchant.currency || 'FCFA'}</span>
                </strong>
                <p className="text-[9px] text-gray-400 mt-1">Calcul : Recettes Pressing + Produits boutique - Dépenses du jour</p>
              </div>`;

const auditPanelSnippet = `              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">📊 Chiffre d'Affaires Théorique Attendu</span>
                <strong className="text-2xl font-black text-ink mt-1 block">
                  {totalTheoreticalRevenue.toLocaleString()} <span className="text-sm font-medium">{merchant.currency || 'FCFA'}</span>
                </strong>
                <p className="text-[9px] text-gray-400 mt-1">Calcul : Recettes Pressing ({dailyPressingRevenue.toLocaleString()}) + Produits boutique ({dailyDetergentRevenue.toLocaleString()}) - Dépenses ({dailyExpensesTotal.toLocaleString()})</p>
              </div>

              {/* 🔍 Audit & Preuve Formelle de Calcul */}
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                      <span>🔍 Audit & Preuve du CA Théorique</span>
                      <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-normal">Date : {closureDate}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Traçabilité complète des requêtes, filtres et opérations enregistrées</p>
                  </div>
                </div>

                {/* Requêtes et Tables */}
                <div className="bg-slate-800/80 p-3 rounded-xl space-y-1.5 text-[10px] text-slate-300">
                  <div className="font-bold text-purple-400">📋 Sources & Filtres Actifs :</div>
                  <div>• <b>Dépôts Pressing :</b> Table <code className="text-purple-300">pressing_tickets_\${merchant.id}</code> (Filtre: <code className="text-yellow-300">depositDate === closureDate</code>, Statut <code className="text-yellow-300">!== 'quotation'</code>, Champs: <code className="text-green-300">amountPaidAtDeposit</code> ou <code className="text-green-300">amountPaid</code>)</div>
                  <div>• <b>Soldes Pressing :</b> Table <code className="text-purple-300">pressing_tickets_\${merchant.id}</code> (Filtre: <code className="text-yellow-300">balanceCollectedDate === closureDate</code>, Champ: <code className="text-green-300">balanceCollectedAmount</code>)</div>
                  <div>• <b>Ventes Boutique :</b> Table <code className="text-purple-300">pressing_stock_sales_\${merchant.id}</code> (Filtre: <code className="text-yellow-300">date.startsWith(closureDate)</code>, Champ: <code className="text-green-300">total</code>)</div>
                  <div>• <b>Dépenses :</b> Table Dexie <code className="text-purple-300">db.expenses</code> (Filtre: <code className="text-yellow-300">merchantId === merchant.id</code> & Date match, Champ: <code className="text-green-300">amount</code>)</div>
                </div>

                {/* Détail Opérations Trouvées */}
                <div className="space-y-3 pt-1">
                  <div className="text-[11px] font-bold text-cyan-400">📦 Opérations enregistrées du jour ({closureDate}) :</div>
                  
                  {/* Dépôts */}
                  <div className="bg-slate-800/50 p-2.5 rounded-lg space-y-1">
                    <div className="text-purple-300 font-bold">1️⃣ Dépôts Pressing ({dailyPressingTickets.length} trouvés) : {dailyDepositsRevenue.toLocaleString()} F</div>
                    {dailyPressingTickets.length === 0 ? (
                      <div className="text-slate-500 italic text-[10px]">Aucun dépôt pour cette date.</div>
                    ) : (
                      dailyPressingTickets.map((t: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[10px] text-slate-300 border-t border-slate-700/50 pt-1">
                          <span>Ticket #{t.ticketNumber} ({t.clientName})</span>
                          <span className="text-emerald-400 font-bold">+{(t.amountPaidAtDeposit !== undefined ? t.amountPaidAtDeposit : (t.amountPaid || 0)).toLocaleString()} F</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Soldes */}
                  <div className="bg-slate-800/50 p-2.5 rounded-lg space-y-1">
                    <div className="text-purple-300 font-bold">2️⃣ Soldes Encaissés ({dailyBalancesCollected.length} trouvés) : {dailyBalancesRevenue.toLocaleString()} F</div>
                    {dailyBalancesCollected.length === 0 ? (
                      <div className="text-slate-500 italic text-[10px]">Aucun solde encaissé pour cette date.</div>
                    ) : (
                      dailyBalancesCollected.map((t: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[10px] text-slate-300 border-t border-slate-700/50 pt-1">
                          <span>Solde Ticket #{t.ticketNumber} ({t.clientName})</span>
                          <span className="text-emerald-400 font-bold">+{(t.balanceCollectedAmount || 0).toLocaleString()} F</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Ventes Boutique */}
                  <div className="bg-slate-800/50 p-2.5 rounded-lg space-y-1">
                    <div className="text-cyan-300 font-bold">3️⃣ Ventes Boutique ({dailyDetergentSales.length} trouvées) : {dailyDetergentRevenue.toLocaleString()} F</div>
                    {dailyDetergentSales.length === 0 ? (
                      <div className="text-slate-500 italic text-[10px]">Aucune vente boutique pour cette date.</div>
                    ) : (
                      dailyDetergentSales.map((s: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[10px] text-slate-300 border-t border-slate-700/50 pt-1">
                          <span>Vente #{s.saleNumber || s.id} ({s.customerName || 'Client'})</span>
                          <span className="text-cyan-400 font-bold">+{(s.total || 0).toLocaleString()} F</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dépenses */}
                  <div className="bg-slate-800/50 p-2.5 rounded-lg space-y-1">
                    <div className="text-rose-300 font-bold">4️⃣ Dépenses du Jour ({dailyExpenses.length} justificatifs) : -{dailyExpensesTotal.toLocaleString()} F</div>
                    {dailyExpenses.length === 0 ? (
                      <div className="text-slate-500 italic text-[10px]">Aucune dépense enregistrée pour cette date.</div>
                    ) : (
                      dailyExpenses.map((e: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[10px] text-slate-300 border-t border-slate-700/50 pt-1">
                          <span>{e.category || 'Dépense'} - {e.description || 'Frais'}</span>
                          <span className="text-rose-400 font-bold">-{(e.amount || 0).toLocaleString()} F</span>
                        </div>
                      ))
                    )}
                  </div>

                </div>

                {/* Synthèse du Calcul */}
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl space-y-1 text-[11px]">
                  <div className="text-emerald-400 font-bold">🧮 Équation Mathématique du CA Théorique :</div>
                  <div className="text-slate-300 font-mono">
                    ({dailyPressingRevenue.toLocaleString()} Recettes Pressing) + ({dailyDetergentRevenue.toLocaleString()} Ventes Boutique) - ({dailyExpensesTotal.toLocaleString()} Dépenses) = <strong className="text-emerald-300 text-sm">{totalTheoreticalRevenue.toLocaleString()} {merchant.currency || 'FCFA'}</strong>
                  </div>
                </div>

              </div>`;

if (code.includes(targetSnippet)) {
  code = code.replace(targetSnippet, auditPanelSnippet);
  fs.writeFileSync('src/modules/pressing/components/PressingClosureManager.tsx', code);
  console.log('Successfully patched PressingClosureManager with audit panel.');
} else {
  console.log('Target snippet not found exactly.');
}
