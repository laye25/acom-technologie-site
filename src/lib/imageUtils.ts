/**
 * Utility to compress and resize images before uploading to Firestore
 * to stay within the 1MB document limit.
 */
export const compressImage = (file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const timeout = setTimeout(() => reject(new Error('Image reading timeout')), 10000);
    
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      clearTimeout(timeout);
      const img = new Image();
      const imgTimeout = setTimeout(() => reject(new Error('Image loading timeout')), 10000);
      
      img.src = event.target?.result as string;
      img.onload = () => {
        clearTimeout(imgTimeout);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with specified quality
        // JPEG is much more efficient for photos than PNG (default of toDataURL)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => {
        clearTimeout(imgTimeout);
        reject(err);
      };
    };
    reader.onerror = (err) => {
      clearTimeout(timeout);
      reject(err);
    };
  });
};

/**
 * Compresses an existing base64 image string
 */
export const compressBase64Image = (base64: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeout = setTimeout(() => reject(new Error('Image compression timeout')), 10000);
    
    img.onerror = (err) => {
      clearTimeout(timeout);
      reject(err);
    };
    img.src = base64;
    img.onload = () => {
      clearTimeout(timeout);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * Helper to optimize Supabase Storage images using their built-in image transformation
 */
export const getOptimizedUrl = (url: string, width: number = 800, quality: number = 80) => {
  if (!url) return url;
  
  // Handle Supabase Storage URLs
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    // Only use transformation if quality is set to something other than default or if explicitly needed
    // For now, let's use the standard public URL to ensure display, 
    // as /render/ requires specific project settings.
    return url;
  }
  
  // Handle Unsplash URLs
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&q=${quality}&w=${width}`;
  }

  // Handle Picsum URLs
  if (url.includes('picsum.photos')) {
    // Picsum format is often https://picsum.photos/seed/xxx/width/height
    // We can try to replace the width/height if it matches the pattern
    const parts = url.split('/');
    if (parts.length >= 5 && !isNaN(Number(parts[parts.length - 2]))) {
      parts[parts.length - 2] = width.toString();
      parts[parts.length - 1] = Math.round(width * 0.6).toString(); // Maintain some aspect ratio
      return parts.join('/');
    }
  }

  return url;
};

/**
 * Normalizes image URL from item (category, product, etc.)
 */
export const getImageUrl = (item: any): string => {
  if (!item) return '';
  const url = item.coverImage || item.cover_image || item.image || item.previewImage || item.preview || '';
  return typeof url === 'string' && url.trim() !== '' ? url.trim() : '';
};
