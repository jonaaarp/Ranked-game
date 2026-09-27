import React, { useState } from 'react';
import { RankTier, RankDivisionInfo } from '../types/ranked';
import { getDivisionImageUrl } from '../utils/rankImages';

interface RankBadgeProps {
  rank: RankTier | RankDivisionInfo;
  divisionLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showEloRange?: boolean;
  imageUrl?: string;
  divisionImages?: Record<string, string>;
  hideImage?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  rank,
  divisionLabel,
  size = 'md',
  showLabel = false,
  showEloRange = false,
  imageUrl,
  divisionImages,
  hideImage = false,
}) => {
  const [imgError, setImgError] = useState(false);

  // Container styling when showing label
  const withLabelSizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 rounded-lg',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-lg',
    lg: 'text-sm px-3 py-1.5 gap-2 rounded-xl',
    xl: 'text-base px-4 py-2 font-bold gap-2.5 rounded-2xl',
  };

  // Standalone container styling (just the URL image, bigger and perfectly framed)
  const soloSizeClasses = {
    sm: 'w-9 h-9 p-1 rounded-xl',
    md: 'w-12 h-12 p-1.5 rounded-2xl',
    lg: 'w-16 h-16 p-2 rounded-2xl',
    xl: 'w-24 h-24 p-2.5 rounded-3xl',
  };

  const imgWithLabelClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const displayName =
    'fullName' in rank
      ? rank.fullName
      : divisionLabel
      ? `${rank.name} ${divisionLabel}`
      : rank.name;

  const effectiveImageUrl =
    imageUrl || ('imageUrl' in rank && rank.imageUrl ? rank.imageUrl : getDivisionImageUrl(displayName, divisionImages));

  return (
    <span
      className={`inline-flex items-center justify-center font-semibold border select-none transition-all shadow-sm ${
        showLabel ? withLabelSizeClasses[size] : soloSizeClasses[size]
      }`}
      style={{
        backgroundColor: `${rank.color}1e`,
        borderColor: `${rank.color}55`,
        color: rank.color,
      }}
      title={displayName}
    >
      {!hideImage && effectiveImageUrl && !imgError ? (
        <img
          src={effectiveImageUrl}
          alt={displayName}
          onError={() => setImgError(true)}
          className={`${showLabel ? imgWithLabelClasses[size] : 'w-full h-full'} object-contain shrink-0`}
          loading="lazy"
        />
      ) : (
        <span className="text-[10px] font-bold font-mono px-0.5 truncate">
          {displayName}
        </span>
      )}

      {showLabel && (
        <span className="whitespace-nowrap font-bold uppercase tracking-wider">
          {displayName}
        </span>
      )}

      {showEloRange && (
        <span className="text-[10px] opacity-75 font-mono ml-0.5">
          {rank.minElo}+
        </span>
      )}
    </span>
  );
};
