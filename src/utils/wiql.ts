/**
 * WIQL Query Builder
 * Utility functions for building Work Item Query Language (WIQL) queries
 * for fetching discussions from Azure DevOps.
 *
 * This module now supports dynamic field resolution to prevent TF51005 errors
 * when custom fields don't exist in the user's process template.
 */

import {
  DISCUSSION_WORK_ITEM_TYPE,
  DISCUSSION_FIELDS,
  SortOption,
  DiscussionFilters,
  Category,
  VisibilityScope,
} from '@/types';
import { ResolvedFields } from './fieldResolver';

/**
 * System fields that are always available in ADO
 */
const SYSTEM_FIELDS = [
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
];

/**
 * Legacy base fields - used when no resolved fields are provided.
 * @deprecated Use buildSelectClauseWithFields instead
 */
const BASE_FIELDS = [
  ...SYSTEM_FIELDS,
  `[${DISCUSSION_FIELDS.Category}]`,
  `[${DISCUSSION_FIELDS.Visibility}]`,
  `[${DISCUSSION_FIELDS.TargetProjects}]`,
  `[${DISCUSSION_FIELDS.VoteCount}]`,
  `[${DISCUSSION_FIELDS.IsPinned}]`,
];

/**
 * Build custom fields array based on resolved field mapping.
 * Only includes fields that are actually mapped.
 */
function buildCustomFields(fields: ResolvedFields): string[] {
  const customFields: string[] = [];

  // Required fields (always present after setup)
  if (fields.Category) {
    customFields.push(`[${fields.Category}]`);
  }
  if (fields.Visibility) {
    customFields.push(`[${fields.Visibility}]`);
  }

  // Optional fields (only if mapped)
  if (fields.TargetProjects) {
    customFields.push(`[${fields.TargetProjects}]`);
  }
  if (fields.VoteCount) {
    customFields.push(`[${fields.VoteCount}]`);
  }
  if (fields.IsPinned) {
    customFields.push(`[${fields.IsPinned}]`);
  }

  return customFields;
}

/**
 * Build the SELECT clause for discussion queries using resolved fields.
 * Only includes fields that are mapped in the field configuration.
 *
 * @param fields - Resolved field reference names
 * @returns SELECT clause string
 */
export function buildSelectClauseWithFields(fields: ResolvedFields): string {
  const allFields = [...SYSTEM_FIELDS, ...buildCustomFields(fields)];
  return `SELECT ${allFields.join(', ')}`;
}

/**
 * Build the SELECT clause for discussion queries.
 * @deprecated Use buildSelectClauseWithFields with resolved fields instead
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
 * Options for building WHERE clauses with resolved fields
 */
export interface WhereClauseOptions {
  /** Include org-wide discussions */
  includeOrgWide?: boolean;
  /** Include cross-project discussions (requires TargetProjects field) */
  includeCrossProject?: boolean;
  /** Resolved field reference names */
  fields?: ResolvedFields;
}

/**
 * Build a WHERE clause for discussion queries using resolved fields.
 *
 * @param projectId - Current project ID
 * @param filters - Optional filters to apply
 * @param options - Options including resolved fields
 * @returns WHERE clause string
 */
export function buildWhereClauseWithFields(
  projectId: string,
  filters?: DiscussionFilters,
  options?: WhereClauseOptions
): string {
  const conditions: string[] = [];
  const fields = options?.fields;
  const includeOrgWide = options?.includeOrgWide ?? false;

  // Cross-project requires the TargetProjects field to be mapped
  const includeCrossProject =
    options?.includeCrossProject && fields?.TargetProjects;

  // Get field references (with fallback to defaults for backward compatibility)
  const visibilityField = fields?.Visibility || DISCUSSION_FIELDS.Visibility;
  const categoryField = fields?.Category || DISCUSSION_FIELDS.Category;
  const isPinnedField = fields?.IsPinned;
  const targetProjectsField = fields?.TargetProjects;

  // Always filter by Discussion Work Item Type
  conditions.push(`[System.WorkItemType] = '${DISCUSSION_WORK_ITEM_TYPE}'`);

  // Filter by project (with org-wide and cross-project support)
  if (includeOrgWide || includeCrossProject) {
    // Complex visibility filter
    const visibilityConditions: string[] = [];

    // Include project-specific discussions
    visibilityConditions.push(
      `([System.TeamProject] = @project AND [${visibilityField}] = '${VisibilityScope.Project}')`
    );

    // Include org-wide discussions from any project
    if (includeOrgWide) {
      visibilityConditions.push(
        `[${visibilityField}] = '${VisibilityScope.Organization}'`
      );
    }

    // Include cross-project discussions that target this project
    // Only if TargetProjects field is mapped
    if (includeCrossProject && targetProjectsField) {
      visibilityConditions.push(
        `([${visibilityField}] = '${VisibilityScope.CrossProject}' AND [${targetProjectsField}] CONTAINS '${projectId}')`
      );
    }

    conditions.push(`(${visibilityConditions.join(' OR ')})`);
  } else {
    // Simple project filter
    conditions.push('[System.TeamProject] = @project');
  }

  // Filter by category
  if (filters?.category) {
    conditions.push(`[${categoryField}] = '${filters.category}'`);
  }

  // Filter by visibility
  if (filters?.visibility) {
    conditions.push(`[${visibilityField}] = '${filters.visibility}'`);
  }

  // Filter by pinned status - only if IsPinned field is mapped
  if (filters?.isPinned !== undefined && isPinnedField) {
    conditions.push(
      `[${isPinnedField}] = ${filters.isPinned ? 'true' : 'false'}`
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
 * Build a WHERE clause for discussion queries.
 * @deprecated Use buildWhereClauseWithFields with resolved fields instead
 */
export function buildWhereClause(
  projectId: string,
  filters?: DiscussionFilters,
  includeOrgWide: boolean = false,
  includeCrossProject: boolean = false
): string {
  return buildWhereClauseWithFields(projectId, filters, {
    includeOrgWide,
    includeCrossProject,
    // No resolved fields - uses hardcoded defaults
  });
}

/**
 * Build an ORDER BY clause for discussion queries using resolved fields.
 *
 * @param sort - Sort option
 * @param fields - Resolved field reference names
 * @returns ORDER BY clause string
 */
export function buildOrderByClauseWithFields(
  sort?: SortOption,
  fields?: ResolvedFields
): string {
  const voteCountField = fields?.VoteCount;
  const isPinnedField = fields?.IsPinned;

  switch (sort) {
    case SortOption.TopVoted:
      // Fall back to date sort if VoteCount field is not mapped
      if (voteCountField) {
        return `ORDER BY [${voteCountField}] DESC, [System.CreatedDate] DESC`;
      }
      console.warn(
        '[WIQL] VoteCount field not mapped, falling back to date sort'
      );
      return `ORDER BY [System.CreatedDate] DESC`;

    case SortOption.MostActive:
      return `ORDER BY [System.ChangedDate] DESC`;

    case SortOption.Newest:
    default:
      // Pinned items first (if field is mapped), then by creation date
      if (isPinnedField) {
        return `ORDER BY [${isPinnedField}] DESC, [System.CreatedDate] DESC`;
      }
      return `ORDER BY [System.CreatedDate] DESC`;
  }
}

/**
 * Build an ORDER BY clause for discussion queries.
 * @deprecated Use buildOrderByClauseWithFields with resolved fields instead
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
 * Options for building discussion list queries
 */
export interface ListQueryOptions {
  /** Include org-wide discussions */
  includeOrgWide?: boolean;
  /** Include cross-project discussions */
  includeCrossProject?: boolean;
  /** Resolved field reference names */
  fields?: ResolvedFields;
}

/**
 * Build a complete WIQL query for listing discussions with resolved fields.
 *
 * @param projectId - Current project ID
 * @param filters - Optional filters
 * @param sort - Sort option
 * @param options - Query options including resolved fields
 * @returns Complete WIQL query string
 */
export function buildListDiscussionsQueryWithFields(
  projectId: string,
  filters?: DiscussionFilters,
  sort?: SortOption,
  options?: ListQueryOptions
): string {
  const fields = options?.fields;

  // If no fields provided, fall back to legacy behavior
  if (!fields) {
    return buildListDiscussionsQuery(projectId, filters, sort, {
      includeOrgWide: options?.includeOrgWide,
      includeCrossProject: options?.includeCrossProject,
    });
  }

  const select = buildSelectClauseWithFields(fields);
  const from = buildFromClause();
  const where = buildWhereClauseWithFields(projectId, filters, {
    includeOrgWide: options?.includeOrgWide,
    // Cross-project is only enabled if TargetProjects field exists
    includeCrossProject:
      options?.includeCrossProject && !!fields.TargetProjects,
    fields,
  });
  const orderBy = buildOrderByClauseWithFields(sort, fields);

  return `${select} ${from} ${where} ${orderBy}`;
}

/**
 * Build a complete WIQL query for listing discussions.
 * @deprecated Use buildListDiscussionsQueryWithFields with resolved fields instead
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
 * Build a WIQL query to get a single discussion by ID with resolved fields.
 *
 * @param discussionId - Discussion work item ID
 * @param fields - Resolved field reference names
 * @returns WIQL query string
 */
export function buildGetDiscussionQueryWithFields(
  discussionId: number,
  fields?: ResolvedFields
): string {
  const select = fields
    ? buildSelectClauseWithFields(fields)
    : buildSelectClause();
  const from = buildFromClause();

  return `${select} ${from} WHERE [System.Id] = ${discussionId}`;
}

/**
 * Build a WIQL query to get a single discussion by ID.
 * @deprecated Use buildGetDiscussionQueryWithFields with resolved fields instead
 */
export function buildGetDiscussionQuery(discussionId: number): string {
  const select = buildSelectClause();
  const from = buildFromClause();

  return `${select} ${from} WHERE [System.Id] = ${discussionId}`;
}

/**
 * Build a WIQL query for org-level aggregated view with resolved fields.
 * Gets discussions from all projects with org-wide or cross-project visibility.
 *
 * @param filters - Optional filters
 * @param sort - Sort option
 * @param fields - Resolved field reference names
 * @returns WIQL query string
 */
export function buildOrgLevelQueryWithFields(
  filters?: DiscussionFilters,
  sort?: SortOption,
  fields?: ResolvedFields
): string {
  const select = fields
    ? buildSelectClauseWithFields(fields)
    : buildSelectClause();
  const from = buildFromClause();

  const visibilityField = fields?.Visibility || DISCUSSION_FIELDS.Visibility;
  const categoryField = fields?.Category || DISCUSSION_FIELDS.Category;

  const conditions: string[] = [];

  // Always filter by Discussion Work Item Type
  conditions.push(`[System.WorkItemType] = '${DISCUSSION_WORK_ITEM_TYPE}'`);

  // Only show org-wide and cross-project discussions
  conditions.push(
    `([${visibilityField}] = '${VisibilityScope.Organization}' OR [${visibilityField}] = '${VisibilityScope.CrossProject}')`
  );

  // Apply additional filters
  if (filters?.category) {
    conditions.push(`[${categoryField}] = '${filters.category}'`);
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
  const orderBy = buildOrderByClauseWithFields(sort, fields);

  return `${select} ${from} ${where} ${orderBy}`;
}

/**
 * Build a WIQL query for org-level aggregated view.
 * Gets discussions from all projects with org-wide or cross-project visibility.
 * @deprecated Use buildOrgLevelQueryWithFields with resolved fields instead
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
