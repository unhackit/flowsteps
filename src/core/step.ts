import { WorkflowContext } from "../types/context";
import {
  RetryConfig,
  StepConfig,
  StepConstructorParams,
  StepExecuteParams,
  StepFunction,
} from "../types/workflow";
import { StepExecutionError } from "../utils/errors";

export class Step<T extends WorkflowContext = WorkflowContext> {
  private readonly stepFn: StepFunction<T>;
  private readonly config: StepConfig;

  constructor({ fn, config }: StepConstructorParams<T>) {
    this.stepFn = fn;
    this.config = {
      name: config.name,
      validator: config.validator,
      retries: config.retries,
      timeout: config.timeout,
    };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number, config: RetryConfig): number {
    const { backoff } = config;
    if (!backoff) return 0;

    if (backoff.type === "fixed") {
      return backoff.delay;
    }

    return backoff.delay * Math.pow(2, attempt - 1);
  }

  async execute({ context }: StepExecuteParams<T>): Promise<void> {
    if (this.config.validator) {
      const validation = this.config.validator.validate(context);
      if (!validation.success) {
        const errors = validation.errors?.map((e) => e.message).join(", ");
        throw new Error(
          `Context validation failed for step ${this.config.name}: ${errors}`
        );
      }
    }

    let lastError: Error | null = null;
    const retryConfig = this.config.retries;

    for (
      let attempt = 1;
      attempt <= (retryConfig?.maxAttempts || 1);
      attempt++
    ) {
      try {
        await this.stepFn({ context });
        return;
      } catch (error) {
        lastError = error as Error;

        if (retryConfig?.shouldRetry && !retryConfig.shouldRetry(lastError)) {
          throw new StepExecutionError(this.name, lastError);
        }

        if (attempt === retryConfig?.maxAttempts) {
          throw new StepExecutionError(
            this.name,
            new Error(
              `Failed after ${attempt} attempts. Last error: ${lastError.message}`
            )
          );
        }

        if (retryConfig?.backoff) {
          const delay = this.calculateBackoff(attempt, retryConfig);
          await this.sleep(delay);
        }
      }
    }

    if (lastError) {
      throw new StepExecutionError(this.name, lastError);
    }
  }

  get name(): string {
    return this.config.name;
  }
}
