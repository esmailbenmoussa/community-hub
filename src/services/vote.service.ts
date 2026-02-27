/**
 * Vote Service
 * Handles upvoting and vote tracking using Azure DevOps Extension Data Service.
 * User votes are stored per-user and vote counts are synced to the Discussion Work Item.
 */

import * as SDK from 'azure-devops-extension-sdk';
import { Vote, EDS_COLLECTIONS } from '@/types';
import { isDevMode } from '@/utils/environment';
import { discussionService } from './discussion.service';

/**
 * Extension Data Service interface
 */
interface IExtensionDataService {
  getExtensionDataManager(
    extensionId: string,
    accessToken: string
  ): Promise<IExtensionDataManager>;
}

interface IExtensionDataManager {
  getValue<T>(
    key: string,
    options?: { scopeType: string; scopeValue?: string }
  ): Promise<T | undefined>;
  setValue<T>(
    key: string,
    value: T,
    options?: { scopeType: string; scopeValue?: string }
  ): Promise<T>;
  getDocuments(
    collectionName: string,
    options?: { scopeType: string; scopeValue?: string }
  ): Promise<Array<{ id: string; [key: string]: unknown }>>;
  setDocument(
    collectionName: string,
    document: { id: string; [key: string]: unknown },
    options?: { scopeType: string; scopeValue?: string }
  ): Promise<{ id: string; [key: string]: unknown }>;
  deleteDocument(
    collectionName: string,
    documentId: string,
    options?: { scopeType: string; scopeValue?: string }
  ): Promise<void>;
}

/**
 * User votes document structure
 */
interface UserVotesDocument {
  id: string; // 'user-votes'
  votes: Record<string, string>; // discussionId -> votedAt ISO string
}

/**
 * Mock votes storage for dev mode
 */
const mockVotes = new Map<number, Date>();

/**
 * Vote Service class
 */
export class VoteService {
  private dataManager: IExtensionDataManager | null = null;
  private userId: string | null = null;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (isDevMode()) {
      this.userId = 'mock-user-id';
      console.log('[VoteService] Running in dev mode - using mock data');
      return;
    }

    const user = SDK.getUser();
    this.userId = user.id;

    try {
      const dataService = await SDK.getService<IExtensionDataService>(
        'ms.vss-features.extension-data-service'
      );
      const accessToken = await SDK.getAccessToken();
      this.dataManager = await dataService.getExtensionDataManager(
        SDK.getExtensionContext().id,
        accessToken
      );
    } catch (error) {
      console.error('[VoteService] Error initializing:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!isDevMode() && !this.dataManager) {
      throw new Error('VoteService not initialized. Call initialize() first.');
    }
  }

  /**
   * Upvote a discussion
   */
  async upvote(discussionId: number): Promise<void> {
    this.ensureInitialized();

    // Check if already voted
    const hasVoted = await this.hasVoted(discussionId);
    if (hasVoted) {
      console.log('[VoteService] Already voted on discussion:', discussionId);
      return;
    }

    if (isDevMode()) {
      mockVotes.set(discussionId, new Date());
      // Update discussion vote count
      await discussionService.updateVoteCount(discussionId, 1);
      return;
    }

    try {
      // Get current user votes
      const userVotes = await this.getUserVotesDocument();
      const votedAt = new Date().toISOString();

      // Add vote
      userVotes.votes[String(discussionId)] = votedAt;

      // Save updated votes
      await this.saveUserVotesDocument(userVotes);

      // Update discussion vote count
      await discussionService.updateVoteCount(discussionId, 1);
    } catch (error) {
      console.error('[VoteService] Error upvoting:', error);
      throw error;
    }
  }

  /**
   * Remove vote from a discussion
   */
  async removeVote(discussionId: number): Promise<void> {
    this.ensureInitialized();

    // Check if voted
    const hasVoted = await this.hasVoted(discussionId);
    if (!hasVoted) {
      console.log('[VoteService] Not voted on discussion:', discussionId);
      return;
    }

    if (isDevMode()) {
      mockVotes.delete(discussionId);
      // Update discussion vote count
      await discussionService.updateVoteCount(discussionId, -1);
      return;
    }

    try {
      // Get current user votes
      const userVotes = await this.getUserVotesDocument();

      // Remove vote
      delete userVotes.votes[String(discussionId)];

      // Save updated votes
      await this.saveUserVotesDocument(userVotes);

      // Update discussion vote count
      await discussionService.updateVoteCount(discussionId, -1);
    } catch (error) {
      console.error('[VoteService] Error removing vote:', error);
      throw error;
    }
  }

  /**
   * Toggle vote (upvote if not voted, remove if voted)
   */
  async toggleVote(discussionId: number): Promise<boolean> {
    const hasVoted = await this.hasVoted(discussionId);
    if (hasVoted) {
      await this.removeVote(discussionId);
      return false;
    } else {
      await this.upvote(discussionId);
      return true;
    }
  }

  /**
   * Check if current user has voted on a discussion
   */
  async hasVoted(discussionId: number): Promise<boolean> {
    this.ensureInitialized();

    if (isDevMode()) {
      return mockVotes.has(discussionId);
    }

    try {
      const userVotes = await this.getUserVotesDocument();
      return String(discussionId) in userVotes.votes;
    } catch (error) {
      console.error('[VoteService] Error checking vote:', error);
      return false;
    }
  }

  /**
   * Get all discussion IDs the current user has voted on
   */
  async getUserVotes(discussionIds: number[]): Promise<Set<number>> {
    this.ensureInitialized();

    if (isDevMode()) {
      const votedIds = new Set<number>();
      for (const id of discussionIds) {
        if (mockVotes.has(id)) {
          votedIds.add(id);
        }
      }
      return votedIds;
    }

    try {
      const userVotes = await this.getUserVotesDocument();
      const votedIds = new Set<number>();

      for (const id of discussionIds) {
        if (String(id) in userVotes.votes) {
          votedIds.add(id);
        }
      }

      return votedIds;
    } catch (error) {
      console.error('[VoteService] Error getting user votes:', error);
      return new Set();
    }
  }

  /**
   * Get all votes by the current user (with timestamps)
   */
  async getAllUserVotes(): Promise<Vote[]> {
    this.ensureInitialized();

    if (isDevMode()) {
      return Array.from(mockVotes.entries()).map(([id, votedAt]) => ({
        discussionId: id,
        votedAt,
      }));
    }

    try {
      const userVotes = await this.getUserVotesDocument();
      return Object.entries(userVotes.votes).map(([id, votedAt]) => ({
        discussionId: parseInt(id, 10),
        votedAt: new Date(votedAt),
      }));
    } catch (error) {
      console.error('[VoteService] Error getting all user votes:', error);
      return [];
    }
  }

  /**
   * Get the user votes document from Extension Data Service
   */
  private async getUserVotesDocument(): Promise<UserVotesDocument> {
    if (!this.dataManager) {
      throw new Error('Data manager not initialized');
    }

    try {
      const doc = await this.dataManager.getValue<UserVotesDocument>(
        `${EDS_COLLECTIONS.UserVotes}-${this.userId}`,
        { scopeType: 'User' }
      );

      return doc || { id: 'user-votes', votes: {} };
    } catch {
      // Document doesn't exist yet
      return { id: 'user-votes', votes: {} };
    }
  }

  /**
   * Save the user votes document to Extension Data Service
   */
  private async saveUserVotesDocument(
    document: UserVotesDocument
  ): Promise<void> {
    if (!this.dataManager) {
      throw new Error('Data manager not initialized');
    }

    await this.dataManager.setValue(
      `${EDS_COLLECTIONS.UserVotes}-${this.userId}`,
      document,
      { scopeType: 'User' }
    );
  }
}

// Export singleton instance
export const voteService = new VoteService();
