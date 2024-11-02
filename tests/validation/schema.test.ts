import { describe, expect, it } from "vitest";
import { z } from "zod";
import { Workflow } from "../../src/core/workflow";
import { WorkflowContext } from "../../src/types/context";
import { ZodValidator } from "../../src/types/validation";

interface UserWorkflowContext extends WorkflowContext {
  userId?: number;
  email?: string;
  age?: number;
  preferences?: {
    theme: "light" | "dark";
    notifications: boolean;
  };
}

const userSchema = z.object({
  userId: z.number().optional(),
  email: z.string().email().optional(),
  age: z.number().min(18).optional(),
  preferences: z
    .object({
      theme: z.enum(["light", "dark"]),
      notifications: z.boolean(),
    })
    .optional(),
});

describe("Workflow Validation", () => {
  it("should validate context at workflow level", async () => {
    const workflow = new Workflow<UserWorkflowContext>({
      name: "user-workflow",
      validator: new ZodValidator(userSchema),
    });

    const validContext = {
      email: "test@example.com",
      age: 25,
      preferences: {
        theme: "dark" as const,
        notifications: true,
      },
    };

    const result = await workflow.execute({ context: validContext });
    expect(result).toEqual(validContext);

    const invalidContext = {
      email: "invalid-email",
      age: 15,
      preferences: {
        theme: "blue" as "light",
        notifications: true,
      },
    };

    await expect(workflow.execute({ context: invalidContext })).rejects.toThrow(
      /validation failed/
    );
  });

  it("should validate context at step level", async () => {
    const emailSchema = z.object({
      email: z.string().email(),
    });

    const workflow = new Workflow<UserWorkflowContext>().addStep({
      fn: ({ context }): void => {
        context.email = "test@example.com";
      },
      config: {
        name: "set-email",
        validator: new ZodValidator(emailSchema),
      },
    });

    const result = await workflow.execute({
      context: { email: "test@example.com" },
    });
    expect(result.email).toBe("test@example.com");
  });

  it("should validate complex nested objects", async () => {
    const workflow = new Workflow<UserWorkflowContext>({
      validator: new ZodValidator(userSchema),
    }).addStep({
      fn: ({ context }): void => {
        context.preferences = {
          theme: "dark",
          notifications: true,
        };
      },
      config: { name: "set-preferences" },
    });

    const result = await workflow.execute({
      context: {
        email: "test@example.com",
        age: 25,
      },
    });

    expect(result.preferences?.theme).toBe("dark");
  });
});
