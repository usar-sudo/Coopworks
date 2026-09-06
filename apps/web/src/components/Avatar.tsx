import React, { useState } from 'react';

/**
 * Avatar — renders a photo when `src` is present, otherwise (or when the
 * image fails to load) a deterministic initials tile. This prevents the
 * empty `src=""` image warnings that occur when a worker/profile has no
 * avatar photo (common in live mode, where RLS may keep avatars empty).
 */
export const Avatar: React.FC<{
  src?: string | null;
  name?: string;
  alt?: string;
  className?: string;
  initialsClassName?: string;
}> = ({ src, name, alt, className = '', initialsClassName = '' }) => {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  if (!showImage) {
    const initials = (name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => (part[0] || '').toUpperCase())
      .join('');
    return (
      <span
        role="img"
        aria-label={alt || name || 'avatar'}
        className={`inline-flex items-center justify-center shrink-0 select-none overflow-hidden bg-[#FF7448]/15 dark:bg-[#FF7448]/20 text-[#FF7448] font-bold ${className} ${initialsClassName}`}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={src as string}
      alt={alt || name || 'avatar'}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 ${className}`}
    />
  );
};
