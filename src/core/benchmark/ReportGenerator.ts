import { BenchmarkRecord } from './BenchmarkHistory';
import * as fs from 'fs';
import * as path from 'path';

export class ReportGenerator {
  static generateHTML(record: BenchmarkRecord, outputDir: string = './benchmark-history'): string {
    const isCertified = record.failed === 0 && record.overallScore >= 98;
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ATCP Certification Report - ${record.version}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #0f172a; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; }
        .glass-panel { background-color: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(51, 65, 85, 0.5); }
    </style>
</head>
<body class="p-8">
    <div class="max-w-6xl mx-auto space-y-8">
        
        <!-- Header -->
        <header class="flex justify-between items-center glass-panel p-6 rounded-2xl">
            <div>
                <h1 class="text-3xl font-black text-white tracking-tight">ATCP Engine Certification</h1>
                <p class="text-slate-400 mt-1 font-mono">${record.timestamp}</p>
            </div>
            <div class="flex items-center gap-4">
                <div class="text-right">
                    <div class="text-sm text-slate-400 uppercase tracking-wider font-bold">Version</div>
                    <div class="text-2xl font-mono text-white">${record.version}</div>
                </div>
                ${isCertified 
                  ? '<div class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-xl">CERTIFIED</div>'
                  : '<div class="bg-amber-500/20 text-amber-400 border border-amber-500/50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-xl">PENDING</div>'
                }
            </div>
        </header>

        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                <div class="text-slate-400 text-sm uppercase tracking-wider font-bold mb-4">Overall Engine Score</div>
                <div class="flex items-end gap-2">
                    <span class="text-6xl font-black font-mono text-sky-400">${record.overallScore.toFixed(2)}</span>
                    <span class="text-xl text-slate-500 font-mono mb-2">/100</span>
                </div>
            </div>
            
            <div class="glass-panel p-6 rounded-2xl">
                <div class="text-slate-400 text-sm uppercase tracking-wider font-bold mb-4">Golden Dataset Validation</div>
                <div class="flex justify-between items-end">
                    <div>
                        <div class="text-emerald-400 font-mono text-4xl">${record.passed}</div>
                        <div class="text-xs text-slate-500 mt-1">PASSED</div>
                    </div>
                    <div>
                        <div class="text-rose-400 font-mono text-4xl">${record.failed}</div>
                        <div class="text-xs text-slate-500 mt-1">FAILED</div>
                    </div>
                    <div>
                        <div class="text-white font-mono text-4xl">${record.total}</div>
                        <div class="text-xs text-slate-500 mt-1">TOTAL</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Module Breakdown -->
        <div class="glass-panel p-6 rounded-2xl">
            <h2 class="text-xl font-bold text-white mb-6">Module Breakdown</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                ${Object.entries(record.moduleScores).map(([name, score]) => `
                <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                    <div class="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">${name}</div>
                    <div class="text-2xl font-mono ${score >= 98 ? 'text-emerald-400' : (score >= 90 ? 'text-amber-400' : 'text-rose-400')}">${score.toFixed(1)}</div>
                </div>
                `).join('')}
            </div>
        </div>

    </div>
</body>
</html>`;

    // Attempt to write to file if in Node environment
    try {
      if (typeof process !== 'undefined' && fs && fs.mkdirSync) {
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        const fileName = `certification_${record.version.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        fs.writeFileSync(path.join(outputDir, fileName), html, 'utf8');
        
        // Also save JSON history
        const jsonFileName = `${new Date().toISOString().split('T')[0]}_${record.version}.json`;
        fs.writeFileSync(path.join(outputDir, jsonFileName), JSON.stringify(record, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('Could not write report to disk. Running in browser?');
    }

    return html;
  }

  static generateBadge(record: BenchmarkRecord, outputDir: string = './benchmark-history'): void {
    const isCertified = record.failed === 0 && record.overallScore >= 98;
    const color = isCertified ? '#10b981' : '#f59e0b';
    const status = isCertified ? 'CERTIFIED' : 'PENDING';
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="28">
      <linearGradient id="b" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
      </linearGradient>
      <mask id="a">
        <rect width="160" height="28" rx="3" fill="#fff"/>
      </mask>
      <g mask="url(#a)">
        <path fill="#555" d="M0 0h90v28H0z"/>
        <path fill="${color}" d="M90 0h70v28H90z"/>
        <path fill="url(#b)" d="M0 0h160v28H0z"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
        <text x="45" y="19" fill="#010101" fill-opacity=".3">ATCP ${record.version}</text>
        <text x="45" y="18">ATCP ${record.version}</text>
        <text x="125" y="19" fill="#010101" fill-opacity=".3">${status}</text>
        <text x="125" y="18">${status}</text>
      </g>
    </svg>`;
    
    try {
      if (typeof process !== 'undefined' && fs && fs.mkdirSync) {
        fs.writeFileSync(path.join(outputDir, 'badge.svg'), svg, 'utf8');
      }
    } catch (e) {
      // Ignore
    }
  }
}
