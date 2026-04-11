import React, { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { getOptimizedUrl } from '../lib/imageUtils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
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
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="w-full h-full bg-gray-200" />
        </div>
      )}

      {error ? (
        <div className={`flex flex-col items-center justify-center bg-gray-50 text-gray-400 ${fallbackClassName || 'h-full'}`}>
          <ImageIcon className="w-1/3 h-1/3 opacity-20" />
          <span className="text-[10px] mt-2 font-mono uppercase tracking-tighter opacity-50">Image non disponible</span>
        </div>
      ) : (
        <img
          src={optimizedSrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            console.error(`Failed to load image: ${optimizedSrc}`, {
              originalSrc: src,
              error: e,
              isSupabase: src.includes('supabase.co'),
              isBase64: src.startsWith('data:')
            });
            setError(true);
          }}
          className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
          loading="eager"
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
};
