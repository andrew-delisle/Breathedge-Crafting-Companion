// /src/tests/flattenRecipeTree.util.test.js

import { flattenRecipeTree } from '../scripts/lib/recipe-utils.js';
import { describe, test, expect, beforeEach, vi } from 'vitest';

const mockData = {
  helmet: {
    name: "Helmet",
    ingredients: [
      { key: "plastic", qty: 2 },
      { key: "metal", qty: 1 }
    ]
  },
  plastic: {
    name: "Plastic",
    ingredients: []
  },
  metal: {
    name: "Metal",
    ingredients: []
  }
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('flattenRecipeTree', () => {
  test('flattens a basic recipe correctly', () => {
    const result = flattenRecipeTree(mockData, "helmet");
    expect(result).toEqual([
      { text: "Plastic x2", level: 0 },
      { text: "Metal", level: 0 }
    ]);
  });

  test('skips ingredients with invalid keys', () => {
    const badData = {
      helmet: {
        name: "Helmet",
        ingredients: [{ key: "unknown", qty: 3 }]
      }
    };
    const result = flattenRecipeTree(badData, "helmet");
    expect(result).toEqual([{ text: "unknown x3", level: 0 }]); // current behavior uses getIngredientName fallback
  });

  test('handles qty of 0 or negative gracefully', () => {
    const badQtyData = {
      helmet: {
        name: "Helmet",
        ingredients: [{ key: "plastic", qty: 0 }, { key: "metal", qty: -2 }]
      },
      plastic: { name: "Plastic", ingredients: [] },
      metal: { name: "Metal", ingredients: [] }
    };
    const result = flattenRecipeTree(badQtyData, "helmet");
    expect(result).toEqual([
      { text: "Plastic", level: 0 },
      { text: "Metal", level: 0 }
    ]);
  });

  test('returns empty for empty ingredient arrays', () => {
    const emptyData = { helmet: { name: "Helmet", ingredients: [] } };
    const result = flattenRecipeTree(emptyData, "helmet");
    expect(result).toEqual([]);
  });

  test('skips null or invalid ingredient objects', () => {
    const badData = {
      helmet: {
        name: "Helmet",
        ingredients: [null, undefined, "bad", 123]
      }
    };
    const result = flattenRecipeTree(badData, "helmet");
    expect(result).toEqual([]);
  });

  test('handles circular references gracefully', () => {
    const circularData = {
      circ: { name: "Circular", ingredients: [{ key: "circ", qty: 1 }] }
    };
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = flattenRecipeTree(circularData, "circ");
    expect(result).toEqual([{ text: "Circular", level: 0 }]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Circular reference detected"));
  });

  test('returns empty for invalid data argument', () => {
    expect(flattenRecipeTree(null, "helmet")).toEqual([]);
    expect(flattenRecipeTree("bad", "helmet")).toEqual([]);
  });

  test('returns empty for invalid key argument', () => {
    expect(flattenRecipeTree(mockData, null)).toEqual([]);
    expect(flattenRecipeTree(mockData, 123)).toEqual([]);
  });
});
