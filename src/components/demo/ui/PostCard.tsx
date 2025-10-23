/**
 * Post Card Component
 *
 * Displays a single post with author information and delete button
 */

export interface PostCardProps {
  post: {
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
}

export function PostCard({ post }: PostCardProps) {
  const createdDate =
    typeof post.createdAt === "string"
      ? new Date(post.createdAt)
      : post.createdAt
  const formattedDate = createdDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Client-side script
  const clientScript = `
  // Ask confirmation before submitting the delete form
  document.addEventListener("DOMContentLoaded", () => {
    const deleteForm = document.querySelector('.demo-delete-form');
    if (deleteForm) {
      deleteForm.addEventListener('submit', (event) => {
        const confirmed = confirm('Are you sure you want to delete this post?');
        if (!confirmed) {
          event.preventDefault();
        }
      });
    }
  });
  `

  return (
    <article className="demo-post-card">
      <script>{clientScript}</script>
      <div className="demo-post-header">
        <h3 className="demo-post-title">{post.title}</h3>
        <span
          className={`demo-post-status demo-status-${post.status.toLowerCase()}`}
        >
          {post.status}
        </span>
      </div>

      {post.content && (
        <div className="demo-post-content">
          <p>{post.content}</p>
        </div>
      )}

      <div className="demo-post-meta">
        <div className="demo-post-author">
          <strong>{post.author.name}</strong>
          <span className="demo-post-email">{post.author.email}</span>
        </div>
        <time className="demo-post-date">{formattedDate}</time>
      </div>

      <div className="demo-post-actions">
        <form
          method="POST"
          action={`/demo/posts/${post.id}/delete`}
          className="demo-delete-form"
        >
          <button
            type="submit"
            className="demo-btn demo-btn-danger demo-btn-sm"
            aria-label={`Delete post ${post.title}`}
            title={`Delete post: ${post.title}`}
          >
            Delete
          </button>
        </form>
      </div>
    </article>
  )
}
