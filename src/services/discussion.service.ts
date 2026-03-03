/**
 * Discussion Service
 * Handles CRUD operations for discussions using Azure DevOps Work Items API.
 * Discussions are stored as custom Work Items of type "Discussion".
 *
 * This service now uses dynamic field resolution to prevent TF51005 errors
 * when custom fields don't exist in the user's process template.
 */

import * as SDK from 'azure-devops-extension-sdk';
import {
  Discussion,
  CreateDiscussionInput,
  UpdateDiscussionInput,
  ListDiscussionsOptions,
  PaginatedResult,
  DISCUSSION_WORK_ITEM_TYPE,
  DISCUSSION_FIELDS,
  User,
} from '@/types';
import { isDevMode } from '@/utils/environment';
import {
  buildListDiscussionsQueryWithFields,
  buildOrgLevelQueryWithFields,
  parseCategory,
  parseVisibility,
  parseJsonArray,
  parseTagString,
} from '@/utils/wiql';
import {
  resolveFields,
  resolveFieldsSync,
  ResolvedFields,
  FieldCapabilities,
} from '@/utils/fieldResolver';
import {
  mockDiscussions,
  getMockDiscussionById,
  addMockDiscussion,
  updateMockDiscussion,
  deleteMockDiscussion,
} from '@/mocks/discussions';
import { commentService } from './comment.service';

/**
 * ADO API types for dynamic imports
 */
interface WorkItemFields {
  [key: string]: unknown;
}

interface WorkItem {
  id: number;
  fields: WorkItemFields;
  url?: string;
}

interface WorkItemQueryResult {
  workItems?: Array<{ id: number }>;
}

interface JsonPatchOperation {
  op: 'add' | 'replace' | 'remove' | 'test' | 'copy' | 'move';
  path: string;
  value?: unknown;
}

/**
 * Dynamically load ADO API clients (only in production)
 */
async function getWorkItemTrackingClient() {
  const { getClient } =
    await import('azure-devops-extension-api/Common/Client');
  const { WorkItemTrackingRestClient } =
    await import('azure-devops-extension-api/WorkItemTracking');

  return getClient(WorkItemTrackingRestClient);
}

/**
 * Dynamically load Core API client (only in production)
 */
async function getCoreClient() {
  const { getClient } =
    await import('azure-devops-extension-api/Common/Client');
  const { CoreRestClient } = await import('azure-devops-extension-api/Core');

  return getClient(CoreRestClient);
}

/**
 * Convert a field value to boolean.
 * Handles both native boolean and string values (e.g., "True"/"False", "Yes"/"No").
 * ADO sometimes reports boolean fields as picklistString in the Process API,
 * which may store values as strings.
 */
function toBooleanValue(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

/**
 * Default page size for discussion lists
 */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Discussion Service class
 */
export class DiscussionService {
  private projectId: string | null = null;
  private projectName: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private workItemClient: any = null;

  /** Cached resolved field names */
  private resolvedFields: ResolvedFields | null = null;
  /** Cached field capabilities */
  private fieldCapabilities: FieldCapabilities | null = null;

  /**
   * Initialize the service with the current project context
   */
  async initialize(): Promise<void> {
    if (isDevMode()) {
      this.projectId = 'mock-project-id';
      this.projectName = 'mock-project';
      // In dev mode, use default fields
      this.resolvedFields = {
        Category: DISCUSSION_FIELDS.Category,
        Visibility: DISCUSSION_FIELDS.Visibility,
        TargetProjects: DISCUSSION_FIELDS.TargetProjects,
        VoteCount: DISCUSSION_FIELDS.VoteCount,
        IsPinned: DISCUSSION_FIELDS.IsPinned,
      };
      this.fieldCapabilities = {
        crossProjectEnabled: true,
        votingEnabled: true,
        pinningEnabled: true,
      };
      console.log('[DiscussionService] Running in dev mode - using mock data');
      return;
    }

    const webContext = SDK.getWebContext();
    this.projectId = webContext.project?.id || null;
    this.projectName = webContext.project?.name || null;

    this.workItemClient = await getWorkItemTrackingClient();

    // Resolve field names from the field mapping
    try {
      const resolution = await resolveFields(true); // useDefaults=true for backward compatibility
      this.resolvedFields = resolution.fields;
      this.fieldCapabilities = resolution.capabilities;

      console.log('[DiscussionService] Field resolution:', {
        fields: this.resolvedFields,
        capabilities: this.fieldCapabilities,
        isValid: resolution.isValid,
      });

      if (!resolution.isValid) {
        console.warn(
          '[DiscussionService] Field resolution incomplete:',
          resolution.error
        );
      }
    } catch (error) {
      console.error('[DiscussionService] Error resolving fields:', error);
      // Fall back to default fields
      this.resolvedFields = {
        Category: DISCUSSION_FIELDS.Category,
        Visibility: DISCUSSION_FIELDS.Visibility,
        TargetProjects: DISCUSSION_FIELDS.TargetProjects,
        VoteCount: DISCUSSION_FIELDS.VoteCount,
        IsPinned: DISCUSSION_FIELDS.IsPinned,
      };
      this.fieldCapabilities = {
        crossProjectEnabled: true,
        votingEnabled: true,
        pinningEnabled: true,
      };
    }
  }

  /**
   * Get resolved fields (with fallback if not initialized)
   */
  private getFields(): ResolvedFields {
    if (this.resolvedFields) {
      return this.resolvedFields;
    }

    // Try sync resolution if not initialized
    try {
      const resolution = resolveFieldsSync(true);
      return resolution.fields;
    } catch {
      // Ultimate fallback to hardcoded defaults
      return {
        Category: DISCUSSION_FIELDS.Category,
        Visibility: DISCUSSION_FIELDS.Visibility,
        TargetProjects: DISCUSSION_FIELDS.TargetProjects,
        VoteCount: DISCUSSION_FIELDS.VoteCount,
        IsPinned: DISCUSSION_FIELDS.IsPinned,
      };
    }
  }

  /**
   * Get field capabilities
   */
  getCapabilities(): FieldCapabilities {
    if (this.fieldCapabilities) {
      return this.fieldCapabilities;
    }

    // Default to all enabled if not resolved
    return {
      crossProjectEnabled: true,
      votingEnabled: true,
      pinningEnabled: true,
    };
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!isDevMode() && !this.workItemClient) {
      throw new Error(
        'DiscussionService not initialized. Call initialize() first.'
      );
    }
  }

  /**
   * Create a new discussion
   */
  async create(input: CreateDiscussionInput): Promise<Discussion> {
    this.ensureInitialized();

    if (isDevMode()) {
      return addMockDiscussion(input);
    }

    if (!this.projectName) {
      throw new Error('Project context not available');
    }

    const fields = this.getFields();

    // Build patch document for Work Item creation
    const patchDocument: JsonPatchOperation[] = [
      {
        op: 'add',
        path: '/fields/System.Title',
        value: input.title,
      },
      {
        op: 'add',
        path: '/fields/System.Description',
        value: input.body,
      },
      {
        op: 'add',
        path: `/fields/${fields.Category}`,
        value: input.category,
      },
      {
        op: 'add',
        path: `/fields/${fields.Visibility}`,
        value: input.visibility,
      },
      {
        op: 'add',
        path: '/fields/System.Tags',
        value: (input.tags || []).join('; '),
      },
    ];

    // Add optional fields only if they are mapped
    if (fields.TargetProjects) {
      patchDocument.push({
        op: 'add',
        path: `/fields/${fields.TargetProjects}`,
        value: JSON.stringify(input.targetProjects || []),
      });
    }

    if (fields.VoteCount) {
      patchDocument.push({
        op: 'add',
        path: `/fields/${fields.VoteCount}`,
        value: 0,
      });
    }

    if (fields.IsPinned) {
      patchDocument.push({
        op: 'add',
        path: `/fields/${fields.IsPinned}`,
        value: false,
      });
    }

    try {
      const workItem = await this.workItemClient.createWorkItem(
        patchDocument,
        this.projectName,
        DISCUSSION_WORK_ITEM_TYPE
      );

      return this.mapWorkItemToDiscussion(workItem);
    } catch (error) {
      console.error('[DiscussionService] Error creating discussion:', error);
      throw error;
    }
  }

  /**
   * Get a single discussion by ID
   */
  async get(id: number): Promise<Discussion | null> {
    this.ensureInitialized();

    if (isDevMode()) {
      return getMockDiscussionById(id);
    }

    try {
      const workItem = await this.workItemClient.getWorkItem(
        id,
        undefined,
        undefined,
        undefined,
        // Expand to get all fields
        4 // WorkItemExpand.All
      );

      if (
        !workItem ||
        workItem.fields?.['System.WorkItemType'] !== DISCUSSION_WORK_ITEM_TYPE
      ) {
        return null;
      }

      return this.mapWorkItemToDiscussion(workItem);
    } catch (error) {
      console.error('[DiscussionService] Error getting discussion:', error);
      throw error;
    }
  }

  /**
   * Update an existing discussion
   */
  async update(
    id: number,
    updates: UpdateDiscussionInput
  ): Promise<Discussion> {
    this.ensureInitialized();

    if (isDevMode()) {
      const updated = updateMockDiscussion(id, updates);
      if (!updated) {
        throw new Error('Discussion not found');
      }
      return updated;
    }

    const fields = this.getFields();

    // Build patch document for updates
    const patchDocument: JsonPatchOperation[] = [];

    if (updates.title !== undefined) {
      patchDocument.push({
        op: 'replace',
        path: '/fields/System.Title',
        value: updates.title,
      });
    }

    if (updates.body !== undefined) {
      patchDocument.push({
        op: 'replace',
        path: '/fields/System.Description',
        value: updates.body,
      });
    }

    if (updates.visibility !== undefined) {
      patchDocument.push({
        op: 'replace',
        path: `/fields/${fields.Visibility}`,
        value: updates.visibility,
      });
    }

    // Only update TargetProjects if the field is mapped
    if (updates.targetProjects !== undefined && fields.TargetProjects) {
      patchDocument.push({
        op: 'replace',
        path: `/fields/${fields.TargetProjects}`,
        value: JSON.stringify(updates.targetProjects),
      });
    }

    if (updates.tags !== undefined) {
      patchDocument.push({
        op: 'replace',
        path: '/fields/System.Tags',
        value: updates.tags.join('; '),
      });
    }

    // Only update IsPinned if the field is mapped
    if (updates.isPinned !== undefined && fields.IsPinned) {
      patchDocument.push({
        op: 'replace',
        path: `/fields/${fields.IsPinned}`,
        value: updates.isPinned,
      });
    }

    if (patchDocument.length === 0) {
      // No updates to apply, just return current state
      const current = await this.get(id);
      if (!current) {
        throw new Error('Discussion not found');
      }
      return current;
    }

    try {
      const workItem = await this.workItemClient.updateWorkItem(
        patchDocument,
        id
      );

      return this.mapWorkItemToDiscussion(workItem);
    } catch (error) {
      console.error('[DiscussionService] Error updating discussion:', error);
      throw error;
    }
  }

  /**
   * Delete a discussion (soft delete - moves to Removed state)
   */
  async delete(id: number): Promise<void> {
    this.ensureInitialized();

    if (isDevMode()) {
      deleteMockDiscussion(id);
      return;
    }

    try {
      // Soft delete by moving to "Removed" state
      const patchDocument: JsonPatchOperation[] = [
        {
          op: 'replace',
          path: '/fields/System.State',
          value: 'Removed',
        },
      ];

      await this.workItemClient.updateWorkItem(patchDocument, id);
    } catch (error) {
      console.error('[DiscussionService] Error deleting discussion:', error);
      throw error;
    }
  }

  /**
   * List discussions with filters and pagination
   */
  async list(
    options: ListDiscussionsOptions = {}
  ): Promise<PaginatedResult<Discussion>> {
    this.ensureInitialized();

    const page = options.page || 1;
    const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;

    if (isDevMode()) {
      return this.getMockPaginatedDiscussions(options, page, pageSize);
    }

    if (!this.projectId || !this.projectName) {
      throw new Error('Project context not available');
    }

    const fields = this.getFields();
    const capabilities = this.getCapabilities();

    try {
      // Build WIQL query with resolved fields
      // Only enable cross-project if TargetProjects field is mapped
      const wiql = buildListDiscussionsQueryWithFields(
        this.projectId,
        options.filters,
        options.sort,
        {
          includeOrgWide: true,
          includeCrossProject: capabilities.crossProjectEnabled,
          fields,
        }
      );

      console.log('[DiscussionService] Executing WIQL query:', wiql);

      // Execute WIQL query
      const queryResult: WorkItemQueryResult =
        await this.workItemClient.queryByWiql(
          { query: wiql },
          this.projectName
        );

      const workItemIds = queryResult.workItems?.map((wi) => wi.id) || [];
      const totalCount = workItemIds.length;

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const paginatedIds = workItemIds.slice(startIndex, startIndex + pageSize);

      if (paginatedIds.length === 0) {
        return {
          items: [],
          totalCount,
          page,
          pageSize,
          hasMore: false,
        };
      }

      // Fetch full work items
      const workItems = await this.workItemClient.getWorkItems(
        paginatedIds,
        undefined,
        undefined,
        undefined,
        4 // WorkItemExpand.All
      );

      const discussions = workItems.map((wi: WorkItem) =>
        this.mapWorkItemToDiscussion(wi)
      );

      return {
        items: discussions,
        totalCount,
        page,
        pageSize,
        hasMore: startIndex + pageSize < totalCount,
      };
    } catch (error) {
      console.error('[DiscussionService] Error listing discussions:', error);
      throw error;
    }
  }

  /**
   * Pin or unpin a discussion
   */
  async pin(id: number, pinned: boolean): Promise<Discussion> {
    return this.update(id, { isPinned: pinned });
  }

  /**
   * List discussions across all projects (for org admin view).
   * Uses org-level WIQL query to fetch discussions with org-wide or cross-project visibility.
   */
  async listOrgWide(
    options: {
      projectId?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PaginatedResult<Discussion>> {
    this.ensureInitialized();

    const page = options.page || 1;
    const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;

    if (isDevMode()) {
      return this.getMockOrgWideDiscussions(options.projectId, page, pageSize);
    }

    const fields = this.getFields();

    try {
      // Build org-level WIQL query
      const wiql = buildOrgLevelQueryWithFields(
        options.projectId ? { projectId: options.projectId } : undefined,
        undefined, // sort - let it use default (pinned first, then newest)
        fields
      );

      console.log('[DiscussionService] Executing org-wide WIQL query:', wiql);

      // Execute WIQL query - note: for org-wide, we don't specify a project
      const queryResult: WorkItemQueryResult =
        await this.workItemClient.queryByWiql({ query: wiql });

      const workItemIds = queryResult.workItems?.map((wi) => wi.id) || [];
      const totalCount = workItemIds.length;

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const paginatedIds = workItemIds.slice(startIndex, startIndex + pageSize);

      if (paginatedIds.length === 0) {
        return {
          items: [],
          totalCount,
          page,
          pageSize,
          hasMore: false,
        };
      }

      // Fetch full work items
      const workItems = await this.workItemClient.getWorkItems(
        paginatedIds,
        undefined,
        undefined,
        undefined,
        4 // WorkItemExpand.All
      );

      const discussions = workItems.map((wi: WorkItem) =>
        this.mapWorkItemToDiscussion(wi)
      );

      return {
        items: discussions,
        totalCount,
        page,
        pageSize,
        hasMore: startIndex + pageSize < totalCount,
      };
    } catch (error) {
      console.error(
        '[DiscussionService] Error listing org-wide discussions:',
        error
      );
      throw error;
    }
  }

  /**
   * Get all projects the user has access to.
   * Used for the project filter in org admin view.
   */
  async getProjects(): Promise<Array<{ id: string; name: string }>> {
    if (isDevMode()) {
      // Return mock projects
      const { mockProjects } = await import('@/mocks');
      return mockProjects;
    }

    try {
      const coreClient = await getCoreClient();
      const projects = await coreClient.getProjects();

      return projects.map((p) => ({
        id: p.id || '',
        name: p.name || '',
      }));
    } catch (error) {
      console.error('[DiscussionService] Error fetching projects:', error);
      throw error;
    }
  }

  /**
   * Get mock org-wide discussions for dev mode
   */
  private getMockOrgWideDiscussions(
    projectId: string | undefined,
    page: number,
    pageSize: number
  ): PaginatedResult<Discussion> {
    let filtered = [...mockDiscussions];

    // Filter by project if specified
    if (projectId) {
      filtered = filtered.filter(
        (d) => d.projectId === projectId || d.projectName === projectId
      );
    }

    // Sort: pinned first, then by created date
    filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.createdDate.getTime() - a.createdDate.getTime();
    });

    const totalCount = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      page,
      pageSize,
      hasMore: startIndex + pageSize < totalCount,
    };
  }

  /**
   * Set tags for a discussion
   */
  async setTags(id: number, tags: string[]): Promise<Discussion> {
    return this.update(id, { tags });
  }

  /**
   * Get all unique tags used across discussions in the project
   */
  async getAllTags(): Promise<string[]> {
    this.ensureInitialized();

    if (isDevMode()) {
      // Aggregate from mock data
      const allTags = mockDiscussions.flatMap((d) => d.tags);
      return [...new Set(allTags)].sort();
    }

    if (!this.projectId || !this.projectName) {
      throw new Error('Project context not available');
    }

    try {
      // Query discussions that have tags
      const wiql = `
        SELECT [System.Id], [System.Tags]
        FROM WorkItems
        WHERE [System.WorkItemType] = '${DISCUSSION_WORK_ITEM_TYPE}'
          AND [System.State] <> 'Removed'
          AND [System.Tags] <> ''
      `;

      const queryResult: WorkItemQueryResult =
        await this.workItemClient.queryByWiql(
          { query: wiql },
          this.projectName
        );

      const workItemIds = queryResult.workItems?.map((wi) => wi.id) || [];

      if (workItemIds.length === 0) {
        return [];
      }

      // Fetch work items in batches (ADO limits to 200 per request)
      const BATCH_SIZE = 200;
      const allTags = new Set<string>();

      for (let i = 0; i < workItemIds.length; i += BATCH_SIZE) {
        const batchIds = workItemIds.slice(i, i + BATCH_SIZE);
        const workItems = await this.workItemClient.getWorkItems(batchIds, [
          'System.Tags',
        ]);

        for (const wi of workItems) {
          const tags = parseTagString(wi.fields?.['System.Tags'] as string);
          tags.forEach((tag) => allTags.add(tag));
        }
      }

      return [...allTags].sort();
    } catch (error) {
      console.error('[DiscussionService] Error fetching tags:', error);
      return []; // Return empty on error, don't break the form
    }
  }

  /**
   * Update vote count for a discussion
   * This is called by the VoteService when votes change
   */
  async updateVoteCount(id: number, delta: number): Promise<void> {
    this.ensureInitialized();

    if (isDevMode()) {
      const discussion = getMockDiscussionById(id);
      if (discussion) {
        updateMockDiscussion(id, {});
        // Manually update vote count in mock
        discussion.voteCount = Math.max(0, discussion.voteCount + delta);
      }
      return;
    }

    const fields = this.getFields();

    // Skip if VoteCount field is not mapped
    if (!fields.VoteCount) {
      console.warn(
        '[DiscussionService] VoteCount field not mapped, skipping vote count update'
      );
      return;
    }

    try {
      // First get current vote count
      const workItem = await this.workItemClient.getWorkItem(id);
      const currentCount = (workItem.fields?.[fields.VoteCount] as number) || 0;

      const patchDocument: JsonPatchOperation[] = [
        {
          op: 'replace',
          path: `/fields/${fields.VoteCount}`,
          value: Math.max(0, currentCount + delta),
        },
      ];

      await this.workItemClient.updateWorkItem(patchDocument, id);
    } catch (error) {
      console.error('[DiscussionService] Error updating vote count:', error);
      throw error;
    }
  }

  /**
   * Enrich discussions with recent commenters data
   * Fetches first 2 unique commenters (chronological, excluding author) for each discussion
   */
  async enrichWithCommenters(discussions: Discussion[]): Promise<Discussion[]> {
    if (discussions.length === 0) {
      return discussions;
    }

    try {
      // Build map of discussionId -> authorId
      const authorIds = new Map<number, string>();
      const discussionIds: number[] = [];

      for (const discussion of discussions) {
        discussionIds.push(discussion.id);
        authorIds.set(discussion.id, discussion.author.id);
      }

      // Fetch commenters for all discussions
      const commentersMap = await commentService.getCommentersForDiscussions(
        discussionIds,
        authorIds
      );

      // Enrich discussions with commenters
      return discussions.map((discussion) => ({
        ...discussion,
        recentCommenters: commentersMap.get(discussion.id) || [],
      }));
    } catch (error) {
      console.error(
        '[DiscussionService] Error enriching with commenters:',
        error
      );
      // Return discussions without commenters on error
      return discussions;
    }
  }

  /**
   * Map a Work Item to a Discussion object
   */
  private mapWorkItemToDiscussion(workItem: WorkItem): Discussion {
    const wiFields = workItem.fields || {};
    const resolvedFields = this.getFields();

    const createdBy = wiFields['System.CreatedBy'] as
      | {
          displayName?: string;
          id?: string;
          imageUrl?: string;
          uniqueName?: string;
        }
      | undefined;

    const author: User = {
      id: createdBy?.id || 'unknown',
      displayName: createdBy?.displayName || 'Unknown User',
      imageUrl: createdBy?.imageUrl,
      uniqueName: createdBy?.uniqueName,
    };

    // Get field values using resolved field names
    // Use defaults for optional fields that aren't mapped
    const categoryValue = resolvedFields.Category
      ? (wiFields[resolvedFields.Category] as string)
      : undefined;
    const visibilityValue = resolvedFields.Visibility
      ? (wiFields[resolvedFields.Visibility] as string)
      : undefined;
    const targetProjectsValue = resolvedFields.TargetProjects
      ? (wiFields[resolvedFields.TargetProjects] as string)
      : undefined;
    const voteCountValue = resolvedFields.VoteCount
      ? (wiFields[resolvedFields.VoteCount] as number)
      : undefined;
    const isPinnedValue = resolvedFields.IsPinned
      ? toBooleanValue(wiFields[resolvedFields.IsPinned])
      : undefined;

    return {
      id: workItem.id,
      title: (wiFields['System.Title'] as string) || '',
      body: (wiFields['System.Description'] as string) || '',
      category: parseCategory(categoryValue),
      visibility: parseVisibility(visibilityValue),
      targetProjects: parseJsonArray(targetProjectsValue),
      voteCount: voteCountValue || 0,
      commentCount: (wiFields['System.CommentCount'] as number) || 0,
      isPinned: isPinnedValue || false,
      tags: parseTagString(wiFields['System.Tags'] as string),
      author,
      createdDate: new Date(wiFields['System.CreatedDate'] as string),
      changedDate: new Date(wiFields['System.ChangedDate'] as string),
      projectId: '', // Will be populated from context
      projectName: (wiFields['System.TeamProject'] as string) || '',
      state: (wiFields['System.State'] as string) || 'Active',
    };
  }

  /**
   * Get mock paginated discussions for dev mode
   */
  private getMockPaginatedDiscussions(
    options: ListDiscussionsOptions,
    page: number,
    pageSize: number
  ): PaginatedResult<Discussion> {
    let filtered = [...mockDiscussions];

    // Apply filters
    if (options.filters?.category) {
      filtered = filtered.filter(
        (d) => d.category === options.filters!.category
      );
    }

    if (options.filters?.visibility) {
      filtered = filtered.filter(
        (d) => d.visibility === options.filters!.visibility
      );
    }

    if (options.filters?.tags && options.filters.tags.length > 0) {
      filtered = filtered.filter((d) =>
        options.filters!.tags!.some((tag) => d.tags.includes(tag))
      );
    }

    if (options.filters?.searchTitle) {
      const searchLower = options.filters.searchTitle.toLowerCase();
      filtered = filtered.filter((d) =>
        d.title.toLowerCase().includes(searchLower)
      );
    }

    if (options.filters?.isPinned !== undefined) {
      filtered = filtered.filter(
        (d) => d.isPinned === options.filters!.isPinned
      );
    }

    // Apply sorting
    switch (options.sort) {
      case 'top-voted':
        filtered.sort((a, b) => b.voteCount - a.voteCount);
        break;
      case 'most-active':
        filtered.sort(
          (a, b) => b.changedDate.getTime() - a.changedDate.getTime()
        );
        break;
      default:
        // Pinned first, then newest
        filtered.sort((a, b) => {
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }
          return b.createdDate.getTime() - a.createdDate.getTime();
        });
    }

    const totalCount = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      page,
      pageSize,
      hasMore: startIndex + pageSize < totalCount,
    };
  }
}

// Export singleton instance
export const discussionService = new DiscussionService();
