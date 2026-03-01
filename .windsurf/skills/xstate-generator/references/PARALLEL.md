
---

## 📁 **File 3: `xstate-generator/references/PARALLEL.md`**

```markdown
# Parallel States

Parallel states allow multiple regions of states to be active simultaneously. This is useful for modeling independent aspects of a system.

## When to Use Parallel States

- **UI with independent selections** (bold, italic, underline)
- **Multi-faceted systems** (a user can be both "logged in" and "editing")
- **Independent workflows** running concurrently

## Basic Syntax

```typescript
import { createMachine } from 'xstate';

const machine = createMachine({
  id: 'editor',
  type: 'parallel',
  states: {
    bold: {
      initial: 'off',
      states: {
        on: { on: { TOGGLE_BOLD: 'off' } },
        off: { on: { TOGGLE_BOLD: 'on' } }
      }
    },
    italic: {
      initial: 'off',
      states: {
        on: { on: { TOGGLE_ITALIC: 'off' } },
        off: { on: { TOGGLE_ITALIC: 'on' } }
      }
    }
  }
});

// State value will be: { bold: 'on', italic: 'off' }
// Both regions are active at the same time