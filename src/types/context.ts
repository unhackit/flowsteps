/**
 * Base type for all workflow contexts
 */
export type WorkflowContext = Record<string, unknown>;

/**
 * Context validation result
 */
export interface ContextValidationResult {
  isValid: boolean;
  errors?: string[];
}

/**
 * Context validator function type
 */
export type ContextValidator = (
  context: WorkflowContext
) => ContextValidationResult;

// Helper type to ensure context types have string index signature
export type EnsureWorkflowContext<T> = T & WorkflowContext;
