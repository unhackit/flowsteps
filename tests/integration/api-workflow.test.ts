import { describe, expect, it } from "vitest";
import { Workflow } from "../../src/core/workflow";
import { WorkflowContext } from "../../src/types/context";

interface ApiWorkflowContext extends WorkflowContext {
  userId?: number;
  posts?: Array<{
    id: number;
    userId: number;
    title: string;
    body: string;
  }>;
  selectedPost?: {
    id: number;
    userId: number;
    title: string;
    body: string;
  };
  comments?: Array<{
    id: number;
    postId: number;
    name: string;
    email: string;
    body: string;
  }>;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  enrichedPost?: {
    title: string;
    body: string;
    commentCount: number;
    author: {
      name: string;
      email: string;
    };
  };
}

describe("API Workflow Integration", () => {
  it("should fetch user posts, select one, and fetch its comments", async () => {
    const workflow = new Workflow<ApiWorkflowContext>()
      .addStep({
        fn: async ({ context }): Promise<void> => {
          const response = await fetch(
            `https://jsonplaceholder.typicode.com/posts?userId=1`
          );
          context.posts = await response.json();
        },
        config: { name: "fetch-user-posts" },
      })
      .addStep({
        fn: ({ context }): void => {
          if (!context.posts) throw new Error("No posts fetched");
          context.selectedPost = context.posts.find(
            (post) => post.body.length > 100
          );
        },
        config: { name: "select-long-post" },
      })
      .addStep({
        fn: async ({ context }): Promise<void> => {
          if (!context.selectedPost?.id) {
            throw new Error("No post selected");
          }
          const response = await fetch(
            `https://jsonplaceholder.typicode.com/comments?postId=${context.selectedPost.id}`
          );
          context.comments = await response.json();
        },
        config: { name: "fetch-post-comments" },
      })
      .addStep({
        fn: ({ context }): void => {
          if (!context.selectedPost) throw new Error("No post selected");
          if (!context.comments) throw new Error("No comments fetched");

          context.enrichedPost = {
            title: context.selectedPost.title,
            body: context.selectedPost.body,
            commentCount: context.comments.length,
            author: {
              name: "Unknown",
              email: "Unknown",
            },
          };
        },
        config: { name: "enrich-post-data" },
      })
      .addStep({
        fn: async ({ context }): Promise<void> => {
          if (!context.selectedPost?.userId)
            throw new Error("No user ID found");
          if (!context.enrichedPost) throw new Error("No enriched post data");

          const response = await fetch(
            `https://jsonplaceholder.typicode.com/users/${context.selectedPost.userId}`
          );
          const user = await response.json();

          context.enrichedPost.author = {
            name: user.name,
            email: user.email,
          };
        },
        config: {
          name: "fetch-user-details",
          retries: {
            maxAttempts: 3,
            backoff: {
              type: "exponential",
              delay: 1000,
            },
          },
        },
      });

    const result = await workflow.execute({ context: {} });

    expect(result.posts).toBeDefined();
    expect(result.posts?.length).toBeGreaterThan(0);
    expect(result.selectedPost).toBeDefined();
    expect(result.comments).toBeDefined();
    expect(result.enrichedPost).toBeDefined();
    expect(result.enrichedPost?.commentCount).toBeGreaterThan(0);
    expect(result.enrichedPost?.author.name).not.toBe("Unknown");
  });

  it("should handle API errors gracefully", async () => {
    const errors: Array<{ error: Error; stepName: string }> = [];

    const workflow = new Workflow<ApiWorkflowContext>({
      hooks: {
        onError: ({ error, stepName }): void => {
          errors.push({ error, stepName });
        },
      },
    }).addStep({
      fn: async (): Promise<void> => {
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/invalid-endpoint"
        );
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
      },
      config: {
        name: "invalid-api-call",
        retries: {
          maxAttempts: 2,
          backoff: {
            type: "fixed",
            delay: 100,
          },
          shouldRetry: (error: Error): boolean => {
            return !error.message.includes("404");
          },
        },
      },
    });

    await expect(workflow.execute({ context: {} })).rejects.toThrow(
      /API error: 404/
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].stepName).toBe("invalid-api-call");
    expect(errors[0].error.message).toMatch(/API error: 404/);
  });

  it("should execute parallel API calls", async () => {
    const fetchUserWorkflow = new Workflow<ApiWorkflowContext>().addStep({
      fn: async ({ context }): Promise<void> => {
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/users/1"
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.status}`);
        }
        context.user = await response.json();
      },
      config: {
        name: "fetch-user",
        retries: {
          maxAttempts: 2,
          backoff: { type: "fixed", delay: 1000 },
        },
      },
    });

    const fetchPostsWorkflow = new Workflow<ApiWorkflowContext>().addStep({
      fn: async ({ context }): Promise<void> => {
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/posts?userId=1"
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.status}`);
        }
        context.posts = await response.json();
      },
      config: {
        name: "fetch-posts",
        retries: {
          maxAttempts: 2,
          backoff: { type: "fixed", delay: 1000 },
        },
      },
    });

    const mainWorkflow = new Workflow<ApiWorkflowContext>();
    await mainWorkflow.parallel([fetchUserWorkflow, fetchPostsWorkflow]);

    const result = await mainWorkflow.execute({ context: {} });

    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe(1);
    expect(result.user?.name).toBeDefined();
    expect(result.posts).toBeDefined();
    expect(result.posts?.length).toBeGreaterThan(0);
    expect(result.posts?.[0].userId).toBe(1);
  });
});
