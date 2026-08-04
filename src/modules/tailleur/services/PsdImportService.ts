import { readPsd, Psd, Layer } from 'ag-psd';

export interface PsdLayerItem {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  top?: number;
  left?: number;
  visible?: boolean;
  opacity?: number;
}

export interface PsdParseResult {
  fileName: string;
  width: number;
  height: number;
  compositeDataUrl: string;
  layers: PsdLayerItem[];
  fileSizeKb: number;
}

export class PsdImportService {
  /**
   * Reads a Photoshop PSD file ArrayBuffer and parses both composite image and individual layers.
   */
  public static async parsePsd(arrayBuffer: ArrayBuffer, fileName: string): Promise<PsdParseResult> {
    const fileSizeKb = Math.round(arrayBuffer.byteLength / 1024);

    try {
      // 1. Try standard ag-psd parser
      const psd: Psd = readPsd(arrayBuffer, {
        skipLayerImageData: false,
        skipThumbnail: false,
      });

      const width = psd.width || 1024;
      const height = psd.height || 1024;

      // Extract Composite Image
      let compositeDataUrl = '';
      if (psd.canvas) {
        compositeDataUrl = psd.canvas.toDataURL('image/png');
      } else {
        // Fallback: create a temporary canvas and draw layers onto it
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx && psd.children) {
          this.drawLayersToCanvas(ctx, psd.children);
        }
        compositeDataUrl = canvas.toDataURL('image/png');
      }

      // Extract Individual Layers
      const layers: PsdLayerItem[] = [];
      if (psd.children && psd.children.length > 0) {
        this.extractLayers(psd.children, layers, width, height);
      } else if (compositeDataUrl) {
        // Single flat PSD
        layers.push({
          id: `psd_flat_${Date.now()}`,
          name: 'Arrière-plan (Image Flat)',
          dataUrl: compositeDataUrl,
          width,
          height,
          top: 0,
          left: 0,
          visible: true,
          opacity: 1
        });
      }

      return {
        fileName,
        width,
        height,
        compositeDataUrl,
        layers,
        fileSizeKb,
      };
    } catch (err: any) {
      console.warn('ag-psd n\'a pas pu lire la structure complète, tentative de décodage 8BPS brut...', err);
      
      // 2. Fallback to custom raw 8BPS parser for raw binary PSDs (e.g. Python PIL exports)
      try {
        return this.parseRaw8Bps(arrayBuffer, fileName, fileSizeKb);
      } catch (rawErr: any) {
        console.error('Erreur de lecture du fichier PSD via 8BPS brut:', rawErr);
        throw new Error(`Impossible de décoder le fichier PSD "${fileName}": ${err.message || rawErr.message || 'Format invalide ou corrompu'}`);
      }
    }
  }

  /**
   * Fallback binary parser for flat uncompressed 8BPS Adobe Photoshop files (including Python/PIL raw binary exports)
   */
  private static parseRaw8Bps(buffer: ArrayBuffer, fileName: string, fileSizeKb: number): PsdParseResult {
    const view = new DataView(buffer);
    
    // Check magic bytes '8BPS'
    const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (sig !== '8BPS') {
      throw new Error("L'en-tête du fichier ne correspond pas au format Photoshop 8BPS.");
    }

    const version = view.getUint16(4, false);
    if (version !== 1) {
      throw new Error(`Version PSD non supportée (${version}).`);
    }

    const channels = view.getUint16(12, false);
    const height = view.getUint32(14, false);
    const width = view.getUint32(18, false);
    const depth = view.getUint16(22, false);
    const colorMode = view.getUint16(24, false);

    let offset = 26;

    // Color Mode Data
    const colorModeLen = view.getUint32(offset, false);
    offset += 4 + colorModeLen;

    // Image Resources
    const imgResLen = view.getUint32(offset, false);
    offset += 4 + imgResLen;

    // Layer & Mask Info
    const layerMaskLen = view.getUint32(offset, false);
    offset += 4 + layerMaskLen;

    // Compression: 0 = Raw, 1 = RLE
    const compression = view.getUint16(offset, false);
    offset += 2;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Impossible de créer le contexte 2D Canvas");

    const imgData = ctx.createImageData(width, height);
    const pixelCount = width * height;
    const rawBytes = new Uint8Array(buffer, offset);

    if (compression === 0 && (colorMode === 3 || colorMode === 0 || colorMode === 1)) {
      // Uncompressed Raw Planar RGB or Grayscale
      if (channels >= 3 && colorMode === 3) {
        const rOffset = 0;
        const gOffset = pixelCount;
        const bOffset = pixelCount * 2;
        const aOffset = channels >= 4 ? pixelCount * 3 : -1;

        for (let i = 0; i < pixelCount; i++) {
          const r = rawBytes[rOffset + i] || 0;
          const g = rawBytes[gOffset + i] || 0;
          const b = rawBytes[bOffset + i] || 0;
          const a = aOffset >= 0 ? rawBytes[aOffset + i] : 255;

          const idx = i * 4;
          imgData.data[idx] = r;
          imgData.data[idx + 1] = g;
          imgData.data[idx + 2] = b;
          imgData.data[idx + 3] = a;
        }
      } else {
        // Grayscale / Single Channel
        for (let i = 0; i < pixelCount; i++) {
          const val = rawBytes[i] || 0;
          const idx = i * 4;
          imgData.data[idx] = val;
          imgData.data[idx + 1] = val;
          imgData.data[idx + 2] = val;
          imgData.data[idx + 3] = 255;
        }
      }
    } else {
      throw new Error(`Compression PSD (${compression}) ou mode couleur (${colorMode}) non géré en mode brut`);
    }

    ctx.putImageData(imgData, 0, 0);
    const compositeDataUrl = canvas.toDataURL('image/png');

    return {
      fileName,
      width,
      height,
      compositeDataUrl,
      layers: [
        {
          id: `psd_raw_flat_${Date.now()}`,
          name: 'Arrière-plan PSD (Brut)',
          dataUrl: compositeDataUrl,
          width,
          height,
          top: 0,
          left: 0,
          visible: true,
          opacity: 1
        }
      ],
      fileSizeKb
    };
  }

  private static drawLayersToCanvas(ctx: CanvasRenderingContext2D, layers: Layer[]) {
    for (const layer of layers) {
      if (layer.hidden) continue;
      if (layer.canvas) {
        const left = layer.left || 0;
        const top = layer.top || 0;
        ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;
        ctx.drawImage(layer.canvas, left, top);
      }
      if (layer.children) {
        this.drawLayersToCanvas(ctx, layer.children);
      }
    }
  }

  private static extractLayers(
    layersList: Layer[], 
    outList: PsdLayerItem[], 
    psdWidth: number, 
    psdHeight: number,
    depth = 0
  ) {
    layersList.forEach((layer, idx) => {
      const layerName = layer.name || `Calque #${idx + 1}`;
      if (layer.canvas) {
        try {
          const dataUrl = layer.canvas.toDataURL('image/png');
          outList.push({
            id: `psd_layer_${depth}_${idx}_${Date.now()}`,
            name: layerName,
            dataUrl,
            width: layer.canvas.width || psdWidth,
            height: layer.canvas.height || psdHeight,
            top: layer.top || 0,
            left: layer.left || 0,
            visible: !layer.hidden,
            opacity: layer.opacity !== undefined ? layer.opacity : 1,
          });
        } catch (e) {
          console.warn(`Impossible d'exporter le canvas du calque PSD "${layerName}"`, e);
        }
      }

      if (layer.children && layer.children.length > 0) {
        this.extractLayers(layer.children, outList, psdWidth, psdHeight, depth + 1);
      }
    });
  }
}
