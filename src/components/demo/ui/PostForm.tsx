/**
 * Post Form Component
 *
 * Form for creating new posts
 */

import { CsrfToken } from "../../../csrf"

export function PostForm() {
  return (
    <form method="POST" action="/demo/posts" className="demo-post-form">
      {/* CSRF Protection - automatically includes token in form submission */}
      <CsrfToken />
      <div className="demo-form-group">
        <label htmlFor="title">
          Post Title <span className="demo-required">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          placeholder="Enter post title"
          className="demo-input"
        />
      </div>

      <div className="demo-form-group">
        <label htmlFor="content">Post Content</label>
        <textarea
          id="content"
          name="content"
          rows={4}
          placeholder="Enter post content (optional)"
          className="demo-textarea"
        />
      </div>

      <div className="demo-form-row">
        <div className="demo-form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" className="demo-select">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <div className="demo-form-row">
        <div className="demo-form-group">
          <label htmlFor="authorName">
            Author Name <span className="demo-required">*</span>
          </label>
          <input
            type="text"
            id="authorName"
            name="authorName"
            required
            placeholder="Your name"
            className="demo-input"
          />
        </div>

        <div className="demo-form-group">
          <label htmlFor="authorEmail">
            Author Email <span className="demo-required">*</span>
          </label>
          <input
            type="email"
            id="authorEmail"
            name="authorEmail"
            required
            placeholder="your@email.com"
            className="demo-input"
          />
        </div>
      </div>

      <div className="demo-form-actions">
        <button type="submit" className="demo-btn demo-btn-primary">
          Create Post
        </button>
      </div>
    </form>
  )
}
