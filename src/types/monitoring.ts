export interface StepMetrics {
  stepName: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: "success" | "failure";
  error?: Error;
}

export interface WorkflowMetrics {
  workflowId: string;
  startTime: number;
  endTime: number;
  totalDuration: number;
  steps: StepMetrics[];
  status: "running" | "completed" | "failed";
}

export interface MetricsCollector {
  recordStepExecution(metrics: StepMetrics): void;
  recordWorkflowExecution(metrics: WorkflowMetrics): void;
}
