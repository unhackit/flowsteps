export type WorkflowContext = {
  [key: string]: unknown;
};

export interface ContextValidationResult {
  isValid: boolean;
  errors?: string[];
}

export type ContextValidator = (
  context: WorkflowContext
) => ContextValidationResult;

export type EnsureWorkflowContext<T> = T & WorkflowContext;
