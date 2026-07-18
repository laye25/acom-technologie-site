const pts = Array.from({length: 7000}, () => ({x: Math.random() * 100, y: Math.random() * 100}));
const pts2 = Array.from({length: 7000}, () => ({x: Math.random() * 100, y: Math.random() * 100}));

const start = Date.now();
let c = 0;
for(let i=0; i<pts.length; i++) {
  for(let j=0; j<pts2.length; j++) {
    const dx = pts[i].x - pts2[j].x;
    const dy = pts[i].y - pts2[j].y;
    if (Math.sqrt(dx*dx + dy*dy) < 0.2) c++;
  }
}
console.log(Date.now() - start, "ms", c);
