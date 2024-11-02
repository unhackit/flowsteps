import { v4 as uuidv4 } from "uuid";
import { IWorkflow } from "../types/base";
import { WorkflowContext } from "../types/context";
import { MetricsCollector, WorkflowMetrics } from "../types/monitoring";
import { Validator } from "../types/validation";
import {
  ConditionConfig,
  StepConstructorParams,
  StepExecuteParams,
  WorkflowConfig,
  WorkflowHooks,
} from "../types/workflow";
import { Step } from "./step";

export interface WorkflowOptions<T extends WorkflowContext>
  extends WorkflowConfig<T> {
  metricsCollector?: MetricsCollector;
  validator?: Validator<T>;
}

export class Workflow<T extends WorkflowContext = WorkflowContext>
  implements IWorkflow<T>
{
  private steps: Step<T>[] = [];
  private currentContext: T | null = null;
  private readonly hooks: WorkflowHooks<T>;
  private readonly name: string;
  private handledErrors = new WeakSet<Error>();
  private readonly workflowId: string;
  private readonly metricsCollector?: MetricsCollector;
  private readonly validator?: Validator<T>;

  constructor(options: WorkflowOptions<T> = {}) {
    this.hooks = options.hooks || {};
    this.name = options.name || "anonymous";
    this.workflowId = uuidv4();
    this.metricsCollector = options.metricsCollector;
    this.validator = options.validator;
  }

  addStep(params: StepConstructorParams<T>): this {
    const step = new Step(params);
    this.steps.push(step);
    return this;
  }

  addCondition(config: ConditionConfig<T>): this {
    const conditionalStep = new Step<T>({
      fn: async ({ context }): Promise<void> => {
        for (const branch of config.branches) {
          const result = await Promise.resolve(branch.condition({ context }));
          if (result) {
            const branchResult = await branch.workflow.execute({ context });
            Object.assign(context, branchResult);
            return;
          }
        }

        if (config.defaultWorkflow) {
          const defaultResult = await config.defaultWorkflow.execute({
            context,
          });
          Object.assign(context, defaultResult);
        }
      },
      config: { name: "condition-step" },
    });

    this.steps.push(conditionalStep);
    return this;
  }

  async execute({ context: initialContext }: StepExecuteParams<T>): Promise<T> {
    if (this.validator) {
      const validation = this.validator.validate(initialContext);
      if (!validation.success) {
        const errors = validation.errors?.map((e) => e.message).join(", ");
        throw new Error(`Workflow context validation failed: ${errors}`);
      }
    }

    const startTime = Date.now();
    const metrics: WorkflowMetrics = {
      workflowId: this.workflowId,
      startTime,
      endTime: 0,
      totalDuration: 0,
      steps: [],
      status: "running",
    };

    try {
      await this.hooks.beforeWorkflow?.({ context: initialContext });

      const context = this.currentContext || { ...initialContext };
      this.currentContext = context;

      for (const step of this.steps) {
        const stepStartTime = Date.now();
        try {
          await this.hooks.beforeStep?.({ stepName: step.name, context });
          await step.execute({ context });
          await this.hooks.afterStep?.({ stepName: step.name, context });

          this.metricsCollector?.recordStepExecution({
            stepName: step.name,
            startTime: stepStartTime,
            endTime: Date.now(),
            duration: Date.now() - stepStartTime,
            status: "success",
          });
        } catch (error) {
          const err = error as Error;
          this.metricsCollector?.recordStepExecution({
            stepName: step.name,
            startTime: stepStartTime,
            endTime: Date.now(),
            duration: Date.now() - stepStartTime,
            status: "failure",
            error: err,
          });

          await this.hooks.onError?.({
            error: err,
            stepName: step.name,
            context,
          });
          throw err;
        }
      }

      const result = { ...this.currentContext } as T;
      this.currentContext = null;

      await this.hooks.afterWorkflow?.({ context: result });

      metrics.status = "completed";
      metrics.endTime = Date.now();
      metrics.totalDuration = metrics.endTime - metrics.startTime;
      this.metricsCollector?.recordWorkflowExecution(metrics);

      return result;
    } catch (error) {
      metrics.status = "failed";
      metrics.endTime = Date.now();
      metrics.totalDuration = metrics.endTime - metrics.startTime;
      this.metricsCollector?.recordWorkflowExecution(metrics);
      throw error;
    }
  }

  async parallel(workflows: Workflow<T>[]): Promise<this> {
    const parallelStep = new Step<T>({
      fn: async ({ context }: StepExecuteParams<T>): Promise<void> => {
        await Promise.all(
          workflows.map(async (workflow) => {
            const result = await workflow.execute({ context });
            Object.assign(context, result);
          })
        );
      },
      config: { name: "parallel-step" },
    });

    this.steps.push(parallelStep);
    return this;
  }
}
