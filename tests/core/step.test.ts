import { describe, expect, it } from "vitest";
import { Step } from "../../src/core/step";
import { WorkflowContext } from "../../src/types/context";
import { ValidationResult, Validator } from "../../src/types/validation";

class TestValidator implements Validator<WorkflowContext> {
  validate(context: WorkflowContext): ValidationResult {
    const value = context.value as number;
    return {
      success: value >= 0,
      errors:
        value >= 0
          ? undefined
          : [{ path: ["value"], message: "Value must be non-negative" }],
    };
  }
}

describe("Step", () => {
  it("should execute a simple step function", async () => {
    const context: WorkflowContext = { value: 1 };
    const step = new Step({
      fn: ({ context }): void => {
        context.value = (context.value as number) + 1;
      },
      config: { name: "increment-step" },
    });

    await step.execute({ context });
    expect(context.value).toBe(2);
  });

  it("should handle async step functions", async () => {
    const context: WorkflowContext = { value: 1 };
    const step = new Step({
      fn: async ({ context }): Promise<void> => {
        await Promise.resolve();
        context.value = (context.value as number) * 2;
      },
      config: { name: "multiply-step" },
    });

    await step.execute({ context });
    expect(context.value).toBe(2);
  });

  it("should validate context when validator is provided", async () => {
    const context: WorkflowContext = { value: -1 };
    const step = new Step({
      fn: ({ context }): void => {
        context.value = (context.value as number) + 1;
      },
      config: {
        name: "validation-step",
        validator: new TestValidator(),
      },
    });

    await expect(step.execute({ context })).rejects.toThrow(
      "Context validation failed"
    );
  });

  it("should handle different backoff strategies", async () => {
    const attempts: number[] = [];
    const startTime = Date.now();

    const fixedStep = new Step({
      fn: (): void => {
        attempts.push(Date.now() - startTime);
        throw new Error("Temporary failure");
      },
      config: {
        name: "fixed-backoff-step",
        retries: {
          maxAttempts: 3,
          backoff: {
            type: "fixed",
            delay: 100,
          },
        },
      },
    });

    await expect(fixedStep.execute({ context: {} })).rejects.toThrow();
    const fixedDelays = attempts.slice(1).map((time, i) => time - attempts[i]);
    expect(fixedDelays[0]).toBeCloseTo(100, -1);
    expect(fixedDelays[1]).toBeCloseTo(100, -1);
  });
});
