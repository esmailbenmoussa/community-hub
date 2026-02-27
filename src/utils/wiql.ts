/**
 * WIQL Query Builder
 * Utility functions for building Work Item Query Language (WIQL) queries
 * for fetching discussions from Azure DevOps.
 */

import {
  DISCUSSION_WORK_ITEM_TYPE,
  DISCUSSION_FIELDS,
  SortOption,
  DiscussionFilters,
  Category,
  VisibilityScope,
} from '@/types';

/**
 * Base fields to select for discussion queries
 */
const BASE_FIELDS = [
  '[System.Id]',
  '[System.Title]',
  '[System.Description]',
  '[System.CreatedBy]',
  '[System.CreatedDate]',
  '[System.ChangedDate]',
  '[System.State]',
  '[System.TeamProject]',
  '[System.CommentCount]',
  '[System.Tags]',
  `[${DISCUSSION_FIELDS.Category}]`,
  `[${DISCUSSION_FIELDS.Visibility}]`,
  `[${DISCUSSION_FIELDS.TargetProjects}]`,
  `[${DISCUSSION_FIELDS.VoteCount}]`,
  `[${DISCUSSION_FIELDS.IsPinned}]`,
];

/**
 * Build the SELECT clause for discussion queries
 */
export function buildSelectClause(): string {
  return `SELECT ${BASE_FIELDS.join(', ')}`;
}

/**
 * Build the FROM clause - always from WorkItems
 */
export function buildFromClause(): string {
  return 'FROM WorkItems';
}

/**
 * Build a WHERE clause for discussion queries
 */
export function buildWhereClause(
  projectId: string,
  filters?: DiscussionFilters,
  includeOrgWide: boolean = false,
  includeCrossProject: boolean = false
): string {
  const conditions: string[] = [];

  // Always filter by Discussion Work Item Type
  conditions.push(`[System.WorkItemType] = '${DISCUSSION_WORK_ITEM_TYPE}'`);

  // Filter by project (with org-wide and cross-project support)
  if (includeOrgWide || includeCrossProject) {
    // Complex visibility filter
    const visibilityConditions: string[] = [];

    // Include project-specific discussions
    visibilityConditions.push(
      `([System.TeamProject] = @project AND [${DISCUSSION_FIELDS.Visibility}] = '${VisibilityScope.Project}')`
    );

    // Include org-wide discussions from any project
    if (includeOrgWide) {
      visibilityConditions.push(
        `[${DISCUSSION_FIELDS.Visibility}] = '${VisibilityScope.Organization}'`
      );
    }

    // Include cross-project discussions that target this project
    if (includeCrossProject) {
      visibilityConditions.push(
        `([${DISCUSSION_FIELDS.Visibility}] = '${VisibilityScope.CrossProject}' AND [${DISCUSSION_FIELDS.TargetProjects}] CONTAINS '${projectId}')`
      );
    }

    conditions.push(`(${visibilityConditions.join(' OR ')})`);
  } else {
    // Simple project filter
    conditions.push('[System.TeamProject] = @project');
  }

  // Filter by category
  if (filters?.category) {
    conditions.push(`[${DISCUSSION_FIELDS.Category}] = '${filters.category}'`);
  }

  // Filter by visibility
  if (filters?.visibility) {
    conditions.push(
      `[${DISCUSSION_FIELDS.Visibility}] = '${filters.visibility}'`
    );
  }

  // Filter by pinned status
  if (filters?.isPinned !== undefined) {
    conditions.push(
      `[${DISCUSSION_FIELDS.IsPinned}] = ${filters.isPinned ? 'true' : 'false'}`
    );
  }

  // Filter by tags (any tag match) - uses native ADO System.Tags
  if (filters?.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map(
      (tag) => `[System.Tags] CONTAINS '${escapeString(tag)}'`
    );
    conditions.push(`(${tagConditions.join(' OR ')})`);
  }

  // Filter by title search
  if (filters?.searchTitle) {
    conditions.push(
      `[System.Title] CONTAINS '${escapeString(filters.searchTitle)}'`
    );
  }

  // Only show active (non-deleted) discussions
  conditions.push(`[System.State] <> 'Removed'`);

  return `WHERE ${conditions.join(' AND ')}`;
}

/**
 * Build an ORDER BY clause for discussion queries
 */
export function buildOrderByClause(sort?: SortOption): string {
  switch (sort) {
    case SortOption.TopVoted:
      return `ORDER BY [${DISCUSSION_FIELDS.VoteCount}] DESC, [System.CreatedDate] DESC`;
    case SortOption.MostActive:
      return `ORDER BY [System.ChangedDate] DESC`;
    case SortOption.Newest:
    default:
      // Pinned items first, then by creation date
      return `ORDER BY [${DISCUSSION_FIELDS.IsPinned}] DESC, [System.CreatedDate] DESC`;
  }
}

/**
 * Build a complete WIQL query for listing discussions
 */
export function buildListDiscussionsQuery(
  projectId: string,
  filters?: DiscussionFilters,
  sort?: SortOption,
  options?: {
    includeOrgWide?: boolean;
    includeCrossProject?: boolean;
  }
): string {
  const select = buildSelectClause();
  const from = buildFromClause();
  const where = buildWhereClause(
    projectId,
    filters,
    options?.includeOrgWide,
    options?.includeCrossProject
  );
  const orderBy = buildOrderByClause(sort);

  return `${select} ${from} ${where} ${orderBy}`;
}

/**
 * Build a WIQL query to get a single discussion by ID
 */
export function buildGetDiscussionQuery(discussionId: number): string {
  const select = buildSelectClause();
  const from = buildFromClause();

  return `${select} ${from} WHERE [System.Id] = ${discussionId}`;
}

/**
 * Build a WIQL query for org-level aggregated view
 * Gets discussions from all projects with org-wide or cross-project visibility
 */
export function buildOrgLevelQuery(
  filters?: DiscussionFilters,
  sort?: SortOption
): string {
  const select = buildSelectClause();
  const from = buildFromClause();

  const conditions: string[] = [];

  // Always filter by Discussion Work Item Type
  conditions.push(`[System.WorkItemType] = '${DISCUSSION_WORK_ITEM_TYPE}'`);

  // Only show org-wide and cross-project discussions
  conditions.push(
    `([${DISCUSSION_FIELDS.Visibility}] = '${VisibilityScope.Organization}' OR [${DISCUSSION_FIELDS.Visibility}] = '${VisibilityScope.CrossProject}')`
  );

  // Apply additional filters
  if (filters?.category) {
    conditions.push(`[${DISCUSSION_FIELDS.Category}] = '${filters.category}'`);
  }

  if (filters?.projectId) {
    conditions.push(
      `[System.TeamProject] = '${escapeString(filters.projectId)}'`
    );
  }

  if (filters?.searchTitle) {
    conditions.push(
      `[System.Title] CONTAINS '${escapeString(filters.searchTitle)}'`
    );
  }

  // Only show active discussions
  conditions.push(`[System.State] <> 'Removed'`);

  const where = `WHERE ${conditions.join(' AND ')}`;
  const orderBy = buildOrderByClause(sort);

  return `${select} ${from} ${where} ${orderBy}`;
}

/**
 * Escape special characters in WIQL string values
 */
function escapeString(value: string): string {
  // Escape single quotes by doubling them
  return value.replace(/'/g, "''");
}

/**
 * Parse a Category enum value from string
 */
export function parseCategory(value: string | undefined): Category {
  if (!value) return Category.General;

  const normalized = value as Category;
  if (Object.values(Category).includes(normalized)) {
    return normalized;
  }
  return Category.General;
}

/**
 * Parse a VisibilityScope enum value from string
 */
export function parseVisibility(value: string | undefined): VisibilityScope {
  if (!value) return VisibilityScope.Project;

  const normalized = value as VisibilityScope;
  if (Object.values(VisibilityScope).includes(normalized)) {
    return normalized;
  }
  return VisibilityScope.Project;
}

/**
 * Parse a JSON string array (for target projects)
 */
export function parseJsonArray(value: string | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string');
    }
  } catch {
    // If not valid JSON, try splitting by comma
    if (value.includes(',')) {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // Single value
    if (value.trim()) {
      return [value.trim()];
    }
  }
  return [];
}

/**
 * Parse ADO System.Tags field (semicolon-separated string) into array
 */
export function parseTagString(value: string | undefined | null): string[] {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(';')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
