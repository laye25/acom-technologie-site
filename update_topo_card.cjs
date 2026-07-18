const fs = require('fs');
const file = 'src/core/validation/ValidationLab/TopologyCard.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    '<div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">',
    `<div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 col-span-2 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Status</span>
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-black">
              <CheckCircle2 className="w-4 h-4" /> PASS
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">TPI Score</span>
            <div className="text-xl font-black text-white">{result.tpi?.toFixed(1)}%</div>
          </div>
        </div>
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Euler Char (χ)</span>
          <div className="text-sm font-mono text-slate-300">{result.euler}</div>
        </div>
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Regions</span>
          <div className="text-sm font-mono text-slate-300">
             <span className="text-emerald-400">{result.islands} Is</span> / <span className="text-rose-400">{result.preservedHoles} Ho</span>
          </div>
        </div>
        <div className="hidden">`
  );
  content = content.replace('</div>\n    </div>\n  );\n};', '</div>\n    </div>\n  );\n};');
  fs.writeFileSync(file, content);
}
