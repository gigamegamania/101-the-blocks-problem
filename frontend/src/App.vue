<script setup lang="ts">
import { ref } from 'vue';
import Result from './Result.vue';
import SectionHeader from './SectionHeader.vue';
import { validate } from './validation';

const inputValue = ref<string>('');
const apiResponse = ref<{ solution?: string; error?: string } | null>(null);
const isLoading = ref<boolean>(false);
const illegalCommands = ref<Array<{ command: string; reason: string }>>([]);

/**
 * Filters out illegal commands from the input before sending to the backend.
 * This ensures illegal commands don't affect the output state.
 *
 * Illegal commands are:
 * 1. Commands where a = b (e.g., "move 0 onto 0")
 * 2. Commands where a and b are in the same stack (e.g., "move 1 onto 2" when 1 and 2 are already stacked together)
 *
 * Why filter here instead of in the backend?
 * - The backend processes commands sequentially and would partially execute illegal commands
 * - By filtering upfront, we ensure only valid commands affect the block state
 * - This prevents issues like "move 0 onto 0" from clearing block 0's position
 *
 * @param input - The raw input string containing number of blocks and commands
 * @returns Object with filtered input (only legal commands) and list of illegal commands
 */
const filterIllegalCommands = (
  input: string,
): { filteredInput: string; illegalCommands: Array<{ command: string; reason: string }> } => {
  const lines = input.trim().split('\n');
  if (lines.length < 2) {
    return { filteredInput: input, illegalCommands: [] };
  }

  // First line is the number of blocks (n)
  const n = parseInt(lines[0], 10);
  if (isNaN(n) || n <= 0) {
    return { filteredInput: input, illegalCommands: [] };
  }

  const commands = lines.slice(1);
  const illegal: Array<{ command: string; reason: string }> = [];
  const legalCommands: string[] = [];

  // Initialize state: each block starts in its own stack [0], [1], [2], etc.
  // We need to simulate state changes to detect if blocks are in the same stack
  const state = Array.from({ length: n }, (_, i) => [i]);

  // Process each command sequentially to check legality and track state
  for (const command of commands) {
    const trimmedCommand = command.trim();

    // 'quit' command is always legal and terminates processing
    if (trimmedCommand === 'quit') {
      legalCommands.push(trimmedCommand);
      break;
    }

    // Parse command: expected format is "move/pile <number> onto/over <number>"
    const values = trimmedCommand.split(/\s+/);
    if (values.length !== 4) {
      // Not a valid command format, but we'll let the backend handle validation errors
      legalCommands.push(trimmedCommand);
      continue;
    }

    const [action, idx, preposition, target] = values;
    const a = parseInt(idx, 10);
    const b = parseInt(target, 10);

    // Validate block numbers are within range
    // Invalid block numbers will be caught by backend validation, so we pass them through
    if (isNaN(a) || isNaN(b) || a < 0 || a >= n || b < 0 || b >= n) {
      legalCommands.push(trimmedCommand);
      continue;
    }

    // Illegal condition 1: a = b
    // Example: "move 0 onto 0" - cannot move a block onto itself
    if (a === b) {
      illegal.push({
        command: trimmedCommand,
        reason: `Block ${a} cannot be moved onto itself (a = b)`,
      });
      continue; // Skip this command, don't add to legal commands
    }

    // Illegal condition 2: a and b are in the same stack
    // We need to check the current state to see if blocks are already stacked together
    // Example: if block 1 is on top of block 2, "move 1 onto 2" is illegal
    const posA = state.findIndex((pile) => pile.includes(a));
    const posB = state.findIndex((pile) => pile.includes(b));

    if (posA === posB && posA !== -1) {
      illegal.push({
        command: trimmedCommand,
        reason: `Blocks ${a} and ${b} are already in the same stack`,
      });
      continue; // Skip this command, don't add to legal commands
    }

    // Command is legal - add it to the filtered list
    legalCommands.push(trimmedCommand);

    // IMPORTANT: Simulate the command execution to update our state tracking
    // This is necessary because subsequent commands need to know the current block positions
    // to correctly detect if they are illegal (e.g., if command 1 moves block 1 onto block 2,
    // then command 2 trying to move block 1 onto block 2 would be illegal)

    // Execute the command simulation to update state for next command checks
    if (action === 'move' || action === 'pile') {
      if (preposition === 'onto' || preposition === 'over') {
        // Get blocks that need to be moved/returned based on command type
        const blocksAboveA = getBlocksAbove(a, posA, state);
        const blocksBeforeA = getBlocksBelow(a, posA, state);

        if (action === 'move') {
          // "move" command: only moves block A, returns blocks above A to initial positions
          if (preposition === 'onto') {
            // "move A onto B": returns blocks above B, then places A on B
            const blocksAboveB = getBlocksAbove(b, posB, state);
            const blocksBeforeB = getBlocksBelow(b, posB, state);
            state[posB] = [...blocksBeforeB, b, a];
            state[posA] = blocksBeforeA;
            returnBlocksToInitialPositions([...blocksAboveA, ...blocksAboveB], state);
          } else {
            // "move A over B": places A on top of B's stack, returns blocks above A
            state[posB] = [...state[posB], a];
            state[posA] = blocksBeforeA;
            returnBlocksToInitialPositions(blocksAboveA, state);
          }
        } else {
          // "pile" command: moves block A and all blocks above it, maintaining their order
          const blocksToMove = getBlocksFromAOnwards(a, posA, state);
          if (preposition === 'onto') {
            // "pile A onto B": returns blocks above B, then places pile on B
            const blocksAboveB = getBlocksAbove(b, posB, state);
            const blocksBeforeB = getBlocksBelow(b, posB, state);
            state[posB] = [...blocksBeforeB, b, ...blocksToMove];
            state[posA] = blocksBeforeA;
            returnBlocksToInitialPositions(blocksAboveB, state);
          } else {
            // "pile A over B": places pile on top of B's stack
            state[posB] = [...state[posB], ...blocksToMove];
            state[posA] = blocksBeforeA;
          }
        }
      }
    }
  }

  // Reconstruct the input with only legal commands
  // This filtered input will be sent to the backend, ensuring illegal commands never affect output
  const filteredInput = `${n}\n${legalCommands.join('\n')}`;
  return { filteredInput, illegalCommands: illegal };
};

const getBlocksAbove = (block: number, pos: number, state: number[][]): number[] => {
  const stack = state[pos];
  const indexOfBlock = stack.indexOf(block);
  if (indexOfBlock === -1) return [];
  return stack.slice(indexOfBlock + 1);
};

const getBlocksBelow = (block: number, pos: number, state: number[][]): number[] => {
  const stack = state[pos];
  const indexOfBlock = stack.indexOf(block);
  if (indexOfBlock === -1) return stack;
  return stack.slice(0, indexOfBlock);
};

const returnBlocksToInitialPositions = (blocks: number[], state: number[][]): void => {
  for (const block of blocks) {
    state[block] = [block];
  }
};

const getBlocksFromAOnwards = (a: number, pos: number, state: number[][]): number[] => {
  const stack = state[pos];
  const indexOfA = stack.indexOf(a);
  return stack.slice(indexOfA);
};

const handleInputChange = async (_e: Event): Promise<void> => {
  if (!inputValue.value.trim()) {
    apiResponse.value = null;
    illegalCommands.value = [];
    return;
  }

  const { valid, error } = await validate(inputValue.value);
  if (!valid) {
    apiResponse.value = { error };
    illegalCommands.value = [];
    return;
  }

  // Filter illegal commands and get filtered input
  const { filteredInput, illegalCommands: detectedIllegal } = filterIllegalCommands(
    inputValue.value,
  );
  illegalCommands.value = detectedIllegal;

  isLoading.value = true;
  try {
    const response = await fetch('http://localhost:5170/blocks/solve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: filteredInput }),
    });
    const data = (await response.json()) as { solution?: string; error?: string };
    apiResponse.value = data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    apiResponse.value = { error: `Error: ${errorMessage}` };
  } finally {
    isLoading.value = false;
  }
};

const insertCommand = (command: string): void => {
  const currentValue = inputValue.value.trim();
  const newLine = currentValue ? '\n' : '';
  inputValue.value = `${currentValue}${newLine}${command}`;

  // Trigger input change handler
  handleInputChange(new Event('input'));
};
</script>

<template>
  <div class="app">
    <header>
      <h1>Technical Test App</h1>
    </header>

    <main class="main-container">
      <div class="left-column">
        <SectionHeader label="Input:" />
        <div class="input-container">
          <div class="input-wrapper">
            <textarea
              id="textbox"
              v-model="inputValue"
              placeholder="Type something..."
              class="text-input"
              rows="10"
              @input="handleInputChange"
            ></textarea>
            <div class="quick-commands">
              <div class="quick-commands-label">Quick commands:</div>
              <div class="command-tags">
                <button
                  type="button"
                  class="command-tag"
                  data-tooltip="Puts block A onto block B after returning any blocks stacked on top of blocks A and B to their initial positions."
                  @click="insertCommand('move A onto B')"
                >
                  move A onto B
                </button>
                <button
                  type="button"
                  class="command-tag"
                  data-tooltip="Puts block A onto the top of the stack containing block B, after returning any blocks stacked on top of block A to their initial positions."
                  @click="insertCommand('move A over B')"
                >
                  move A over B
                </button>
                <button
                  type="button"
                  class="command-tag"
                  data-tooltip="Moves the pile of blocks consisting of block A and any blocks stacked above it onto block B. All blocks on top of block B are moved to their initial positions. Blocks above A retain their order."
                  @click="insertCommand('pile A onto B')"
                >
                  pile A onto B
                </button>
                <button
                  type="button"
                  class="command-tag"
                  data-tooltip="Puts the pile of blocks consisting of block A and any blocks stacked above it onto the top of the stack containing block B. Blocks above A retain their order."
                  @click="insertCommand('pile A over B')"
                >
                  pile A over B
                </button>
                <button
                  type="button"
                  class="command-tag"
                  data-tooltip="Terminates manipulations in the block world."
                  @click="insertCommand('quit')"
                >
                  quit
                </button>
              </div>
            </div>
          </div>
          <div class="helper-text">
            <p>
              <strong>Input format:</strong> Enter the number of blocks on the first line, followed
              by block manipulation commands (move/pile a onto/over b), and end with "quit".
            </p>
            <p><strong>Example:</strong></p>
            <pre class="helper-example">
5
move 2 over 1
move 3 over 2
pile 1 onto 0
quit</pre
            >
            <p><strong>Illegal commands rule:</strong></p>
            <p>
              Any command in which a = b or in which a and b are in the same stack of blocks is an
              illegal command. All illegal commands should be ignored and should have no effect on
              the configuration of blocks.
            </p>
          </div>
        </div>
      </div>

      <div class="right-column">
        <SectionHeader label="Output:" />
        <div v-if="isLoading" class="status">Loading...</div>
        <Result v-else-if="apiResponse" :api-response="apiResponse" />
        <div v-else class="placeholder">Results will appear here</div>
        <div v-if="illegalCommands.length > 0" class="illegal-commands">
          <h3>Illegal commands (ignored):</h3>
          <ul>
            <li v-for="(item, index) in illegalCommands" :key="index" class="illegal-command">
              <span class="illegal-command-text">{{ item.command }}</span>
              <span class="illegal-command-reason">— {{ item.reason }}</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  padding: 2rem;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  color: #42b883;
}

.main-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 768px) {
  .main-container {
    grid-template-columns: 1fr;
  }
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
}

.sample-input-section pre {
  padding: 0.75rem;
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
  overflow-x: auto;
}

.placeholder {
  padding: 1rem;
  color: #999;
  font-style: italic;
  text-align: center;
  border: 2px dashed #ddd;
  border-radius: 4px;
}

.input-container {
  margin-bottom: 1rem;
}

.input-wrapper {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.text-input {
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-family: monospace;
  resize: vertical;
  color: #ccc;
  background-color: var(--color-background);
  transition: border-color 0.2s ease;
}

.text-input:hover {
  border-color: #999;
}

.text-input:focus {
  outline: none;
  border-color: #42b883;
}

.status {
  padding: 1rem;
  border-radius: 4px;
  margin-top: 0;
  background-color: #f0f0f0;
  color: #666;
}

.helper-text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #aaa;
  line-height: 1.5;
}

.helper-text p {
  margin: 0.25rem 0;
}

.helper-text strong {
  color: #ccc;
}

.helper-example {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  font-family: monospace;
  color: #aaa;
  white-space: pre-wrap;
  overflow-x: auto;
}

.quick-commands {
  flex-shrink: 0;
  min-width: 180px;
}

.quick-commands-label {
  font-size: 0.875rem;
  color: #aaa;
  margin-bottom: 0.5rem;
}

.command-tags {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (max-width: 1024px) {
  .input-wrapper {
    flex-direction: column;
  }

  .quick-commands {
    width: 100%;
    min-width: auto;
  }

  .command-tags {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.command-tag {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-family: monospace;
  color: #ccc;
  background-color: transparent;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.command-tag:hover {
  background-color: rgba(66, 184, 131, 0.1);
  border-color: #42b883;
  color: #42b883;
}

.command-tag:active {
  background-color: rgba(66, 184, 131, 0.2);
}

.illegal-commands {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 4px;
}

.illegal-commands h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #ff9800;
  font-weight: bold;
}

.illegal-commands ul {
  margin: 0;
  padding-left: 1.5rem;
  list-style-type: disc;
}

.illegal-command {
  font-size: 0.875rem;
  color: #aaa;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.illegal-command-text {
  font-family: monospace;
  color: #ff9800;
  font-weight: 500;
}

.illegal-command-reason {
  font-family: sans-serif;
  color: #aaa;
  font-style: italic;
}

.command-tag[data-tooltip]:hover::before {
  content: attr(data-tooltip);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: #2a2a2a;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: sans-serif;
  white-space: normal;
  width: 250px;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  line-height: 1.4;
}

.command-tag[data-tooltip]:hover::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 0.5rem;
  border: 6px solid transparent;
  border-right-color: #2a2a2a;
  z-index: 1001;
  pointer-events: none;
}
</style>
