import { storageService } from '../../services/storageService';
import { compressBase64Image } from '../../lib/imageUtils';
import { toast } from 'react-hot-toast';

/**
 * Service pour gérer les images de manière robuste
 */
export const ImageService = {
  /**
   * Upload avec retry automatique
   */
  async uploadWithRetry(file: File | string, path: string, retries = 3): Promise<string> {
    try {
      // Si c'est un fichier, on l'upload directement
      if (file instanceof File) {
        return await storageService.uploadFile('studio-acom', path, file);
      }
      // Si c'est du base64 (fallback), on l'upload
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
      // 1. Convertir en base64 pour compresser
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // 2. Compresser
      const compressed = await compressBase64Image(base64, 1200, 1200, 0.7);

      // 3. Upload avec retry
      const url = await this.uploadWithRetry(compressed, path);
      
      toast.success('Image optimisée et enregistrée !', { id: loadingToast });
      return url;
    } catch (error) {
      toast.error('Échec de l\'optimisation de l\'image.', { id: loadingToast });
      throw error;
    }
  }
};
