import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * Optimized Image Component
 * Handles Supabase image transformation, lazy loading, and fallbacks.
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackSrc,
  priority = false,
  objectFit = 'cover',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  // Helper to optimize Supabase Storage images
  const getOptimizedUrl = (url: string, targetWidth?: number) => {
    if (!url) return '';
    
    // If it's already a data URL or a blob, don't touch it
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;

    // Supabase Storage Optimization
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      // Note: Image transformation is a paid feature. 
      // We use a strategy that tries transformation but can fallback.
      const baseUrl = url.replace('/object/public/', '/render/image/public/');
      const params = new URLSearchParams();
      if (targetWidth) params.append('width', targetWidth.toString());
      params.append('quality', '80');
      params.append('format', 'webp'); // WebP is much smaller
      
      return `${baseUrl}?${params.toString()}`;
    }

    return url;
  };

  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }

    setError(false);
    setIsLoaded(false);
    
    // Initial attempt with optimization
    setCurrentSrc(getOptimizedUrl(src, width));
  }, [src, width]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    // If the optimized URL failed, try the original URL
    if (currentSrc.includes('/render/image/public/')) {
      console.warn('Supabase image transformation failed, falling back to original URL');
      setCurrentSrc(src);
    } else if (fallbackSrc && currentSrc !== fallbackSrc) {
      // If original failed, try provided fallback
      setCurrentSrc(fallbackSrc);
    } else if (!currentSrc.includes('picsum.photos')) {
      // Last resort: Picsum placeholder
      setCurrentSrc(`https://picsum.photos/seed/${encodeURIComponent(alt)}/${width || 800}/${height || 600}`);
    } else {
      setError(true);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-gray-100/50 ${className}`} style={{ width, height }}>
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10"
          >
            <Loader2 className="w-6 h-6 text-primary/20 animate-spin" />
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-300 z-10"
          >
            <ImageOff className="w-8 h-8 mb-2" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Image indisponible</span>
          </motion.div>
        )}
      </AnimatePresence>

      <img
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        className={`w-full h-full transition-all duration-700 ${
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-lg'
        }`}
        style={{ objectFit }}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
