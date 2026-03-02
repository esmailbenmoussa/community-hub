interface ProjectBadgeProps {
  /** The project name to display */
  projectName: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

/**
 * ProjectBadge component - displays the origin project for cross-project discussions.
 * Shows a folder icon with "from {projectName}" text.
 * Used when a discussion originates from a different project than the current one.
 */
export function ProjectBadge({ projectName, size = 'md' }: ProjectBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${sizeClasses[size]}
        border-border bg-surface-secondary text-content-secondary
      `}
      title={`This discussion is from the "${projectName}" project`}
    >
      {/* Folder icon */}
      <svg
        className={iconSize}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
      <span>from {projectName}</span>
    </span>
  );
}

export default ProjectBadge;
