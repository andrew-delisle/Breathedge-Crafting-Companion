import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock persistence so tests don't touch localStorage
vi.mock('../state/persistence.js', () => ({
  savePinState: vi.fn(),
  clearPinState: vi.fn(),
}));

// Mock appState with a gameId so savePinState calls don't fail
vi.mock('../state/appState.js', () => ({
  appState: { gameId: 'test-game' },
}));
import {
  pinState,
  isPinned,
  pinRecipe,
  unpinRecipe,
  unpinAll,
  toggleNode,
  setMultiplier,
  computeMaterialsSummary
} from '../state/pinState.js';

// Minimal flat node tree matching flattenRecipeTree output for:
// Helmet -> Refined Metal (craftable) -> Metal (base)
//        -> Plastic (base)
const makeNodes = () => [
  {
    nodeId: 'helmet__refined__0',
    parentNodeId: null,
    ingredientKey: 'refined',
    qty: 1,
    isBase: false,
    text: 'Refined Metal',
    level: 0,
  },
  {
    nodeId: 'helmet__refined__0/refined__metal__0',
    parentNodeId: 'helmet__refined__0',
    ingredientKey: 'metal',
    qty: 2,
    isBase: true,
    text: 'Metal x2',
    level: 1,
  },
  {
    nodeId: 'helmet__plastic__1',
    parentNodeId: null,
    ingredientKey: 'plastic',
    qty: 3,
    isBase: true,
    text: 'Plastic x3',
    level: 0,
  },
];

const mockData = {
  refined: { name: 'Refined Metal', ingredients: [{ key: 'metal', qty: 2 }] },
  metal:   { name: 'Metal',         ingredients: [] },
  plastic: { name: 'Plastic',       ingredients: [] },
};

beforeEach(() => {
  unpinAll();
});

describe('isPinned', () => {
  test('returns false when not pinned', () => {
    expect(isPinned('helmet')).toBe(false);
  });

  test('returns true after pinning', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    expect(isPinned('helmet')).toBe(true);
  });
});

describe('pinRecipe', () => {
  test('adds the recipe to pinState', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    expect(pinState.pinnedRecipes.has('helmet')).toBe(true);
  });

  test('stores the recipe name', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    expect(pinState.pinnedRecipes.get('helmet').name).toBe('Helmet');
  });

  test('does not pin the same recipe twice', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    pinRecipe('helmet', 'Helmet', makeNodes());
    expect(pinState.pinnedRecipes.size).toBe(1);
  });

  test('wires child references from parentNodeId', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    const nodes = pinState.pinnedRecipes.get('helmet').nodes;
    const refined = nodes.get('helmet__refined__0');
    expect(refined.childNodeIds).toContain('helmet__refined__0/refined__metal__0');
  });
});

describe('unpinRecipe', () => {
  test('removes a pinned recipe', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    unpinRecipe('helmet');
    expect(isPinned('helmet')).toBe(false);
  });

  test('is safe to call on an unpinned recipe', () => {
    expect(() => unpinRecipe('nothing')).not.toThrow();
  });
});

describe('unpinAll', () => {
  test('clears all pinned recipes', () => {
    pinRecipe('helmet',  'Helmet',  makeNodes());
    pinRecipe('sawdrill', 'Sawdrill', makeNodes());
    unpinAll();
    expect(pinState.pinnedRecipes.size).toBe(0);
  });
});

describe('toggleNode', () => {
  test('checks an unchecked node', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    toggleNode('helmet', 'helmet__plastic__1');
    const node = pinState.pinnedRecipes.get('helmet').nodes.get('helmet__plastic__1');
    expect(node.checked).toBe(true);
  });

  test('unchecks a checked node', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    toggleNode('helmet', 'helmet__plastic__1');
    toggleNode('helmet', 'helmet__plastic__1');
    const node = pinState.pinnedRecipes.get('helmet').nodes.get('helmet__plastic__1');
    expect(node.checked).toBe(false);
  });

  test('checking a parent disables children', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    toggleNode('helmet', 'helmet__refined__0');
    const child = pinState.pinnedRecipes.get('helmet').nodes
      .get('helmet__refined__0/refined__metal__0');
    expect(child.disabled).toBe(true);
    expect(child.checked).toBe(false);
  });

  test('unchecking a parent re-enables children', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    toggleNode('helmet', 'helmet__refined__0'); // check parent
    toggleNode('helmet', 'helmet__refined__0'); // uncheck parent
    const child = pinState.pinnedRecipes.get('helmet').nodes
      .get('helmet__refined__0/refined__metal__0');
    expect(child.disabled).toBe(false);
  });

  test('does nothing if node is disabled', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    // Disable child by checking parent first
    toggleNode('helmet', 'helmet__refined__0');
    // Try to toggle the now-disabled child
    toggleNode('helmet', 'helmet__refined__0/refined__metal__0');
    const child = pinState.pinnedRecipes.get('helmet').nodes
      .get('helmet__refined__0/refined__metal__0');
    expect(child.checked).toBe(false); // still unchecked, toggle was ignored
  });

  test('is safe to call with unknown recipeKey', () => {
    expect(() => toggleNode('nothing', 'some-node')).not.toThrow();
  });
});

describe('setMultiplier', () => {
  test('sets multiplier on a pinned recipe', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    setMultiplier('helmet', 3);
    expect(pinState.pinnedRecipes.get('helmet').multiplier).toBe(3);
  });

  test('clamps multiplier to minimum of 1', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    setMultiplier('helmet', 0);
    expect(pinState.pinnedRecipes.get('helmet').multiplier).toBe(1);
    setMultiplier('helmet', -5);
    expect(pinState.pinnedRecipes.get('helmet').multiplier).toBe(1);
  });

  test('rounds non-integer values', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    setMultiplier('helmet', 2.7);
    expect(pinState.pinnedRecipes.get('helmet').multiplier).toBe(3);
  });

  test('handles non-numeric input gracefully', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    setMultiplier('helmet', 'abc');
    expect(pinState.pinnedRecipes.get('helmet').multiplier).toBe(1);
  });

  test('does nothing for an unpinned recipe', () => {
    expect(() => setMultiplier('nothing', 5)).not.toThrow();
  });
});

describe('computeMaterialsSummary', () => {
  test('returns base ingredients that are unchecked', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    const summary = computeMaterialsSummary(mockData);
    expect(summary.has('metal')).toBe(true);
    expect(summary.has('plastic')).toBe(true);
    expect(summary.get('metal').qty).toBe(2);
    expect(summary.get('plastic').qty).toBe(3);
  });

  test('excludes checked base ingredients', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    toggleNode('helmet', 'helmet__plastic__1');
    const summary = computeMaterialsSummary(mockData);
    expect(summary.has('plastic')).toBe(false);
  });

  test('excludes children of a checked parent', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    toggleNode('helmet', 'helmet__refined__0'); // check craftable parent
    const summary = computeMaterialsSummary(mockData);
    // Metal is child of refined — should be excluded
    expect(summary.has('metal')).toBe(false);
    // Plastic is unaffected
    expect(summary.has('plastic')).toBe(true);
  });

  test('combines quantities of the same ingredient across recipes', () => {
    // Pin two recipes both needing plastic
    pinRecipe('helmet',   'Helmet',   makeNodes());
    pinRecipe('helmet2',  'Helmet 2', makeNodes());
    const summary = computeMaterialsSummary(mockData);
    expect(summary.get('plastic').qty).toBe(6); // 3 + 3
  });

  test('applies multiplier to base ingredient quantities', () => {
    pinRecipe('helmet', 'Helmet', makeNodes());
    setMultiplier('helmet', 3);
    const summary = computeMaterialsSummary(mockData);
    // plastic qty is 3 * multiplier 3 = 9
    expect(summary.get('plastic').qty).toBe(9);
    // metal qty is 2 * multiplier 3 = 6
    expect(summary.get('metal').qty).toBe(6);
  });

  test('returns empty map when nothing is pinned', () => {
    const summary = computeMaterialsSummary(mockData);
    expect(summary.size).toBe(0);
  });
});
