/**
 * Discussion Service
 * Handles CRUD operations for discussions using Azure DevOps Work Items API.
 * Discussions are stored as custom Work Items of type "Discussion".
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
  buildListDiscussionsQuery,
  parseCategory,
  parseVisibility,
  parseJsonArray,
} from '@/utils/wiql';
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

  /**
   * Initialize the service with the current project context
   */
  async initialize(): Promise<void> {
    if (isDevMode()) {
      this.projectId = 'mock-project-id';
      this.projectName = 'mock-project';
      console.log('[DiscussionService] Running in dev mode - using mock data');
      return;
    }

    const webContext = SDK.getWebContext();
    this.projectId = webContext.project?.id || null;
    this.projectName = webContext.project?.name || null;

    this.workItemClient = await getWorkItemTrackingClient();
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
        path: `/fields/${DISCUSSION_FIELDS.Category}`,
        value: input.category,
      },
      {
        op: 'add',
        path: `/fields/${DISCUSSION_FIELDS.Visibility}`,
        value: input.visibility,
      },
      {
        op: 'add',
        path: `/fields/${DISCUSSION_FIELDS.TargetProjects}`,
        value: JSON.stringify(input.targetProjects || []),
      },
      {
        op: 'add',
        path: `/fields/${DISCUSSION_FIELDS.VoteCount}`,
        value: 0,
      },
      {
        op: 'add',
        path: `/fields/${DISCUSSION_FIELDS.IsPinned}`,
        value: false,
      },
      {
        op: 'add',
        path: `/fields/${DISCUSSION_FIELDS.Labels}`,
        value: JSON.stringify(input.labels || []),
      },
    ];

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
        path: `/fields/${DISCUSSION_FIELDS.Visibility}`,
        value: updates.visibility,
      });
    }

    if (updates.targetProjects !== undefined) {
      patchDocument.push({
        op: 'replace',
        path: `/fields/${DISCUSSION_FIELDS.TargetProjects}`,
        value: JSON.stringify(updates.targetProjects),
      });
    }

    if (updates.labels !== undefined) {
      patchDocument.push({
        op: 'replace',
        path: `/fields/${DISCUSSION_FIELDS.Labels}`,
        value: JSON.stringify(updates.labels),
      });
    }

    if (updates.isPinned !== undefined) {
      patchDocument.push({
        op: 'replace',
        path: `/fields/${DISCUSSION_FIELDS.IsPinned}`,
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

    try {
      // Build WIQL query
      const wiql = buildListDiscussionsQuery(
        this.projectId,
        options.filters,
        options.sort,
        {
          includeOrgWide: true,
          includeCrossProject: true,
        }
      );

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
   * Set labels for a discussion
   */
  async setLabels(id: number, labels: string[]): Promise<Discussion> {
    return this.update(id, { labels });
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

    try {
      // First get current vote count
      const workItem = await this.workItemClient.getWorkItem(id);
      const currentCount =
        (workItem.fields?.[DISCUSSION_FIELDS.VoteCount] as number) || 0;

      const patchDocument: JsonPatchOperation[] = [
        {
          op: 'replace',
          path: `/fields/${DISCUSSION_FIELDS.VoteCount}`,
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
    const fields = workItem.fields || {};

    const createdBy = fields['System.CreatedBy'] as
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

    return {
      id: workItem.id,
      title: (fields['System.Title'] as string) || '',
      body: (fields['System.Description'] as string) || '',
      category: parseCategory(fields[DISCUSSION_FIELDS.Category] as string),
      visibility: parseVisibility(
        fields[DISCUSSION_FIELDS.Visibility] as string
      ),
      targetProjects: parseJsonArray(
        fields[DISCUSSION_FIELDS.TargetProjects] as string
      ),
      voteCount: (fields[DISCUSSION_FIELDS.VoteCount] as number) || 0,
      commentCount: (fields['System.CommentCount'] as number) || 0,
      isPinned: (fields[DISCUSSION_FIELDS.IsPinned] as boolean) || false,
      labels: parseJsonArray(fields[DISCUSSION_FIELDS.Labels] as string),
      author,
      createdDate: new Date(fields['System.CreatedDate'] as string),
      changedDate: new Date(fields['System.ChangedDate'] as string),
      projectId: '', // Will be populated from context
      projectName: (fields['System.TeamProject'] as string) || '',
      state: (fields['System.State'] as string) || 'Active',
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

    if (options.filters?.labels && options.filters.labels.length > 0) {
      filtered = filtered.filter((d) =>
        options.filters!.labels!.some((label) => d.labels.includes(label))
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
