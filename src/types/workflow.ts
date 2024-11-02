import { IWorkflow } from "./base";
import { WorkflowContext } from "./context";
import { Validator } from "./validation";

export interface RetryConfig {
  maxAttempts: number;
  backoff?: {
    type: "fixed" | "exponential";
    delay: number;
  };
  shouldRetry?: (error: Error) => boolean;
}

export interface StepExecuteParams<T extends WorkflowContext> {
  context: T;
}

export type StepFunction<T extends WorkflowContext> = (params: {
  context: T;
}) => Promise<void> | void;

export interface StepConfig {
  name: string;
  validator?: Validator<any>;
  retries?: RetryConfig;
  timeout?: number;
}

export interface StepConstructorParams<T extends WorkflowContext> {
  fn: StepFunction<T>;
  config: Partial<StepConfig> & { name: string };
}

export interface ConditionBranch<T extends WorkflowContext> {
  name: string;
  condition: (params: StepExecuteParams<T>) => boolean | Promise<boolean>;
  workflow: IWorkflow<T>;
}

export interface ConditionConfig<T extends WorkflowContext> {
  branches: ConditionBranch<T>[];
  defaultWorkflow?: IWorkflow<T>;
}

export interface StepHookParams<T extends WorkflowContext> {
  stepName: string;
  context: T;
}

export interface WorkflowHookParams<T extends WorkflowContext> {
  context: T;
}

export interface ErrorHookParams<T extends WorkflowContext>
  extends StepHookParams<T> {
  error: Error;
}

export type StepHookFunction<T extends WorkflowContext> = (
  params: StepHookParams<T>
) => void | Promise<void>;
export type WorkflowHookFunction<T extends WorkflowContext> = (
  params: WorkflowHookParams<T>
) => void | Promise<void>;
export type ErrorHookFunction<T extends WorkflowContext> = (
  params: ErrorHookParams<T>
) => void | Promise<void>;

export interface WorkflowHooks<T extends WorkflowContext> {
  beforeStep?: StepHookFunction<T>;
  afterStep?: StepHookFunction<T>;
  onError?: ErrorHookFunction<T>;
  beforeWorkflow?: WorkflowHookFunction<T>;
  afterWorkflow?: WorkflowHookFunction<T>;
}

export interface WorkflowConfig<T extends WorkflowContext> {
  hooks?: WorkflowHooks<T>;
  name?: string;
  validator?: Validator<T>;
}
