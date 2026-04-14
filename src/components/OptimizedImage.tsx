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
  fallback = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
  ...props 
}) => {
  const [error, setError] = useState(false);

  // Utilisation du fallback si src est vide
  const finalSrc = src || fallback;
  const optimizedSrc = getOptimizedUrl(finalSrc, width, quality);

  // Reset state when src changes
  useEffect(() => {
    setError(false);
  }, [optimizedSrc]);

  return (
    <div className={`relative overflow-hidden w-full h-full ${containerClassName}`}>
      {error ? (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-400`}>
          <ImageIcon className="w-8 h-8 opacity-50" />
        </div>
      ) : (
        <img
          src={optimizedSrc}
          alt={alt}
          onError={() => setError(true)}
          className={`absolute inset-0 w-full h-full ${className.includes('object-') ? '' : 'object-cover'} ${className}`}
          loading={priority ? "eager" : "lazy"}
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
};
