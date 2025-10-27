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
  Req,
  Redirect,
  HttpCode,
} from "@nestjs/common"
import type { Response, Request } from "express"
import { renderPage } from "../../ssr/renderPage"
import { PostListPage } from "./ui/PostListPage"
import { DemoComponentService } from "./component.service"
import { DemoPage } from "./ui/DemoPage"

@Controller()
export class DemoController {
  constructor(private readonly demoService: DemoComponentService) {}

  /**
   * Legacy demo route - redirects to posts list
   */
  @Get("/demo")
  demo() {
    // Redirect to the new posts list page
    const view = renderPage(<DemoPage title="Demo Component" />, {
      title: "Demo Component",
      currentPath: "/demo",
    })
    return view
  }

  /**
   * GET /demo/posts
   * Display all posts with a form to add new posts
   */
  @Get("/demo/posts")
  async getPosts(@Req() req: Request, @Res() res: Response) {
    const posts = await this.demoService.getAllPosts()

    const view = renderPage(<PostListPage posts={posts} />, {
      title: "Demo Posts - Database Integration",
      currentPath: "/demo/posts",
      request: req,
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
