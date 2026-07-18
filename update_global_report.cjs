const fs = require('fs');

let code = fs.readFileSync('src/core/validation/ValidationLab/GlobalReportCard.tsx', 'utf8');

code = code.replace(
  '        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">\n          <div className="text-slate-400 text-xs mb-1 uppercase">Overall Score</div>\n          <div className="text-3xl text-sky-400 font-mono">{globalReport.averageScore.toFixed(2)}%</div>\n        </div>',
  `        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase">Overall Score</div>
          <div className="text-3xl text-sky-400 font-mono">{globalReport.averageScore.toFixed(2)}%</div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase flex items-center gap-1">
             <Clock size={12} className="text-amber-500" /> Total Time
          </div>
          <div className="text-3xl text-amber-400 font-mono">{globalReport.totalTimeMs ? globalReport.totalTimeMs.toFixed(0) : 0}ms</div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase flex items-center gap-1">
             <Activity size={12} className="text-fuchsia-500" /> Memory Used
          </div>
          <div className="text-3xl text-fuchsia-400 font-mono">{globalReport.memoryUsedMB ? globalReport.memoryUsedMB.toFixed(1) : 0} MB</div>
        </div>`
);

// We need to update the grid-cols to 6 instead of 4
code = code.replace('grid-cols-4', 'grid-cols-6');

fs.writeFileSync('src/core/validation/ValidationLab/GlobalReportCard.tsx', code);
console.log('GlobalReportCard updated');
