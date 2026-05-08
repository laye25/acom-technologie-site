import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const storageService = {
  /**
   * Uploads a file to Firebase Storage
   * @param bucket The bucket name (used as a prefix in Firebase Storage)
   * @param path The path within the bucket
   * @param file The file to upload (File object or base64 string)
   * @returns The download URL of the uploaded file
   */
  async uploadFile(bucket: string, path: string, file: File | string): Promise<string> {
    try {
      let fileBody: Blob | Uint8Array;
      let contentType: string | undefined;

      if (typeof file === 'string') {
        // Handle base64 string
        const parts = file.split(',');
        const base64Data = parts[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }
        fileBody = uint8Array;
        
        // Try to extract content type from base64
        const match = file.match(/^data:(image\/[a-zA-Z+]+);base64,/);
        if (match) {
          contentType = match[1];
        }
      } else {
        fileBody = file;
        contentType = file.type;
      }

      // In Firebase Storage, we use a single bucket usually, so we prefix the path with the "bucket" name
      const storageRef = ref(storage, `${bucket}/${path}`);
      
      const metadata = contentType ? { contentType } : undefined;
      
      // Add a 30-second timeout to allow larger files to upload on slower connections
      const uploadPromise = uploadBytes(storageRef, fileBody, metadata);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout: Firebase Storage might be slow or unconfigured')), 30000);
      });
      
      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('File uploaded, URL:', downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading file to Firebase Storage:', error);
      throw error;
    }
  },

  /**
   * Deletes a file from Firebase Storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const storageRef = ref(storage, `${bucket}/${path}`);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file from Firebase Storage:', error);
      throw error;
    }
  }
};
