
---

## 📁 **File 4: `xstate-generator/references/HISTORY.md`**

```markdown
# History States

History states allow a machine to remember the last substate it was in and return to it. This is useful for "back" navigation, remembering user preferences, or restoring previous configurations.

## Types of History

- **Shallow History (`type: 'history'`):** Remembers the immediate substate
- **Deep History (`type: 'history'`, `history: 'deep'`):** Remembers the entire nested state hierarchy

## Basic Example

```typescript
import { createMachine } from 'xstate';

const paymentMachine = createMachine({
  id: 'payment',
  initial: 'method',
  states: {
    method: {
      initial: 'cash',
      states: {
        cash: {
          on: { SWITCH_CHECK: 'check' }
        },
        check: {
          on: { SWITCH_CASH: 'cash' }
        },
        // Shallow history state
        hist: { type: 'history' }
      },
      on: { NEXT: 'review' }
    },
    review: {
      on: { BACK: 'method.hist' } // Returns to previous substate
    }
  }
});

// Flow:
// 1. Start: { method: 'cash' }
// 2. SWITCH_CHECK: { method: 'check' }
// 3. NEXT: 'review'
// 4. BACK: { method: 'check' } // Remembered!