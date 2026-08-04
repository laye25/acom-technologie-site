const fs = require('fs');
const content = fs.readFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', 'utf8');

const search = `              {/* Zoom & Pan Controls */}`;
const replace = `              {/* BRIDGE STATS */ }
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/80 text-green-400 font-mono text-xs px-4 py-2 rounded border border-green-500/50 shadow-xl flex gap-4 pointer-events-none">
                <div>BRIDGE:</div>
                <div>Confirmed: {window.__BRIDGE_STATS?.totalLayers || 0}</div>
                <div>Applied: {window.__BRIDGE_STATS?.actuallyAppliedToLayers || 0}</div>
              </div>

              {/* Zoom & Pan Controls */}`;

let newContent = content.replace(search, replace);

if (newContent === content) {
    console.error("NO CHANGES MADE for ui stats");
} else {
    fs.writeFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', newContent);
    console.log("UI STATS CHANGES APPLIED");
}
