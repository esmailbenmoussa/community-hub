/**
 * Comment Service
 * Handles CRUD operations for discussion comments using Azure DevOps Work Item Comments API.
 */

import {
  Comment,
  CommentReactionType,
  CreateCommentInput,
  UpdateCommentInput,
  User,
} from '@/types';
import type { WorkItem } from 'azure-devops-extension-api/WorkItemTracking';
import { isDevMode } from '@/utils/environment';
import {
  MOCK_USERS,
  MARCUS,
  ALICE,
  BOB,
  CAROL,
  DAN,
  EVA,
  FRANK,
  GRACE,
  HENRY,
  IVY,
  JACK,
  KAREN,
  LEO,
} from '@/mocks/users';

/**
 * ADO API response types for comments
 */
interface CommentResponse {
  id: number;
  text: string;
  version: number;
  createdBy?: {
    displayName?: string;
    id?: string;
    imageUrl?: string;
    uniqueName?: string;
  };
  createdDate?: string;
  modifiedDate?: string;
}

interface CommentsResponse {
  comments?: CommentResponse[];
  totalCount?: number;
  count?: number;
}

/**
 * Dynamically load ADO API client (only in production)
 */
async function getWorkItemTrackingClient() {
  const { getClient } =
    await import('azure-devops-extension-api/Common/Client');
  const { WorkItemTrackingRestClient } =
    await import('azure-devops-extension-api/WorkItemTracking');

  return getClient(WorkItemTrackingRestClient);
}

/**
 * Mock comments storage for dev mode
 */
const mockCommentsMap: Map<number, Comment[]> = new Map();

/**
 * Mock reactions storage for dev mode
 * Key: `${commentId}-${userId}` -> array of reaction types
 */
const mockUserReactionsMap: Map<string, Set<CommentReactionType>> = new Map();

let nextCommentId = 100;
let mockDataInitialized = false;

/**
 * Helper to get user reaction key
 */
function getUserReactionKey(commentId: number, userId: string): string {
  return `${commentId}-${userId}`;
}

/**
 * Helper to create a date N days ago
 */
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Initialize all mock comments for dev mode (across multiple discussions)
 */
function initAllMockComments(): void {
  if (mockDataInitialized) return;
  mockDataInitialized = true;

  // Discussion 1: Welcome to Community Hub! (12 comments)
  mockCommentsMap.set(1, [
    {
      id: nextCommentId++,
      text: 'Welcome everyone! Excited to launch this community space. Feel free to explore and share your thoughts!',
      author: MARCUS,
      createdDate: daysAgo(25),
      workItemId: 1,
      version: 1,
      reactions: [
        {
          commentId: 100,
          type: CommentReactionType.Like,
          count: 8,
          isCurrentUserEngaged: true,
        },
        {
          commentId: 100,
          type: CommentReactionType.Heart,
          count: 3,
          isCurrentUserEngaged: false,
        },
        {
          commentId: 100,
          type: CommentReactionType.Hooray,
          count: 5,
          isCurrentUserEngaged: false,
        },
      ],
    },
    {
      id: nextCommentId++,
      text: 'This is exactly what we needed! Great initiative.',
      author: ALICE,
      createdDate: daysAgo(24),
      workItemId: 1,
      version: 1,
      reactions: [
        {
          commentId: 101,
          type: CommentReactionType.Like,
          count: 4,
          isCurrentUserEngaged: false,
        },
      ],
    },
    {
      id: nextCommentId++,
      text: 'Love the clean interface. Very intuitive!',
      author: BOB,
      createdDate: daysAgo(23),
      workItemId: 1,
      version: 1,
      reactions: [
        {
          commentId: 102,
          type: CommentReactionType.Like,
          count: 2,
          isCurrentUserEngaged: false,
        },
        {
          commentId: 102,
          type: CommentReactionType.Smile,
          count: 1,
          isCurrentUserEngaged: true,
        },
      ],
    },
    {
      id: nextCommentId++,
      text: 'Will there be mobile support?',
      author: CAROL,
      createdDate: daysAgo(20),
      workItemId: 1,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Carol Yes! Mobile app is coming in Q1. See the roadmap discussion for details.',
      author: MARCUS,
      createdDate: daysAgo(20),
      workItemId: 1,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The voting feature is really useful for prioritizing discussions.',
      author: DAN,
      createdDate: daysAgo(18),
      workItemId: 1,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'How do we create new categories?',
      author: EVA,
      createdDate: daysAgo(15),
      workItemId: 1,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Eva Categories are managed by admins. Reach out if you have suggestions!',
      author: MARCUS,
      createdDate: daysAgo(15),
      workItemId: 1,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Can we integrate this with Slack notifications?',
      author: FRANK,
      createdDate: daysAgo(10),
      workItemId: 1,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Great question @Frank - Slack integration is on the roadmap for v2.6!',
      author: ALICE,
      createdDate: daysAgo(9),
      workItemId: 1,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Been using this for a week now. Really enjoying the experience!',
      author: GRACE,
      createdDate: daysAgo(5),
      workItemId: 1,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Thanks for all the positive feedback everyone! Keep the suggestions coming.',
      author: MARCUS,
      createdDate: daysAgo(2),
      workItemId: 1,
      version: 1,
    },
  ]);

  // Discussion 2: Q1 2026 Roadmap Preview (15 comments)
  mockCommentsMap.set(2, [
    {
      id: nextCommentId++,
      text: 'Dark mode is at the top of my wishlist! Glad to see it prioritized.',
      author: ALICE,
      createdDate: daysAgo(28),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The API v3 changes - will there be a migration guide?',
      author: BOB,
      createdDate: daysAgo(27),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Bob Yes, comprehensive migration guide will be published a week before release.',
      author: MARCUS,
      createdDate: daysAgo(27),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Mobile app beta - sign me up! Where do we register?',
      author: CAROL,
      createdDate: daysAgo(25),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Will there be backwards compatibility for API v2 users?',
      author: DAN,
      createdDate: daysAgo(22),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "@Dan We'll maintain v2 for 6 months after v3 launch.",
      author: MARCUS,
      createdDate: daysAgo(22),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The accessibility improvements are much appreciated. Our team has been asking for this.',
      author: EVA,
      createdDate: daysAgo(20),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Any plans for SSO integration in Q1?',
      author: HENRY,
      createdDate: daysAgo(18),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Can we get webhooks for real-time events?',
      author: IVY,
      createdDate: daysAgo(15),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Ivy Webhooks are already supported! Check the docs at /api/webhooks',
      author: FRANK,
      createdDate: daysAgo(15),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Would love to see performance benchmarks for the large dataset improvements.',
      author: JACK,
      createdDate: daysAgo(12),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'This roadmap looks solid. Kudos to the team!',
      author: KAREN,
      createdDate: daysAgo(10),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Will the search improvements include fuzzy matching?',
      author: LEO,
      createdDate: daysAgo(7),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Leo Yes! Fuzzy search with typo tolerance is included.',
      author: ALICE,
      createdDate: daysAgo(6),
      workItemId: 2,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Excited for all these updates. Q1 is going to be big!',
      author: GRACE,
      createdDate: daysAgo(3),
      workItemId: 2,
      version: 1,
    },
  ]);

  // Discussion 3: Maintenance Window (3 comments)
  mockCommentsMap.set(3, [
    {
      id: nextCommentId++,
      text: 'Thanks for the advance notice. Will staging be available during the maintenance?',
      author: ALICE,
      createdDate: daysAgo(1),
      workItemId: 3,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Alice Yes, staging environments will remain up.',
      author: BOB,
      createdDate: daysAgo(1),
      workItemId: 3,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Got it on my calendar. Thanks!',
      author: CAROL,
      createdDate: daysAgo(0),
      workItemId: 3,
      version: 1,
    },
  ]);

  // Discussion 4: New Release v2.5.0 (8 comments)
  mockCommentsMap.set(4, [
    {
      id: nextCommentId++,
      text: 'Real-time notifications are game-changing! No more refreshing the page.',
      author: DAN,
      createdDate: daysAgo(4),
      workItemId: 4,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The markdown preview is so useful. Thanks for adding this!',
      author: EVA,
      createdDate: daysAgo(4),
      workItemId: 4,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'What keyboard shortcuts are available?',
      author: FRANK,
      createdDate: daysAgo(3),
      workItemId: 4,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Frank Press `?` to see all available shortcuts!',
      author: ALICE,
      createdDate: daysAgo(3),
      workItemId: 4,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The mobile layout fixes are perfect. Testing on my iPad now.',
      author: GRACE,
      createdDate: daysAgo(2),
      workItemId: 4,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Love the improved search. Finding old discussions is so much easier now.',
      author: HENRY,
      createdDate: daysAgo(2),
      workItemId: 4,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Any performance improvements in this release?',
      author: IVY,
      createdDate: daysAgo(1),
      workItemId: 4,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Ivy Yes! Page load times improved by ~20% thanks to lazy loading.',
      author: BOB,
      createdDate: daysAgo(1),
      workItemId: 4,
      version: 1,
    },
  ]);

  // Discussion 5: Dark Mode Support (14 comments)
  mockCommentsMap.set(5, [
    {
      id: nextCommentId++,
      text: 'FINALLY! My eyes thank you.',
      author: JACK,
      createdDate: daysAgo(6),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The transition animations are so smooth!',
      author: KAREN,
      createdDate: daysAgo(6),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'System preference detection works great on macOS.',
      author: LEO,
      createdDate: daysAgo(5),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Can we get a scheduling feature? Dark mode at night, light during day?',
      author: ALICE,
      createdDate: daysAgo(5),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Alice Great idea! Added to the backlog.',
      author: DAN,
      createdDate: daysAgo(5),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "Found a small bug: code blocks don't have proper contrast in dark mode.",
      author: BOB,
      createdDate: daysAgo(4),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Bob Thanks for reporting! Fix coming in v2.5.1',
      author: DAN,
      createdDate: daysAgo(4),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Dark mode + OLED = massive battery savings on my phone!',
      author: CAROL,
      createdDate: daysAgo(3),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Is there an API to detect/set the theme programmatically?',
      author: EVA,
      createdDate: daysAgo(3),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Eva Yes! Check `window.communityHub.setTheme("dark"|"light"|"system")`',
      author: FRANK,
      createdDate: daysAgo(3),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The colors are well chosen. Not too harsh on the eyes.',
      author: GRACE,
      createdDate: daysAgo(2),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Testing on Windows - works perfectly with system dark mode.',
      author: HENRY,
      createdDate: daysAgo(2),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'My productivity has increased since switching to dark mode. Less eye strain!',
      author: IVY,
      createdDate: daysAgo(1),
      workItemId: 5,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Best update this year! Thanks team!',
      author: MARCUS,
      createdDate: daysAgo(1),
      workItemId: 5,
      version: 1,
    },
  ]);

  // Discussion 6: Sprint 12 Retrospective (12 comments)
  mockCommentsMap.set(6, [
    {
      id: nextCommentId++,
      text: 'Great summary! I especially agree about needing better API docs.',
      author: ALICE,
      createdDate: daysAgo(2),
      workItemId: 6,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The CI/CD improvements made such a difference this sprint.',
      author: BOB,
      createdDate: daysAgo(2),
      workItemId: 6,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Pair programming sessions have been really helpful for knowledge sharing.',
      author: CAROL,
      createdDate: daysAgo(2),
      workItemId: 6,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'I can help set up the automated API documentation. OpenAPI?',
      author: DAN,
      createdDate: daysAgo(1),
      workItemId: 6,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Dan Yes! OpenAPI 3.0 with auto-generated docs would be perfect.',
      author: CAROL,
      createdDate: daysAgo(1),
      workItemId: 6,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'What SLA should we set for code reviews?',
      author: EVA,
      createdDate: daysAgo(1),
      workItemId: 6,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'I suggest 24 hours for initial review, 48 hours for approval.',
      author: FRANK,
      createdDate: daysAgo(1),
      workItemId: 6,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Frank That sounds reasonable. Smaller PRs for faster reviews?',
      author: GRACE,
      createdDate: daysAgo(1),
      workItemId: 6,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'We should cap PRs at 400 lines max. Anything larger gets split.',
      author: HENRY,
      createdDate: daysAgo(1),
      workItemId: 6,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '+1 on the PR size limit. Reviewing huge PRs is exhausting.',
      author: IVY,
      createdDate: daysAgo(0),
      workItemId: 6,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "Great discussion everyone. Let's formalize these in our team docs.",
      author: CAROL,
      createdDate: daysAgo(0),
      workItemId: 6,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Looking forward to Sprint 13!',
      author: JACK,
      createdDate: daysAgo(0),
      workItemId: 6,
      version: 1,
    },
  ]);

  // Discussion 7: Community Guidelines (6 comments)
  mockCommentsMap.set(7, [
    {
      id: nextCommentId++,
      text: 'Clear and comprehensive guidelines. Thanks for putting this together!',
      author: ALICE,
      createdDate: daysAgo(8),
      workItemId: 7,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The privacy section is especially important. Good call on being explicit about it.',
      author: BOB,
      createdDate: daysAgo(7),
      workItemId: 7,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "What's the process for reporting violations?",
      author: CAROL,
      createdDate: daysAgo(6),
      workItemId: 7,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Carol Click the three dots menu on any post and select "Report". Admins will review within 24 hours.',
      author: MARCUS,
      createdDate: daysAgo(6),
      workItemId: 7,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Will there be translations for non-English speakers?',
      author: LEO,
      createdDate: daysAgo(4),
      workItemId: 7,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "@Leo Good idea! We'll work on Spanish, French, and German translations.",
      author: MARCUS,
      createdDate: daysAgo(3),
      workItemId: 7,
      version: 1,
    },
  ]);

  // Discussion 8: API Rate Limits (9 comments)
  mockCommentsMap.set(8, [
    {
      id: nextCommentId++,
      text: 'Super helpful breakdown. The headers explanation is exactly what I needed.',
      author: DAN,
      createdDate: daysAgo(11),
      workItemId: 8,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Is there a way to request higher limits for specific use cases?',
      author: EVA,
      createdDate: daysAgo(10),
      workItemId: 8,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Eva Contact api-support@repryl.com with your use case for limit increases.',
      author: FRANK,
      createdDate: daysAgo(10),
      workItemId: 8,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The exponential backoff example would be useful. Any code samples?',
      author: GRACE,
      createdDate: daysAgo(8),
      workItemId: 8,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Grace I can share our Node.js implementation. Will post in #dev-resources.',
      author: HENRY,
      createdDate: daysAgo(8),
      workItemId: 8,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Do WebSocket connections count against rate limits?',
      author: IVY,
      createdDate: daysAgo(6),
      workItemId: 8,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Ivy No, WebSocket messages have separate limits. 100 messages/second.',
      author: FRANK,
      createdDate: daysAgo(6),
      workItemId: 8,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Thanks for documenting this. Saved me hours of trial and error.',
      author: JACK,
      createdDate: daysAgo(3),
      workItemId: 8,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Added this to our team wiki for reference.',
      author: KAREN,
      createdDate: daysAgo(1),
      workItemId: 8,
      version: 1,
    },
  ]);

  // Discussion 9: Security Best Practices (4 comments)
  mockCommentsMap.set(9, [
    {
      id: nextCommentId++,
      text: 'Great reminder about API key rotation. Setting up automated rotation now.',
      author: BOB,
      createdDate: daysAgo(14),
      workItemId: 9,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Is there a recommended password manager for the team?',
      author: CAROL,
      createdDate: daysAgo(12),
      workItemId: 9,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Carol We use 1Password for Teams. IT can help you get set up.',
      author: EVA,
      createdDate: daysAgo(12),
      workItemId: 9,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "The bug bounty program link doesn't work. Can you update it?",
      author: DAN,
      createdDate: daysAgo(10),
      workItemId: 9,
      version: 1,
    },
  ]);

  // Discussion 10: Monthly Digest (5 comments)
  mockCommentsMap.set(10, [
    {
      id: nextCommentId++,
      text: 'Love these monthly digests! Great way to stay informed.',
      author: ALICE,
      createdDate: daysAgo(0),
      workItemId: 10,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Congrats to the top contributors! Well deserved.',
      author: BOB,
      createdDate: daysAgo(0),
      workItemId: 10,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Would be great to see a "most improved" category too.',
      author: CAROL,
      createdDate: daysAgo(0),
      workItemId: 10,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Can we get email subscriptions for these digests?',
      author: DAN,
      createdDate: daysAgo(0),
      workItemId: 10,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "@Dan Coming in March! You'll be able to subscribe in settings.",
      author: GRACE,
      createdDate: daysAgo(0),
      workItemId: 10,
      version: 1,
    },
  ]);

  // Discussion 11: Dev Environment Setup (7 comments)
  mockCommentsMap.set(11, [
    {
      id: nextCommentId++,
      text: 'That error usually means you need to use nvm instead of system Node. Try `nvm use 20`.',
      author: ALICE,
      createdDate: daysAgo(3),
      workItemId: 11,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Alice worked! Thanks so much.',
      author: HENRY,
      createdDate: daysAgo(3),
      workItemId: 11,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "We should add nvm setup to the README. I'll create a PR.",
      author: BOB,
      createdDate: daysAgo(2),
      workItemId: 11,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Also recommend adding volta as an alternative to nvm.',
      author: CAROL,
      createdDate: daysAgo(2),
      workItemId: 11,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'For Windows users, I recommend using WSL2 for the best experience.',
      author: DAN,
      createdDate: daysAgo(1),
      workItemId: 11,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Docker setup is also an option if you want a clean environment.',
      author: EVA,
      createdDate: daysAgo(1),
      workItemId: 11,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Thanks everyone for the help! Got it working now.',
      author: HENRY,
      createdDate: daysAgo(0),
      workItemId: 11,
      version: 1,
    },
  ]);

  // Discussion 12: Keyboard Shortcuts Idea (8 comments)
  mockCommentsMap.set(12, [
    {
      id: nextCommentId++,
      text: 'Love this idea! vim-style navigation would be awesome.',
      author: BOB,
      createdDate: daysAgo(7),
      workItemId: 12,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Maybe add Ctrl+Enter to submit forms too?',
      author: CAROL,
      createdDate: daysAgo(6),
      workItemId: 12,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '+1 for searchable shortcuts panel. GitHub does this well.',
      author: DAN,
      createdDate: daysAgo(5),
      workItemId: 12,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Can we customize shortcuts? I use different keybindings.',
      author: EVA,
      createdDate: daysAgo(4),
      workItemId: 12,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "@Eva Custom keybindings would require significant work, but it's a good idea for the future.",
      author: ALICE,
      createdDate: daysAgo(4),
      workItemId: 12,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Escape to close modals would be nice too.',
      author: FRANK,
      createdDate: daysAgo(3),
      workItemId: 12,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "@Frank That's already implemented! Try pressing Escape on any modal.",
      author: GRACE,
      createdDate: daysAgo(3),
      workItemId: 12,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Added keyboard shortcuts to the v2.5.0 milestone. Thanks for the detailed proposal!',
      author: MARCUS,
      createdDate: daysAgo(2),
      workItemId: 12,
      version: 1,
    },
  ]);

  // Discussion 13: Code Review Best Practices (15 comments)
  mockCommentsMap.set(13, [
    {
      id: nextCommentId++,
      text: 'I think 48 hours is reasonable for non-urgent PRs.',
      author: ALICE,
      createdDate: daysAgo(5),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "2 approvers minimum is standard in most teams I've worked with.",
      author: CAROL,
      createdDate: daysAgo(5),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Dedicated review time blocks help. We do 10-11am daily.',
      author: DAN,
      createdDate: daysAgo(4),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "@Dan That's a great idea. Prevents context switching.",
      author: BOB,
      createdDate: daysAgo(4),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'For disagreements, I suggest: discuss in PR → if unresolved, sync call → if still unresolved, tech lead decides.',
      author: EVA,
      createdDate: daysAgo(4),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'We should use conventional comments (praise, suggestion, nitpick, etc).',
      author: FRANK,
      createdDate: daysAgo(3),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Frank +1! Makes feedback tone clearer.',
      author: GRACE,
      createdDate: daysAgo(3),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Should we require tests for all new code?',
      author: HENRY,
      createdDate: daysAgo(3),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Henry For features, yes. For hotfixes, tests can follow after.',
      author: IVY,
      createdDate: daysAgo(2),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'What about code coverage requirements?',
      author: JACK,
      createdDate: daysAgo(2),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "I'd say 80% minimum, but focus on critical paths, not just hitting a number.",
      author: KAREN,
      createdDate: daysAgo(2),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Automated linting in CI helps reduce nitpick comments.',
      author: LEO,
      createdDate: daysAgo(1),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "Great discussion! I'll compile these into a doc.",
      author: BOB,
      createdDate: daysAgo(1),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "Thanks @Bob! Let's review the draft next team meeting.",
      author: ALICE,
      createdDate: daysAgo(0),
      workItemId: 13,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'This thread should be pinned as a reference!',
      author: MARCUS,
      createdDate: daysAgo(0),
      workItemId: 13,
      version: 1,
    },
  ]);

  // Discussion 14: Team Offsite Photos (18 comments)
  mockCommentsMap.set(14, [
    {
      id: nextCommentId++,
      text: 'What an amazing event! Best offsite yet.',
      author: ALICE,
      createdDate: daysAgo(9),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The hackathon was so much fun. Our AI project was a blast to build.',
      author: BOB,
      createdDate: daysAgo(9),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Congrats Team Alpha on the win!',
      author: CAROL,
      createdDate: daysAgo(9),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The hiking trail was beautiful. Great choice!',
      author: DAN,
      createdDate: daysAgo(8),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "Can't wait to see the photos. The sunset on Day 2 was incredible.",
      author: EVA,
      createdDate: daysAgo(8),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Thanks to the organizers! Everything was perfectly planned.',
      author: FRANK,
      createdDate: daysAgo(8),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The team dinner was fantastic. That restaurant was a great find!',
      author: GRACE,
      createdDate: daysAgo(8),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Still thinking about that chocolate dessert...',
      author: HENRY,
      createdDate: daysAgo(7),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The strategy session was really productive. Good ideas for 2026.',
      author: IVY,
      createdDate: daysAgo(7),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "When's the next one? Already looking forward to it!",
      author: JACK,
      createdDate: daysAgo(7),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The escape room activity was hilarious. Our team needs more practice!',
      author: KAREN,
      createdDate: daysAgo(6),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Photos are now in the shared drive! Link in the original post.',
      author: CAROL,
      createdDate: daysAgo(6),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Just looked through the photos. So many good memories!',
      author: LEO,
      createdDate: daysAgo(5),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'The group photo turned out great. New profile pic incoming.',
      author: ALICE,
      createdDate: daysAgo(5),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Missing you all already. Remote work is great but nothing beats in-person time.',
      author: BOB,
      createdDate: daysAgo(4),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: "Let's do a virtual happy hour to keep the vibes going!",
      author: DAN,
      createdDate: daysAgo(3),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Dan Great idea! Setting one up for Friday.',
      author: MARCUS,
      createdDate: daysAgo(3),
      workItemId: 14,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Count me in for the virtual happy hour!',
      author: EVA,
      createdDate: daysAgo(2),
      workItemId: 14,
      version: 1,
    },
  ]);

  // Discussion 15: Mobile App Beta Testers (22 comments)
  mockCommentsMap.set(15, [
    {
      id: nextCommentId++,
      text: 'Signed up! Excited to test on iOS.',
      author: ALICE,
      createdDate: daysAgo(2),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Will there be a TestFlight build for iPhone?',
      author: BOB,
      createdDate: daysAgo(2),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Bob Yes! iOS will use TestFlight, Android will use Firebase App Distribution.',
      author: DAN,
      createdDate: daysAgo(2),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Applied! Android user here.',
      author: CAROL,
      createdDate: daysAgo(2),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'What features will be in the beta?',
      author: EVA,
      createdDate: daysAgo(2),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Eva Core features: view discussions, comment, vote, notifications. No new post creation initially.',
      author: DAN,
      createdDate: daysAgo(2),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Will it support offline mode?',
      author: FRANK,
      createdDate: daysAgo(1),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Frank Offline reading is planned for v1.1. Beta will require connectivity.',
      author: DAN,
      createdDate: daysAgo(1),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Native app or React Native?',
      author: GRACE,
      createdDate: daysAgo(1),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Grace React Native for faster cross-platform development.',
      author: DAN,
      createdDate: daysAgo(1),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Hope it supports biometric login!',
      author: HENRY,
      createdDate: daysAgo(1),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Henry Face ID and fingerprint support confirmed!',
      author: DAN,
      createdDate: daysAgo(1),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Applied from the EU. Will there be any geo restrictions?',
      author: IVY,
      createdDate: daysAgo(1),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Ivy No restrictions! Beta is open globally.',
      author: DAN,
      createdDate: daysAgo(1),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Any tablet-optimized UI?',
      author: JACK,
      createdDate: daysAgo(1),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Jack iPad support is in scope. Android tablets in v1.1.',
      author: DAN,
      createdDate: daysAgo(1),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Signed up! Happy to help find bugs.',
      author: KAREN,
      createdDate: daysAgo(0),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Will beta testers get early access to future features?',
      author: LEO,
      createdDate: daysAgo(0),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Leo Yes! Beta testers get early access to all future betas.',
      author: DAN,
      createdDate: daysAgo(0),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'Just applied. Let me know if you need help with accessibility testing.',
      author: MARCUS,
      createdDate: daysAgo(0),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: '@Esmail Absolutely! Accessibility feedback is super valuable.',
      author: DAN,
      createdDate: daysAgo(0),
      workItemId: 15,
      version: 1,
    },
    {
      id: nextCommentId++,
      text: 'So excited for this! The mobile experience will make Community Hub even better.',
      author: ALICE,
      createdDate: daysAgo(0),
      workItemId: 15,
      version: 1,
    },
  ]);
}

/**
 * Initialize mock comments for a specific discussion (for backwards compatibility)
 */
function initMockComments(discussionId: number): Comment[] {
  initAllMockComments();
  if (!mockCommentsMap.has(discussionId)) {
    mockCommentsMap.set(discussionId, []);
  }
  return mockCommentsMap.get(discussionId)!;
}

/**
 * Comment Service class
 */
export class CommentService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private workItemClient: any = null;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (isDevMode()) {
      console.log('[CommentService] Running in dev mode - using mock data');
      return;
    }

    this.workItemClient = await getWorkItemTrackingClient();
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!isDevMode() && !this.workItemClient) {
      throw new Error(
        'CommentService not initialized. Call initialize() first.'
      );
    }
  }

  /**
   * Get all comments for a discussion
   */
  async getComments(discussionId: number): Promise<Comment[]> {
    this.ensureInitialized();

    if (isDevMode()) {
      return initMockComments(discussionId);
    }

    try {
      const response: CommentsResponse =
        await this.workItemClient.getComments(discussionId);

      return (response.comments || []).map((c) =>
        this.mapToComment(c, discussionId)
      );
    } catch (error) {
      console.error('[CommentService] Error getting comments:', error);
      throw error;
    }
  }

  /**
   * Get first 2 unique commenters for multiple discussions (excluding authors)
   * Returns commenters in chronological order (earliest first)
   * @param discussionIds List of discussion IDs to fetch commenters for
   * @param authorIds Map of discussionId -> authorId to exclude from results
   */
  async getCommentersForDiscussions(
    discussionIds: number[],
    authorIds: Map<number, string>
  ): Promise<Map<number, User[]>> {
    this.ensureInitialized();

    const result = new Map<number, User[]>();

    if (discussionIds.length === 0) {
      return result;
    }

    if (isDevMode()) {
      // Initialize all mock comments
      initAllMockComments();

      for (const discussionId of discussionIds) {
        const comments = mockCommentsMap.get(discussionId) || [];
        const authorId = authorIds.get(discussionId);

        // Sort by createdDate ascending (earliest first)
        const sortedComments = [...comments].sort(
          (a, b) => a.createdDate.getTime() - b.createdDate.getTime()
        );

        // Extract unique commenters excluding author
        const seenIds = new Set<string>();
        const commenters: User[] = [];

        for (const comment of sortedComments) {
          if (comment.author.id === authorId) continue;
          if (seenIds.has(comment.author.id)) continue;

          seenIds.add(comment.author.id);
          commenters.push(comment.author);

          if (commenters.length >= 2) break;
        }

        result.set(discussionId, commenters);
      }

      return result;
    }

    // Production: Fetch comments for each discussion in parallel
    try {
      const commentPromises = discussionIds.map(async (discussionId) => {
        try {
          const comments = await this.getComments(discussionId);
          return { discussionId, comments };
        } catch {
          return { discussionId, comments: [] as Comment[] };
        }
      });

      const allResults = await Promise.all(commentPromises);

      for (const { discussionId, comments } of allResults) {
        const authorId = authorIds.get(discussionId);

        // Sort by createdDate ascending (earliest first)
        const sortedComments = [...comments].sort(
          (a, b) => a.createdDate.getTime() - b.createdDate.getTime()
        );

        // Extract unique commenters excluding author
        const seenIds = new Set<string>();
        const commenters: User[] = [];

        for (const comment of sortedComments) {
          if (comment.author.id === authorId) continue;
          if (seenIds.has(comment.author.id)) continue;

          seenIds.add(comment.author.id);
          commenters.push(comment.author);

          if (commenters.length >= 2) break;
        }

        result.set(discussionId, commenters);
      }

      return result;
    } catch (error) {
      console.error(
        '[CommentService] Error getting commenters for discussions:',
        error
      );
      return result;
    }
  }

  /**
   * Add a new comment to a discussion
   */
  async addComment(
    discussionId: number,
    input: CreateCommentInput
  ): Promise<Comment> {
    this.ensureInitialized();

    if (isDevMode()) {
      const comments = initMockComments(discussionId);
      const newComment: Comment = {
        id: nextCommentId++,
        text: input.text,
        author: MARCUS, // Current user in dev mode
        createdDate: new Date(),
        workItemId: discussionId,
        version: 1,
      };
      comments.push(newComment);
      return newComment;
    }

    try {
      const response: CommentResponse = await this.workItemClient.addComment(
        { text: input.text },
        undefined, // project (not needed when using work item ID)
        discussionId
      );

      return this.mapToComment(response, discussionId);
    } catch (error) {
      console.error('[CommentService] Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Update an existing comment
   */
  async updateComment(
    discussionId: number,
    commentId: number,
    input: UpdateCommentInput
  ): Promise<Comment> {
    this.ensureInitialized();

    if (isDevMode()) {
      const comments = initMockComments(discussionId);
      const index = comments.findIndex((c) => c.id === commentId);
      if (index === -1) {
        throw new Error('Comment not found');
      }
      const updatedComment: Comment = {
        ...comments[index],
        text: input.text,
        modifiedDate: new Date(),
        version: comments[index].version + 1,
      };
      comments[index] = updatedComment;
      return updatedComment;
    }

    try {
      const response: CommentResponse = await this.workItemClient.updateComment(
        { text: input.text },
        undefined, // project
        discussionId,
        commentId
      );

      return this.mapToComment(response, discussionId);
    } catch (error) {
      console.error('[CommentService] Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(discussionId: number, commentId: number): Promise<void> {
    this.ensureInitialized();

    if (isDevMode()) {
      const comments = initMockComments(discussionId);
      const index = comments.findIndex((c) => c.id === commentId);
      if (index !== -1) {
        comments.splice(index, 1);
      }
      return;
    }

    try {
      await this.workItemClient.deleteComment(
        undefined, // project
        discussionId,
        commentId
      );
    } catch (error) {
      console.error('[CommentService] Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Get a single comment by ID
   */
  async getComment(
    discussionId: number,
    commentId: number
  ): Promise<Comment | null> {
    this.ensureInitialized();

    if (isDevMode()) {
      const comments = initMockComments(discussionId);
      return comments.find((c) => c.id === commentId) || null;
    }

    try {
      const response: CommentResponse = await this.workItemClient.getComment(
        undefined, // project
        discussionId,
        commentId
      );

      return this.mapToComment(response, discussionId);
    } catch (error) {
      console.error('[CommentService] Error getting comment:', error);
      return null;
    }
  }

  /**
   * Get all recent comments across all discussions (for leaderboard)
   * @param daysBack Number of days to look back (default 30)
   */
  async getAllRecentComments(daysBack: number = 30): Promise<Comment[]> {
    this.ensureInitialized();

    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    if (isDevMode()) {
      initAllMockComments();
      const allComments: Comment[] = [];
      mockCommentsMap.forEach((comments) => {
        allComments.push(...comments);
      });
      // Filter by date
      return allComments.filter((c) => c.createdDate >= cutoffDate);
    }

    try {
      // In production, query for all Discussion work items and fetch their comments
      // Using WIQL to find all Discussion work items
      const wiql = {
        query: `SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'Discussion' ORDER BY [System.CreatedDate] DESC`,
      };

      const queryResult = await this.workItemClient.queryByWiql(wiql);
      const workItemIds: number[] = (queryResult.workItems || []).map(
        (wi: WorkItem) => wi.id
      );

      if (workItemIds.length === 0) {
        return [];
      }

      // Fetch comments for each work item (batch in parallel)
      const commentPromises = workItemIds.map((id) =>
        this.getComments(id).catch(() => [] as Comment[])
      );
      const allCommentsArrays = await Promise.all(commentPromises);
      const allComments = allCommentsArrays.flat();

      // Filter by date
      return allComments.filter((c) => c.createdDate >= cutoffDate);
    } catch (error) {
      console.error(
        '[CommentService] Error getting all recent comments:',
        error
      );
      throw error;
    }
  }

  /**
   * Toggle a reaction on a comment (add if not present, remove if present)
   * Returns the updated comment with reactions
   */
  async toggleReaction(
    discussionId: number,
    commentId: number,
    reactionType: CommentReactionType,
    currentUserId: string
  ): Promise<Comment> {
    this.ensureInitialized();

    if (isDevMode()) {
      const comments = initMockComments(discussionId);
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Track user reactions
      const userKey = getUserReactionKey(commentId, currentUserId);
      if (!mockUserReactionsMap.has(userKey)) {
        mockUserReactionsMap.set(userKey, new Set());
      }
      const userReactions = mockUserReactionsMap.get(userKey)!;

      // Initialize reactions array if not present
      if (!comment.reactions) {
        comment.reactions = [];
      }

      // Find existing reaction of this type
      const reaction = comment.reactions.find((r) => r.type === reactionType);
      const hasUserReacted = userReactions.has(reactionType);

      if (hasUserReacted) {
        // Remove reaction
        userReactions.delete(reactionType);
        if (reaction) {
          reaction.count--;
          reaction.isCurrentUserEngaged = false;
          // Remove if count is 0
          if (reaction.count <= 0) {
            comment.reactions = comment.reactions.filter(
              (r) => r.type !== reactionType
            );
          }
        }
      } else {
        // Add reaction
        userReactions.add(reactionType);
        if (reaction) {
          reaction.count++;
          reaction.isCurrentUserEngaged = true;
        } else {
          // Create new reaction
          comment.reactions.push({
            commentId,
            type: reactionType,
            count: 1,
            isCurrentUserEngaged: true,
          });
        }
      }

      return { ...comment };
    }

    // Production: Use Azure DevOps API
    try {
      // Check if user already has this reaction
      const comment = await this.getComment(discussionId, commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      const existingReaction = comment.reactions?.find(
        (r) => r.type === reactionType && r.isCurrentUserEngaged
      );

      if (existingReaction) {
        // Remove reaction
        await this.removeReaction(discussionId, commentId, reactionType);
      } else {
        // Add reaction
        await this.addReaction(discussionId, commentId, reactionType);
      }

      // Fetch updated comment
      const updatedComment = await this.getComment(discussionId, commentId);
      if (!updatedComment) {
        throw new Error('Failed to fetch updated comment');
      }
      return updatedComment;
    } catch (error) {
      console.error('[CommentService] Error toggling reaction:', error);
      throw error;
    }
  }

  /**
   * Add a reaction to a comment
   */
  async addReaction(
    discussionId: number,
    commentId: number,
    reactionType: CommentReactionType
  ): Promise<void> {
    this.ensureInitialized();

    if (isDevMode()) {
      // Dev mode handled in toggleReaction
      return;
    }

    try {
      // Azure DevOps API: PUT /_apis/wit/workItems/{id}/comments/{commentId}/reactions/{type}
      await this.workItemClient.addCommentReaction(
        undefined, // project
        discussionId,
        commentId,
        reactionType
      );
    } catch (error) {
      console.error('[CommentService] Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Remove a reaction from a comment
   */
  async removeReaction(
    discussionId: number,
    commentId: number,
    reactionType: CommentReactionType
  ): Promise<void> {
    this.ensureInitialized();

    if (isDevMode()) {
      // Dev mode handled in toggleReaction
      return;
    }

    try {
      // Azure DevOps API: DELETE /_apis/wit/workItems/{id}/comments/{commentId}/reactions/{type}
      await this.workItemClient.deleteCommentReaction(
        undefined, // project
        discussionId,
        commentId,
        reactionType
      );
    } catch (error) {
      console.error('[CommentService] Error removing reaction:', error);
      throw error;
    }
  }

  /**
   * Map API response to Comment type
   */
  private mapToComment(response: CommentResponse, workItemId: number): Comment {
    const author: User = {
      id: response.createdBy?.id || 'unknown',
      displayName: response.createdBy?.displayName || 'Unknown User',
      imageUrl: response.createdBy?.imageUrl,
      uniqueName: response.createdBy?.uniqueName,
    };

    return {
      id: response.id,
      text: response.text,
      author,
      createdDate: response.createdDate
        ? new Date(response.createdDate)
        : new Date(),
      modifiedDate: response.modifiedDate
        ? new Date(response.modifiedDate)
        : undefined,
      workItemId,
      version: response.version,
    };
  }
}

// Export singleton instance
export const commentService = new CommentService();

// Re-export MOCK_USERS for backward compatibility
export { MOCK_USERS };
