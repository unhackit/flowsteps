import { z } from "zod";
import { WorkflowContext } from "./context";

export interface ValidationError {
  path: Array<string | number>;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors?: ValidationError[];
}

export interface Validator<T extends WorkflowContext> {
  validate(context: T): ValidationResult;
}

export class ZodValidator<T extends WorkflowContext> implements Validator<T> {
  constructor(private schema: z.ZodType<T>) {}

  validate(context: T): ValidationResult {
    try {
      this.schema.parse(context);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map((err) => ({
            path: err.path,
            message: err.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ path: [], message: "Unknown validation error" }],
      };
    }
  }
}
