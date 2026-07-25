import React from 'react';

interface GarmentVectorIconProps {
  id?: string;
  name?: string;
  category?: string;
  className?: string;
  size?: number;
  color?: string;
}

export const GarmentVectorIcon: React.FC<GarmentVectorIconProps> = ({
  id = '',
  name = '',
  category = '',
  className = 'w-6 h-6',
  size = 24,
  color = 'currentColor'
}) => {
  const lowerId = id.toLowerCase();
  const lowerName = name.toLowerCase();

  // Grand Boubou / Agbada
  if (lowerId.includes('agbada') || lowerId.includes('boubou-grand') || lowerName.includes('agbada') || lowerName.includes('grand boubou')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Large flowing shoulders & sleeves */}
        <path d="M 4 11 L 11 6 L 16 8 L 21 6 L 28 11 L 27 21 L 22 20 L 22 28 L 10 28 L 10 20 L 5 21 Z" fill="currentColor" fillOpacity="0.1" />
        {/* Embroidered neckline V/U collar */}
        <path d="M 12 7 C 12 12 20 12 20 7" strokeWidth="2" />
        <path d="M 16 11 L 16 17" strokeWidth="1.5" strokeDasharray="1 1" />
        {/* Chest embroidery medallion motif */}
        <polygon points="16,13 18,15 16,17 14,15" fill="currentColor" />
        {/* Sleeve folds */}
        <path d="M 8 13 L 8 19" strokeWidth="1.2" opacity="0.6" />
        <path d="M 24 13 L 24 19" strokeWidth="1.2" opacity="0.6" />
      </svg>
    );
  }

  // Petit Boubou / Senegalese Boubou
  if (lowerId.includes('boubou-petit') || lowerName.includes('petit boubou')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M 6 10 L 12 6 L 20 6 L 26 10 L 25 26 L 7 26 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M 13 6 C 13 10 19 10 19 6" strokeWidth="2" />
        <path d="M 16 10 L 16 16" />
        <line x1="12" y1="26" x2="12" y2="29" />
        <line x1="20" y1="26" x2="20" y2="29" />
      </svg>
    );
  }

  // Kaftan / Abaya / Djellaba
  if (lowerId.includes('kaftan') || lowerId.includes('abaya') || lowerName.includes('kaftan') || lowerName.includes('abaya') || lowerName.includes('djellaba')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M 8 7 L 12 4 L 20 4 L 24 7 L 26 28 L 6 28 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M 14 4 L 16 9 L 18 4" strokeWidth="2" />
        <path d="M 16 9 L 16 28" strokeWidth="1.5" strokeDasharray="2 1" />
        <path d="M 8 13 L 3 15" />
        <path d="M 24 13 L 29 15" />
      </svg>
    );
  }

  // Dashiki / Tunique
  if (lowerId.includes('dashiki') || lowerId.includes('tunique') || lowerName.includes('dashiki') || lowerName.includes('tunique') || lowerName.includes('mande')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M 5 10 L 11 6 L 21 6 L 27 10 L 25 22 L 7 22 Z" fill="currentColor" fillOpacity="0.1" />
        {/* Dashiki V Neck Ornament */}
        <polygon points="16,6 20,11 16,15 12,11" fill="currentColor" fillOpacity="0.2" strokeWidth="1.5" />
        <line x1="16" y1="15" x2="16" y2="22" strokeWidth="1.5" />
      </svg>
    );
  }

  // Gandoura
  if (lowerId.includes('gandoura') || lowerName.includes('gandoura')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M 7 8 L 12 5 L 20 5 L 25 8 L 24 28 L 8 28 Z" fill="currentColor" fillOpacity="0.1" />
        <circle cx="16" cy="8" r="2.5" strokeWidth="1.5" />
        <path d="M 16 10.5 L 16 20" strokeDasharray="2 1" />
      </svg>
    );
  }

  // Robe Africaine / Robe Bazin / Robe Soirée
  if (lowerId.includes('robe') || lowerName.includes('robe')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Fitted Bust + Flared / Mermaid Skirt */}
        <path d="M 11 5 L 21 5 L 19 12 L 23 20 L 26 28 L 6 28 L 9 20 L 13 12 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M 11 5 C 16 9 16 9 21 5" strokeWidth="1.8" />
        <path d="M 13 12 C 16 13 16 13 19 12" strokeWidth="1.5" />
        <path d="M 16 5 L 16 12" opacity="0.5" />
      </svg>
    );
  }

  // Ensemble Marinière / Taille Basse / Corsage
  if (lowerId.includes('ensemble-femme') || lowerId.includes('corsage') || lowerName.includes('marinière') || lowerName.includes('taille basse')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Top Corsage */}
        <path d="M 10 5 L 22 5 L 20 13 L 12 13 Z" fill="currentColor" fillOpacity="0.15" />
        {/* Peplum / Flounce */}
        <path d="M 12 13 Q 16 17 20 13 L 23 16 L 9 16 Z" />
        {/* Long Pagne / Skirt */}
        <path d="M 10 17 L 22 17 L 24 28 L 8 28 Z" fill="currentColor" fillOpacity="0.1" />
      </svg>
    );
  }

  // Pagne Cousu / Jupe
  if (lowerId.includes('pagne') || lowerId.includes('jupe') || lowerName.includes('pagne') || lowerName.includes('jupe')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M 10 8 L 22 8 L 25 28 L 7 28 Z" fill="currentColor" fillOpacity="0.1" />
        <line x1="10" y1="12" x2="22" y2="12" strokeWidth="1.5" />
        <path d="M 16 8 L 16 28" strokeDasharray="2 1" opacity="0.6" />
      </svg>
    );
  }

  // Tailleur Dame / Blazer
  if (lowerId.includes('tailleur') || lowerId.includes('blazer') || lowerName.includes('tailleur') || lowerName.includes('blazer')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M 8 6 L 24 6 L 22 22 L 10 22 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M 8 6 L 13 13 L 16 13 L 19 13 L 24 6" strokeWidth="2" />
        <circle cx="16" cy="17" r="1" fill="currentColor" />
        <circle cx="16" cy="20" r="1" fill="currentColor" />
      </svg>
    );
  }

  // Costume Sur-Mesure / Veste
  if (lowerId.includes('costume') || lowerName.includes('costume') || lowerName.includes('veste')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M 7 6 L 25 6 L 23 22 L 9 22 Z" fill="currentColor" fillOpacity="0.1" />
        {/* Lapels */}
        <path d="M 7 6 L 12 12 L 16 12 L 20 12 L 25 6" strokeWidth="2" />
        {/* Tie */}
        <polygon points="16,6 17.5,8 16,15 14.5,8" fill="currentColor" stroke="none" />
        <circle cx="16" cy="18" r="1" fill="currentColor" />
      </svg>
    );
  }

  // Chemise
  if (lowerId.includes('chemise') || lowerName.includes('chemise')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M 7 8 L 12 5 L 20 5 L 25 8 L 23 23 L 9 23 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M 12 5 L 16 8 L 20 5" strokeWidth="2" />
        <line x1="16" y1="8" x2="16" y2="23" strokeDasharray="2 1" />
        <line x1="7" y1="12" x2="2" y2="14" />
        <line x1="25" y1="12" x2="30" y2="14" />
      </svg>
    );
  }

  // Pantalon / Chino / Tuxedo
  if (lowerId.includes('pantalon') || lowerName.includes('pantalon') || lowerName.includes('chino')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M 9 6 L 23 6 L 21 28 L 17 28 L 16 14 L 15 14 L 11 28 L 7 28 Z" fill="currentColor" fillOpacity="0.1" />
        <line x1="9" y1="9" x2="23" y2="9" strokeWidth="1.5" />
      </svg>
    );
  }

  // Enfant / Garçon / Fille
  if (lowerId.includes('enfant') || lowerName.includes('enfant') || lowerName.includes('garçon') || lowerName.includes('fille')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="16" cy="8" r="4" fill="currentColor" fillOpacity="0.15" />
        <path d="M 10 15 L 22 15 L 20 27 L 12 27 Z" />
      </svg>
    );
  }

  // Fallback Generic Couture Scissors & Tape Icon
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M 8 7 L 13 4 L 19 4 L 24 7 L 22 25 L 10 25 Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M 13 4 C 13 8 19 8 19 4" />
    </svg>
  );
};
