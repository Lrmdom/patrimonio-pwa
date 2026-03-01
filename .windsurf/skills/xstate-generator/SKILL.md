---
name: xstate-generator
description: Generate, explain, and modify XState v5 state machines (actors, statecharts) from user requirements. Use when the user needs to model logic with finite state machines, handle complex workflows, or visualize application state.
license: MIT
metadata:
  author: agentskills
  version: "1.0.0"
  xstate-version: "v5"
compatibility: Requires XState v5 or later. The agent may need to install the 'xstate' npm package. The Stately Studio visualizer (state.new) is recommended for previewing machines.
allowed-tools: Bash(npm) Bash(node) Read
---

# XState State Machine Generator

This skill helps you create, debug, and explain **XState v5** state machines. Follow these instructions step-by-step to ensure the generated code is accurate, follows best practices, and is ready for implementation.

## 🧠 1. Core Principles (Read First)
Before generating code, always consider these XState fundamentals:
1.  **Actors:** Every machine instance is an actor. Use `createActor(machine)` to spawn an instance.
2.  **Context:** Extended state (data) lives in `context`. Use the `assign` action to update it.
3.  **Events:** Everything is triggered by an event `{ type: 'EVENT_NAME' }`.
4.  **Guards:** Conditional transitions use `guard` functions.
5.  **Actions:** Side effects (console.log, assigning context, spawning actors) are defined in `actions`.
6.  **Hierarchy & Parallelism:** Use nested states (`.`) and parallel states (`type: 'parallel'`) to reduce complexity.

## ⚙️ 2. Code Generation Template
Always structure the generated machine using the `setup()` factory (best practice for v5). Use the following template:

```typescript
import { setup, createActor, assign } from 'xstate';

// 1. Define the machine logic with setup()
const machine = setup({
  // Define types for context and events (if using TypeScript)
  types: {} as {
    context: { /* Define your context properties here */ };
    events: { type: 'EVENT_NAME' } | { type: 'ANOTHER_EVENT'; value: string };
  },
  // Define reusable actions (e.g., assign to context)
  actions: {
    updateValue: assign({
      value: ({ event }) => {
        if (event.type === 'ANOTHER_EVENT') return event.value;
        return '';
      }
    }),
    logAction: ({ context, event }) => {
      console.log('Event:', event.type, 'Context:', context);
    }
  },
  // Define reusable guards (conditional logic)
  guards: {
    isReady: ({ context }) => context.value === 'ready'
  },
  // Define actors (spawned machines)
  actors: {
    // childMachine: createMachine({ ... })
  }
}).createMachine({
  id: 'machine_id',
  initial: 'idle',
  context: {
    value: null,
    count: 0
    // ... initial context
  },
  states: {
    idle: {
      on: {
        START: { target: 'loading' }
      }
    },
    loading: {
      entry: ['logAction'],
      on: {
        SUCCESS: {
          target: 'success',
          guard: 'isReady'
        },
        FAIL: 'failure'
      }
    },
    success: {
      type: 'final'
    },
    failure: {}
  }
});

// 2. Create the actor to run the machine
const actor = createActor(machine);

// 3. Subscribe to state changes (optional, for logging/debugging)
actor.subscribe((state) => {
  console.log('State:', state.value);
  console.log('Context:', state.context);
});

// 4. Start the actor
actor.start();

// 5. Send events
// actor.send({ type: 'START' });
// actor.send({ type: 'SUCCESS' });