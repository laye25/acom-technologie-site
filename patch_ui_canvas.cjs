const fs = require('fs');
const content = fs.readFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', 'utf8');

const search = `<canvas `;
const replace = `
              {/* BRIDGE STATS HASHES IN UI */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/80 text-green-400 font-mono text-xs px-4 py-2 rounded border border-green-500/50 shadow-xl pointer-events-none flex flex-col">
                <div className="font-bold border-b border-green-500/30 pb-1 mb-1">SENTINEL TEST HASHES:</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                   <span>ORIGINAL:</span> <span>{window.__SENTINEL_HASHES?.ORIGINAL_HASH || 'N/A'}</span>
                   <span>RECONSTRUCTED:</span> <span>{window.__SENTINEL_HASHES?.RECONSTRUCTED_HASH || 'N/A'}</span>
                   <span>ACTIVE:</span> <span>{window.__SENTINEL_HASHES?.ACTIVE_LAYER_HASH || 'N/A'}</span>
                   <span>STATE:</span> <span>{window.__SENTINEL_STATE_HASH || 'N/A'}</span>
                   <span>RENDER:</span> <span>{window.__SENTINEL_RENDER_HASH || 'N/A'}</span>
                   <span>EMBROIDERY:</span> <span>{window.__SENTINEL_EMBROIDERY_HASH || 'N/A'}</span>
                </div>
              </div>
              <canvas `;

let newContent = content.replace(search, replace);

if (newContent === content) {
    console.error("NO CHANGES MADE for canvas ui");
} else {
    fs.writeFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', newContent);
    console.log("CANVAS UI CHANGES APPLIED");
}
