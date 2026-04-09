import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import { getOptimizedUrl } from '../lib/imageUtils';

interface OptimizedImageProps extends HTMLMotionProps<"img"> {
  src: string;
  alt: string;
  width?: number;
  quality?: number;
  className?: string;
  containerClassName?: string;
  fallbackClassName?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  width = 800,
  quality = 80,
  className = '', 
  containerClassName = '',
  fallbackClassName = '',
  priority = false,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimizedSrc = getOptimizedUrl(src, width, quality);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${containerClassName} ${className.includes('h-') ? '' : 'h-full'} ${className.includes('w-') ? '' : 'w-full'}`}>
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10"
          >
            <div className="w-full h-full animate-pulse bg-gray-200" />
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <div className={`flex flex-col items-center justify-center bg-gray-50 text-gray-400 ${fallbackClassName || 'h-full'}`}>
          <ImageIcon className="w-1/3 h-1/3 opacity-20" />
          <span className="text-[10px] mt-2 font-mono uppercase tracking-tighter opacity-50">Image non disponible</span>
        </div>
      ) : (
        <motion.img
          src={optimizedSrc}
          alt={alt}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0,
            scale: isLoaded ? 1 : 1.05
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover ${className}`}
          loading={priority ? 'eager' : 'lazy'}
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
};
