import {
  MetricsCollector,
  StepMetrics,
  WorkflowMetrics,
} from "../types/monitoring";

export class ConsoleMetricsCollector implements MetricsCollector {
  recordStepExecution(metrics: StepMetrics): void {
    console.log(
      `Step: ${metrics.stepName} - Duration: ${metrics.duration}ms - Status: ${metrics.status}`
    );
    if (metrics.error) {
      console.error(`Error in step ${metrics.stepName}:`, metrics.error);
    }
  }

  recordWorkflowExecution(metrics: WorkflowMetrics): void {
    console.log(
      `Workflow: ${metrics.workflowId} - Total Duration: ${metrics.totalDuration}ms - Status: ${metrics.status}`
    );
    console.log("Steps:", metrics.steps.length);
  }
}

export class InMemoryMetricsCollector implements MetricsCollector {
  private stepMetrics: StepMetrics[] = [];
  private workflowMetrics: WorkflowMetrics[] = [];

  recordStepExecution(metrics: StepMetrics): void {
    this.stepMetrics.push(metrics);
  }

  recordWorkflowExecution(metrics: WorkflowMetrics): void {
    this.workflowMetrics.push(metrics);
  }

  getStepMetrics(): StepMetrics[] {
    return this.stepMetrics;
  }

  getWorkflowMetrics(): WorkflowMetrics[] {
    return this.workflowMetrics;
  }

  clear(): void {
    this.stepMetrics = [];
    this.workflowMetrics = [];
  }
}
