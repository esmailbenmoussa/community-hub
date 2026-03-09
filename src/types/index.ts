import type { IUserContext } from 'azure-devops-extension-sdk';

// Re-export all Community Hub types
export * from './discussion';
export * from './setup';
export * from './fieldMapping';
export * from './categorySettings';
export * from './admin';

/**
 * Azure DevOps context returned by useAzureDevOps hook
 */
export interface AzureDevOpsContext {
  /** Whether the SDK is initialized and ready */
  isReady: boolean;
  /** Current user context */
  user: IUserContext | null;
  /** Host/organization name */
  hostName: string;
  /** Current project name */
  projectName: string;
}

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * Button size types
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Content to display inside the button */
  children: React.ReactNode;
}

/**
 * Direction for FadeIn animation
 */
export type FadeInDirection = 'up' | 'down' | 'left' | 'right' | 'none';

/**
 * FadeIn animation component props
 */
export interface FadeInProps {
  /** Content to animate */
  children: React.ReactNode;
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Duration of the animation (in seconds) */
  duration?: number;
  /** Direction of the slide animation */
  direction?: FadeInDirection;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AnimatedCard component props
 */
export interface AnimatedCardProps {
  /** Content to display inside the card */
  children: React.ReactNode;
  /** Delay before entrance animation starts (in seconds) */
  delay?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Side panel props
 */
export interface SidePanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel should close */
  onClose: () => void;
  /** Panel title */
  title: string;
  /** Panel content */
  children: React.ReactNode;
  /** Panel width */
  width?: 'sm' | 'md' | 'lg';
}

// ============================================
// Example Item Types (for template demonstration)
// ============================================

/**
 * Example item for demonstrating the template
 */
export interface ExampleItem {
  /** Unique identifier */
  id: number;
  /** Item title */
  title: string;
  /** Item description */
  description: string;
  /** Current status */
  status: 'active' | 'pending' | 'completed';
  /** Creation date */
  createdAt: Date;
  /** Tags associated with the item */
  tags?: string[];
}

/**
 * Example card props
 */
export interface ExampleCardProps {
  /** Item to display */
  item: ExampleItem;
  /** Whether this card is selected */
  isSelected?: boolean;
  /** Click handler */
  onClick: (item: ExampleItem) => void;
}

/**
 * Example list item props
 */
export interface ExampleListItemProps {
  /** Item to display */
  item: ExampleItem;
  /** Click handler */
  onClick: (item: ExampleItem) => void;
}
