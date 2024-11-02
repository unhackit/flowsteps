# Stepflow

A flexible, type-safe workflow automation library for Node.js.

## Features

- Step-based workflow execution
- Conditional branching
- Parallel execution
- Type-safe context passing
- Input validation (Zod integration)
- Retry mechanisms with backoff strategies
- Built-in metrics collection
- Lifecycle hooks
- Error handling and recovery

## Installation

```bash
npm install stepflow
```

## Usage

```typescript
import { Workflow } from "stepflow";

interface UserWorkflowContext {
  userId?: number;
  userData?: {
    name: string;
    email: string;
  };
  processed?: boolean;
}

const workflow = new Workflow<UserWorkflowContext>()
  .addStep({
    fn: async ({ context }) => {
      const response = await fetch(`/api/users/${context.userId}`);
      context.userData = await response.json();
    },
    config: {
      name: "fetch-user",
      retries: {
        maxAttempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      },
    },
  })
  .addStep({
    fn: ({ context }) => {
      context.processed = true;
    },
    config: { name: "process-user" },
  });

const result = await workflow.execute({
  context: { userId: 123 },
});
```

## Core Concepts

### Conditional Branching

```typescript
workflow.addCondition({
  branches: [
    {
      name: "premium-user",
      condition: ({ context }) => context.userData?.isPremium,
      workflow: premiumWorkflow,
    },
    {
      name: "regular-user",
      condition: ({ context }) => !context.userData?.isPremium,
      workflow: regularWorkflow,
    },
  ],
});
```

### Parallel Execution

```typescript
const mainWorkflow = new Workflow().parallel([
  notificationWorkflow,
  dataProcessingWorkflow,
  analyticsWorkflow,
]);
```

### Input Validation

```typescript
import { z } from "zod";
import { ZodValidator } from "stepflow";

const userSchema = z.object({
  userId: z.number(),
  email: z.string().email(),
  age: z.number().min(18),
});

const workflow = new Workflow({
  validator: new ZodValidator(userSchema),
});
```

### Error Handling

```typescript
const workflow = new Workflow({
  hooks: {
    onError: ({ error, stepName, context }) => {
      console.error(`Error in step ${stepName}:`, error);
    },
  },
});
```

## API Reference

### Workflow

#### Constructor Options

- `name?: string`
- `validator?: Validator<T>`
- `metricsCollector?: MetricsCollector`
- `hooks?: WorkflowHooks<T>`

#### Methods

- `addStep(params: StepConstructorParams<T>): this`
- `addCondition(config: ConditionConfig<T>): this`
- `parallel(workflows: Workflow<T>[]): Promise<this>`
- `execute(params: { context: T }): Promise<T>`

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.
