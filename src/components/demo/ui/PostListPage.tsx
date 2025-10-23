/**
 * Post List Page Component
 *
 * Displays all posts with a form to add new posts
 */

import { PostForm } from "./PostForm"
import { PostCard } from "./PostCard"
import styles from "./demo.css"

export interface Post {
  id: string
  title: string
  content: string | null
  status: string
  createdAt: Date | string
  author: {
    id: string
    name: string
    email: string
  }
}

export interface PostListPageProps {
  posts: Post[]
}

export function PostListPage({ posts }: PostListPageProps) {
  return (
    <div className="demo-posts-page">
      {/* Scoped stylesheet for the Demo component UI */}
      <link rel="stylesheet" href={styles} />
      <header className="demo-header">
        <h1>Demo Posts - Database Integration</h1>
        <p>
          This page demonstrates component-level database integration using
          Prisma. Posts are stored in PostgreSQL and rendered server-side with
          JSX.
        </p>
      </header>

      <section className="demo-add-post">
        <h2>Add New Post</h2>
        <PostForm />
      </section>

      <section className="demo-posts-list">
        <h2>All Posts ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className="demo-no-posts">
            No posts yet. Create your first post using the form above!
          </p>
        ) : (
          <div className="demo-posts-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
