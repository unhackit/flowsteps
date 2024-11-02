export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}

export class StepExecutionError extends WorkflowError {
  constructor(stepName: string, cause: Error) {
    super(`Step '${stepName}' failed: ${cause.message}`);
    this.name = "StepExecutionError";
  }
}

export class ContextValidationError extends WorkflowError {
  constructor(stepName: string, errors: string[]) {
    super(
      `Context validation failed for step '${stepName}': ${errors.join(", ")}`
    );
    this.name = "ContextValidationError";
  }
}
