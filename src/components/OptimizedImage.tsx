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
  placeholder?: 'blur' | 'empty';
  fallback?: string;
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
  placeholder = 'empty',
  fallback = '/images/placeholder.jpg',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Utilisation du fallback si src est vide
  const finalSrc = src || fallback;
  const optimizedSrc = getOptimizedUrl(finalSrc, width, quality);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [finalSrc]); // Use finalSrc instead of src for stability

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${containerClassName} ${className.includes('h-') ? '' : 'h-full'} ${className.includes('w-') ? '' : 'w-full'}`}>
      {!isLoaded && !error && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 z-10 ${placeholder === 'blur' ? 'animate-pulse' : ''}`} />
      )}

      {error ? (
        <img src={fallback} alt={alt} className={`w-full h-full object-cover ${className}`} />
      ) : (
        <img
          src={optimizedSrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
          loading={priority ? "eager" : "lazy"}
          {...props}
        />
      )}
    </div>
  );
};
