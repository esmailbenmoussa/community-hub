# Community Hub for Azure DevOps

## Requirements Specification

**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Vision

Create a GitHub Discussions-like collaborative discussion platform natively within Azure DevOps, enabling teams to share announcements, gather feedback, discuss ideas, and build community around their projects.

### 1.2 Product Name

**Community Hub**

### 1.3 Key Objectives

- Provide a centralized discussion platform within Azure DevOps
- Enable project teams to communicate through announcements
- Foster collaboration through comments and voting
- Support both project-level and organization-level discussions
- Allow cross-project visibility for broader organizational collaboration

---

## 2. Scope & Access Levels

### 2.1 Project Level

| Aspect       | Description                                                            |
| ------------ | ---------------------------------------------------------------------- |
| **Location** | Top-level hub in ADO projects (same level as Boards, Repos, Pipelines) |
| **Scope**    | Discussions are scoped to a single project by default                  |
| **Access**   | Project team members have access based on project permissions          |

### 2.2 Organization Level

| Aspect        | Description                                                                |
| ------------- | -------------------------------------------------------------------------- |
| **Location**  | Accessible at the organization root level                                  |
| **View Type** | Aggregated view displaying organization-wide and cross-project discussions |
| **Content**   | Shows discussions the user has access to across all projects               |
| **Purpose**   | Enables cross-project collaboration and organizational visibility          |

---

## 3. Core Features

### 3.1 Navigation & Layout

| Component             | Description                                   |
| --------------------- | --------------------------------------------- |
| **Hub Location**      | Top-level navigation item in ADO project menu |
| **Sidebar**           | Left panel displaying discussion categories   |
| **Main Content Area** | Discussion list with topic rows               |
| **Topic Detail Page** | Full discussion view with comments            |

### 3.2 Categories

#### MVP (Phase 1)

| Category          | Description                                     | Create Permission   | Comment Permission |
| ----------------- | ----------------------------------------------- | ------------------- | ------------------ |
| **Announcements** | Official communications from project leadership | Project Admins only | All members        |

#### Future Phases

| Category                 | Description                      | Target Phase |
| ------------------------ | -------------------------------- | ------------ |
| **General**              | Open-ended discussions           | Phase 2      |
| **Ideas**                | Feature requests and suggestions | Phase 2      |
| **Help/Troubleshooting** | Bug reports and support requests | Phase 3      |

### 3.3 Discussion List View

#### Row Components

Each discussion row displays:

- **Upvote button** (left side) - upvote-only system
- **Topic title**
- **Category label**
- **Custom labels/tags** (if assigned)
- **Author avatar/name**
- **Timestamp** (created/last activity)
- **Comment count**
- **Pinned indicator** (for pinned discussions)

#### Sorting Options

| Sort            | Description                 |
| --------------- | --------------------------- |
| **Newest**      | Most recent first (default) |
| **Top voted**   | Most upvoted discussions    |
| **Most active** | Most commented discussions  |

#### Filtering Options

| Filter           | Description                 |
| ---------------- | --------------------------- |
| **By category**  | Filter to specific category |
| **By label/tag** | Filter by assigned labels   |

#### Search

- **Title search only** (MVP)
- Full-text search deferred to future phases

### 3.4 Discussion Detail Page

| Section              | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| **Header**           | Title, category, labels, author, timestamp, visibility scope |
| **Body**             | Full discussion content (Markdown rendered)                  |
| **Voting**           | Upvote count with vote button                                |
| **Actions**          | Pin (admin), Edit (author/admin), Delete (admin)             |
| **Comments Section** | Chronological discussion below main content                  |

### 3.5 Comment System

#### Comment Display

Each comment shows:

- Author avatar/name
- Timestamp
- Content (Markdown rendered)
- Edit/Delete options (author/admin)

#### Comment Features

- Chronological ordering
- Same Markdown support as main content
- Inline editing capability

---

## 4. Post Visibility & Exposure Settings

### 4.1 Visibility Scope Options

When creating a discussion, authors can choose the exposure level:

| Visibility            | Description                                   | Created From           |
| --------------------- | --------------------------------------------- | ---------------------- |
| **Project Only**      | Visible only within the current project       | Project Hub            |
| **Organization-wide** | Visible to all org members in aggregated view | Project Hub or Org Hub |
| **Cross-Project**     | Visible to selected specific projects         | Project Hub or Org Hub |

### 4.2 Visibility Rules

| Rule                  | Description                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| **Default**           | Project Only (safest default)                                                                  |
| **Organization-wide** | Appears in Org-level aggregated view for all org members; still "owned" by originating project |
| **Cross-Project**     | Author selects target projects; appears in selected projects' Community Hubs                   |
| **Permissions**       | Only users with appropriate permissions in target scope can set that visibility                |

### 4.3 UI Requirements for Visibility

- Visibility selector (dropdown/radio buttons) in post creation form
- Multi-select project picker for "Cross-Project" option
- Preview indicator showing "This post will be visible to: [scope]"
- Visual badge on discussion list indicating visibility scope

---

## 5. Content & Markdown Support

### 5.1 Standard Markdown

| Feature                     | Support |
| --------------------------- | ------- |
| Headers (H1-H6)             | Yes     |
| Bold, Italic, Strikethrough | Yes     |
| Ordered lists               | Yes     |
| Unordered lists             | Yes     |
| Blockquotes                 | Yes     |
| Code blocks (inline)        | Yes     |
| Code blocks (fenced)        | Yes     |
| Tables                      | Yes     |
| Horizontal rules            | Yes     |
| Links                       | Yes     |

### 5.2 Enhanced Features

| Feature                    | Description                               | Phase   |
| -------------------------- | ----------------------------------------- | ------- |
| **Syntax highlighting**    | Language-specific code coloring           | MVP     |
| **Image/file attachments** | Drag & drop upload support                | Phase 2 |
| **ADO @mentions**          | Link to users, triggers ADO notifications | Phase 3 |
| **ADO entity linking**     | Link to work items, PRs, commits, repos   | Phase 3 |

---

## 6. Voting System

### 6.1 Voting Type

**Upvote only** - Users can only give positive votes (no downvoting)

### 6.2 Voting Rules

| Rule                   | Description                                    |
| ---------------------- | ---------------------------------------------- |
| **One vote per user**  | Each user can upvote once per discussion       |
| **Toggle behavior**    | Clicking again removes the upvote              |
| **Vote count display** | Total upvote count visible on discussion       |
| **Voter visibility**   | Vote count public; individual voters not shown |

---

## 7. Moderation Features

| Feature              | Description                                  | Available To                      | Phase  |
| -------------------- | -------------------------------------------- | --------------------------------- | ------ |
| **Pinning**          | Pin important discussions to top of list     | Project Admins                    | MVP    |
| **Labels/Tags**      | Custom labels for organization and filtering | Admins (create), Authors (assign) | MVP    |
| **Locking**          | Prevent further comments on a discussion     | -                                 | Future |
| **Hiding/Archiving** | Soft delete inappropriate content            | -                                 | Future |

### 7.1 Label Management

| Action                         | Permission                        |
| ------------------------------ | --------------------------------- |
| Create labels                  | Project Admins                    |
| Edit labels                    | Project Admins                    |
| Delete labels                  | Project Admins                    |
| Assign labels to discussions   | Discussion author, Project Admins |
| Remove labels from discussions | Discussion author, Project Admins |

---

## 8. Permissions Model

### 8.1 Project-Level Permissions

| Action                                | All Members | Contributors | Project Admins |
| ------------------------------------- | :---------: | :----------: | :------------: |
| View discussions                      |     Yes     |     Yes      |      Yes       |
| Upvote                                |     Yes     |     Yes      |      Yes       |
| Comment on discussions                |     Yes     |     Yes      |      Yes       |
| Create General/Ideas/Help discussions |     No      |     Yes      |      Yes       |
| Create Announcements                  |     No      |      No      |      Yes       |
| Edit own content                      |     Yes     |     Yes      |      Yes       |
| Edit any content                      |     No      |      No      |      Yes       |
| Delete own content                    |     Yes     |     Yes      |      Yes       |
| Delete any content                    |     No      |      No      |      Yes       |
| Pin discussions                       |     No      |      No      |      Yes       |
| Manage labels                         |     No      |      No      |      Yes       |
| Set Organization-wide visibility      |     No      |      No      |      Yes       |
| Set Cross-Project visibility          |     No      |     Yes      |      Yes       |

### 8.2 Organization-Level Permissions

| Action                         | Org Members | Org Admins |
| ------------------------------ | :---------: | :--------: |
| View aggregated discussions    |     Yes     |    Yes     |
| Create org-level announcements |     No      |    Yes     |
| Create org-level discussions   |     Yes     |    Yes     |
| Manage org-level labels        |     No      |    Yes     |
| Pin org-level discussions      |     No      |    Yes     |

### 8.3 Visibility & Access Control

- Users only see discussions from projects they have access to
- Organization-wide posts visible to all organization members
- Cross-project posts visible only to members of selected projects

---

## 9. User Stories

### 9.1 MVP User Stories (Phase 1)

| ID    | As a...       | I want to...                              | So that...                                         | Priority |
| ----- | ------------- | ----------------------------------------- | -------------------------------------------------- | -------- |
| US-01 | Project Admin | Create an announcement                    | I can communicate important information to my team | High     |
| US-02 | Team Member   | View announcements in my project          | I stay informed about project updates              | High     |
| US-03 | Team Member   | Comment on announcements                  | I can ask questions or provide feedback            | High     |
| US-04 | Team Member   | Upvote a discussion                       | I can show agreement or acknowledgment             | High     |
| US-05 | Project Admin | Pin an announcement                       | Important items stay visible at the top            | High     |
| US-06 | Project Admin | Add labels to discussions                 | I can organize and categorize content              | Medium   |
| US-07 | Team Member   | Filter discussions by label               | I can find relevant content quickly                | Medium   |
| US-08 | Team Member   | Sort discussions by newest/votes/activity | I can view content in my preferred order           | Medium   |
| US-09 | Team Member   | Search discussion titles                  | I can find specific topics                         | Medium   |
| US-10 | Project Admin | Set post visibility to organization-wide  | Important announcements reach the whole org        | High     |
| US-11 | Project Admin | Set post visibility to cross-project      | I can share information with related projects      | Medium   |

### 9.2 Organization-Level User Stories

| ID    | As a...    | I want to...                                     | So that...                                       | Priority |
| ----- | ---------- | ------------------------------------------------ | ------------------------------------------------ | -------- |
| US-12 | Org Member | View aggregated discussions from all my projects | I have a single view of all relevant discussions | High     |
| US-13 | Org Admin  | Create organization-wide announcements           | I can communicate to the entire organization     | High     |
| US-14 | Org Admin  | Pin discussions at the org level                 | Important org-wide content stays visible         | Medium   |
| US-15 | Org Member | Filter aggregated view by project                | I can focus on specific project discussions      | Medium   |

### 9.3 Future Phase User Stories

| ID    | As a...     | I want to...                      | So that...                                   | Phase |
| ----- | ----------- | --------------------------------- | -------------------------------------------- | ----- |
| US-16 | Contributor | Create a general discussion       | I can start open-ended conversations         | 2     |
| US-17 | Contributor | Submit an idea/feature request    | I can suggest improvements                   | 2     |
| US-18 | Team Member | Attach images to my posts         | I can provide visual context                 | 2     |
| US-19 | Team Member | @mention colleagues               | They get notified and can respond            | 3     |
| US-20 | Team Member | Link to work items in discussions | I can reference related work                 | 3     |
| US-21 | Team Member | Ask for help/troubleshooting      | I can get support from my team               | 3     |
| US-22 | Team Member | Search full discussion content    | I can find topics by content, not just title | 3     |

---

## 10. Phased Delivery Plan

### Phase 1 - MVP

**Focus:** Core functionality with Announcements

| Feature                                        | Included |
| ---------------------------------------------- | -------- |
| Project-level Community Hub                    | Yes      |
| Announcements category                         | Yes      |
| Upvoting system                                | Yes      |
| Comments with Markdown                         | Yes      |
| Pinning discussions                            | Yes      |
| Labels/Tags                                    | Yes      |
| Basic sorting (newest, top voted, most active) | Yes      |
| Filtering by label                             | Yes      |
| Title search                                   | Yes      |
| Post visibility settings                       | Yes      |
| Syntax highlighting in code blocks             | Yes      |

### Phase 2 - Enhanced Content & Categories

**Focus:** More categories and richer content

| Feature                            | Included |
| ---------------------------------- | -------- |
| Organization-level aggregated view | Yes      |
| General discussions category       | Yes      |
| Ideas category                     | Yes      |
| Image/file attachments             | Yes      |
| Cross-project visibility           | Yes      |

### Phase 3 - Integration & Advanced Features

**Focus:** Deep ADO integration and discoverability

| Feature                         | Included |
| ------------------------------- | -------- |
| Help/Troubleshooting category   | Yes      |
| ADO @mentions integration       | Yes      |
| ADO work item/PR/commit linking | Yes      |
| Full-text search                | Yes      |
| Notification subscriptions      | Yes      |

---

## 11. Non-Functional Requirements

### 11.1 Performance

| Requirement                 | Target        |
| --------------------------- | ------------- |
| Discussion list load time   | < 2 seconds   |
| Discussion detail page load | < 1.5 seconds |
| Search response time        | < 1 second    |
| Comment submission          | < 500ms       |

### 11.2 Scalability

| Metric                       | Expected Range |
| ---------------------------- | -------------- |
| Discussions per project      | Up to 10,000   |
| Comments per discussion      | Up to 500      |
| Concurrent users per project | Up to 100      |

### 11.3 Availability

- Target availability: 99.5% uptime
- Graceful degradation when ADO services are unavailable

### 11.4 Security

- All actions require Azure DevOps authentication
- Respect existing ADO project and organization permissions
- No elevation of privileges through the extension
- Secure storage of discussion data

### 11.5 Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast

---

## 12. Technical Architecture Decisions

### 12.1 Architecture Overview

| Component              | Technology                              | Rationale                                                   |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------- |
| **Discussion Storage** | Custom Work Item Type (`Discussion`)    | WIQL queries, cross-project support, native ADO integration |
| **Comment Storage**    | Native Work Item Comments API           | Built-in, no custom type needed, supports markdown          |
| **Vote Storage**       | Extension Data Service (user-scoped)    | Lightweight, per-user tracking                              |
| **Label Storage**      | Extension Data Service (project-scoped) | Flexible, admin-managed                                     |
| **Process Setup**      | Manual admin configuration              | Extension validates configuration exists                    |

### 12.2 Setup Approach

The extension uses a **validation-based setup** approach:

1. Admin manually creates an inherited process in ADO Settings
2. Admin adds `Discussion` Work Item Type with required custom fields
3. Admin applies the process to target project(s)
4. Extension's Setup Wizard **validates** configuration exists
5. If validation passes, the hub is enabled

### 12.3 Discussion Work Item Type - Required Fields

Administrators must create the following custom fields on the `Discussion` Work Item Type:

| Field Name      | Reference Name                | Type               | Values/Notes                                           |
| --------------- | ----------------------------- | ------------------ | ------------------------------------------------------ |
| Category        | `CommunityHub.Category`       | Picklist           | Announcements (MVP), General, Ideas, Help (future)     |
| Visibility      | `CommunityHub.Visibility`     | Picklist           | Project, Organization, CrossProject                    |
| Target Projects | `CommunityHub.TargetProjects` | String (multiline) | JSON array of project IDs for cross-project visibility |
| Vote Count      | `CommunityHub.VoteCount`      | Integer            | Default: 0. Cached count of upvotes                    |
| Is Pinned       | `CommunityHub.IsPinned`       | Boolean            | Default: false. Pinned discussions appear at top       |
| Labels          | `CommunityHub.Labels`         | String (multiline) | JSON array of label names assigned to discussion       |

### 12.4 Required OAuth Scopes

| Scope            | Purpose                                       |
| ---------------- | --------------------------------------------- |
| `vso.work_write` | Create, read, update Work Items (discussions) |
| `vso.project`    | Read project information                      |
| `vso.profile`    | Read user profile for permissions             |

### 12.5 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Community Hub UI                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  Discussion  │ │   Comment    │ │    Vote      │
        │   Service    │ │   Service    │ │   Service    │
        └──────────────┘ └──────────────┘ └──────────────┘
                │               │               │
                ▼               ▼               ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  Work Item   │ │  WI Comments │ │  Extension   │
        │     API      │ │     API      │ │ Data Service │
        │   (WIQL)     │ │              │ │ (user-scoped)│
        └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 13. Resolved Technical Questions

| #   | Topic                        | Status   | Resolution                                                                                                 |
| --- | ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | **Data Storage**             | Resolved | Custom `Discussion` Work Item Type with manual process setup by admin                                      |
| 2   | **Attachment Storage**       | Deferred | Phase 2 - will use Work Item Attachments API                                                               |
| 3   | **API Design**               | Resolved | Work Item API for discussions, native Comments API for comments, Extension Data Service for votes/labels   |
| 4   | **Cross-project visibility** | Resolved | Configurable per-post with Project/Org/Cross-Project options stored in `CommunityHub.TargetProjects` field |
| 5   | **Performance & Scale**      | Resolved | WIQL pagination (TOP + skip), client-side caching, lazy loading                                            |

---

## 14. Success Metrics

| Metric                | Description                             | Target                  |
| --------------------- | --------------------------------------- | ----------------------- |
| **Adoption Rate**     | % of projects enabling Community Hub    | 50% within 6 months     |
| **Active Users**      | Monthly active users posting/commenting | Growth month-over-month |
| **Engagement**        | Average comments per discussion         | > 3 comments            |
| **User Satisfaction** | User feedback score                     | > 4.0/5.0               |

---

## 15. Appendix

### 15.1 Glossary

| Term                 | Definition                                                           |
| -------------------- | -------------------------------------------------------------------- |
| **Discussion**       | A topic/post created in Community Hub                                |
| **Category**         | A classification type for discussions (e.g., Announcements, Ideas)   |
| **Label/Tag**        | Custom metadata applied to discussions for organization              |
| **Visibility Scope** | The exposure setting determining who can see a discussion            |
| **Hub**              | The main Community Hub interface/page                                |
| **Aggregated View**  | Organization-level view combining discussions from multiple projects |

### 15.2 Reference

- [GitHub Discussions Documentation](https://docs.github.com/en/discussions)
- [Azure DevOps Extension SDK](https://docs.microsoft.com/en-us/azure/devops/extend/)

---

## Document History

| Version | Date          | Author | Changes                                             |
| ------- | ------------- | ------ | --------------------------------------------------- |
| 1.0     | February 2026 | -      | Initial requirements specification                  |
| 1.1     | February 2026 | -      | Added technical architecture decisions (Section 12) |
