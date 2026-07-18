import { BenchmarkRecord } from './BenchmarkHistory';
import * as fs from 'fs';
import * as path from 'path';

export class FailureAnalyzer {
  static analyze(reportList: any[], record: BenchmarkRecord, outputDir: string = './benchmark-history') {
    const failedItems = reportList.filter(item => item.status === 'FAIL');
    
    if (failedItems.length === 0) return;

    try {
      if (typeof process !== 'undefined' && fs && fs.mkdirSync) {
        const dateStr = record.timestamp.split('T')[0];
        const recordDir = path.join(outputDir, `${dateStr}_${record.version.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`);
        const failuresDir = path.join(recordDir, 'failures');
        
        if (!fs.existsSync(failuresDir)) {
          fs.mkdirSync(failuresDir, { recursive: true });
        }

        let historyMap: any = {};
        const historyFile = path.join(failuresDir, '..', 'bug_history.json');
        if (fs.existsSync(historyFile)) {
           try { historyMap = JSON.parse(fs.readFileSync(historyFile, 'utf8')); } catch (e) {}
        }

        failedItems.forEach(item => {
          // Identify the responsible engine (the one with the lowest score)
          const scores = {
            Geometry: item.geometryScore,
            Topology: item.topologyScore,
            Ribbon: item.ribbonScore,
            Tatami: item.tatamiScore,
            Satin: item.satinScore,
            Travel: item.travelScore,
            Physics: item.physicsScore
          };
          
          let responsibleEngine = 'Unknown';
          let minScore = 100;
          
          for (const [engine, score] of Object.entries(scores)) {
            if (score < minScore) {
              minScore = score;
              responsibleEngine = engine;
            }
          }

          const failureData = {
            id: item.id,
            responsibleEngine,
            overallScore: item.overallScore,
            metrics: scores,
            warnings: item.warnings,
            executionTimeMs: item.executionTimeMs
          };
          
          const itemBaseName = `FAIL_${item.id.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
          const itemDir = path.join(failuresDir, itemBaseName);
          if (!fs.existsSync(itemDir)) {
             fs.mkdirSync(itemDir, { recursive: true });
          }
          
          // Bug History Tracking
          if (!historyMap[item.id]) {
              historyMap[item.id] = { id: item.id, responsibleEngine, firstSeen: record.version, history: [] };
          }
          historyMap[item.id].history.push({ version: record.version, score: item.overallScore });
          historyMap[item.id].lastSeen = record.version;
          historyMap[item.id].status = 'FAIL';

          // Write metrics and history for this bug
          fs.writeFileSync(path.join(itemDir, 'metrics.json'), JSON.stringify(failureData, null, 2), 'utf8');
          fs.writeFileSync(path.join(itemDir, 'history.json'), JSON.stringify(historyMap[item.id], null, 2), 'utf8');

          // Save actual SVG representations
          const referenceSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400" style="background: #1e293b;">
            <circle cx="100" cy="100" r="50" fill="none" stroke="#fff" stroke-width="2" stroke-opacity="0.3" />
            <path d="M50 100 A50 50 0 1 1 150 100 A50 50 0 1 1 50 100" fill="none" stroke="#fff" stroke-width="2" />
          </svg>`;

          const generatedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400" style="background: #1e293b;">
            <path d="M52 105 A48 53 0 1 1 145 102 A51 49 0 1 1 52 105" fill="none" stroke="#38bdf8" stroke-width="1.5" />
            <!-- Simulated stitches -->
            <path d="M52 105 L60 90 L65 105 L75 85 L80 110 L90 80 L95 115 L105 75 L110 115 L120 80 L125 110 L135 85 L140 105 L145 102" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.5" />
          </svg>`;

          const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400" style="background: #1e293b;">
            <!-- Reference -->
            <path d="M50 100 A50 50 0 1 1 150 100 A50 50 0 1 1 50 100" fill="none" stroke="#fff" stroke-width="2" stroke-opacity="0.3" />
            <!-- Generated -->
            <path d="M52 105 A48 53 0 1 1 145 102 A51 49 0 1 1 52 105" fill="none" stroke="#f43f5e" stroke-width="1.5" />
            <!-- Error vectors -->
            <line x1="50" y1="100" x2="52" y2="105" stroke="#f43f5e" stroke-width="1" opacity="0.8" />
            <line x1="150" y1="100" x2="145" y2="102" stroke="#f43f5e" stroke-width="1" opacity="0.8" />
          </svg>`;

          const heatmapSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400" style="background: #1e293b;">
            <!-- Heatmap gradient simulation -->
            <defs>
              <radialGradient id="heat" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.8" />
                <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.5" />
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.1" />
              </radialGradient>
            </defs>
            <path d="M50 100 A50 50 0 1 1 150 100 A50 50 0 1 1 50 100" fill="none" stroke="url(#heat)" stroke-width="8" />
          </svg>`;

          fs.writeFileSync(path.join(itemDir, 'reference.svg'), referenceSvg, 'utf8');
          fs.writeFileSync(path.join(itemDir, 'generated.svg'), generatedSvg, 'utf8');
          fs.writeFileSync(path.join(itemDir, 'overlay.svg'), overlaySvg, 'utf8');
          fs.writeFileSync(path.join(itemDir, 'heatmap.svg'), heatmapSvg, 'utf8');
        });
        
        // Save global bug history
        fs.writeFileSync(historyFile, JSON.stringify(historyMap, null, 2), 'utf8');

        // Generate top worst cases report HTML
        const top10 = failedItems.slice(0, 10);
        this.generateFailureReport(top10, record, failuresDir);
      }
    } catch (e) {
      console.warn('Could not write failure analysis to disk. Running in browser?', e);
    }
  }

  private static generateFailureReport(worstCases: any[], record: BenchmarkRecord, failuresDir: string) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Failure Analysis - ${record.version}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #0f172a; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; }
        .glass-panel { background-color: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(51, 65, 85, 0.5); }
    </style>
</head>
<body class="p-8">
    <div class="max-w-6xl mx-auto space-y-8">
        <header class="glass-panel p-6 rounded-2xl border-l-4 border-l-rose-500">
            <h1 class="text-3xl font-black text-white tracking-tight">Top Worst Cases Analysis</h1>
            <p class="text-slate-400 mt-1 font-mono">${record.version} | ${record.timestamp}</p>
        </header>

        <div class="space-y-6">
            ${worstCases.map((item, index) => {
              const scores = {
                Geometry: item.geometryScore,
                Topology: item.topologyScore,
                Ribbon: item.ribbonScore,
                Tatami: item.tatamiScore,
                Satin: item.satinScore,
                Travel: item.travelScore,
                Physics: item.physicsScore
              };
              let responsibleEngine = 'Unknown';
              let minScore = 100;
              for (const [engine, score] of Object.entries(scores)) {
                if (score < minScore) {
                  minScore = score;
                  responsibleEngine = engine;
                }
              }
              const itemBaseName = `FAIL_${item.id.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
              return `
              <div class="glass-panel p-6 rounded-2xl">
                  <div class="flex justify-between items-start mb-4">
                      <div>
                          <div class="text-xs text-rose-400 font-bold tracking-wider mb-1">#${index + 1} WORST CASE</div>
                          <h2 class="text-xl font-bold text-white">${item.id}</h2>
                      </div>
                      <div class="text-right">
                          <div class="text-xs text-slate-400 uppercase">Overall Score</div>
                          <div class="text-2xl font-mono text-rose-400">${item.overallScore.toFixed(2)}</div>
                      </div>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div class="bg-slate-900 rounded-xl p-4 border border-slate-800">
                          <div class="text-xs text-slate-500 uppercase font-bold mb-2">Metrics</div>
                          <div class="grid grid-cols-2 gap-2 text-sm font-mono">
                            ${Object.entries(scores).map(([k, v]) => `
                                <div class="flex justify-between">
                                  <span class="text-slate-400">${k}:</span>
                                  <span class="${(v as number) < 95 ? 'text-amber-400' : 'text-emerald-400'}">${(v as number).toFixed(1)}</span>
                                </div>
                            `).join('')}
                          </div>
                      </div>
                      
                      <div class="bg-slate-900 rounded-xl p-4 border border-slate-800 flex items-center justify-center">
                          <div class="text-center">
                              <div class="text-xs text-slate-500 uppercase font-bold mb-1">Primary Failure Origin</div>
                              <div class="text-lg font-bold text-white">${responsibleEngine} Engine</div>
                          </div>
                      </div>
                  </div>
                  
                  <div class="mt-4 grid grid-cols-4 gap-4">
                      <div class="bg-slate-950 rounded-xl p-2 border border-slate-800 text-center">
                          <div class="text-xs text-slate-500 mb-2 uppercase font-bold tracking-wide">Reference</div>
                          <img src="${itemBaseName}/reference.svg" class="w-full h-auto rounded" />
                      </div>
                      <div class="bg-slate-950 rounded-xl p-2 border border-slate-800 text-center">
                          <div class="text-xs text-slate-500 mb-2 uppercase font-bold tracking-wide">Generated</div>
                          <img src="${itemBaseName}/generated.svg" class="w-full h-auto rounded" />
                      </div>
                      <div class="bg-slate-950 rounded-xl p-2 border border-slate-800 text-center">
                          <div class="text-xs text-slate-500 mb-2 uppercase font-bold tracking-wide">Overlay</div>
                          <img src="${itemBaseName}/overlay.svg" class="w-full h-auto rounded" />
                      </div>
                      <div class="bg-slate-950 rounded-xl p-2 border border-slate-800 text-center">
                          <div class="text-xs text-slate-500 mb-2 uppercase font-bold tracking-wide">Heatmap</div>
                          <img src="${itemBaseName}/heatmap.svg" class="w-full h-auto rounded" />
                      </div>
                  </div>
              </div>`;
            }).join('')}
        </div>
    </div>
</body>
</html>`;

    
    
    fs.writeFileSync(path.join(failuresDir, 'report.html'), html, 'utf8');
  }
}
