const fs = require('fs');
const content = fs.readFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', 'utf8');

const search = `                <div>Applied: {window.__BRIDGE_STATS?.actuallyAppliedToLayers || 0}</div>
              </div>`;
const replace = `                <div>Applied: {window.__BRIDGE_STATS?.actuallyAppliedToLayers || 0}</div>
                <div className="flex flex-col gap-1 ml-4 border-l border-green-500/30 pl-4">
                   <span>ORIGINAL_HASH: {window.__SENTINEL_HASHES?.ORIGINAL_HASH || 'N/A'}</span>
                   <span>RECONSTRUCTED_HASH: {window.__SENTINEL_HASHES?.RECONSTRUCTED_HASH || 'N/A'}</span>
                   <span>ACTIVE_LAYER_HASH: {window.__SENTINEL_HASHES?.ACTIVE_LAYER_HASH || 'N/A'}</span>
                   <span>STATE_LAYER_HASH: {window.__SENTINEL_STATE_HASH || 'N/A'}</span>
                   <span>RENDER_INPUT_HASH: {window.__SENTINEL_RENDER_HASH || 'N/A'}</span>
                   <span>EMBROIDERY_INPUT_HASH: {window.__SENTINEL_EMBROIDERY_HASH || 'N/A'}</span>
                </div>
              </div>`;

let newContent = content.replace(search, replace);

if (newContent === content) {
    console.error("NO CHANGES MADE for ui hashes");
} else {
    fs.writeFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', newContent);
    console.log("UI HASHES CHANGES APPLIED");
}
