const fs = require('fs');
const content = fs.readFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', 'utf8');

const search = `  const drawCanvas = useCallback(() => {`;
const replace = `  const drawCanvas = useCallback(() => {
    // --- SENTINEL TEST HASH FOR RENDER ---
    const hashGeometry = (pts) => {
      if (!pts) return 'null';
      let hash = 0;
      for (let i = 0; i < pts.length; i++) {
        hash = Math.imul(31, hash) + (pts[i].x * 1000) | 0;
        hash = Math.imul(31, hash) + (pts[i].y * 1000) | 0;
      }
      return hash.toString(16);
    };
    if (!window.__SENTINEL_RENDER_HASH) {
       window.__SENTINEL_RENDER_HASH = 'null';
    }
    const sentLayer = layers.find(l => l.id === 'SENTINEL_LAYER_001');
    if (sentLayer) {
       window.__SENTINEL_RENDER_HASH = hashGeometry(sentLayer.points);
       window.__SENTINEL_STATE_HASH = hashGeometry(sentLayer.points);
    }
`;

let newContent = content.replace(search, replace);

if (newContent === content) {
    console.error("NO CHANGES MADE for render hash");
} else {
    fs.writeFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', newContent);
    console.log("RENDER HASH CHANGES APPLIED");
}
