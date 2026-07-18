const polygons = [[{x:0,y:0}, {x:100,y:0}, {x:100,y:100}, {x:0,y:100}]];
const py = 50;
const px = 50;
let inside = false;
for (const polygon of polygons) {
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const diffY = yj - yi;
    if (Math.abs(diffY) > 1e-9) {
      const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / diffY + xi);
      if (intersect) inside = !inside;
    }
  }
}
console.log(inside);
