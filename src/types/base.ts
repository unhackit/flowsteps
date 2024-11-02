import { WorkflowContext } from "./context";

export interface IWorkflow<T extends WorkflowContext> {
  execute(params: { context: T }): Promise<T>;
}
