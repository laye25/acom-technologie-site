const fs = require('fs');
let code = fs.readFileSync('src/core/validation/ValidationLab/GlobalReportCard.tsx', 'utf8');

const additionalHtml = `
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase text-center">Geometry</div>
          <div className="text-xl text-white font-mono text-center">{(globalReport.aggregatedPerformance?.GeometryPass || 0).toFixed(0)} ms</div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase text-center">Topology</div>
          <div className="text-xl text-white font-mono text-center">{(globalReport.aggregatedPerformance?.TopologyPass || 0).toFixed(0)} ms</div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase text-center">Ribbon</div>
          <div className="text-xl text-white font-mono text-center">{(globalReport.aggregatedPerformance?.RibbonPass || 0).toFixed(0)} ms</div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase text-center">Tatami</div>
          <div className="text-xl text-white font-mono text-center">{(globalReport.aggregatedPerformance?.TatamiPass || 0).toFixed(0)} ms</div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase text-center">Satin</div>
          <div className="text-xl text-white font-mono text-center">{(globalReport.aggregatedPerformance?.SatinPass || 0).toFixed(0)} ms</div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 uppercase text-center">Travel</div>
          <div className="text-xl text-white font-mono text-center">{(globalReport.aggregatedPerformance?.TravelPass || 0).toFixed(0)} ms</div>
        </div>
      </div>
`;

code = code.replace(
  '      </div>\n    </div>',
  '      </div>' + additionalHtml + '\n    </div>'
);

fs.writeFileSync('src/core/validation/ValidationLab/GlobalReportCard.tsx', code);
console.log('GlobalReportCard updated with performance metrics');
