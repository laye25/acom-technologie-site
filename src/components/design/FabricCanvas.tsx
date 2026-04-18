import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { fabric } from 'fabric';
import { CanvasElement } from '../../types';

interface FabricCanvasProps {
  elements: CanvasElement[];
  setElements: (elements: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  bgColor: string;
  stageScale: number;
  showGrid: boolean;
  guides: any[];
  blocks?: any[];
  user?: any;
  others?: any[];
  width: number;
  height: number;
  onTextDoubleClick?: (e: any, id: string) => void;
}

export const FabricCanvas = forwardRef<any, FabricCanvasProps>(({
  elements,
  setElements,
  selectedIds,
  setSelectedIds,
  bgColor,
  stageScale,
  showGrid,
  guides,
  blocks,
  user,
  others,
  width,
  height,
  onTextDoubleClick
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const isUpdatingFromFabric = useRef(false);

  useImperativeHandle(ref, () => ({
    toDataURL: (options?: any) => {
      if (fabricCanvasRef.current) {
        return fabricCanvasRef.current.toDataURL({
          format: 'png',
          multiplier: options?.pixelRatio || 1,
        });
      }
      return '';
    }
  }));

  // Initialize Canvas
  useEffect(() => {
    console.log('FabricCanvas initialized with size:', width, 'x', height);
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: bgColor,
      preserveObjectStacking: true,
    });
    
    // Ensure the canvas element itself has the correct dimensions
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    canvas.setDimensions({ width, height });
    fabricCanvasRef.current = canvas;

    canvas.on('mouse:down', (e) => {
      console.log('Mouse down', e);
    });

    const handleDoubleClick = (e: fabric.IEvent) => {
      console.log('Double click event detected', e);
      const target = e.target;

      if (target && (target.type === 'i-text' || target.type === 'text' || target.type === 'textbox')) {
        console.log('Text element clicked', target);
        
        // Disable Fabric's internal editing
        const textObj = target as fabric.IText;
        textObj.editable = false;
        
        if (e.e) {
          e.e.preventDefault();
          e.e.stopPropagation();
        }
        
        onTextDoubleClick?.(e, target.name || '');
      } else {
        console.log('No text element clicked');
      }
    };

    canvas.off('mouse:dblclick', handleDoubleClick);
    canvas.on('mouse:dblclick', handleDoubleClick);

    // Event Listeners
    canvas.on('selection:created', (e) => {
      if (isUpdatingFromFabric.current) return;
      const selected = canvas.getActiveObjects().map(obj => obj.name).filter(Boolean) as string[];
      setSelectedIds(selected);
    });

    canvas.on('selection:updated', (e) => {
      if (isUpdatingFromFabric.current) return;
      const selected = canvas.getActiveObjects().map(obj => obj.name).filter(Boolean) as string[];
      setSelectedIds(selected);
    });

    canvas.on('selection:cleared', () => {
      if (isUpdatingFromFabric.current) return;
      setSelectedIds([]);
    });

    canvas.on('object:modified', (e) => {
      isUpdatingFromFabric.current = true;
      const target = e.target;
      if (!target) return;

      if (target.type === 'activeSelection') {
        const group = target as fabric.ActiveSelection;
        const objects = group.getObjects();
        
        setElements(prev => {
          const newElements = [...prev];
          objects.forEach(obj => {
            const elIndex = newElements.findIndex(el => el.id === obj.name);
            if (elIndex !== -1) {
              // Calculate absolute position
              const matrix = obj.calcTransformMatrix();
              const options = fabric.util.qrDecompose(matrix);
              newElements[elIndex] = {
                ...newElements[elIndex],
                x: options.translateX,
                y: options.translateY,
                scaleX: options.scaleX,
                scaleY: options.scaleY,
                rotation: options.angle,
              };
            }
          });
          return newElements;
        });
      } else {
        setElements(prev => {
          const elIndex = prev.findIndex(el => el.id === target.name);
          if (elIndex !== -1) {
            const newElements = [...prev];
            newElements[elIndex] = {
              ...newElements[elIndex],
              x: target.left || 0,
              y: target.top || 0,
              scaleX: target.scaleX || 1,
              scaleY: target.scaleY || 1,
              rotation: target.angle || 0,
              width: target.width,
              height: target.height,
            };
            if (target.type === 'i-text' || target.type === 'text') {
              newElements[elIndex].text = (target as fabric.IText).text;
            }
            return newElements;
          }
          return prev;
        });
      }
      setTimeout(() => { isUpdatingFromFabric.current = false; }, 50);
    });

    return () => {
      canvas.off('mouse:dblclick', handleDoubleClick);
      try {
        canvas.dispose();
      } catch (err) {
        console.warn('Fabric canvas disposal error:', err);
      }
      fabricCanvasRef.current = null;
    };
  }, [width, height]); // Removed onTextDoubleClick to prevent excessive re-inits

  // Update background color
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.backgroundColor = bgColor;
      fabricCanvasRef.current.requestRenderAll();
    }
  }, [bgColor]);

  // Sync elements to Fabric
  useEffect(() => {
    if (!fabricCanvasRef.current || isUpdatingFromFabric.current) return;
    const canvas = fabricCanvasRef.current;

    // We need to sync the elements array with the canvas objects.
    // For simplicity in this migration, we will clear and re-render.
    // In a production app, you'd want to update existing objects to preserve state/selection.
    
    // Save current selection
    const activeObjectNames = canvas.getActiveObjects().map(obj => obj.name);
    
    canvas.clear();
    canvas.backgroundColor = bgColor;

    elements.forEach(el => {
      if (el.hidden) return;

      if (el.fabricData) {
        fabric.util.enlivenObjects([el.fabricData], (enlivenedObjects) => {
          const enlivenedObj = enlivenedObjects[0];
          if (enlivenedObj) {
            enlivenedObj.set({
              name: el.id,
              left: el.x,
              top: el.y,
              scaleX: el.scaleX || 1,
              scaleY: el.scaleY || 1,
              angle: el.rotation || 0,
              opacity: el.opacity ?? 1,
              selectable: !el.locked,
              evented: !el.locked,
            });
            
            // Only override fill/stroke if they are explicitly set and not transparent
            // This preserves complex SVG gradients unless the user explicitly changes the color
            if (el.fill && el.fill !== 'transparent') {
              enlivenedObj.set('fill', el.fill);
              if (enlivenedObj.type === 'group') {
                const group = enlivenedObj as fabric.Group;
                group.getObjects().forEach(child => {
                  child.set('fill', el.fill);
                });
              }
            }
            if (el.stroke && el.stroke !== 'transparent') {
              enlivenedObj.set('stroke', el.stroke);
              if (enlivenedObj.type === 'group') {
                const group = enlivenedObj as fabric.Group;
                group.getObjects().forEach(child => {
                  child.set('stroke', el.stroke);
                });
              }
            }

            canvas.add(enlivenedObj);
            if (activeObjectNames.includes(el.id)) {
              canvas.setActiveObject(enlivenedObj);
            }
            canvas.requestRenderAll();
          }
        }, 'fabric');
        return; // Async addition
      }

      let obj: fabric.Object | null = null;

      const commonOptions: fabric.IObjectOptions = {
        name: el.id,
        left: el.x,
        top: el.y,
        scaleX: el.scaleX || 1,
        scaleY: el.scaleY || 1,
        angle: el.rotation || 0,
        fill: el.fill || 'transparent',
        stroke: el.stroke || 'transparent',
        strokeWidth: el.strokeWidth || 0,
        opacity: el.opacity ?? 1,
        selectable: !el.locked,
        evented: !el.locked,
      };

      if (el.shadowColor) {
        commonOptions.shadow = new fabric.Shadow({
          color: el.shadowColor,
          blur: el.shadowBlur || 0,
          offsetX: el.shadowOffsetX || 0,
          offsetY: el.shadowOffsetY || 0,
        });
      }

      if (el.type === 'shape') {
        obj = new fabric.Rect({
          ...commonOptions,
          width: el.width || 100,
          height: el.height || 100,
          rx: el.cornerRadius || 0,
          ry: el.cornerRadius || 0,
        });
      } else if (el.type === 'circle') {
        obj = new fabric.Circle({
          ...commonOptions,
          radius: el.radius || 50,
        });
      } else if (el.type === 'ellipse') {
        obj = new fabric.Ellipse({
          ...commonOptions,
          rx: el.radiusX || 50,
          ry: el.radiusY || 50,
        });
      } else if (el.type === 'text') {
        obj = new fabric.IText(el.text || '', {
          ...commonOptions,
          editable: false,
          fontFamily: el.fontFamily || 'Arial',
          fontSize: el.fontSize || 20,
          fontStyle: el.fontStyle?.includes('italic') ? 'italic' : 'normal',
          fontWeight: el.fontStyle?.includes('bold') ? 'bold' : 'normal',
          textAlign: el.align || 'left',
          lineHeight: el.lineHeight || 1.2,
        });
      } else if (el.type === 'path' && el.data) {
        obj = new fabric.Path(el.data, commonOptions);
      } else if (el.type === 'image' && el.src) {
        fabric.Image.fromURL(el.src, (img) => {
          img.set({
            ...commonOptions,
            width: el.width || img.width,
            height: el.height || img.height,
          });
          canvas.add(img);
          if (activeObjectNames.includes(el.id)) {
            canvas.setActiveObject(img);
          }
          canvas.requestRenderAll();
        }, { crossOrigin: 'anonymous' });
        return; // Image is added asynchronously
      }

      if (obj) {
        canvas.add(obj);
        if (activeObjectNames.includes(el.id)) {
          canvas.setActiveObject(obj);
        }
      }
    });

    canvas.requestRenderAll();
  }, [elements, bgColor]);

  // Sync selection from props
  useEffect(() => {
    if (!fabricCanvasRef.current || isUpdatingFromFabric.current) return;
    const canvas = fabricCanvasRef.current;
    
    isUpdatingFromFabric.current = true;
    canvas.discardActiveObject();
    
    if (selectedIds.length > 0) {
      const objectsToSelect = canvas.getObjects().filter(obj => obj.name && selectedIds.includes(obj.name));
      if (objectsToSelect.length === 1) {
        canvas.setActiveObject(objectsToSelect[0]);
      } else if (objectsToSelect.length > 1) {
        const selection = new fabric.ActiveSelection(objectsToSelect, { canvas });
        canvas.setActiveObject(selection);
      }
    }
    canvas.requestRenderAll();
    isUpdatingFromFabric.current = false;
  }, [selectedIds]);

  return (
    <div style={{ width: width, height: height, position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
});

FabricCanvas.displayName = 'FabricCanvas';
