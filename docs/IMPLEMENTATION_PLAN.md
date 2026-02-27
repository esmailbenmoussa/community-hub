# Community Hub - Implementation Plan

**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Approved

---

## Architecture Decisions

| Decision               | Choice                                  | Rationale                                                   |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------- |
| **Process Setup**      | Manual setup by admin, wizard validates | Simpler, no Process API complexity                          |
| **Discussion Storage** | Custom Work Item Type (`Discussion`)    | WIQL queries, cross-project support, native ADO integration |
| **Comment Storage**    | Native Work Item Comments API           | Built-in, no custom type needed, supports markdown          |
| **Vote Storage**       | Extension Data Service (user-scoped)    | Lightweight, per-user tracking                              |
| **Label Storage**      | Extension Data Service (project-scoped) | Flexible, admin-managed                                     |

### Setup Flow

1. Admin manually creates inherited process in ADO Settings
2. Admin adds `Discussion` Work Item Type with required custom fields
3. Admin applies process to project(s)
4. Extension's Setup Wizard **validates** configuration exists
5. If validation passes → Hub is enabled

---

## Phase 1: Foundation & Setup Validation

**Duration:** ~1 week

### 1.1 Project Configuration

- [ ] Update `vss-extension.json` with hub contributions
- [ ] Configure OAuth scopes (`vso.work_write`, `vso.project`, `vso.profile`)
- [ ] Set up TypeScript types for Discussion fields
- [ ] Configure Tailwind theme tokens (GitHub Discussions-like)
- [ ] Set up project structure following Atomic Design

### 1.2 Setup Validation Wizard

- [ ] Create `SetupWizard` component (multi-step UI)
- [ ] Implement `ValidationService`:
  - [ ] Check project's process template
  - [ ] Validate `Discussion` Work Item Type exists
  - [ ] Validate required custom fields exist
  - [ ] Validate field types are correct
- [ ] Display clear error messages for missing configuration
- [ ] Store validation status in Extension Data Service
- [ ] Create "Setup Complete" success state

### 1.3 Admin Setup Documentation

Create setup guide documenting the manual configuration:

**Discussion Work Item Type - Required Fields:**

| Field Name      | Reference Name                | Type               | Values/Notes                        |
| --------------- | ----------------------------- | ------------------ | ----------------------------------- |
| Category        | `CommunityHub.Category`       | Picklist           | Announcements                       |
| Visibility      | `CommunityHub.Visibility`     | Picklist           | Project, Organization, CrossProject |
| Target Projects | `CommunityHub.TargetProjects` | String (multiline) | JSON array of project IDs           |
| Vote Count      | `CommunityHub.VoteCount`      | Integer            | Default: 0                          |
| Is Pinned       | `CommunityHub.IsPinned`       | Boolean            | Default: false                      |
| Labels          | `CommunityHub.Labels`         | String (multiline) | JSON array of label names           |

### 1.4 Deliverables

- Updated `vss-extension.json`
- TypeScript types (`src/types/discussion.ts`, `src/types/comment.ts`)
- `ValidationService` (`src/services/validation.service.ts`)
- `SetupWizard` component (`src/components/organisms/SetupWizard/`)
- `SetupPage` (`src/components/pages/SetupPage/`)
- Admin setup guide (`docs/ADMIN_SETUP_GUIDE.md`)

---

## Phase 2: Core Services Layer

**Duration:** ~1 week

### 2.1 Discussion Service

```typescript
interface DiscussionService {
  create(discussion: CreateDiscussionInput): Promise<Discussion>;
  get(id: number): Promise<Discussion>;
  update(id: number, updates: UpdateDiscussionInput): Promise<Discussion>;
  delete(id: number): Promise<void>;
  list(options: ListOptions): Promise<PaginatedResult<Discussion>>;
  search(
    title: string,
    options: ListOptions
  ): Promise<PaginatedResult<Discussion>>;
  pin(id: number, pinned: boolean): Promise<Discussion>;
  setLabels(id: number, labels: string[]): Promise<Discussion>;
}
```

**Implementation Tasks:**

- [ ] Create `DiscussionService` class
- [ ] Implement WIQL query builder for list/search
- [ ] Implement Work Item creation with custom fields
- [ ] Implement pagination logic
- [ ] Add caching layer for performance

### 2.2 Comment Service

Uses native Work Item Comments API (`/wit/workitems/{id}/comments`).

```typescript
interface CommentService {
  getComments(discussionId: number): Promise<Comment[]>;
  addComment(discussionId: number, content: string): Promise<Comment>;
  updateComment(
    discussionId: number,
    commentId: number,
    content: string
  ): Promise<Comment>;
  deleteComment(discussionId: number, commentId: number): Promise<void>;
}
```

**Implementation Tasks:**

- [ ] Create `CommentService` class
- [ ] Implement GET comments endpoint
- [ ] Implement POST comment endpoint
- [ ] Implement PATCH comment endpoint
- [ ] Implement DELETE comment endpoint

### 2.3 Vote Service

Uses Extension Data Service (user-scoped collection).

```typescript
interface VoteService {
  upvote(discussionId: number): Promise<void>;
  removeVote(discussionId: number): Promise<void>;
  hasVoted(discussionId: number): Promise<boolean>;
  getUserVotes(discussionIds: number[]): Promise<Set<number>>;
}
```

**Implementation Tasks:**

- [ ] Create `VoteService` class
- [ ] Implement user-scoped vote storage
- [ ] Implement vote count sync to Discussion Work Item
- [ ] Add optimistic update support

### 2.4 Permission Service

```typescript
interface PermissionService {
  canCreateAnnouncement(): Promise<boolean>;
  canCreateDiscussion(category: Category): Promise<boolean>;
  canEdit(discussion: Discussion): Promise<boolean>;
  canDelete(discussion: Discussion): Promise<boolean>;
  canPin(): Promise<boolean>;
  canSetVisibility(scope: VisibilityScope): Promise<boolean>;
  isProjectAdmin(): Promise<boolean>;
}
```

**Implementation Tasks:**

- [ ] Create `PermissionService` class
- [ ] Implement ADO security namespace checks
- [ ] Cache permission results per session

### 2.5 Label Service

```typescript
interface LabelService {
  getLabels(): Promise<Label[]>;
  createLabel(label: CreateLabelInput): Promise<Label>;
  updateLabel(id: string, updates: UpdateLabelInput): Promise<Label>;
  deleteLabel(id: string): Promise<void>;
}
```

**Implementation Tasks:**

- [ ] Create `LabelService` class
- [ ] Implement Extension Data Service collection for labels
- [ ] Add color and name validation

### 2.6 Deliverables

- `src/services/discussion.service.ts`
- `src/services/comment.service.ts`
- `src/services/vote.service.ts`
- `src/services/permission.service.ts`
- `src/services/label.service.ts`
- `src/services/validation.service.ts` (from Phase 1)
- `src/utils/wiql.ts` (WIQL query builder)
- Unit tests for all services

---

## Phase 3: UI Components

**Duration:** ~1.5 weeks

### 3.1 Atoms

| Component          | Description                              | File                      |
| ------------------ | ---------------------------------------- | ------------------------- |
| `VoteButton`       | Upvote arrow with count, toggle state    | `atoms/VoteButton/`       |
| `CategoryBadge`    | Colored pill for category                | `atoms/CategoryBadge/`    |
| `LabelTag`         | Custom label chip with color             | `atoms/LabelTag/`         |
| `VisibilityBadge`  | Icon + text for visibility scope         | `atoms/VisibilityBadge/`  |
| `PinnedIndicator`  | Pin icon indicator                       | `atoms/PinnedIndicator/`  |
| `Avatar`           | User avatar with fallback                | `atoms/Avatar/`           |
| `Timestamp`        | Relative time display                    | `atoms/Timestamp/`        |
| `MarkdownRenderer` | Render markdown with syntax highlighting | `atoms/MarkdownRenderer/` |
| `Button`           | Styled button variants                   | `atoms/Button/`           |
| `Input`            | Text input field                         | `atoms/Input/`            |
| `Textarea`         | Multiline text input                     | `atoms/Textarea/`         |
| `Dropdown`         | Select dropdown                          | `atoms/Dropdown/`         |

### 3.2 Molecules

| Component            | Description                      | File                            |
| -------------------- | -------------------------------- | ------------------------------- |
| `DiscussionRow`      | Full row for list view           | `molecules/DiscussionRow/`      |
| `DiscussionHeader`   | Detail page header with actions  | `molecules/DiscussionHeader/`   |
| `CommentCard`        | Single comment display           | `molecules/CommentCard/`        |
| `CommentEditor`      | Markdown textarea with preview   | `molecules/CommentEditor/`      |
| `SearchBar`          | Title search input               | `molecules/SearchBar/`          |
| `SortDropdown`       | Newest/Top/Active selector       | `molecules/SortDropdown/`       |
| `FilterPanel`        | Category + label filters         | `molecules/FilterPanel/`        |
| `VisibilitySelector` | Visibility dropdown with options | `molecules/VisibilitySelector/` |
| `ProjectPicker`      | Multi-select for cross-project   | `molecules/ProjectPicker/`      |
| `EmptyState`         | Empty list state with CTA        | `molecules/EmptyState/`         |
| `LoadingState`       | Skeleton loaders                 | `molecules/LoadingState/`       |

### 3.3 Organisms

| Component          | Description                            | File                          |
| ------------------ | -------------------------------------- | ----------------------------- |
| `DiscussionList`   | Full list with filters/sort/pagination | `organisms/DiscussionList/`   |
| `DiscussionDetail` | Full discussion view                   | `organisms/DiscussionDetail/` |
| `DiscussionForm`   | Create/Edit discussion form            | `organisms/DiscussionForm/`   |
| `CommentSection`   | Comments list + new comment editor     | `organisms/CommentSection/`   |
| `SetupWizard`      | Setup validation steps                 | `organisms/SetupWizard/`      |
| `LabelManager`     | Admin label CRUD interface             | `organisms/LabelManager/`     |
| `Sidebar`          | Navigation sidebar with categories     | `organisms/Sidebar/`          |

### 3.4 Pages

| Component            | Description              | Route                  | File                        |
| -------------------- | ------------------------ | ---------------------- | --------------------------- |
| `HubPage`            | Main discussion list     | `/`                    | `pages/HubPage/`            |
| `DiscussionPage`     | Single discussion detail | `/discussion/:id`      | `pages/DiscussionPage/`     |
| `NewDiscussionPage`  | Create discussion form   | `/new`                 | `pages/NewDiscussionPage/`  |
| `EditDiscussionPage` | Edit discussion form     | `/discussion/:id/edit` | `pages/EditDiscussionPage/` |
| `SetupPage`          | Setup validation wizard  | `/setup`               | `pages/SetupPage/`          |
| `SettingsPage`       | Admin settings (labels)  | `/settings`            | `pages/SettingsPage/`       |

### 3.5 Deliverables

- All atom components with tests
- All molecule components with tests
- All organism components with tests
- All page components
- Storybook stories for each component (optional)

---

## Phase 4: Project Hub Integration

**Duration:** ~1 week

### 4.1 Hub Registration

- [ ] Register `community-hub` in `vss-extension.json`
- [ ] Create hub group "Community" at project level
- [ ] Configure contribution points
- [ ] Set up React Router for internal navigation

**vss-extension.json contributions:**

```json
{
  "contributions": [
    {
      "id": "community-hub-group",
      "type": "ms.vss-web.hub-group",
      "targets": ["ms.vss-web.project-hub-groups-collection"],
      "properties": {
        "name": "Community",
        "order": 100
      }
    },
    {
      "id": "community-hub",
      "type": "ms.vss-web.hub",
      "targets": [".community-hub-group"],
      "properties": {
        "name": "Discussions",
        "uri": "dist/index.html"
      }
    }
  ]
}
```

### 4.2 State Management (Jotai)

| Atom                    | Description                               |
| ----------------------- | ----------------------------------------- |
| `discussionsAtom`       | Paginated discussion list                 |
| `currentDiscussionAtom` | Selected discussion with comments         |
| `filtersAtom`           | Active filters (category, labels, search) |
| `sortAtom`              | Current sort option                       |
| `userVotesAtom`         | Set of discussion IDs user has voted on   |
| `setupStatusAtom`       | Setup validation status                   |
| `labelsAtom`            | Available labels for project              |
| `currentUserAtom`       | Current user info                         |
| `permissionsAtom`       | Cached permissions                        |

### 4.3 Custom Hooks

| Hook                            | Purpose                             |
| ------------------------------- | ----------------------------------- |
| `useDiscussions(filters, sort)` | Fetch paginated discussions         |
| `useDiscussion(id)`             | Fetch single discussion             |
| `useComments(discussionId)`     | Fetch comments for discussion       |
| `useVote(discussionId)`         | Vote/unvote with optimistic updates |
| `usePermissions()`              | Check user permissions              |
| `useSetupValidation()`          | Check and run setup validation      |
| `useLabels()`                   | Fetch and manage labels             |
| `useCreateDiscussion()`         | Create discussion mutation          |
| `useUpdateDiscussion()`         | Update discussion mutation          |
| `useDeleteDiscussion()`         | Delete discussion mutation          |

### 4.4 Core Features Implementation

- [ ] Discussion list with pagination (infinite scroll or pages)
- [ ] Create Announcement flow (Admin only for MVP)
- [ ] View discussion with full detail
- [ ] Comments list with add/edit/delete
- [ ] Upvote/remove vote with optimistic UI
- [ ] Pin/unpin discussions
- [ ] Assign/remove labels
- [ ] Title search
- [ ] Sort by Newest/Top Voted/Most Active
- [ ] Filter by category
- [ ] Filter by label

### 4.5 Deliverables

- Updated `vss-extension.json`
- Jotai atoms (`src/store/atoms.ts`)
- Custom hooks (`src/hooks/`)
- Integrated pages with routing
- Working project-level hub

---

## Phase 5: Organization Hub & Cross-Project

**Duration:** ~1 week

### 5.1 Organization Hub

- [ ] Register org-level hub in `collection-admin-hub-group`
- [ ] Implement cross-project WIQL queries
- [ ] Build aggregated view component
- [ ] Add project filter dropdown
- [ ] Handle permission filtering (only show accessible projects)

**vss-extension.json addition:**

```json
{
  "id": "community-hub-org",
  "type": "ms.vss-web.hub",
  "targets": ["ms.vss-web.collection-admin-hub-group"],
  "properties": {
    "name": "Community Hub",
    "uri": "dist/index.html?org=true"
  }
}
```

### 5.2 Cross-Project Visibility

- [ ] Implement visibility selector in discussion form
- [ ] Build project picker component (multi-select)
- [ ] Store target projects in `CommunityHub.TargetProjects` field
- [ ] Modify WIQL queries to include cross-project discussions
- [ ] Add visibility badge to discussion rows

### 5.3 Organization-wide Visibility

- [ ] Implement org-wide visibility option
- [ ] Permission check: only admins can set org-wide
- [ ] Aggregated view shows all org-wide discussions
- [ ] Visual indicator for org-wide posts

### 5.4 Deliverables

- Org-level hub registration
- `OrgHubPage` component
- Cross-project query utilities
- Project picker component
- Visibility selector component
- Updated discussion form with visibility options

---

## Phase 6: Polish & Release

**Duration:** ~1 week

### 6.1 UI/UX Polish

- [ ] Match GitHub Discussions visual style
- [ ] Loading states (skeleton loaders)
- [ ] Empty states with helpful CTAs
- [ ] Error states with retry options
- [ ] Toast notifications for actions
- [ ] ADO theme integration (light/dark mode)
- [ ] Responsive design for different viewports
- [ ] Keyboard navigation support
- [ ] Focus management for accessibility

### 6.2 Testing

- [ ] Unit tests for all services (>80% coverage)
- [ ] Unit tests for utility functions
- [ ] Component tests with React Testing Library
- [ ] Hook tests
- [ ] Integration tests with mocked ADO SDK
- [ ] Manual E2E testing checklist

### 6.3 Documentation

- [ ] `README.md` - Extension overview
- [ ] `docs/ADMIN_SETUP_GUIDE.md` - Manual process configuration
- [ ] `docs/USER_GUIDE.md` - End user documentation
- [ ] Inline code documentation
- [ ] Marketplace listing content

### 6.4 Deployment

- [ ] CI/CD pipeline (GitHub Actions)
  - Build
  - Test
  - Package extension (.vsix)
  - Publish to marketplace (manual trigger)
- [ ] Version 1.0.0 release
- [ ] Marketplace listing with screenshots

### 6.5 Deliverables

- Polished UI matching GitHub Discussions
- Comprehensive test suite
- Documentation files
- CI/CD pipeline configuration
- Marketplace-ready extension package

---

## Timeline Summary

| Phase     | Focus                         | Duration       | Cumulative |
| --------- | ----------------------------- | -------------- | ---------- |
| **1**     | Foundation & Setup Validation | ~1 week        | Week 1     |
| **2**     | Core Services Layer           | ~1 week        | Week 2     |
| **3**     | UI Components                 | ~1.5 weeks     | Week 3-4   |
| **4**     | Project Hub Integration       | ~1 week        | Week 4-5   |
| **5**     | Org Hub & Cross-Project       | ~1 week        | Week 5-6   |
| **6**     | Polish & Release              | ~1 week        | Week 6-7   |
| **Total** |                               | **~6.5 weeks** |            |

---

## Risk Mitigation

| Risk                                      | Mitigation                                          |
| ----------------------------------------- | --------------------------------------------------- |
| Process template not configured correctly | Clear validation messages, detailed setup guide     |
| Work Item Comments API limitations        | Test early, have fallback to Extension Data Service |
| Cross-project query performance           | Implement caching, pagination, lazy loading         |
| ADO SDK version compatibility             | Pin SDK version, test across ADO versions           |
| Permission edge cases                     | Comprehensive permission service with fallbacks     |

---

## Success Criteria

### Phase 1 Complete When:

- Setup wizard validates configuration correctly
- Clear error messages for missing fields
- Admin setup guide is complete and accurate

### Phase 2 Complete When:

- All services have >80% test coverage
- CRUD operations work for discussions and comments
- Voting persists and syncs correctly

### Phase 3 Complete When:

- All components render correctly
- Components match GitHub Discussions style
- Components are accessible (keyboard, screen reader)

### Phase 4 Complete When:

- Hub appears in project navigation
- All core features functional
- Users can create, view, vote, comment on discussions

### Phase 5 Complete When:

- Org hub shows aggregated discussions
- Cross-project visibility works correctly
- Permission checks prevent unauthorized access

### Phase 6 Complete When:

- All tests pass
- Documentation is complete
- Extension is published to marketplace

---

## Document History

| Version | Date          | Author | Changes                     |
| ------- | ------------- | ------ | --------------------------- |
| 1.0     | February 2026 | -      | Initial implementation plan |
