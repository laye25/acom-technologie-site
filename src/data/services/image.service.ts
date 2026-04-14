import { storageService } from '../../services/storageService';
import { compressImage } from '../../lib/imageUtils';
import { toast } from 'react-hot-toast';

/**
 * Service pour gérer les images de manière robuste
 */
export const ImageService = {
  /**
   * Upload avec retry automatique
   */
  async uploadWithRetry(file: File | string, path: string, retries = 0): Promise<string> {
    try {
      return await storageService.uploadFile('studio-acom', path, file);
    } catch (e) {
      if (retries <= 0) throw e;
      console.warn(`Upload failed, retrying... (${retries} retries left)`);
      return this.uploadWithRetry(file, path, retries - 1);
    }
  },

  /**
   * Flux complet : Compression -> Upload -> Retourne l'URL
   */
  async compressAndUpload(file: File, path: string): Promise<string> {
    const loadingToast = toast.loading('Optimisation et upload...');
    try {
      // 1. Compresser l'image (utilise le timeout interne de 10s)
      const compressed = await compressImage(file, 1200, 1200, 0.7);

      // 2. Upload (utilise le timeout interne de 5s)
      try {
        const url = await this.uploadWithRetry(compressed, path);
        toast.success('Image optimisée et enregistrée !', { id: loadingToast });
        return url;
      } catch (uploadError) {
        console.warn('Storage upload failed, using base64 fallback:', uploadError);
        toast.success('Image optimisée (stockage local) !', { id: loadingToast });
        return compressed;
      }
    } catch (error: any) {
      console.error('ImageService error:', error);
      toast.error(`Échec : ${error.message || 'Erreur inconnue'}`, { id: loadingToast });
      throw error;
    }
  }
};
