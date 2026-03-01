
---

## 📁 **File 2: `xstate-generator/references/ACTORS.md`**

```markdown
# XState Actors Guide

In XState v5, every machine instance is an **actor**.

## What is an Actor?
An actor is an entity that:
- Has its own internal state
- Receives and processes events
- Can send events to other actors
- Can spawn child actors
- Can be stopped and started

## Spawning Actors

You can spawn actors from within a machine using the `spawnChild` action or the `spawn` function.

### Using `spawnChild` (Recommended)

```typescript
import { setup, createMachine, spawnChild } from 'xstate';

// Define a child machine
const childMachine = createMachine({
  id: 'child',
  initial: 'active',
  states: {
    active: {
      on: {
        STOP: { target: 'stopped' }
      }
    },
    stopped: {}
  }
});

// Parent machine that spawns the child
const parentMachine = setup({
  actions: {
    spawnChildActor: spawnChild({
      systemId: 'my-child', // Unique ID for the child
      src: 'child', // References actor defined in `actors` object
      input: ({ context, event }) => ({
        initialData: context.someValue
      })
    })
  },
  actors: {
    child: childMachine // Register the child machine
  }
}).createMachine({
  id: 'parent',
  initial: 'active',
  states: {
    active: {
      on: {
        SPAWN_CHILD: { actions: 'spawnChildActor' }
      }
    }
  }
});