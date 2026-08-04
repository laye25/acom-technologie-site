const fs = require('fs');
const content = fs.readFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', 'utf8');

const search = `  const compileStitches = useCallback((projLayers: EmbroideryLayer[], fabricKey: string): Stitch[] => {`;
const replace = `  const compileStitches = useCallback((projLayers: EmbroideryLayer[], fabricKey: string): Stitch[] => {
    // --- SENTINEL TEST HASH FOR EMBROIDERY ---
    const hashGeometry = (pts) => {
      if (!pts) return 'null';
      let hash = 0;
      for (let i = 0; i < pts.length; i++) {
        hash = Math.imul(31, hash) + (pts[i].x * 1000) | 0;
        hash = Math.imul(31, hash) + (pts[i].y * 1000) | 0;
      }
      return hash.toString(16);
    };
    if (!window.__SENTINEL_EMBROIDERY_HASH) {
       window.__SENTINEL_EMBROIDERY_HASH = 'null';
    }
    const sentLayer = projLayers.find(l => l.id === 'SENTINEL_LAYER_001');
    if (sentLayer) {
       window.__SENTINEL_EMBROIDERY_HASH = hashGeometry(sentLayer.points);
    }
`;

let newContent = content.replace(search, replace);

if (newContent === content) {
    console.error("NO CHANGES MADE for embroidery hash");
} else {
    fs.writeFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', newContent);
    console.log("EMBROIDERY HASH CHANGES APPLIED");
}
