/**
 * Mock Discussion Data
 * Simulates discussions for development mode
 */

import {
  Discussion,
  CreateDiscussionInput,
  UpdateDiscussionInput,
  Category,
  VisibilityScope,
} from '@/types';
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
} from './users';

/**
 * Mock discussions data
 */
export const mockDiscussions: Discussion[] = [
  // === PINNED DISCUSSIONS ===
  {
    id: 1,
    title: '👋 Welcome to Community Hub!',
    body: `# Welcome to Community Hub! 🎉

This is our new space for team discussions, announcements, and collaboration.

## What you can do here:
- **Share announcements** with the team
- **Ask questions** and get help
- **Propose ideas** for improvement
- **Vote** on discussions you find valuable

Let's build a great community together!`,
    category: Category.Announcements,
    visibility: VisibilityScope.Organization,
    targetProjects: [],
    voteCount: 47,
    commentCount: 12,
    isPinned: false,
    tags: ['welcome', 'important'],
    author: MARCUS,
    createdDate: new Date('2026-02-01T10:00:00Z'),
    changedDate: new Date('2026-02-25T14:30:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 2,
    title: 'Q1 2026 Roadmap Preview',
    body: `## Q1 2026 Roadmap

Here's what we're planning for Q1 2026. Feedback welcome!

### 🚀 Major Features
- **Dark Mode Support** - Coming in v2.6
- **Mobile App** - Beta launching in March
- **API v3** - Breaking changes, migration guide coming soon

### 🔧 Improvements
- Performance optimizations for large datasets
- Better search functionality
- Enhanced accessibility (WCAG 2.1 AA compliance)

### 📅 Timeline
| Feature | Target Date |
|---------|-------------|
| Dark Mode | Feb 28 |
| API v3 Beta | Mar 10 |
| Mobile Beta | Mar 20 |

Please share your thoughts and priorities in the comments!`,
    category: Category.Announcements,
    visibility: VisibilityScope.Organization,
    targetProjects: [],
    voteCount: 38,
    commentCount: 15,
    isPinned: true,
    tags: ['important', 'roadmap'],
    author: MARCUS,
    createdDate: new Date('2026-01-15T09:00:00Z'),
    changedDate: new Date('2026-02-20T11:00:00Z'),
    projectId: 'platform-team-project-id',
    projectName: 'Platform Team',
    state: 'Active',
  },
  {
    id: 3,
    title: '🔧 Maintenance Window: March 1st',
    body: `## Scheduled Maintenance

**Date:** Saturday, March 1st, 2026
**Time:** 10:00 PM - 2:00 AM EST

### What's happening:
- Database migration to new cluster
- Infrastructure upgrades
- Security patches

### Expected impact:
- Production environment will be unavailable
- Development environments will not be affected
- Estimated downtime: 2-4 hours

### Contact:
If you have concerns, please reach out to the DevOps team.

Thank you for your patience!`,
    category: Category.Announcements,
    visibility: VisibilityScope.Organization,
    targetProjects: [],
    voteCount: 8,
    commentCount: 3,
    isPinned: false,
    tags: ['maintenance', 'important'],
    author: BOB,
    createdDate: new Date('2026-02-25T08:00:00Z'),
    changedDate: new Date('2026-02-25T08:00:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },

  // === REGULAR DISCUSSIONS ===
  {
    id: 4,
    title: 'New Release: v2.5.0 Features',
    body: `## Release v2.5.0 🎉

We're excited to announce the release of v2.5.0! Here's what's new:

### New Features
- **Real-time notifications** - Get instant updates on discussions you follow
- **Markdown preview** - See your formatting before posting
- **Improved search** - Full-text search across all discussions
- **Keyboard shortcuts** - Navigate faster with hotkeys

### Bug Fixes
- Fixed: Comments not loading on slow connections
- Fixed: Vote count not updating in real-time
- Fixed: Mobile layout issues on tablets

### Breaking Changes
None in this release.

### Upgrade Instructions
No action required - the update will be deployed automatically.

Full changelog: [link to changelog]`,
    category: Category.Announcements,
    visibility: VisibilityScope.Organization,
    targetProjects: [],
    voteCount: 24,
    commentCount: 8,
    isPinned: false,
    tags: ['feature-request', 'release'],
    author: ALICE,
    createdDate: new Date('2026-02-22T14:00:00Z'),
    changedDate: new Date('2026-02-24T09:00:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 5,
    title: '🌙 Introducing Dark Mode Support',
    body: `## Dark Mode is Here! 🌙

Based on popular demand, we've implemented dark mode support!

### How to Enable
1. Click on your profile icon
2. Go to Settings
3. Select "Appearance"
4. Choose "Dark", "Light", or "System"

### Features
- Follows system preference by default
- Persists your choice across sessions
- Smooth transition animations
- Optimized for OLED displays

### Screenshots
[Dark mode preview images would go here]

### Known Issues
- Some third-party embeds may not respect dark mode
- Working on fixing calendar widget colors

Let us know what you think!`,
    category: Category.Announcements,
    visibility: VisibilityScope.Organization,
    targetProjects: [],
    voteCount: 35,
    commentCount: 14,
    isPinned: false,
    tags: ['feature-request'],
    author: DAN,
    createdDate: new Date('2026-02-20T16:00:00Z'),
    changedDate: new Date('2026-02-25T09:20:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 6,
    title: 'Sprint 12 Retrospective Summary',
    body: `## Sprint 12 Retrospective Summary

### What went well
- Completed all planned user stories
- Great collaboration between frontend and backend teams
- New CI/CD pipeline reduced build times by 40%

### What could be improved
- Need better documentation for API changes
- More frequent code reviews
- Consider pair programming for complex features

### Action items
1. Set up automated API documentation
2. Establish code review SLAs
3. Schedule pair programming sessions

Please add your thoughts in the comments!`,
    category: Category.Announcements,
    visibility: VisibilityScope.Project,
    targetProjects: [],
    voteCount: 15,
    commentCount: 12,
    isPinned: false,
    tags: ['retrospective'],
    author: CAROL,
    createdDate: new Date('2026-02-24T09:00:00Z'),
    changedDate: new Date('2026-02-25T16:45:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 7,
    title: 'Community Guidelines Updated',
    body: `## Updated Community Guidelines

We've updated our community guidelines to ensure a positive environment for everyone.

### Key Changes

#### 1. Be Respectful
- Treat others as you would like to be treated
- No personal attacks or harassment
- Constructive criticism is welcome, rudeness is not

#### 2. Stay On Topic
- Keep discussions relevant to the channel/category
- Use appropriate labels
- Create new discussions for new topics

#### 3. No Spam
- Don't post the same content multiple times
- Avoid excessive self-promotion
- Quality over quantity

#### 4. Protect Privacy
- Don't share personal information without consent
- No doxxing
- Respect confidentiality

### Enforcement
Violations may result in warnings, temporary mutes, or permanent bans depending on severity.

Full guidelines: [link to full document]`,
    category: Category.Announcements,
    visibility: VisibilityScope.Organization,
    targetProjects: [],
    voteCount: 18,
    commentCount: 6,
    isPinned: false,
    tags: ['documentation', 'important'],
    author: MARCUS,
    createdDate: new Date('2026-02-18T10:00:00Z'),
    changedDate: new Date('2026-02-18T10:00:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 8,
    title: 'API Rate Limits Explained',
    body: `## Understanding API Rate Limits

We've received questions about our API rate limits. Here's a comprehensive guide.

### Current Limits

| Tier | Requests/min | Requests/hour | Requests/day |
|------|-------------|---------------|--------------|
| Free | 60 | 1,000 | 10,000 |
| Pro | 300 | 10,000 | 100,000 |
| Enterprise | 1,000 | Unlimited | Unlimited |

### Rate Limit Headers
Every response includes these headers:
- \`X-RateLimit-Limit\`: Your max requests
- \`X-RateLimit-Remaining\`: Requests left
- \`X-RateLimit-Reset\`: Unix timestamp when limit resets

### What Happens When You Exceed
- Returns HTTP 429 (Too Many Requests)
- \`Retry-After\` header indicates wait time
- Requests are queued, not rejected (Pro+ tiers)

### Best Practices
1. Implement exponential backoff
2. Cache responses when possible
3. Use webhooks instead of polling
4. Batch requests where supported

Questions? Drop them in the comments!`,
    category: Category.Announcements,
    visibility: VisibilityScope.Organization,
    targetProjects: [],
    voteCount: 22,
    commentCount: 9,
    isPinned: false,
    tags: ['documentation'],
    author: FRANK,
    createdDate: new Date('2026-02-15T11:00:00Z'),
    changedDate: new Date('2026-02-20T14:00:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 9,
    title: 'Security Best Practices',
    body: `## Security Best Practices for Our Platform

Security is everyone's responsibility. Here are some best practices to follow.

### 🔐 Authentication
- Use strong, unique passwords (16+ characters)
- Enable two-factor authentication (2FA)
- Never share your credentials
- Rotate API keys regularly

### 🛡️ Authorization
- Follow principle of least privilege
- Review access permissions quarterly
- Remove access for departing team members immediately

### 📝 Secure Coding
- Never commit secrets to repositories
- Use environment variables for configuration
- Sanitize all user inputs
- Keep dependencies updated

### 🚨 Incident Response
If you suspect a security issue:
1. Don't panic
2. Document what you observed
3. Contact security@repryl.com immediately
4. Don't share details publicly

### Resources
- [Security Policy]
- [Bug Bounty Program]
- [Security Training]`,
    category: Category.Announcements,
    visibility: VisibilityScope.Organization,
    targetProjects: [],
    voteCount: 14,
    commentCount: 4,
    isPinned: false,
    tags: ['important', 'documentation'],
    author: EVA,
    createdDate: new Date('2026-02-12T09:00:00Z'),
    changedDate: new Date('2026-02-12T09:00:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 10,
    title: 'Monthly Digest: February 2026',
    body: `## February 2026 Monthly Digest 📰

Here's a summary of what happened this month!

### 📊 Stats
- **New discussions:** 47
- **Total comments:** 312
- **Unique contributors:** 28
- **Most upvoted:** "Q1 2026 Roadmap Preview" (38 votes)

### 🏆 Top Contributors
1. @alice.johnson - 45 comments
2. @bob.smith - 38 comments
3. @carol.davis - 32 comments

### 🔥 Trending Topics
- Dark mode implementation
- API v3 migration
- Mobile app beta feedback

### 📅 Upcoming
- March 1: Maintenance window
- March 10: API v3 beta release
- March 20: Mobile app beta launch

### 💡 Feedback
What would you like to see in next month's digest? Let us know!`,
    category: Category.General,
    visibility: VisibilityScope.Organization,
    targetProjects: [],
    voteCount: 9,
    commentCount: 5,
    isPinned: false,
    tags: [],
    author: GRACE,
    createdDate: new Date('2026-02-26T08:00:00Z'),
    changedDate: new Date('2026-02-26T08:00:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 11,
    title: 'How do I set up the development environment?',
    body: `I'm new to the team and trying to set up my development environment.

I've followed the README but I'm getting an error when running \`npm install\`:

\`\`\`
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
\`\`\`

Has anyone else encountered this? What's the recommended setup?

My environment:
- macOS 14.3
- Node.js 20.11.0
- npm 10.2.4

Thanks in advance!`,
    category: Category.Help,
    visibility: VisibilityScope.Project,
    targetProjects: [],
    voteCount: 5,
    commentCount: 7,
    isPinned: false,
    tags: ['help-wanted'],
    author: HENRY,
    createdDate: new Date('2026-02-25T14:20:00Z'),
    changedDate: new Date('2026-02-26T11:15:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 12,
    title: 'Idea: Keyboard shortcuts reference',
    body: `## Feature Request: Keyboard Shortcuts Reference

It would be helpful to have a keyboard shortcuts reference panel.

### Proposed Implementation
- Press \`?\` to open shortcuts panel
- Searchable list of all shortcuts
- Categories: Navigation, Actions, Editing

### Suggested Shortcuts
| Action | Shortcut |
|--------|----------|
| New discussion | \`n\` |
| Search | \`/\` or \`Ctrl+K\` |
| Go home | \`g h\` |
| Next discussion | \`j\` |
| Previous discussion | \`k\` |
| Upvote | \`u\` |
| Comment | \`c\` |

Would love to hear other ideas!`,
    category: Category.Ideas,
    visibility: VisibilityScope.Project,
    targetProjects: [],
    voteCount: 19,
    commentCount: 8,
    isPinned: false,
    tags: ['feature-request'],
    author: ALICE,
    createdDate: new Date('2026-02-24T15:00:00Z'),
    changedDate: new Date('2026-02-25T10:00:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 13,
    title: 'General discussion: Code review best practices',
    body: `I wanted to start a discussion about code review best practices.

## Questions for the team:

1. How long should a PR be open before it's considered "stale"?
2. What's the minimum number of approvers we should require?
3. Should we have dedicated review time or ad-hoc reviews?
4. How do we handle disagreements in reviews?

Looking forward to hearing everyone's thoughts!`,
    category: Category.General,
    visibility: VisibilityScope.Project,
    targetProjects: [],
    voteCount: 12,
    commentCount: 15,
    isPinned: false,
    tags: ['discussion', 'best-practices'],
    author: BOB,
    createdDate: new Date('2026-02-23T11:30:00Z'),
    changedDate: new Date('2026-02-24T17:00:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 14,
    title: 'Team offsite photos from last week',
    body: `## Team Offsite 2026 📸

What an amazing time we had at the team offsite! Here are some highlights.

### Day 1 - Strategy Session
- Reviewed 2025 achievements
- Set goals for 2026
- Team building exercises

### Day 2 - Hackathon
- 5 teams, 24 hours
- Winner: "AI-powered code review" by Team Alpha
- Runner-up: "Slack bot for standups" by Team Beta

### Day 3 - Adventure
- Hiking trip to [location]
- Team dinner at [restaurant]

Thanks to everyone who made this event special! 

Photos are in the shared drive: [link]`,
    category: Category.General,
    visibility: VisibilityScope.Organization,
    targetProjects: [],
    voteCount: 31,
    commentCount: 18,
    isPinned: false,
    tags: [],
    author: CAROL,
    createdDate: new Date('2026-02-21T09:00:00Z'),
    changedDate: new Date('2026-02-22T16:00:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
  {
    id: 15,
    title: 'Looking for beta testers for mobile app',
    body: `## Mobile App Beta - Testers Needed! 📱

We're looking for beta testers for our upcoming mobile app!

### What We Need
- 20-30 testers across iOS and Android
- Commitment: 2-3 hours/week for 4 weeks
- Provide feedback via our testing portal

### What You'll Get
- Early access to new features
- Direct input on product direction
- Beta tester badge on your profile
- Exclusive swag 👕

### Requirements
- iOS 15+ or Android 12+
- Stable internet connection
- Willingness to report bugs

### How to Apply
1. Fill out the form: [link]
2. We'll review applications by March 5
3. Selected testers notified by March 8
4. Beta starts March 20

Questions? Ask below!`,
    category: Category.Help,
    visibility: VisibilityScope.Organization,
    targetProjects: [],
    voteCount: 27,
    commentCount: 22,
    isPinned: false,
    tags: ['help-wanted'],
    author: DAN,
    createdDate: new Date('2026-02-22T13:00:00Z'),
    changedDate: new Date('2026-02-26T10:00:00Z'),
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  },
];

/**
 * Auto-incrementing ID for new discussions
 */
let nextId = Math.max(...mockDiscussions.map((d) => d.id)) + 1;

/**
 * Get the current user for mock data (Esmail as default)
 */
function getCurrentMockUser() {
  return MARCUS;
}

/**
 * Get a mock discussion by ID
 */
export function getMockDiscussionById(id: number): Discussion | null {
  return mockDiscussions.find((d) => d.id === id) || null;
}

/**
 * Add a new mock discussion
 */
export function addMockDiscussion(input: CreateDiscussionInput): Discussion {
  const now = new Date();
  const newDiscussion: Discussion = {
    id: nextId++,
    title: input.title,
    body: input.body,
    category: input.category,
    visibility: input.visibility,
    targetProjects: input.targetProjects || [],
    voteCount: 0,
    commentCount: 0,
    isPinned: false,
    tags: input.tags || [],
    author: getCurrentMockUser(),
    createdDate: now,
    changedDate: now,
    projectId: 'mock-project-id',
    projectName: 'mock-project',
    state: 'Active',
  };

  mockDiscussions.unshift(newDiscussion);
  return newDiscussion;
}

/**
 * Update a mock discussion
 */
export function updateMockDiscussion(
  id: number,
  updates: UpdateDiscussionInput
): Discussion | null {
  const index = mockDiscussions.findIndex((d) => d.id === id);
  if (index === -1) {
    return null;
  }

  const discussion = mockDiscussions[index];
  const updated: Discussion = {
    ...discussion,
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.body !== undefined && { body: updates.body }),
    ...(updates.visibility !== undefined && { visibility: updates.visibility }),
    ...(updates.targetProjects !== undefined && {
      targetProjects: updates.targetProjects,
    }),
    ...(updates.tags !== undefined && { tags: updates.tags }),
    ...(updates.isPinned !== undefined && { isPinned: updates.isPinned }),
    changedDate: new Date(),
  };

  mockDiscussions[index] = updated;
  return updated;
}

/**
 * Delete a mock discussion (soft delete)
 */
export function deleteMockDiscussion(id: number): boolean {
  const index = mockDiscussions.findIndex((d) => d.id === id);
  if (index === -1) {
    return false;
  }

  mockDiscussions[index].state = 'Removed';
  return true;
}

// Re-export users for backward compatibility
export { MOCK_USERS };
