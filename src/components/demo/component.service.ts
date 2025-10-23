/**
 * Demo Component Service
 *
 * This service demonstrates how to use PrismaService to perform database operations
 * within a component. It provides business logic methods for managing DemoUser and DemoPost entities.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../../database/runtime/prisma.service"

export interface CreateUserInput {
  name: string
  email: string
}

export interface CreatePostInput {
  title: string
  content?: string
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  authorName: string
  authorEmail: string
}

@Injectable()
export class DemoComponentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user or return existing user if name/email already exists
   *
   * @param data - User data with name and email
   * @returns Created or existing DemoUser
   */
  async createUser(data: CreateUserInput): Promise<any> {
    // Upsert: create if doesn't exist, return existing if it does
    return await this.prisma.demoUser.upsert({
      where: { email: data.email },
      update: {},
      create: {
        name: data.name,
        email: data.email,
      },
    })
  }

  /**
   * Create a new post with author relationship
   * Upserts the author if they don't exist
   *
   * @param data - Post data including author information
   * @returns Created DemoPost with author relation
   */
  async createPost(data: CreatePostInput): Promise<any> {
    // First, ensure the author exists (upsert)
    const author = await this.createUser({
      name: data.authorName,
      email: data.authorEmail,
    })

    // Create the post
    return await this.prisma.demoPost.create({
      data: {
        title: data.title,
        content: data.content,
        status: data.status || "DRAFT",
        authorId: author.id,
      },
      include: {
        author: true,
      },
    })
  }

  /**
   * Get all posts with author data included
   * Ordered by creation date (newest first)
   *
   * @returns Array of DemoPost with author relation
   */
  async getAllPosts(): Promise<any[]> {
    return await this.prisma.demoPost.findMany({
      include: {
        author: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }

  /**
   * Delete a post by ID
   *
   * @param id - Post ID to delete
   * @throws NotFoundException if post doesn't exist
   */
  async deletePost(id: string): Promise<any> {
    try {
      return await this.prisma.demoPost.delete({
        where: { id },
      })
    } catch {
      throw new NotFoundException(`Post with ID ${id} not found`)
    }
  }

  /**
   * Get a single post by ID with author data
   *
   * @param id - Post ID to retrieve
   * @returns DemoPost with author relation
   * @throws NotFoundException if post doesn't exist
   */
  async getPostById(id: string): Promise<any> {
    const post = await this.prisma.demoPost.findUnique({
      where: { id },
      include: {
        author: true,
      },
    })

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`)
    }

    return post
  }

  /**
   * Get all users with their posts
   *
   * @returns Array of DemoUser with posts relation
   */
  async getAllUsers(): Promise<any[]> {
    return await this.prisma.demoUser.findMany({
      include: {
        posts: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }
}
