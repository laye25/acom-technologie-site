import { fabric } from 'fabric';
import { CanvasElement } from '../types';

export interface ParseSvgResult {
  elements: CanvasElement[];
  width: number;
  height: number;
}

export const parseSvgToElements = (svgString: string): Promise<ParseSvgResult> => {
  return new Promise((resolve) => {
    fabric.loadSVGFromString(svgString, (objects, options) => {
      if (!objects || objects.length === 0) {
        resolve({ elements: [], width: 1050, height: 600 });
        return;
      }

      const elements: CanvasElement[] = [];
      const canvasEl = document.createElement('canvas');
      const canvas = new fabric.Canvas(canvasEl, { width: options.width || 600, height: options.height || 350 });
      
      objects.forEach(obj => canvas.add(obj));

      const ungroupAll = () => {
        let hasGroups = false;
        const currentObjects = [...canvas.getObjects()];
        currentObjects.forEach(obj => {
          if (obj.type === 'group') {
            hasGroups = true;
            const group = obj as fabric.Group;
            canvas.setActiveObject(group);
            group.toActiveSelection();
            canvas.discardActiveObject();
          }
        });
        if (hasGroups) {
          ungroupAll();
        }
      };

      ungroupAll();

      const finalObjects = canvas.getObjects();
      if (finalObjects.length === 0) {
        canvas.dispose();
        resolve({ elements: [], width: 1050, height: 600 });
        return;
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      finalObjects.forEach(obj => {
        const rect = obj.getBoundingRect();
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.left + rect.width);
        maxY = Math.max(maxY, rect.top + rect.height);
      });

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      let parsedOptWidth = parseFloat(options.width as any);
      let parsedOptHeight = parseFloat(options.height as any);
      
      let finalWidth = (!isNaN(parsedOptWidth) && parsedOptWidth > 0 ? parsedOptWidth : contentWidth) || 1050;
      let finalHeight = (!isNaN(parsedOptHeight) && parsedOptHeight > 0 ? parsedOptHeight : contentHeight) || 600;

      // If dimensions are completely unreadable, fall back to content bound box
      if (finalWidth <= 1 || finalHeight <= 1) {
        finalWidth = contentWidth > 0 ? contentWidth : 1050;
        finalHeight = contentHeight > 0 ? contentHeight : 600;
      }

      // Optional: Normalize to a reasonable size if the internal values are extremely small/large but keep ratio
      if (finalWidth > 0 && finalHeight > 0) {
        let displayScale = 1;
        if (finalWidth < 200 || finalHeight < 200) {
           displayScale = 800 / Math.max(finalWidth, finalHeight);
        } else if (finalWidth > 4000 || finalHeight > 4000) {
           displayScale = 2000 / Math.max(finalWidth, finalHeight);
        }

        if (displayScale !== 1) {
          finalObjects.forEach(obj => {
            obj.set({
              left: obj.left * displayScale,
              top: obj.top * displayScale,
              scaleX: (obj.scaleX || 1) * displayScale,
              scaleY: (obj.scaleY || 1) * displayScale
            });
            obj.setCoords();
          });
          finalWidth *= displayScale;
          finalHeight *= displayScale;
          minX *= displayScale;
          minY *= displayScale;
        }

        // Translate to origin (0,0) so there's no random offset padding
        finalObjects.forEach(obj => {
          obj.set({
            left: obj.left - minX,
            top: obj.top - minY
          });
          obj.setCoords();
        });
      }

      finalObjects.forEach((obj) => {
        if (!obj) return;
        
        const id = `el_${Math.random().toString(36).substring(2, 9)}`;
        
        // Convert Fabric object to CanvasElement
        const el: CanvasElement = {
          id,
          type: 'shape', // default
          x: obj.left || 0,
          y: obj.top || 0,
          scaleX: obj.scaleX || 1,
          scaleY: obj.scaleY || 1,
          rotation: obj.angle || 0,
          opacity: obj.opacity ?? 1,
          fill: typeof obj.fill === 'string' ? obj.fill : 'transparent',
          stroke: typeof obj.stroke === 'string' ? obj.stroke : 'transparent',
          strokeWidth: obj.strokeWidth || 0,
          fabricData: JSON.parse(JSON.stringify(obj.toObject())), // Strip undefined values for Firestore
        };

        // Extract color from gradients for the properties panel
        if (obj.fill && typeof obj.fill !== 'string') {
          if ((obj.fill as any).colorStops) {
             el.fill = (obj.fill as any).colorStops[0]?.color || '#000000';
          }
        }
        if (obj.stroke && typeof obj.stroke !== 'string') {
          if ((obj.stroke as any).colorStops) {
             el.stroke = (obj.stroke as any).colorStops[0]?.color || '#000000';
          }
        }

        if (obj.type === 'rect') {
          el.type = 'shape';
          el.width = obj.width;
          el.height = obj.height;
          el.cornerRadius = (obj as fabric.Rect).rx || 0;
        } else if (obj.type === 'circle') {
          el.type = 'circle';
          el.radius = (obj as fabric.Circle).radius;
        } else if (obj.type === 'ellipse') {
          el.type = 'ellipse';
          el.radiusX = (obj as fabric.Ellipse).rx;
          el.radiusY = (obj as fabric.Ellipse).ry;
        } else if (obj.type === 'path') {
          el.type = 'path';
          el.data = (obj as fabric.Path).path?.map((p: any) => p.join(' ')).join(' ');
          el.width = obj.width;
          el.height = obj.height;
        } else if (obj.type === 'i-text' || obj.type === 'text') {
          el.type = 'text';
          el.text = (obj as fabric.IText).text;
          el.fontFamily = (obj as fabric.IText).fontFamily;
          el.fontSize = (obj as fabric.IText).fontSize;
          el.fontStyle = (obj as fabric.IText).fontStyle;
          el.align = (obj as fabric.IText).textAlign;
          el.lineHeight = (obj as fabric.IText).lineHeight;
        } else if (obj.type === 'image') {
          el.type = 'image';
          el.src = (obj as fabric.Image).getSrc();
          el.width = obj.width;
          el.height = obj.height;
        } else if (obj.type === 'polygon' || obj.type === 'polyline') {
          el.type = 'path';
          const points = (obj as any).points;
          if (points && points.length > 0) {
            let pathData = `M ${points[0].x} ${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
              pathData += ` L ${points[i].x} ${points[i].y}`;
            }
            if (obj.type === 'polygon') pathData += ' Z';
            el.data = pathData;
            el.width = obj.width;
            el.height = obj.height;
          }
        } else if (obj.type === 'line') {
          el.type = 'path';
          const line = obj as fabric.Line;
          el.data = `M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`;
          el.width = obj.width;
          el.height = obj.height;
        }

        if (obj.shadow) {
          const shadow = obj.shadow as fabric.Shadow;
          el.shadowColor = shadow.color;
          el.shadowBlur = shadow.blur;
          el.shadowOffsetX = shadow.offsetX;
          el.shadowOffsetY = shadow.offsetY;
        }

        elements.push(el);
      });

      canvas.dispose();
      resolve({ elements, width: finalWidth, height: finalHeight });
    });
  });
};
