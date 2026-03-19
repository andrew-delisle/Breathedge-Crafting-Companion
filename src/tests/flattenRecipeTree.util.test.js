import { flattenRecipeTree } from '../scripts/lib/recipe-utils.js';
import * as loggerModule from '../scripts/lib/logger.js';
import { describe, test, expect, beforeEach, vi } from 'vitest';

const mockData = {
  helmet: {
    name: "Helmet",
    ingredients: [
      { key: "plastic", qty: 2 },
      { key: "metal", qty: 1 }
    ]
  },
  plastic: { name: "Plastic", ingredients: [] },
  metal:   { name: "Metal",   ingredients: [] }
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('flattenRecipeTree', () => {
  test('flattens a basic recipe correctly', () => {
    const result = flattenRecipeTree(mockData, "helmet");
    expect(result).toEqual([
      expect.objectContaining({ text: "Plastic x2", level: 0, isBase: true }),
      expect.objectContaining({ text: "Metal",      level: 0, isBase: true }),
    ]);
  });

  test('each node has required pin metadata fields', () => {
    const result = flattenRecipeTree(mockData, "helmet");
    for (const node of result) {
      expect(node).toHaveProperty('nodeId');
      expect(node).toHaveProperty('ingredientKey');
      expect(node).toHaveProperty('qty');
      expect(node).toHaveProperty('isBase');
      expect(node).toHaveProperty('level');
      expect(node).toHaveProperty('text');
    }
  });

  test('top-level nodes have null parentNodeId', () => {
    const result = flattenRecipeTree(mockData, "helmet");
    const topLevel = result.filter(n => n.level === 0);
    for (const node of topLevel) {
      expect(node.parentNodeId).toBeNull();
    }
  });

  test('child nodes reference their parent nodeId', () => {
    const nestedData = {
      helmet: { name: "Helmet", ingredients: [{ key: "refined", qty: 1 }] },
      refined: { name: "Refined Metal", ingredients: [{ key: "metal", qty: 2 }] },
      metal:   { name: "Metal", ingredients: [] }
    };
    const result = flattenRecipeTree(nestedData, "helmet");
    const refined = result.find(n => n.ingredientKey === 'refined');
    const metal   = result.find(n => n.ingredientKey === 'metal');
    expect(metal.parentNodeId).toBe(refined.nodeId);
  });

  test('isBase is false for ingredients that have sub-recipes', () => {
    const nestedData = {
      helmet:  { name: "Helmet",        ingredients: [{ key: "refined", qty: 1 }] },
      refined: { name: "Refined Metal", ingredients: [{ key: "metal",   qty: 2 }] },
      metal:   { name: "Metal",         ingredients: [] }
    };
    const result = flattenRecipeTree(nestedData, "helmet");
    const refined = result.find(n => n.ingredientKey === 'refined');
    const metal   = result.find(n => n.ingredientKey === 'metal');
    expect(refined.isBase).toBe(false);
    expect(metal.isBase).toBe(true);
  });

  test('skips ingredients with invalid keys (falls back to key as name)', () => {
    const badData = {
      helmet: { name: "Helmet", ingredients: [{ key: "unknown", qty: 3 }] }
    };
    const result = flattenRecipeTree(badData, "helmet");
    expect(result).toEqual([
      expect.objectContaining({ text: "unknown x3", level: 0 })
    ]);
  });

  test('handles qty of 0 or negative gracefully', () => {
    const badQtyData = {
      helmet: {
        name: "Helmet",
        ingredients: [{ key: "plastic", qty: 0 }, { key: "metal", qty: -2 }]
      },
      plastic: { name: "Plastic", ingredients: [] },
      metal:   { name: "Metal",   ingredients: [] }
    };
    const result = flattenRecipeTree(badQtyData, "helmet");
    expect(result).toEqual([
      expect.objectContaining({ text: "Plastic", level: 0 }),
      expect.objectContaining({ text: "Metal",   level: 0 }),
    ]);
  });

  test('returns empty for empty ingredient arrays', () => {
    const emptyData = { helmet: { name: "Helmet", ingredients: [] } };
    const result = flattenRecipeTree(emptyData, "helmet");
    expect(result).toEqual([]);
  });

  test('skips null or invalid ingredient objects', () => {
    const badData = {
      helmet: { name: "Helmet", ingredients: [null, undefined, "bad", 123] }
    };
    const result = flattenRecipeTree(badData, "helmet");
    expect(result).toEqual([]);
  });

  test('handles circular references gracefully', () => {
    const circularData = {
      circ: { name: "Circular", ingredients: [{ key: "circ", qty: 1 }] }
    };
    const warnSpy = vi.spyOn(loggerModule.logger, 'warn').mockImplementation(() => {});
    const result = flattenRecipeTree(circularData, "circ");
    expect(result).toEqual([
      expect.objectContaining({ text: "Circular", level: 0 })
    ]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Circular reference detected"));
  });

  test('returns empty for invalid data argument', () => {
    expect(flattenRecipeTree(null,  "helmet")).toEqual([]);
    expect(flattenRecipeTree("bad", "helmet")).toEqual([]);
  });

  test('returns empty for invalid key argument', () => {
    expect(flattenRecipeTree(mockData, null)).toEqual([]);
    expect(flattenRecipeTree(mockData, 123)).toEqual([]);
  });
});
