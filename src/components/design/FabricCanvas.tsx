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
  onTextEditExit?: () => void;
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
  onTextDoubleClick,
  onTextEditExit
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const isUpdatingFromFabric = useRef(false);
  const onTextDoubleClickRef = useRef(onTextDoubleClick);
  const onTextEditExitRef = useRef(onTextEditExit);

  useEffect(() => {
    onTextDoubleClickRef.current = onTextDoubleClick;
    onTextEditExitRef.current = onTextEditExit;
  }, [onTextDoubleClick, onTextEditExit]);

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
      // no-op, prevent massive log
    });

    const handleDoubleClick = (e: fabric.IEvent) => {
      let target = e.target;

      // If we clicked a group, try to find the actual text object inside it
      if (target && target.type === 'group') {
        const pointer = canvas.getPointer(e.e);
        const subTarget = (target as fabric.Group)._objects.find(obj => {
          // Simplistic check: is the pointer inside this child's bounds after accounting for group transform?
          // Fabric's internal subTargetCheck is better but more complex to trigger here.
          return (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox');
        });
        if (subTarget) target = subTarget;
      }

      if (target && (target.type === 'i-text' || target.type === 'text' || target.type === 'textbox')) {
        console.log('Text double-clicked:', target.type, target.name);
        
        // Force enter editing mode for Fabric objects that support it
        if ((target as any).enterEditing) {
          (target as any).enterEditing();
          if ((target as any).selectAll) {
            (target as any).selectAll();
          }
          canvas.requestRenderAll();
        } else if (target.type === 'text') {
           console.warn('Click on Text object without enterEditing');
        }
        
        onTextDoubleClickRef.current?.(e, target.name || '');
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

    canvas.on('text:changed', (e) => {
      isUpdatingFromFabric.current = true;
      const target = e.target;
      if (!target || !target.name) {
        setTimeout(() => { isUpdatingFromFabric.current = false; }, 50);
        return;
      }
      setElements(prev => {
        const newElements = [...prev];
        const elIndex = newElements.findIndex(el => el.id === target.name);
        if (elIndex !== -1 && (target as fabric.IText).text !== undefined) {
          newElements[elIndex] = { ...newElements[elIndex], text: (target as fabric.IText).text };
          return newElements;
        }
        return prev;
      });
      setTimeout(() => { isUpdatingFromFabric.current = false; }, 50);
    });

    canvas.on('text:editing:exited', () => {
      onTextEditExitRef.current?.();
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

    // Use a map for faster lookup of existing objects by name (initialized with el.id)
    const objects = canvas.getObjects();
    const objectMap = new Map<string, fabric.Object>();
    objects.forEach(obj => {
      if (obj.name) objectMap.set(obj.name, obj);
    });

    // Determine which elements should be on canvas
    const currentElementIds = new Set(elements.filter(el => !el.hidden).map(el => el.id));

    // Remove objects that are no longer present or are now hidden
    objects.forEach(obj => {
      if (obj.name && !currentElementIds.has(obj.name)) {
        canvas.remove(obj);
      }
    });

    // Update or add elements
    elements.forEach(el => {
      if (el.hidden) return;

      const existingObj = objectMap.get(el.id);

      if (existingObj) {
        // Update existing object properties
        const isEditing = (existingObj as any).isEditing;
        
        // Basic properties
        const props: any = {
          left: el.x,
          top: el.y,
          scaleX: el.scaleX || 1,
          scaleY: el.scaleY || 1,
          angle: el.rotation || 0,
          opacity: el.opacity ?? 1,
          selectable: !el.locked,
          evented: !el.locked,
        };

        // Text-specific properties
        if (existingObj.type === 'i-text' || existingObj.type === 'textbox') {
          // IMPORTANT: Do NOT update text content if actively editing to avoid jumping cursor
          if (!isEditing) {
            props.text = el.text || '';
          }
          props.fontFamily = el.fontFamily || 'Arial';
          props.fontSize = el.fontSize || 20;
          props.fontStyle = el.fontStyle?.includes('italic') ? 'italic' : 'normal';
          props.fontWeight = el.fontStyle?.includes('bold') ? 'bold' : 'normal';
          props.textAlign = el.align || 'left';
          props.lineHeight = el.lineHeight || 1.2;
        }

        // Color properties
        if (el.fill && el.fill !== 'transparent') {
          props.fill = el.fill;
        }
        if (el.stroke && el.stroke !== 'transparent') {
          props.stroke = el.stroke;
        }

        existingObj.set(props);
        existingObj.setCoords();
      } else {
        // Add new object
        if (el.fabricData) {
          const fabricData = { ...el.fabricData };
          if (fabricData.type === 'text') {
            fabricData.type = 'i-text';
          }

          fabric.util.enlivenObjects([fabricData], (enlivenedObjects) => {
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

              if ((enlivenedObj as any).type === 'i-text' || (enlivenedObj as any).type === 'text' || (enlivenedObj as any).type === 'textbox') {
                enlivenedObj.set('editable', true);
              }
              
              if (el.fill && el.fill !== 'transparent') {
                enlivenedObj.set('fill', el.fill);
              }

              canvas.add(enlivenedObj);
              if (selectedIds.includes(el.id)) {
                canvas.setActiveObject(enlivenedObj);
              }
              canvas.requestRenderAll();
            }
          }, 'fabric');
          return;
        }

        let obj: fabric.Object | null = null;
        const commonOptions: fabric.IObjectOptions = {
          name: el.id,
          left: el.x,
          top: el.y,
          scaleX: el.scaleX || 1,
          scaleY: el.scaleY || 1,
          angle: el.rotation || 0,
          fill: el.fill || '#000000',
          stroke: el.stroke || 'transparent',
          strokeWidth: el.strokeWidth || 0,
          opacity: el.opacity ?? 1,
          selectable: !el.locked,
          evented: !el.locked,
        };

        if (el.type === 'shape') {
          obj = new fabric.Rect({
            ...commonOptions,
            width: el.width || 100,
            height: el.height || 100,
            rx: el.cornerRadius || 0,
            ry: el.cornerRadius || 0,
          });
        } else if (el.type === 'circle') {
          obj = new fabric.Circle({ ...commonOptions, radius: el.radius || 50 });
        } else if (el.type === 'ellipse') {
          obj = new fabric.Ellipse({ ...commonOptions, rx: el.radiusX || 50, ry: el.radiusY || 50 });
        } else if (el.type === 'text') {
          obj = new fabric.IText(el.text || '', {
            ...commonOptions,
            editable: true,
            fontFamily: el.fontFamily || 'Arial',
            fontSize: el.fontSize || 20,
            fontStyle: el.fontStyle?.includes('italic') ? 'italic' : 'normal',
            fontWeight: el.fontStyle?.includes('bold') ? 'bold' : 'normal',
            textAlign: el.align || 'left',
          });
        } else if (el.type === 'path' && el.data) {
          obj = new fabric.Path(el.data, commonOptions);
        } else if (el.type === 'image' && el.src) {
          fabric.Image.fromURL(el.src, (img) => {
            img.set({ ...commonOptions, width: el.width || img.width, height: el.height || img.height });
            canvas.add(img);
            if (selectedIds.includes(el.id)) canvas.setActiveObject(img);
            canvas.requestRenderAll();
          }, { crossOrigin: 'anonymous' });
          return;
        }

        if (obj) {
          canvas.add(obj);
          if (selectedIds.includes(el.id)) {
            canvas.setActiveObject(obj);
          }
        }
      }
    });

    canvas.requestRenderAll();
  }, [elements, bgColor, selectedIds]);

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
