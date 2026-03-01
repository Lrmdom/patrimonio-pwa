

/**
 * scripts/validate-machine.js
 * 
 * XState Machine Validator
 * 
 * This script validates XState v5 machines by attempting to instantiate them.
 * 
 * Usage:
 *   node scripts/validate-machine.js ./path/to/machine-file.js
 *   node scripts/validate-machine.js ./path/to/machine-file.ts (requires ts-node)
 * 
 * Exit codes:
 *   0: Valid machine
 *   1: Invalid machine or error
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function logError(message) {
  console.error(`${colors.red}❌ ERROR:${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

async function validateMachine(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  
  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    logError(`File not found: ${filePath}`);
    process.exit(1);
  }

  logInfo(`Validating: ${path.relative(process.cwd(), absolutePath)}`);

  try {
    // Try to load XState
    let xstate;
    try {
      xstate = require('xstate');
    } catch (e) {
      logError('XState is not installed. Run: npm install xstate');
      logInfo('If you have xstate installed, ensure you are running this from the correct directory.');
      process.exit(1);
    }

    // Clear require cache to ensure fresh load
    delete require.cache[absolutePath];

    // Import the machine file
    let machineModule;
    try {
      machineModule = require(absolutePath);
    } catch (e) {
      if (filePath.endsWith('.ts')) {
        logError('TypeScript files require ts-node. Install with: npm install -D ts-node');
        logInfo('Then run with: node -r ts-node/register scripts/validate-machine.js ' + filePath);
      } else {
        logError(`Failed to load file: ${e.message}`);
      }
      process.exit(1);
    }

    // Extract the machine - check common export patterns
    let machine;
    if (machineModule.default?.machine) {
      machine = machineModule.default.machine;
      logInfo('Found machine as default.machine');
    } else if (machineModule.machine) {
      machine = machineModule.machine;
      logInfo('Found machine as named export "machine"');
    } else if (machineModule.default?.createMachine) {
      machine = machineModule.default;
      logInfo('Found machine as default export of createMachine()');
    } else if (typeof machineModule === 'function' && machineModule.name === 'createMachine') {
      machine = machineModule;
      logInfo('Found machine as direct export of createMachine()');
    } else if (machineModule.default) {
      machine = machineModule.default;
      logInfo('Attempting to use default export as machine');
    } else {
      machine = machineModule;
      logInfo('Attempting to use module export as machine');
    }

    // Validate that we have something that looks like a machine
    if (!machine || typeof machine !== 'object') {
      logError('Could not find a valid machine export. Expected a machine object or function.');
      console.log('\nCommon export patterns:');
      console.log('  export const machine = createMachine({...});');
      console.log('  export default createMachine({...});');
      console.log('  module.exports = { machine: createMachine({...}) };');
      process.exit(1);
    }

    // Check if it's a setup function result or direct machine
    const isMachineConfig = machine.initial !== undefined && machine.states !== undefined;
    const isSetupResult = machine.config !== undefined || machine._options !== undefined;
    
    if (!isMachineConfig && !isSetupResult && typeof machine.createMachine !== 'function') {
      logWarning('This does not look like a standard XState machine object.');
      logInfo('Attempting validation anyway...');
    }

    // Try to create an actor from the machine
    let actor;
    try {
      // Handle both v4 and v5 patterns
      if (xstate.createActor) {
        // XState v5
        actor = xstate.createActor(machine);
      } else if (xstate.interpret) {
        // XState v4
        actor = xstate.interpret(machine);
      } else {
        throw new Error('Unsupported XState version. Please use XState v4 or v5.');
      }
    } catch (e) {
      logError(`Failed to create actor: ${e.message}`);
      if (e.message.includes('input')) {
        logInfo('This machine requires input. You may need to provide input data.');
        logInfo('Try: createActor(machine, { input: { ... } })');
      }
      process.exit(1);
    }

    // Start and stop the actor to validate
    try {
      actor.start();
      
      // Get initial state
      const initialState = actor.getSnapshot?.() || actor.state;
      logSuccess(`Machine started successfully`);
      logInfo(`Initial state: ${JSON.stringify(initialState.value)}`);
      
      // Log context preview
      const context = initialState.context || {};
      const contextPreview = Object.keys(context).length > 0 
        ? JSON.stringify(context).slice(0, 100) + (JSON.stringify(context).length > 100 ? '...' : '')
        : '(empty)';
      logInfo(`Initial context: ${contextPreview}`);
      
      actor.stop();
      logSuccess(`Machine validation complete!`);
      
    } catch (e) {
      logError(`Runtime validation failed: ${e.message}`);
      actor.stop?.();
      process.exit(1);
    }

    process.exit(0);

  } catch (e) {
    logError(`Unexpected error: ${e.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.log(`
${colors.cyan}XState Machine Validator${colors.reset}
Usage: node ${path.relative(process.cwd(), __filename)} <path-to-machine-file>

Examples:
  node scripts/validate-machine.js ./src/machine.js
  node scripts/validate-machine.js ./src/toggle.machine.ts
  
${colors.yellow}Note for TypeScript files:${colors.reset}
  npm install -D ts-node
  node -r ts-node/register scripts/validate-machine.js ./src/machine.ts
  `);
  process.exit(1);
}

validateMachine(filePath);