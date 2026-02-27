import { User } from '@/types';

interface AvatarProps {
  /** User object with displayName and optional imageUrl */
  user: User;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether to show tooltip on hover */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Generate initials from display name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate a consistent color based on user ID or name
 */
function getAvatarColor(id: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Avatar component for displaying user profile images
 * Falls back to initials if no image is provided
 */
export function Avatar({
  user,
  size = 'md',
  showTooltip = false,
  className = '',
}: AvatarProps) {
  const sizeClasses = {
    xs: 'h-5 w-5 text-[10px]',
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  const initials = getInitials(user.displayName);
  const bgColor = getAvatarColor(user.id);

  return (
    <div
      className={`relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClasses[size]} ${className}`}
      title={showTooltip ? user.displayName : undefined}
    >
      {user.imageUrl ? (
        <img
          src={user.imageUrl}
          alt={user.displayName}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Hide image on error, fallback will show
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}

      {/* Fallback initials (shown if no image or image fails to load) */}
      <div
        className={`absolute inset-0 flex items-center justify-center font-medium text-white ${bgColor} ${user.imageUrl ? 'opacity-0' : 'opacity-100'}`}
      >
        {initials}
      </div>
    </div>
  );
}

export default Avatar;
