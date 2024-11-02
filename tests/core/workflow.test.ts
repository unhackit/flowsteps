import { describe, expect, it } from "vitest";
import { Workflow } from "../../src/core/workflow";
import { WorkflowContext } from "../../src/types/context";
import { ErrorHookParams, StepHookParams } from "../../src/types/workflow";

interface TestWorkflowContext extends WorkflowContext {
  value?: number;
  value1?: number;
  value2?: number;
  value3?: number;
  base?: number;
  type?: string;
  path?: string[];
}

describe("Workflow", () => {
  it("should execute steps in sequence", async () => {
    const workflow = new Workflow<TestWorkflowContext>()
      .addStep({
        fn: ({ context }): void => {
          context.value = 1;
        },
        config: { name: "step-1" },
      })
      .addStep({
        fn: ({ context }): void => {
          context.value = (context.value as number) + 1;
        },
        config: { name: "step-2" },
      })
      .addStep({
        fn: ({ context }): void => {
          context.value = (context.value as number) * 2;
        },
        config: { name: "step-3" },
      });

    const result = await workflow.execute({ context: {} });
    expect(result.value).toBe(4);
  });

  it("should handle conditional branching", async () => {
    const executionLog: string[] = [];

    const workflow = new Workflow<TestWorkflowContext>()
      .addStep({
        fn: ({ context }): void => {
          context.value = 10;
          executionLog.push(`Initial value set: ${context.value}`);
        },
        config: { name: "initial-step" },
      })
      .addCondition({
        branches: [
          {
            name: "greater than 5",
            condition: ({ context }): boolean => {
              const result = (context.value as number) > 5;
              executionLog.push(`Condition evaluated: ${result}`);
              return result;
            },
            workflow: new Workflow<TestWorkflowContext>().addStep({
              fn: ({ context }): void => {
                context.value = (context.value as number) * 2;
                executionLog.push(`Value multiplied: ${context.value}`);
              },
              config: { name: "multiply-step" },
            }),
          },
        ],
      });

    const result = await workflow.execute({ context: {} });
    expect(result.value).toBe(20);
  });

  it("should execute hooks in correct order", async () => {
    const executionOrder: string[] = [];

    const workflow = new Workflow<TestWorkflowContext>({
      name: "test-workflow",
      hooks: {
        beforeWorkflow: (): void => {
          executionOrder.push("beforeWorkflow");
        },
        beforeStep: ({
          stepName,
        }: StepHookParams<TestWorkflowContext>): void => {
          executionOrder.push(`beforeStep:${stepName}`);
        },
        afterStep: ({
          stepName,
        }: StepHookParams<TestWorkflowContext>): void => {
          executionOrder.push(`afterStep:${stepName}`);
        },
        afterWorkflow: (): void => {
          executionOrder.push("afterWorkflow");
        },
      },
    });

    workflow
      .addStep({
        fn: ({ context }): void => {
          executionOrder.push("step1");
          context.value = 1;
        },
        config: { name: "step-1" },
      })
      .addStep({
        fn: ({ context }): void => {
          executionOrder.push("step2");
          context.value = 2;
        },
        config: { name: "step-2" },
      });

    await workflow.execute({ context: {} });
    expect(executionOrder).toEqual([
      "beforeWorkflow",
      "beforeStep:step-1",
      "step1",
      "afterStep:step-1",
      "beforeStep:step-2",
      "step2",
      "afterStep:step-2",
      "afterWorkflow",
    ]);
  });

  it("should execute workflows in parallel", async () => {
    const workflow1 = new Workflow<TestWorkflowContext>().addStep({
      fn: async ({ context }): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        context.value1 = 1;
      },
      config: { name: "workflow1-step" },
    });

    const workflow2 = new Workflow<TestWorkflowContext>().addStep({
      fn: async ({ context }): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        context.value2 = 2;
      },
      config: { name: "workflow2-step" },
    });

    const workflow3 = new Workflow<TestWorkflowContext>().addStep({
      fn: async ({ context }): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        context.value3 = 3;
      },
      config: { name: "workflow3-step" },
    });

    const mainWorkflow = new Workflow<TestWorkflowContext>().addStep({
      fn: ({ context }): void => {
        context.base = 10;
      },
      config: { name: "set-base" },
    });

    await mainWorkflow.parallel([workflow1, workflow2, workflow3]);

    const result = await mainWorkflow.execute({ context: {} });
    expect(result).toEqual({
      base: 10,
      value1: 1,
      value2: 2,
      value3: 3,
    });
  });

  it("should handle error propagation in nested workflows", async () => {
    const errorMessage = "Nested workflow error";
    const errors: Error[] = [];

    const workflow = new Workflow<TestWorkflowContext>({
      hooks: {
        onError: ({ error }: ErrorHookParams<TestWorkflowContext>): void => {
          errors.push(error);
        },
      },
    });

    workflow.addStep({
      fn: (): void => {
        throw new Error(errorMessage);
      },
      config: { name: "error-step" },
    });

    await expect(workflow.execute({ context: {} })).rejects.toThrow(
      errorMessage
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain(errorMessage);
  });

  it("should handle multiple conditions in sequence", async () => {
    const workflow = new Workflow<TestWorkflowContext>()
      .addStep({
        fn: ({ context }): void => {
          context.value = 15;
          context.path = [];
        },
        config: { name: "initial-step" },
      })
      .addCondition({
        branches: [
          {
            name: "greater-than-10",
            condition: ({ context }): boolean => (context.value as number) > 10,
            workflow: new Workflow<TestWorkflowContext>().addStep({
              fn: ({ context }): void => {
                context.value = (context.value as number) * 2;
                context.path?.push("gt-10");
              },
              config: { name: "multiply-step" },
            }),
          },
        ],
      })
      .addCondition({
        branches: [
          {
            name: "greater-than-20",
            condition: ({ context }): boolean => (context.value as number) > 20,
            workflow: new Workflow<TestWorkflowContext>().addStep({
              fn: ({ context }): void => {
                context.value = (context.value as number) + 5;
                context.path?.push("gt-20");
              },
              config: { name: "add-step" },
            }),
          },
        ],
      });

    const result = await workflow.execute({ context: {} });
    expect(result.value).toBe(35);
    expect(result.path).toEqual(["gt-10", "gt-20"]);
  });

  it("should handle nested conditions", async () => {
    const workflow = new Workflow<TestWorkflowContext>()
      .addStep({
        fn: ({ context }): void => {
          context.value = 10;
          context.path = [];
        },
        config: { name: "initial-step" },
      })
      .addCondition({
        branches: [
          {
            name: "outer-condition",
            condition: ({ context }): boolean =>
              (context.value as number) >= 10,
            workflow: new Workflow<TestWorkflowContext>()
              .addStep({
                fn: ({ context }): void => {
                  context.value = (context.value as number) * 2;
                  context.path?.push("outer");
                },
                config: { name: "outer-step" },
              })
              .addCondition({
                branches: [
                  {
                    name: "inner-condition",
                    condition: ({ context }): boolean =>
                      (context.value as number) > 15,
                    workflow: new Workflow<TestWorkflowContext>().addStep({
                      fn: ({ context }): void => {
                        context.value = (context.value as number) + 5;
                        context.path?.push("inner");
                      },
                      config: { name: "inner-step" },
                    }),
                  },
                ],
              }),
          },
        ],
      });

    const result = await workflow.execute({ context: {} });
    expect(result.value).toBe(25);
    expect(result.path).toEqual(["outer", "inner"]);
  });

  it("should handle mixed parallel and conditional flows", async () => {
    const executionLog: string[] = [];

    const conditionalWorkflow = new Workflow<TestWorkflowContext>()
      .addStep({
        fn: ({ context }): void => {
          context.value1 = 5;
          executionLog.push(`Set initial value1: ${context.value1}`);
        },
        config: { name: "set-initial" },
      })
      .addCondition({
        branches: [
          {
            name: "multiply",
            condition: ({ context }): boolean => {
              const result = (context.value1 as number) > 0;
              executionLog.push(`Condition evaluated: ${result}`);
              return result;
            },
            workflow: new Workflow<TestWorkflowContext>().addStep({
              fn: ({ context }): void => {
                context.value1 = (context.value1 as number) * 2;
                executionLog.push(`Multiplied value1: ${context.value1}`);
              },
              config: { name: "multiply-step" },
            }),
          },
        ],
      });

    const parallelWorkflow = new Workflow<TestWorkflowContext>().addStep({
      fn: ({ context }): void => {
        context.value2 = 10;
        executionLog.push(`Set value2: ${context.value2}`);
      },
      config: { name: "parallel-step" },
    });

    const mainWorkflow = new Workflow<TestWorkflowContext>();
    await mainWorkflow.parallel([conditionalWorkflow, parallelWorkflow]);

    const result = await mainWorkflow.execute({ context: {} });

    expect(result.value1).toBe(10);
    expect(result.value2).toBe(10);
  });

  it("should handle condition with no matching branches", async () => {
    const workflow = new Workflow<TestWorkflowContext>()
      .addStep({
        fn: ({ context }): void => {
          context.value = 5;
        },
        config: { name: "initial-step" },
      })
      .addCondition({
        branches: [
          {
            name: "never-matches",
            condition: ({ context }): boolean => (context.value as number) > 10,
            workflow: new Workflow<TestWorkflowContext>().addStep({
              fn: ({ context }): void => {
                context.value = 100;
              },
              config: { name: "never-executed" },
            }),
          },
        ],
      });

    const result = await workflow.execute({ context: {} });
    expect(result.value).toBe(5);
  });
});
