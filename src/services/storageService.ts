import { supabase } from '../lib/supabase';

export const storageService = {
  /**
   * Uploads a file to Supabase Storage
   * @param bucket The bucket name
   * @param path The path within the bucket
   * @param file The file to upload (File object or base64 string)
   * @returns The public URL of the uploaded file
   */
  async uploadFile(bucket: string, path: string, file: File | string): Promise<string> {
    try {
      let fileBody: any;
      let contentType: string | undefined;

      if (typeof file === 'string') {
        // Handle base64 string
        const base64Data = file.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }
        fileBody = arrayBuffer;
        
        // Try to extract content type from base64
        const match = file.match(/^data:(image\/[a-zA-Z+]+);base64,/);
        if (match) {
          contentType = match[1];
        }
      } else {
        fileBody = file;
        contentType = file.type;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, fileBody, {
          contentType,
          upsert: true
        });

      if (error) {
        // If bucket doesn't exist, we might need to inform the user
        if (error.message.includes('bucket not found')) {
          throw new Error(`Le bucket "${bucket}" n'existe pas dans Supabase Storage. Veuillez le créer.`);
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Deletes a file from Supabase Storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  }
};
