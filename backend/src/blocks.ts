export function solveBlocks(input: string): string {
  // Solves the blocks problem described here: https://onlinejudge.org/external/1/101.pdf
  const lines = input.trim().split('\n');
  const n = parseInt(lines[0], 10);
  const commands = lines.slice(1);

  const state = Array.from({ length: n }, (_, i) => [i]);

  for (const command of commands) {
    if (command === 'quit') {
      break;
    }
    const values = command.split(' ');
    if (values.length !== 4) {
      throw new Error('Command is invalid: ' + command); // Invalid command format
    }
    const [action, idx, preposition, target] = values;
    const a = parseInt(idx, 10);
    const b = parseInt(target, 10);

    if (isNaN(a) || isNaN(b) || a < 0 || a >= n || b < 0 || b >= n) {
      throw new Error('Block number out of range: ' + command + ` ${a} - ${b} - ${n} - ${input}`); // Block number out of range
    }

    const posA = state.findIndex((pile) => pile.includes(a));
    const posB = state.findIndex((pile) => pile.includes(b));

    switch (action) {
      case 'move':
        switch (preposition) {
          case 'onto': {
            // Move a onto b, clean up any other blocks
            const blocksAboveA = getBlocksAbove(a, posA, state);
            const blocksAboveB = getBlocksAbove(b, posB, state);
            const blocksBeforeA = getBlocksBelow(a, posA, state);
            const blocksBeforeB = getBlocksBelow(b, posB, state);

            state[posB] = [...blocksBeforeB, b, a];
            state[posA] = blocksBeforeA;

            returnBlocksToInitialPositions([...blocksAboveA, ...blocksAboveB], state);
            break;
          }
          case 'over': {
            // Move a over b, clean up any other blocks on top of a
            const blocksAboveA = getBlocksAbove(a, posA, state);
            const blocksBeforeA = getBlocksBelow(a, posA, state);

            state[posB] = [...state[posB], a];
            state[posA] = blocksBeforeA;

            returnBlocksToInitialPositions(blocksAboveA, state);
            break;
          }
        }
        break;
      case 'pile':
        switch (preposition) {
          case 'onto': {
            // pile a onto b, clean up any other blocks
            const blocksAboveB = getBlocksAbove(b, posB, state);
            const blocksToMove = getBlocksFromAOnwards(a, posA, state);
            const blocksBeforeA = getBlocksBelow(a, posA, state);
            const blocksBeforeB = getBlocksBelow(b, posB, state);

            state[posB] = [...blocksBeforeB, b, ...blocksToMove];
            state[posA] = blocksBeforeA;

            returnBlocksToInitialPositions(blocksAboveB, state);
            break;
          }
          case 'over': {
            // Move a over b, clean up any other blocks on top of a
            const blocksToMove = getBlocksFromAOnwards(a, posA, state);
            const blocksBeforeA = getBlocksBelow(a, posA, state);

            state[posB] = [...state[posB], ...blocksToMove];
            state[posA] = blocksBeforeA;
            break;
          }
        }
        break;
      default:
        throw new Error('Unknown action: ' + command); // Unknown action
    }
  }

  return state.map((x, i) => `${i}: ${x.join(' ')}`).join('\n');
}

// Command syntax validator
const commandRegex = /(move|pile)\s+(\d+)\s+(onto|over)\s+(\d+)/i;
const initCommandRegex = /(\d)+/;
const quitCommandRegex = /quit/i;
const combinedCommandRegex = new RegExp(
  `^(${commandRegex.source}|${initCommandRegex.source}|${quitCommandRegex.source})$`,
  'im',
);

export function validateBlocks(command: string): {
  valid: boolean;
  error?: string;
  command?: string;
} {
  const trimmedCommand = command.trim();
  if (!trimmedCommand) {
    return { valid: false, error: 'Command cannot be empty' };
  }

  for (const commandLine of trimmedCommand.split('\n')) {
    if (!combinedCommandRegex.test(commandLine)) {
      return {
        valid: false,
        error: `Invalid command syntax. Expected format: "move/pile <number> onto/over <number>", a number, or "quit" (received: "${commandLine}")`,
        command: trimmedCommand,
      };
    }
  }

  return { valid: true };
}

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
