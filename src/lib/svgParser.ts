import { fabric } from 'fabric';
import { CanvasElement } from '../types';

export const parseSvgToElements = (svgString: string): Promise<CanvasElement[]> => {
  return new Promise((resolve) => {
    fabric.loadSVGFromString(svgString, (objects, options) => {
      if (!objects || objects.length === 0) {
        resolve([]);
        return;
      }

      const elements: CanvasElement[] = [];
      
      // Create a temporary canvas to handle ungrouping properly
      const canvasEl = document.createElement('canvas');
      const canvas = new fabric.Canvas(canvasEl, { width: options.width || 600, height: options.height || 350 });
      
      // Add all objects to canvas
      objects.forEach(obj => canvas.add(obj));

      // Function to recursively ungroup
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
        resolve([]);
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
      
      if (contentWidth > 0 && contentHeight > 0) {
        const targetWidth = 1050;
        const targetHeight = 600;
        const padding = 0.9;
        const scale = Math.min((targetWidth * padding) / contentWidth, (targetHeight * padding) / contentHeight);

        finalObjects.forEach(obj => {
          obj.set({
            left: (obj.left - minX) * scale + (targetWidth - contentWidth * scale) / 2,
            top: (obj.top - minY) * scale + (targetHeight - contentHeight * scale) / 2,
            scaleX: (obj.scaleX || 1) * scale,
            scaleY: (obj.scaleY || 1) * scale
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
          fabricData: obj.toObject(), // Store the exact fabric representation
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
      resolve(elements);
    });
  });
};
