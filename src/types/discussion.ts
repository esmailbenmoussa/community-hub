/**
 * Community Hub Discussion Types
 * Type definitions for discussions, comments, votes, and tags
 */

// ============================================
// Enums and Constants
// ============================================

/**
 * Default discussion categories.
 * These are the built-in categories that come pre-configured.
 * Additional categories can be defined in the ADO picklist field.
 */
export enum Category {
  Announcements = 'Announcements',
  General = 'General',
  Ideas = 'Ideas',
  Help = 'Help',
}

/**
 * Type alias for category values.
 * This allows for both the default enum values and custom categories from ADO picklists.
 * Use this type when accepting category values that may come from dynamic sources.
 */
export type CategoryValue = string;

/**
 * Default category values as an array for iteration.
 * Use this when you need to iterate over the built-in categories.
 */
export const DEFAULT_CATEGORIES: CategoryValue[] = Object.values(Category);

/**
 * Visibility scope for discussions
 */
export enum VisibilityScope {
  Project = 'Project',
  Organization = 'Organization',
  CrossProject = 'CrossProject',
}

/**
 * Sort options for discussion list
 */
export enum SortOption {
  Newest = 'newest',
  TopVoted = 'top-voted',
  MostActive = 'most-active',
}

/**
 * Custom field reference names
 */
export const DISCUSSION_FIELDS = {
  Category: 'Custom.Category',
  Visibility: 'Custom.Visibility',
  TargetProjects: 'Custom.TargetProjects',
  VoteCount: 'Custom.VoteCount',
  IsPinned: 'Custom.IsPinned',
} as const;

/**
 * Work Item Type name for discussions
 */
export const DISCUSSION_WORK_ITEM_TYPE = 'Discussion';

// ============================================
// Core Entity Types
// ============================================

/**
 * User information
 */
export interface User {
  id: string;
  displayName: string;
  imageUrl?: string;
  uniqueName?: string;
}

/**
 * Discussion entity
 */
export interface Discussion {
  /** Work Item ID */
  id: number;
  /** Discussion title */
  title: string;
  /** Discussion body content (markdown) */
  body: string;
  /** Category (can be a default enum value or custom from ADO picklist) */
  category: CategoryValue;
  /** Visibility scope */
  visibility: VisibilityScope;
  /** Target project IDs for cross-project visibility */
  targetProjects: string[];
  /** Number of upvotes */
  voteCount: number;
  /** Number of comments */
  commentCount: number;
  /** Whether discussion is pinned */
  isPinned: boolean;
  /** Assigned tags (using native ADO System.Tags) */
  tags: string[];
  /** Author information */
  author: User;
  /** Creation date */
  createdDate: Date;
  /** Last modified date */
  changedDate: Date;
  /** Project ID where discussion was created */
  projectId: string;
  /** Project name where discussion was created */
  projectName: string;
  /** Work Item state */
  state: string;
  /** First 2 unique commenters (chronological, excluding author) */
  recentCommenters?: User[];
}

/**
 * Comment reaction types supported by Azure DevOps
 */
export enum CommentReactionType {
  Like = 'like',
  Heart = 'heart',
  Hooray = 'hooray',
  Smile = 'smile',
  Confused = 'confused',
}

/**
 * Reaction on a comment
 */
export interface CommentReaction {
  /** Comment ID this reaction belongs to */
  commentId: number;
  /** Type of reaction */
  type: CommentReactionType;
  /** Total count of this reaction type */
  count: number;
  /** Whether the current user has this reaction */
  isCurrentUserEngaged: boolean;
}

/**
 * Discussion comment (from Work Item Comments API)
 */
export interface Comment {
  /** Comment ID */
  id: number;
  /** Comment text content (markdown) */
  text: string;
  /** Author information */
  author: User;
  /** Creation date */
  createdDate: Date;
  /** Last modified date */
  modifiedDate?: Date;
  /** Work Item ID this comment belongs to */
  workItemId: number;
  /** Version number */
  version: number;
  /** Reactions on this comment */
  reactions?: CommentReaction[];
}

/**
 * User vote record
 */
export interface Vote {
  discussionId: number;
  votedAt: Date;
}

/**
 * Leaderboard entry for "Most Helpful" users
 */
export interface LeaderboardEntry {
  /** User information */
  user: User;
  /** Number of comments in the time period */
  commentCount: number;
  /** Rank position (1-10) */
  rank: number;
}

// ============================================
// Input/Output Types
// ============================================

/**
 * Input for creating a new discussion
 */
export interface CreateDiscussionInput {
  title: string;
  body: string;
  category: CategoryValue;
  visibility: VisibilityScope;
  targetProjects?: string[];
  tags?: string[];
}

/**
 * Input for updating an existing discussion
 */
export interface UpdateDiscussionInput {
  title?: string;
  body?: string;
  visibility?: VisibilityScope;
  targetProjects?: string[];
  tags?: string[];
  isPinned?: boolean;
}

/**
 * Input for creating a new comment
 */
export interface CreateCommentInput {
  text: string;
}

/**
 * Input for updating a comment
 */
export interface UpdateCommentInput {
  text: string;
}

// ============================================
// List/Query Types
// ============================================

/**
 * Filter options for discussion list
 */
export interface DiscussionFilters {
  category?: CategoryValue;
  tags?: string[];
  visibility?: VisibilityScope;
  projectId?: string;
  searchTitle?: string;
  isPinned?: boolean;
}

/**
 * Options for listing discussions
 */
export interface ListDiscussionsOptions {
  filters?: DiscussionFilters;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// API Response Types
// ============================================

/**
 * Work Item field values mapping
 */
export interface DiscussionFieldValues {
  'System.Id': number;
  'System.Title': string;
  'System.Description': string;
  'System.CreatedBy': { displayName: string; id: string; imageUrl?: string };
  'System.CreatedDate': string;
  'System.ChangedDate': string;
  'System.State': string;
  'System.TeamProject': string;
  'System.Tags': string;
  [DISCUSSION_FIELDS.Category]: string;
  [DISCUSSION_FIELDS.Visibility]: string;
  [DISCUSSION_FIELDS.TargetProjects]: string;
  [DISCUSSION_FIELDS.VoteCount]: number;
  [DISCUSSION_FIELDS.IsPinned]: boolean;
}
