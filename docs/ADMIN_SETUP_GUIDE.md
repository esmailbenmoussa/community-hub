# Community Hub - Administrator Setup Guide

This guide walks administrators through the process of configuring their Azure DevOps project to use Community Hub.

## Prerequisites

- **Organization Administrator** or **Project Collection Administrator** permissions
- Access to Organization Settings in Azure DevOps

## Overview

Community Hub uses a custom Work Item Type called "Discussion" to store discussions. This requires:

1. Creating an inherited process template
2. Adding the Discussion Work Item Type
3. Adding required custom fields
4. Applying the process to your project(s)

## Step-by-Step Setup

### Step 1: Create an Inherited Process

1. Go to **Organization Settings** (gear icon in bottom left)
2. Navigate to **Boards** → **Process**
3. Find your base process (Agile, Scrum, or Basic)
4. Click the **...** menu and select **Create inherited process**
5. Name it something like "Community Hub Process" or "[Your Org] Process"
6. Click **Create process**

![Create inherited process](screenshots/create-process.png)

### Step 2: Add the Discussion Work Item Type

1. Open your newly created inherited process
2. Click **+ New work item type**
3. Configure the new Work Item Type:
   - **Name**: `Discussion`
   - **Description**: `Community Hub discussion thread`
   - **Icon**: Choose the chat/discussion icon
   - **Color**: Choose a color (recommended: `#009CCC`)
4. Click **Create**

![Add work item type](screenshots/add-wit.png)

### Step 3: Add Required Custom Fields

Add each of the following fields to the Discussion Work Item Type:

#### 3.1 Category Field

1. In the Discussion Work Item Type, click **New field**
2. Configure:
   - **Create a field**: Selected
   - **Name**: `Category`
   - **Type**: `Picklist (string)`
3. Click **Add**
4. After adding, click on the field to edit
5. Add picklist values:
   - `Announcements`
   - `General` (for future use)
   - `Ideas` (for future use)
   - `Help` (for future use)
6. Set **Default value**: `Announcements`

> **Reference Name**: `Custom.Category`

#### 3.2 Visibility Field

1. Click **New field**
2. Configure:
   - **Name**: `Visibility`
   - **Type**: `Picklist (string)`
3. Add picklist values:
   - `Project`
   - `Organization`
   - `CrossProject`
4. Set **Default value**: `Project`

> **Reference Name**: `Custom.Visibility`

#### 3.3 Target Projects Field

1. Click **New field**
2. Configure:
   - **Name**: `TargetProjects`
   - **Type**: `Text (multiple lines)`
3. Leave default value empty

> **Reference Name**: `Custom.TargetProjects`
>
> This field stores a JSON array of project IDs for cross-project visibility.

#### 3.4 Vote Count Field

1. Click **New field**
2. Configure:
   - **Name**: `VoteCount`
   - **Type**: `Integer`
3. Set **Default value**: `0`

> **Reference Name**: `Custom.VoteCount`

#### 3.5 Is Pinned Field

1. Click **New field**
2. Configure:
   - **Name**: `IsPinned`
   - **Type**: `Boolean`
3. Set **Default value**: `False`

> **Reference Name**: `Custom.IsPinned`

#### 3.6 Labels Field

1. Click **New field**
2. Configure:
   - **Name**: `Labels`
   - **Type**: `Text (multiple lines)`
3. Leave default value empty

> **Reference Name**: `Custom.Labels`
>
> This field stores a JSON array of label names.

### Step 4: Configure the Layout (Optional)

You can customize the Discussion Work Item layout:

1. In the Discussion Work Item Type, click **Layout**
2. Create a new group called "Community Hub"
3. Drag the custom fields into this group
4. Hide fields from the main form that users don't need to see directly (like `Vote Count`, `Is Pinned`)

### Step 5: Apply Process to Project

1. Go back to **Organization Settings** → **Boards** → **Process**
2. Click on your inherited process
3. Click the **Projects** tab
4. Click **+ Add project**
5. Select the project(s) you want to enable Community Hub for
6. Click **Add**

> **Note**: Changing a project's process may affect existing Work Item Types and queries. Review the impact before proceeding.

## Field Reference Table

| Field Name     | Reference Name          | Type         | Required | Default       | Purpose                          |
| -------------- | ----------------------- | ------------ | -------- | ------------- | -------------------------------- |
| Category       | `Custom.Category`       | Picklist     | Yes      | Announcements | Discussion category              |
| Visibility     | `Custom.Visibility`     | Picklist     | Yes      | Project       | Who can see the discussion       |
| TargetProjects | `Custom.TargetProjects` | Text (multi) | No       | Empty         | Cross-project visibility targets |
| VoteCount      | `Custom.VoteCount`      | Integer      | No       | 0             | Cached upvote count              |
| IsPinned       | `Custom.IsPinned`       | Boolean      | No       | False         | Pin discussion to top            |
| Labels         | `Custom.Labels`         | Text (multi) | No       | Empty         | Custom labels (JSON array)       |

## Verification

After completing the setup:

1. Navigate to Community Hub in your project
2. The extension will automatically validate your configuration
3. If all checks pass, you're ready to use Community Hub!

### Validation Checks

The extension validates:

- ✅ Project uses an inherited (not system) process
- ✅ Discussion Work Item Type exists
- ✅ All required fields exist with correct types

## Troubleshooting

### "Project uses a system process"

You need to create an inherited process. System processes (Agile, Scrum, Basic) cannot be customized.

### "Discussion Work Item Type not found"

Make sure you:

1. Created the Work Item Type with exactly the name `Discussion`
2. The Work Item Type is not disabled
3. The correct process is applied to the project

### "Field [name] not found"

Ensure the field:

1. Was added to the Discussion Work Item Type (not just the process)
2. Has the correct reference name (starts with `Custom.`)
3. Has the correct type

### "Field type mismatch"

The field was created with the wrong type. You may need to:

1. Delete the existing field
2. Re-create it with the correct type

> **Warning**: Deleting fields may cause data loss if they contain values.

## Multi-Project Setup

If you want to enable Community Hub for multiple projects:

1. Apply the same inherited process to all projects, OR
2. Create a separate inherited process for each project with the same field configuration

Using a single process is recommended as it:

- Ensures consistent configuration
- Makes updates easier
- Enables cross-project queries

## Need Help?

If you encounter issues during setup:

1. Check the browser console for detailed error messages
2. Verify all field reference names match exactly (case-sensitive)
3. Ensure you have the required permissions
4. Contact your Azure DevOps administrator

---

**Version**: 1.0  
**Last Updated**: February 2026
