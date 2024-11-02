import { describe, expect, it } from "vitest";
import { Workflow } from "../../src/core/workflow";
import { InMemoryMetricsCollector } from "../../src/monitoring/collectors";
import { WorkflowContext } from "../../src/types/context";

describe("Workflow Metrics", () => {
  it("should collect metrics for successful workflow", async () => {
    const collector = new InMemoryMetricsCollector();
    const workflow = new Workflow<WorkflowContext>({
      name: "test-workflow",
      metricsCollector: collector,
    })
      .addStep({
        fn: async ({ context }): Promise<void> => {
          await new Promise((resolve) => setTimeout(resolve, 150));
          context.value = 1;
        },
        config: { name: "step-1" },
      })
      .addStep({
        fn: ({ context }): void => {
          context.value = (context.value as number) + 1;
        },
        config: { name: "step-2" },
      });

    await workflow.execute({ context: {} });

    const workflowMetrics = collector.getWorkflowMetrics();
    const stepMetrics = collector.getStepMetrics();

    expect(workflowMetrics).toHaveLength(1);
    expect(workflowMetrics[0].status).toBe("completed");
    expect(workflowMetrics[0].totalDuration).toBeGreaterThan(100);

    expect(stepMetrics).toHaveLength(2);
    expect(stepMetrics[0].status).toBe("success");
    expect(stepMetrics[1].status).toBe("success");
    expect(stepMetrics[0].duration).toBeGreaterThan(100);
  });

  it("should collect metrics for failed workflow", async () => {
    const collector = new InMemoryMetricsCollector();
    const workflow = new Workflow<WorkflowContext>({
      name: "test-workflow",
      metricsCollector: collector,
    }).addStep({
      fn: (): void => {
        throw new Error("Test error");
      },
      config: { name: "failing-step" },
    });

    await expect(workflow.execute({ context: {} })).rejects.toThrow(
      "Test error"
    );

    const workflowMetrics = collector.getWorkflowMetrics();
    const stepMetrics = collector.getStepMetrics();

    expect(workflowMetrics).toHaveLength(1);
    expect(workflowMetrics[0].status).toBe("failed");
    expect(stepMetrics).toHaveLength(1);
    expect(stepMetrics[0].status).toBe("failure");
    expect(stepMetrics[0].error).toBeDefined();
  });
});
