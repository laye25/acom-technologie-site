const hashGeometry = (pts) => {
  if (!pts) return 'null';
  let hash = 0;
  for (let i = 0; i < pts.length; i++) {
    hash = Math.imul(31, hash) + (pts[i].x * 1000) | 0;
    hash = Math.imul(31, hash) + (pts[i].y * 1000) | 0;
  }
  return hash.toString(16);
};

const sentinelOriginalPoints = Array.from({length: 30}).map((_, i) => ({
  x: Math.cos(i * Math.PI * 2 / 30) * 100 + 10 * 0.5,
  y: Math.sin(i * Math.PI * 2 / 30) * 100 + 10 * 0.5
}));
const sentinelReconstructedPoints = Array.from({length: 30}).map((_, i) => ({
  x: Math.cos(i * Math.PI * 2 / 30) * 100,
  y: Math.sin(i * Math.PI * 2 / 30) * 100
}));

console.log("ORIGINAL_HASH:", hashGeometry(sentinelOriginalPoints));
console.log("RECONSTRUCTED_HASH:", hashGeometry(sentinelReconstructedPoints));
