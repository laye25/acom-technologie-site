import { parse } from 'svg-parser';

export const parseSvgToElements = (svgString: string): any[] => {
  // Automatic cleanup: remove metadata, comments, and unnecessary namespaces
  const cleanSvg = svgString
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .replace(/<metadata>[\s\S]*?<\/metadata>/g, '') // Remove metadata
    .replace(/<desc>[\s\S]*?<\/desc>/g, '') // Remove desc
    .replace(/xmlns="[^"]*"/g, ''); // Remove xmlns

  const parsed = parse(cleanSvg);
  const elements: any[] = [];
  
  // Extract SVG dimensions for scaling
  let svgWidth = 600;
  let svgHeight = 350;
  let viewBox = { x: 0, y: 0, width: 600, height: 350 };

  const svgNode = parsed.children.find((c: any) => c.tagName === 'svg');
  if (svgNode && svgNode.properties) {
    if (svgNode.properties.width) svgWidth = parseFloat(svgNode.properties.width);
    if (svgNode.properties.height) svgHeight = parseFloat(svgNode.properties.height);
    if (svgNode.properties.viewBox) {
      const vb = svgNode.properties.viewBox.split(/[\s,]+/).map(Number);
      if (vb.length === 4) {
        viewBox = { x: vb[0], y: vb[1], width: vb[2], height: vb[3] };
      }
    } else {
      viewBox = { x: 0, y: 0, width: svgWidth, height: svgHeight };
    }
  }

  // Calculate scale to fit 600x350 but maintain aspect ratio
  const targetWidth = 600;
  const targetHeight = 350;
  
  const scaleX = targetWidth / viewBox.width;
  const scaleY = targetHeight / viewBox.height;
  
  // Use the smaller scale to ensure it fits, but don't let it be 0
  const scale = Math.min(scaleX, scaleY) || 1;
  
  // Center the content
  const offsetX = (targetWidth - viewBox.width * scale) / 2 - viewBox.x * scale;
  const offsetY = (targetHeight - viewBox.height * scale) / 2 - viewBox.y * scale;

  const parseStyle = (style: string) => {
    if (!style) return {};
    return style.split(';').reduce((acc: any, pair) => {
      const [key, value] = pair.split(':').map(s => s.trim());
      if (key && value) acc[key] = value;
      return acc;
    }, {});
  };

  const multiplyMatrices = (m1: number[], m2: number[]) => {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
    ];
  };

  const INHERITABLE_PROPS = [
    'fill', 'fill-opacity', 'fill-rule',
    'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset',
    'opacity', 'visibility', 'display',
    'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing', 'word-spacing'
  ];

  const traverse = (node: any, parentProps: any = {}, parentMatrix = [1, 0, 0, 1, 0, 0], definitions: Record<string, any> = {}) => {
    if (node.type === 'element') {
      // Skip non-renderable definitions during main traversal
      if (['defs', 'metadata', 'style', 'script', 'linearGradient', 'radialGradient'].includes(node.tagName)) {
        return;
      }

      const styleProps = parseStyle(node.properties.style);
      
      // Only inherit specific properties from parent
      const inheritedProps: Record<string, any> = {};
      INHERITABLE_PROPS.forEach(prop => {
        if (parentProps[prop] !== undefined) inheritedProps[prop] = parentProps[prop];
      });

      // Current element properties (local properties override inherited ones)
      const props = { ...inheritedProps, ...node.properties, ...styleProps };
      
      let localMatrix = [1, 0, 0, 1, 0, 0];
      const transform = node.properties.transform || styleProps.transform;
      
      if (transform) {
        const transformRegex = /([a-z]+)\(([^)]+)\)/gi;
        let match;
        while ((match = transformRegex.exec(transform)) !== null) {
          const type = match[1].toLowerCase();
          const args = match[2].split(/[\s,]+/).map(Number);
          
          let m = [1, 0, 0, 1, 0, 0];
          if (type === 'matrix' && args.length === 6) {
            m = args;
          } else if (type === 'translate') {
            m = [1, 0, 0, 1, args[0] || 0, args[1] || 0];
          } else if (type === 'scale') {
            const sx = args[0] || 1;
            const sy = args[1] === undefined ? sx : args[1];
            m = [sx, 0, 0, sy, 0, 0];
          } else if (type === 'rotate') {
            const angle = (args[0] || 0) * Math.PI / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            if (args.length === 3) {
              const cx = args[1];
              const cy = args[2];
              const m1 = [1, 0, 0, 1, cx, cy];
              const m2 = [cos, sin, -sin, cos, 0, 0];
              const m3 = [1, 0, 0, 1, -cx, -cy];
              m = multiplyMatrices(multiplyMatrices(m1, m2), m3);
            } else {
              m = [cos, sin, -sin, cos, 0, 0];
            }
          }
          localMatrix = multiplyMatrices(localMatrix, m);
        }
      }

      if (node.tagName !== 'path' && (node.properties.x !== undefined || node.properties.y !== undefined)) {
        const tx = parseFloat(node.properties.x || 0);
        const ty = parseFloat(node.properties.y || 0);
        localMatrix = multiplyMatrices(localMatrix, [1, 0, 0, 1, tx, ty]);
      }

      const currentMatrix = multiplyMatrices(parentMatrix, localMatrix);

      // Handle nested SVG / Symbol viewBox
      if ((node.tagName === 'svg' || node.tagName === 'symbol') && node.properties.viewBox) {
        const vb = node.properties.viewBox.split(/[\s,]+/).map(Number);
        if (vb.length === 4) {
          // Only use width/height if explicitly defined on the element or passed from a <use> tag
          const vw = parseFloat(node.properties.width || parentProps._useWidth || vb[2]);
          const vh = parseFloat(node.properties.height || parentProps._useHeight || vb[3]);
          const sx = vw / vb[2];
          const sy = vh / vb[3];
          const m1 = [1, 0, 0, 1, -vb[0], -vb[1]];
          const m2 = [sx, 0, 0, sy, 0, 0];
          const vbMatrix = multiplyMatrices(m2, m1);
          node.children.forEach((child: any) => traverse(child, props, multiplyMatrices(currentMatrix, vbMatrix), definitions));
          return;
        }
      }

      // Handle <use> tag
      if (node.tagName === 'use') {
        const href = node.properties['xlink:href'] || node.properties.href;
        if (href && href.startsWith('#')) {
          const id = href.substring(1);
          const symbol = definitions[id];
          if (symbol) {
            // Pass the use tag's dimensions to the symbol for viewport calculation
            const useProps = { 
              ...props, 
              _useWidth: node.properties.width, 
              _useHeight: node.properties.height 
            };
            traverse(symbol, useProps, currentMatrix, definitions);
          }
        }
        return;
      }

      // Gradient logic
      let fill = props.fill;
      if (fill === 'none') fill = 'transparent';
      else if (!fill) fill = '#000000';
      
      let fillLinearGradientColorStops: any[] = [];
      
      if (typeof fill === 'string' && fill.startsWith('url(#')) {
        const gradientId = fill.substring(5, fill.length - 1);
        const gradientNode = definitions[gradientId];
        if (gradientNode && gradientNode.tagName === 'linearGradient') {
          fill = undefined;
          fillLinearGradientColorStops = gradientNode.children
            .filter((c: any) => c.tagName === 'stop')
            .flatMap((c: any) => [c.properties.offset, c.properties['stop-color']]);
        }
      }

      const baseElement = {
        id: `svg-el-${Date.now()}-${Math.random()}`,
        fill,
        fillLinearGradientColorStops,
        stroke: props.stroke === 'none' ? 'transparent' : (props.stroke || undefined),
        strokeWidth: props.strokeWidth ? Number(props.strokeWidth) * scale * Math.sqrt(Math.abs(currentMatrix[0] * currentMatrix[3])) : undefined,
        opacity: props.opacity ? Number(props.opacity) : 1,
      };

      const getGlobalPos = (x: number, y: number) => ({
        x: (x * currentMatrix[0] + y * currentMatrix[2] + currentMatrix[4]) * scale + offsetX,
        y: (x * currentMatrix[1] + y * currentMatrix[3] + currentMatrix[5]) * scale + offsetY,
      });

      const getGlobalScale = () => ({
        sx: Math.sqrt(currentMatrix[0] * currentMatrix[0] + currentMatrix[1] * currentMatrix[1]) * scale,
        sy: Math.sqrt(currentMatrix[2] * currentMatrix[2] + currentMatrix[3] * currentMatrix[3]) * scale,
      });

      if (node.tagName === 'path') {
        const pos = getGlobalPos(0, 0);
        const s = getGlobalScale();
        elements.push({
          ...baseElement,
          type: 'path',
          x: pos.x,
          y: pos.y,
          scaleX: s.sx,
          scaleY: s.sy,
          data: props.d,
        });
      } else if (node.tagName === 'rect') {
        const pos = getGlobalPos(0, 0);
        const s = getGlobalScale();
        elements.push({
          ...baseElement,
          type: 'shape',
          x: pos.x,
          y: pos.y,
          width: Number(props.width || 0) * s.sx,
          height: Number(props.height || 0) * s.sy,
          cornerRadius: Number(props.rx || props.ry || 0) * Math.max(s.sx, s.sy),
        });
      } else if (node.tagName === 'circle') {
        const pos = getGlobalPos(0, 0);
        const s = getGlobalScale();
        const r = Number(props.r || 0) * Math.max(s.sx, s.sy);
        elements.push({
          ...baseElement,
          type: 'circle',
          x: pos.x,
          y: pos.y,
          radius: r,
          width: r * 2,
          height: r * 2,
        });
      } else if (node.tagName === 'polygon' || node.tagName === 'polyline') {
        const points = props.points.split(/[\s,]+/).map(Number);
        if (points.length >= 2) {
          let d = `M ${points[0]} ${points[1]}`;
          for (let i = 2; i < points.length; i += 2) {
            d += ` L ${points[i]} ${points[i+1]}`;
          }
          if (node.tagName === 'polygon') d += ' Z';
          
          const pos = getGlobalPos(0, 0);
          const s = getGlobalScale();
          elements.push({
            ...baseElement,
            type: 'path',
            x: pos.x,
            y: pos.y,
            scaleX: s.sx,
            scaleY: s.sy,
            data: d,
          });
        }
      } else if (node.tagName === 'line') {
        const x1 = Number(props.x1 || 0);
        const y1 = Number(props.y1 || 0);
        const x2 = Number(props.x2 || 0);
        const y2 = Number(props.y2 || 0);
        const d = `M ${x1} ${y1} L ${x2} ${y2}`;
        
        const pos = getGlobalPos(0, 0);
        const s = getGlobalScale();
        elements.push({
          ...baseElement,
          type: 'path',
          x: pos.x,
          y: pos.y,
          scaleX: s.sx,
          scaleY: s.sy,
          data: d,
        });
      } else if (node.tagName === 'ellipse') {
        const pos = getGlobalPos(0, 0);
        const s = getGlobalScale();
        const rx = Number(props.rx || 0) * s.sx;
        const ry = Number(props.ry || 0) * s.sy;
        elements.push({
          ...baseElement,
          type: 'ellipse',
          x: pos.x,
          y: pos.y,
          radiusX: rx,
          radiusY: ry,
          width: rx * 2,
          height: ry * 2,
        });
      } else if (node.tagName === 'text') {
        const s = getGlobalScale();
        const fontSize = Number(props['font-size'] || 16) * Math.max(s.sx, s.sy);
        const pos = getGlobalPos(0, 0);
        // SVG text y is baseline, Konva is top. Adjust by ~80% of font size.
        elements.push({
          ...baseElement,
          type: 'text',
          x: pos.x,
          y: pos.y - fontSize * 0.8,
          text: node.children.map((c: any) => c.value).join(''),
          fontSize: fontSize,
          fontFamily: props['font-family'] || 'Arial',
        });
      } else if (node.tagName === 'image') {
        const pos = getGlobalPos(0, 0);
        const s = getGlobalScale();
        elements.push({
          ...baseElement,
          type: 'image',
          x: pos.x,
          y: pos.y,
          width: Number(props.width || 0) * s.sx,
          height: Number(props.height || 0) * s.sy,
          src: props['xlink:href'] || props.href,
        });
      }
      
      if (node.children) {
        node.children.forEach((child: any) => traverse(child, props, currentMatrix, definitions));
      }
    } else if (node.children) {
      node.children.forEach((child: any) => traverse(child, parentProps, parentMatrix, definitions));
    }
  };

  // First pass: collect definitions
  const defs: Record<string, any> = {};
  const collectDefs = (node: any) => {
    if (node.type === 'element') {
      if (node.properties.id) {
        defs[node.properties.id] = node;
      }
      if (node.children) node.children.forEach(collectDefs);
    }
  };
  collectDefs(parsed);

  traverse(parsed, {}, [1, 0, 0, 1, 0, 0], defs);
  return elements;
};
