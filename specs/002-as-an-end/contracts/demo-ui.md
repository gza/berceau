# Demo Component UI Specification

**Feature**: `002-as-an-end` | **Date**: 2025-10-21

## Overview

The demo component demonstrates component-level database integration with a simple UI showing CRUD operations using the centralized Prisma Client. The UI is server-side rendered using JSX and displays posts with basic add/delete functionality.

## UI Components

### Main Page: Post List with Add Form

**URL**: `/demo` or `/demo/posts`

**Layout**:
```
┌─────────────────────────────────────┐
│  Demo: Database Integration         │
├─────────────────────────────────────┤
│                                      │
│  Add New Post                        │
│  ┌────────────────────────────────┐ │
│  │ Title: [___________________]    │ │
│  │ Content: [_________________]    │ │
│  │          [_________________]    │ │
│  │          [_________________]    │ │
│  │ Author: [___________________]   │ │
│  │         [Add Post]              │ │
│  └────────────────────────────────┘ │
│                                      │
│  Posts                               │
│  ┌────────────────────────────────┐ │
│  │ Post Title 1                    │ │
│  │ by Author Name                  │ │
│  │ Content preview here...         │ │
│  │ Created: 2025-10-21             │ │
│  │                    [Delete]     │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ Post Title 2                    │ │
│  │ by Author Name                  │ │
│  │ Content preview here...         │ │
│  │ Created: 2025-10-21             │ │
│  │                    [Delete]     │ │
│  └────────────────────────────────┘ │
│                                      │
│  (No posts yet)                     │
│                                      │
└─────────────────────────────────────┘
```

## UI Specification

### 1. Add Post Form

**Location**: Top of the page

**Fields**:
- **Title** (text input, required)
  - Placeholder: "Enter post title"
  - Max length: 200 characters
  
- **Content** (textarea, optional)
  - Placeholder: "Enter post content (optional)"
  - Rows: 4
  
- **Author** (text input, required)
  - Placeholder: "Your name"
  - Max length: 100 characters

**Submit Button**: "Add Post"

**Behavior**:
- POST to `/demo/posts` with form data
- On success: Redirect to `/demo/posts` (shows updated list)
- On error: Display error message above form
- Auto-create user if doesn't exist (by name for demo simplicity)

**Validation**:
- Title required, min 1 character
- Author required, min 1 character
- Content optional

### 2. Post List

**Location**: Below the add form

**Display**:
- Show all posts ordered by `createdAt` DESC (newest first)
- Each post shows:
  - Title (h3)
  - Author name (small text)
  - Content (paragraph, truncated to 200 chars if longer)
  - Created date (formatted: "October 21, 2025")
  - Delete button

**Empty State**:
- When no posts exist, show: "(No posts yet. Add your first post above!)"

**Post Card Styling**:
- Border around each post
- Padding inside card
- Delete button aligned to the right

### 3. Delete Button

**Location**: Bottom right of each post card

**Label**: "Delete" or "×" (close icon)

**Behavior**:
- POST to `/demo/posts/{id}/delete` or DELETE to `/demo/posts/{id}`
- On success: Redirect to `/demo/posts` (shows updated list)
- No confirmation dialog (demo simplicity)
- Cascade deletes handled by database (onDelete: Cascade in schema)

## Routes

### GET `/demo/posts`

**Purpose**: Display the main page with add form and post list

**Response**: HTML page (server-side rendered JSX)

**Data fetching**:
```typescript
const posts = await prisma.demoPost.findMany({
  include: { author: true },
  orderBy: { createdAt: 'desc' }
});
```

### POST `/demo/posts`

**Purpose**: Create a new post

**Request Body** (form data):
```typescript
{
  title: string;
  content?: string;
  author: string; // author name
}
```

**Processing**:
1. Find or create user by name:
   ```typescript
   const user = await prisma.demoUser.upsert({
     where: { name: authorName },
     create: { name: authorName, email: `${authorName.toLowerCase()}@demo.local` },
     update: {}
   });
   ```

2. Create post:
   ```typescript
   await prisma.demoPost.create({
     data: {
       title,
       content,
       authorId: user.id,
       status: 'PUBLISHED'
     }
   });
   ```

3. Redirect to `/demo/posts`

**Error Handling**:
- Validation errors: Re-render form with error message
- Database errors: Show generic error message

### POST `/demo/posts/:id/delete`

**Purpose**: Delete a post

**Request**: POST with post ID in URL

**Processing**:
```typescript
await prisma.demoPost.delete({
  where: { id: postId }
});
```

**Response**: Redirect to `/demo/posts`

**Error Handling**:
- Post not found: Redirect to `/demo/posts` (silently fail)
- Database error: Show error page

## Component Structure

```
src/components/demo/
├── component.module.ts          # NestJS module
├── component.controller.tsx     # Controller with JSX rendering
├── component.service.ts         # Business logic + Prisma calls
├── prisma/
│   └── schema.prisma           # DemoUser, DemoPost models
└── ui/
    ├── DemoPage.tsx            # Main page component
    ├── PostCard.tsx            # Individual post display
    ├── AddPostForm.tsx         # Add post form
    └── demo.css                # Styles
```

## CSS Styling

**File**: `src/components/demo/ui/demo.css`

**Key styles**:
- Container with max-width for readability
- Form with clear field spacing
- Post cards with border and shadow
- Delete button styled as danger (red)
- Responsive layout (stack on mobile)

**Example structure**:
```css
.demo-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.add-post-form {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-card {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  position: relative;
}

.delete-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #dc3545;
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
}
```

## Data Flow

### Page Load (GET `/demo/posts`)

```
Client Request
    ↓
Controller.renderPostsPage()
    ↓
Service.getAllPosts()
    ↓
Prisma Client Query
    ↓
Database (PostgreSQL)
    ↓
Posts with Authors
    ↓
JSX Component (DemoPage)
    ↓
Rendered HTML
    ↓
Client Response
```

### Add Post (POST `/demo/posts`)

```
Form Submit
    ↓
Controller.createPost()
    ↓
Service.createPost({ title, content, authorName })
    ↓
Service.findOrCreateUser(authorName)
    ↓
Prisma Client Upsert + Create
    ↓
Database (PostgreSQL)
    ↓
Redirect to /demo/posts
    ↓
Page Reload (shows new post)
```

### Delete Post (POST `/demo/posts/:id/delete`)

```
Delete Button Click
    ↓
Controller.deletePost(id)
    ↓
Service.deletePost(id)
    ↓
Prisma Client Delete
    ↓
Database (PostgreSQL)
    ↓
Redirect to /demo/posts
    ↓
Page Reload (post removed)
```

## Demo Database Schema

```prisma
// src/components/demo/prisma/schema.prisma

model DemoUser {
  id        String     @id @default(uuid())
  name      String     @unique
  email     String     @unique
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  posts     DemoPost[]
}

model DemoPost {
  id        String         @id @default(uuid())
  title     String
  content   String?
  status    DemoPostStatus @default(PUBLISHED)
  authorId  String
  author    DemoUser       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@index([authorId])
}

enum DemoPostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

**Note**: For demo simplicity, we use `name` as a unique identifier (in addition to `id`). In production, you'd use email or username.

## Testing

### Manual Testing Checklist

1. **Page Load**:
   - [ ] Page loads at `/demo/posts`
   - [ ] Add form is visible
   - [ ] Post list is visible (or empty state)

2. **Add Post**:
   - [ ] Can submit with title and author
   - [ ] Can submit with optional content
   - [ ] Post appears in list after submission
   - [ ] Form clears after submission

3. **Delete Post**:
   - [ ] Delete button appears on each post
   - [ ] Clicking delete removes post
   - [ ] Page refreshes showing updated list

4. **Validation**:
   - [ ] Cannot submit without title
   - [ ] Cannot submit without author
   - [ ] Error messages display properly

5. **Edge Cases**:
   - [ ] Works with long titles/content
   - [ ] Works with special characters
   - [ ] Multiple posts display correctly
   - [ ] Empty state shows when no posts

### Integration Tests

**File**: `src/components/demo/test/integration/demo-ui.spec.ts`

**Test cases**:
- Create post and verify it appears in database
- Delete post and verify it's removed
- Load posts page and verify data is rendered
- Test user creation/reuse logic

## Accessibility

- Form labels properly associated with inputs
- Delete button has accessible text (not just icon)
- Semantic HTML (h1, h2, form, article elements)
- Keyboard navigation works for all interactions

## Future Enhancements (Not in MVP)

- Edit post functionality
- User profile pages
- Post filtering/search
- Pagination for large post lists
- Rich text editor for content
- Image uploads
- Comments on posts
