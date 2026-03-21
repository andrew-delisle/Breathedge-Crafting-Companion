import { describe, test, expect, beforeEach, vi } from 'vitest';
import { savePinState, loadPinState, clearPinState } from '../state/persistence.js';
import { pinState, unpinAll, pinRecipe, toggleNode } from '../state/pinState.js';
import { flattenRecipeTree } from '../scripts/lib/recipe-utils.js';

vi.mock('../state/appState.js', () => ({
  appState: { gameId: 'test-game' },
}));

const mockData = {
  helmet:  { name: 'Helmet',        ingredients: [{ key: 'refined', qty: 1 }] },
  refined: { name: 'Refined Metal', ingredients: [{ key: 'metal',   qty: 2 }] },
  metal:   { name: 'Metal',         ingredients: [] },
};

beforeEach(() => {
  unpinAll();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('savePinState', () => {
  test('writes serialized pin state to localStorage', () => {
    const nodes = new Map([
      ['helmet__refined__0', {
        checked: false, disabled: false, isBase: false, qty: 1,
        ingredientKey: 'refined', text: 'Refined Metal', level: 0,
        parentNodeId: null, childNodeIds: ['helmet__refined__0/refined__metal__0']
      }],
      ['helmet__refined__0/refined__metal__0', {
        checked: true, disabled: false, isBase: true, qty: 2,
        ingredientKey: 'metal', text: 'Metal x2', level: 1,
        parentNodeId: 'helmet__refined__0', childNodeIds: []
      }],
    ]);
    pinState.pinnedRecipes.set('helmet', { name: 'Helmet', nodes, multiplier: 1 });

    savePinState('test-game', pinState);

    const raw = localStorage.getItem('pinState:test-game');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe(1);
    expect(parsed.pins.helmet.checkedNodes).toContain(
      'helmet__refined__0/refined__metal__0'
    );
  });

  test('does nothing if gameId is falsy', () => {
    savePinState(null, pinState);
    savePinState('', pinState);
    expect(localStorage.length).toBe(0);
  });

  test('does nothing if pinState is falsy', () => {
    savePinState('test-game', null);
    expect(localStorage.length).toBe(0);
  });
});

describe('loadPinState', () => {
  test('returns early if no saved state exists', () => {
    loadPinState('test-game', mockData, pinRecipe, toggleNode, pinState);
    expect(pinState.pinnedRecipes.size).toBe(0);
  });

  test('returns early if gameId is falsy', () => {
    loadPinState(null, mockData, pinRecipe, toggleNode, pinState);
    expect(pinState.pinnedRecipes.size).toBe(0);
  });

  test('rehydrates pinned recipes from saved state', () => {
    const saved = { version: 1, pins: { helmet: { checkedNodes: [], multiplier: 1 } } };
    localStorage.setItem('pinState:test-game', JSON.stringify(saved));

    loadPinState('test-game', mockData, pinRecipe, toggleNode, pinState);
    expect(pinState.pinnedRecipes.has('helmet')).toBe(true);
  });

  test('replays checked node state correctly', () => {
    // Use flattenRecipeTree to get the real nodeId — no dynamic import needed
    const flatNodes = flattenRecipeTree(mockData, 'helmet');
    const refinedNodeId = flatNodes.find(n => n.ingredientKey === 'refined')?.nodeId;

    const saved = {
      version: 1,
      pins: { helmet: { checkedNodes: [refinedNodeId], multiplier: 1 } }
    };
    localStorage.setItem('pinState:test-game', JSON.stringify(saved));

    loadPinState('test-game', mockData, pinRecipe, toggleNode, pinState);

    const recipe = pinState.pinnedRecipes.get('helmet');
    const refined = recipe?.nodes.get(refinedNodeId);
    expect(refined?.checked).toBe(true);
  });

  test('propagates disabled state to children when parent is checked on rehydrate', () => {
    const flatNodes = flattenRecipeTree(mockData, 'helmet');
    const refinedNodeId = flatNodes.find(n => n.ingredientKey === 'refined')?.nodeId;

    const saved = {
      version: 1,
      pins: { helmet: { checkedNodes: [refinedNodeId], multiplier: 1 } }
    };
    localStorage.setItem('pinState:test-game', JSON.stringify(saved));

    loadPinState('test-game', mockData, pinRecipe, toggleNode, pinState);

    const recipe = pinState.pinnedRecipes.get('helmet');
    const metalNode = [...recipe.nodes.values()].find(n => n.ingredientKey === 'metal');
    expect(metalNode?.disabled).toBe(true);
  });

  test('restores multiplier from saved state', () => {
    const saved = {
      version: 1,
      pins: { helmet: { checkedNodes: [], multiplier: 4 } }
    };
    localStorage.setItem('pinState:test-game', JSON.stringify(saved));

    loadPinState('test-game', mockData, pinRecipe, toggleNode, pinState);

    expect(pinState.pinnedRecipes.get('helmet')?.multiplier).toBe(4);
  });

  test('silently skips stale recipe keys not in current data', () => {
    const saved = {
      version: 1,
      pins: {
        helmet:  { checkedNodes: [], multiplier: 1 },
        deleted: { checkedNodes: [], multiplier: 1 },
      }
    };
    localStorage.setItem('pinState:test-game', JSON.stringify(saved));

    loadPinState('test-game', mockData, pinRecipe, toggleNode, pinState);
    expect(pinState.pinnedRecipes.has('helmet')).toBe(true);
    expect(pinState.pinnedRecipes.has('deleted')).toBe(false);
  });

  test('ignores saved state with wrong version', () => {
    const saved = { version: 99, pins: { helmet: { checkedNodes: [], multiplier: 1 } } };
    localStorage.setItem('pinState:test-game', JSON.stringify(saved));

    loadPinState('test-game', mockData, pinRecipe, toggleNode, pinState);
    expect(pinState.pinnedRecipes.size).toBe(0);
  });

  test('handles corrupt localStorage data gracefully', () => {
    localStorage.setItem('pinState:test-game', 'not-valid-json{{{{');
    expect(() => loadPinState('test-game', mockData, pinRecipe, toggleNode, pinState))
      .not.toThrow();
    expect(pinState.pinnedRecipes.size).toBe(0);
  });
});

describe('clearPinState', () => {
  test('removes the localStorage entry for a gameId', () => {
    localStorage.setItem('pinState:test-game', '{"version":1,"pins":{}}');
    clearPinState('test-game');
    expect(localStorage.getItem('pinState:test-game')).toBeNull();
  });

  test('does nothing if gameId is falsy', () => {
    expect(() => clearPinState(null)).not.toThrow();
    expect(() => clearPinState('')).not.toThrow();
  });
});
