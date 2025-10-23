/**
 * Demo Component Controller
 *
 * This controller demonstrates database integration with JSX server-side rendering.
 * It provides routes for viewing, creating, and deleting demo posts.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  Redirect,
  HttpCode,
} from "@nestjs/common"
import type { Response } from "express"
import { renderPage } from "../../ssr/renderPage"
import { PostListPage } from "./ui/PostListPage"
import { DemoComponentService } from "./component.service"

@Controller()
export class DemoController {
  constructor(private readonly demoService: DemoComponentService) {}

  /**
   * Legacy demo route - redirects to posts list
   */
  @Get("/demo")
  @Redirect("/demo/posts", 302)
  demo() {
    // Redirect to the new posts list page
  }

  /**
   * GET /demo/posts
   * Display all posts with a form to add new posts
   */
  @Get("/demo/posts")
  async getPosts(@Res() res: Response) {
    const posts = await this.demoService.getAllPosts()

    const view = renderPage(<PostListPage posts={posts} />, {
      title: "Demo Posts - Database Integration",
      currentPath: "/demo/posts",
    })
    res.status(200).send(view)
  }

  /**
   * POST /demo/posts
   * Create a new post (upserts author)
   * Body: { title: string, content?: string, status?: string, authorName: string, authorEmail: string }
   */
  @Post("/demo/posts")
  @Redirect("/demo/posts", 303)
  async createPost(
    @Body("title") title: string,
    @Body("content") content: string | undefined,
    @Body("status") status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined,
    @Body("authorName") authorName: string,
    @Body("authorEmail") authorEmail: string,
  ) {
    await this.demoService.createPost({
      title,
      content,
      status,
      authorName,
      authorEmail,
    })

    // Redirect back to posts list after creation
  }

  /**
   * POST /demo/posts/:id/delete
   * Delete a post by ID
   */
  @Post("/demo/posts/:id/delete")
  @HttpCode(303)
  @Redirect("/demo/posts", 303)
  async deletePost(@Param("id") id: string) {
    await this.demoService.deletePost(id)

    // Redirect back to posts list after deletion
  }
}
