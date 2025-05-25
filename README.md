# FlowSteps

A flexible, type-safe workflow orchestration library for Node.js.

## Overview

FlowSteps helps you build robust, maintainable workflows by providing a type-safe framework for defining steps, handling errors, and managing execution flow. It's perfect for complex business processes, ETL pipelines, or any scenario where you need to orchestrate multiple steps with error handling and validation.

## Features

- **Type Safety**: Built with TypeScript for full type checking and IDE support
- **Step-Based Architecture**: Break complex workflows into simple, reusable steps
- **Error Handling**: Robust error management with customizable retry strategies
- **Validation**: Validate context data between steps using built-in validation
- **Conditional Branching**: Define conditional logic to determine workflow paths
- **Parallel Execution**: Run steps or sub-workflows in parallel
- **Metrics Collection**: Built-in support for collecting execution metrics
- **Extensibility**: Easily extend with custom validators and hooks

## Installation

```bash
npm install flowsteps
```

## Basic Usage

```typescript
import { Workflow, WorkflowContext } from 'flowsteps';

// Define your context interface
interface MyContext extends WorkflowContext {
  value: number;
}

// Create a workflow
const workflow = new Workflow<MyContext>();

// Add steps
workflow
  .addStep({
    fn: ({ context }) => {
      context.value = context.value * 2;
    },
    config: { name: 'double-value' },
  })
  .addStep({
    fn: async ({ context }) => {
      // You can perform async operations
      await someAsyncOperation();
      context.value += 10;
    },
    config: { name: 'add-ten' },
  });

// Execute the workflow
const result = await workflow.execute({ context: { value: 5 } });
console.log(result.value); // Output: 20
```

## Advanced Features

### Retry Logic

```typescript
workflow.addStep({
  fn: ({ context }) => {
    // This might fail sometimes
    performRiskyOperation(context);
  },
  config: {
    name: 'risky-operation',
    retries: {
      maxAttempts: 3,
      backoff: {
        type: 'exponential',
        delay: 100, // 100ms, 200ms, 400ms
      },
      shouldRetry: (error) => error.message.includes('RETRY_ME'),
    },
  },
});
```

### Conditional Branching

```typescript
workflow.addCondition({
  branches: [
    {
      condition: ({ context }) => context.value > 10,
      workflow: highValueWorkflow,
    },
    {
      condition: ({ context }) => context.value < 0,
      workflow: negativeValueWorkflow,
    },
  ],
  defaultWorkflow: normalValueWorkflow,
});
```

### Parallel Execution

```typescript
workflow.parallel([
  workflowA,
  workflowB,
  workflowC,
]);
```

## Documentation

For full documentation and examples, please visit our [GitHub repository](https://github.com/unhackit/stepflow).

## License

MIT
