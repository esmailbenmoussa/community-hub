/**
 * Mock data for development mode
 * These mocks simulate Azure DevOps SDK responses when running locally
 */

import { MARCUS } from './users';

/**
 * Mock user context - uses Marcus Rivera from shared user pool
 */
export const mockUser = {
  id: MARCUS.id,
  name: MARCUS.displayName,
  displayName: MARCUS.displayName,
  descriptor: 'mock-descriptor',
  imageUrl: MARCUS.imageUrl,
};

/**
 * Mock host/organization name
 */
export const mockHostName = 'mock-organization';

/**
 * Mock project name
 */
export const mockProjectName = 'mock-project';

/**
 * Mock project ID
 */
export const mockProjectId = 'mock-project-id-12345';

/**
 * Mock process template
 */
export const mockProcess = {
  id: 'mock-process-id',
  name: 'Community Hub Process',
  description: 'Inherited process for Community Hub',
  isDefault: false,
  type: 'inherited',
  parentProcessId: 'agile-process-id',
};

/**
 * Mock Discussion work item type
 */
export const mockDiscussionWorkItemType = {
  name: 'Discussion',
  referenceName: 'Custom.Discussion',
  description: 'Community Hub discussion',
  color: '009CCC',
  icon: 'icon_chat',
  isDisabled: false,
};

/**
 * Mock custom fields for Discussion
 */
export const mockDiscussionFields = [
  {
    name: 'Category',
    referenceName: 'Custom.Category',
    type: 'string',
    isPicklist: true,
  },
  {
    name: 'Visibility',
    referenceName: 'Custom.Visibility',
    type: 'string',
    isPicklist: true,
  },
  {
    name: 'Target Projects',
    referenceName: 'Custom.TargetProjects',
    type: 'html',
  },
  {
    name: 'Vote Count',
    referenceName: 'Custom.VoteCount',
    type: 'integer',
  },
  {
    name: 'Is Pinned',
    referenceName: 'Custom.IsPinned',
    type: 'boolean',
  },
];

/**
 * Mock available fields for field mapping UI.
 * Includes both exact-match fields and GUID-style fields to test different scenarios.
 * Uses DiscoveredField type from @/types/fieldMapping.
 */
import type { DiscoveredField } from '@/types/fieldMapping';
import type { FieldType } from '@/types/setup';

/**
 * Mock projects for org-wide view
 */
export const mockProjects: Array<{ id: string; name: string }> = [
  { id: 'proj-alpha-001', name: 'Project Alpha' },
  { id: 'proj-beta-002', name: 'Project Beta' },
  { id: 'proj-gamma-003', name: 'Project Gamma' },
  { id: 'mock-project-id-12345', name: 'mock-project' },
];

export const mockAvailableFields: DiscoveredField[] = [
  // Exact-match fields (will auto-match)
  {
    name: 'Category',
    referenceName: 'Custom.Category',
    type: 'picklistString' as FieldType,
    isPicklist: true,
    allowedValues: ['Announcements', 'General', 'Ideas', 'Help'],
    description: 'Discussion category',
  },
  {
    name: 'Visibility',
    referenceName: 'Custom.Visibility',
    type: 'picklistString' as FieldType,
    isPicklist: true,
    allowedValues: ['Project', 'Organization', 'CrossProject'],
    description: 'Visibility scope',
  },
  {
    name: 'Target Projects',
    referenceName: 'Custom.TargetProjects',
    type: 'html' as FieldType,
    isPicklist: false,
    description: 'JSON array of project IDs',
  },
  {
    name: 'Vote Count',
    referenceName: 'Custom.VoteCount',
    type: 'integer' as FieldType,
    isPicklist: false,
    description: 'Cached upvote count',
  },
  {
    name: 'Is Pinned',
    referenceName: 'Custom.IsPinned',
    type: 'boolean' as FieldType,
    isPicklist: false,
    description: 'Whether discussion is pinned',
  },
  // Additional fields that won't auto-match (for testing manual selection)
  {
    name: 'Priority',
    referenceName: 'Custom.f8a3b2c1',
    type: 'picklistString' as FieldType,
    isPicklist: true,
    allowedValues: ['Low', 'Medium', 'High', 'Critical'],
    description: 'Priority level (GUID-style ref name)',
  },
  {
    name: 'Custom Notes',
    referenceName: 'Custom.12345678',
    type: 'html' as FieldType,
    isPicklist: false,
    description: 'Additional notes (numeric ref name)',
  },
  {
    name: 'Review Status',
    referenceName: 'Custom.ReviewStatus',
    type: 'string' as FieldType,
    isPicklist: false,
    description: 'Current review status',
  },
];
