import React, { useState } from 'react';
import { User } from 'lucide-react';

interface RiderAvatarProps {
  name: string;
  avatarUrl?: string;
  sizeClass?: string;
}

export const RiderAvatar: React.FC<RiderAvatarProps> = ({
  name,
  avatarUrl,
  sizeClass = 'w-10 h-10',
}) => {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!avatarUrl || imgError) {
    return (
      <div
        className={`${sizeClass} rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0`}
        aria-label={name}
      >
        {initials || <User className="w-4 h-4 text-slate-500" />}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={`${sizeClass} rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100`}
    />
  );
};
