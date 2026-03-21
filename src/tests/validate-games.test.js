/**
 * validate-games.test.js
 *
 * Tests for the GitHub Action validation script.
 *
 * Happy-path tests use the real src/games/breathedge and src/games/subnautica
 * folders as fixtures — they always exist, have known-good structure, and
 * exercise the validator against real data.
 *
 * Tests that need broken/missing files use temporary directories.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, copyFileSync } from 'fs';
import { join, resolve }                                               from 'path';
import { tmpdir }                                                      from 'os';
import {
  validateGameFolder,
  buildReport,
  REQUIRED_FILES,
} from '../../.github/scripts/validate-games.js';

const REAL_GAMES_DIR  = resolve('src/games');
const BREATHEDGE_DIR  = join(REAL_GAMES_DIR, 'breathedge');

// ── Temp dir helpers (only used for failure-case tests) ──────

let tmpDir;

function gameDir(gameId) { return join(tmpDir, gameId); }

function writeFile(gameId, filename, content) {
  writeFileSync(join(gameDir(gameId), filename), content, 'utf8');
}

/**
 * Creates a valid game folder in tmpDir by copying all required files
 * from the real breathedge folder, then allows individual files to be
 * overwritten for negative testing.
 */
function makeGameFromBreathedge(gameId = 'test-game') {
  mkdirSync(gameDir(gameId), { recursive: true });
  for (const file of REQUIRED_FILES) {
    copyFileSync(join(BREATHEDGE_DIR, file), join(gameDir(gameId), file));
  }
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'cc-validate-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// ============================================================
// Happy path — real game folders
// ============================================================

describe('real game folders', () => {
  test('breathedge passes validation with no errors', () => {
    const result = validateGameFolder('breathedge', REAL_GAMES_DIR);
    expect(result.errors).toHaveLength(0);
  });

  test('breathedge returns correct stats', () => {
    const result = validateGameFolder('breathedge', REAL_GAMES_DIR);
    expect(result.stats.gameName).toBe('Breathedge');
    expect(result.stats.recipeCount).toBeGreaterThan(0);
    expect(result.stats.typeCount).toBeGreaterThan(0);
  });

  test('subnautica passes validation with no errors', () => {
    const result = validateGameFolder('subnautica', REAL_GAMES_DIR);
    expect(result.errors).toHaveLength(0);
  });

  test('subnautica returns correct stats', () => {
    const result = validateGameFolder('subnautica', REAL_GAMES_DIR);
    expect(result.stats.gameName).toBe('Subnautica');
    expect(result.stats.recipeCount).toBeGreaterThan(0);
    expect(result.stats.typeCount).toBeGreaterThan(0);
  });
});

// ============================================================
// Folder existence
// ============================================================

describe('folder existence', () => {
  test('returns error if game folder does not exist', () => {
    const result = validateGameFolder('nonexistent', tmpDir);
    // The error message always uses src/games/ regardless of the gamesDir
    // argument — check the gameId portion which is always present
    expect(result.errors.some(e => e.includes('nonexistent') && e.includes('does not exist'))).toBe(true);
  });
});

// ============================================================
// Required files
// ============================================================

describe('required files', () => {
  test.each(REQUIRED_FILES)('errors when %s is missing', (filename) => {
    makeGameFromBreathedge();
    rmSync(join(gameDir('test-game'), filename));
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.errors).toContain(`Missing required file: \`${filename}\``);
  });
});

// ============================================================
// game-config.json
// ============================================================

describe('game-config.json', () => {
  test('errors on invalid JSON', () => {
    makeGameFromBreathedge();
    writeFile('test-game', 'game-config.json', '{ invalid json {{');
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.errors).toContain('`game-config.json` is not valid JSON.');
  });

  test.each(['name', 'recipes', 'recipeTypes', 'theme', 'header'])(
    'errors when %s field is missing',
    (field) => {
      makeGameFromBreathedge();
      const config = {
        name: 'Test Game', recipes: 'recipes.json',
        recipeTypes: 'recipe-type.json', theme: 'theme.css', header: 'header.html',
      };
      delete config[field];
      writeFile('test-game', 'game-config.json', JSON.stringify(config));
      const result = validateGameFolder('test-game', tmpDir);
      expect(result.errors).toContain(
        `\`game-config.json\` is missing required field: \`${field}\``
      );
    }
  );

  test('errors if referenced recipes file does not exist', () => {
    makeGameFromBreathedge();
    writeFile('test-game', 'game-config.json', JSON.stringify({
      name: 'Test', recipes: 'missing.json',
      recipeTypes: 'recipe-type.json', theme: 'theme.css', header: 'header.html'
    }));
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.errors.some(e => e.includes('missing.json') && e.includes('not found'))).toBe(true);
  });
});

// ============================================================
// recipe-type.json
// ============================================================

describe('recipe-type.json', () => {
  test('errors on invalid JSON', () => {
    makeGameFromBreathedge();
    writeFile('test-game', 'recipe-type.json', 'not json');
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.errors).toContain('`recipe-type.json` is not valid JSON.');
  });

  test('errors when empty', () => {
    makeGameFromBreathedge();
    writeFile('test-game', 'recipe-type.json', '{}');
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.errors).toContain(
      '`recipe-type.json` must contain at least one type entry.'
    );
  });
});

// ============================================================
// recipes.json
// ============================================================

describe('recipes.json', () => {
  test('errors on invalid JSON', () => {
    makeGameFromBreathedge();
    writeFile('test-game', 'recipes.json', '{ bad }');
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.errors).toContain('`recipes.json` is not valid JSON.');
  });

  test('errors when empty', () => {
    makeGameFromBreathedge();
    writeFile('test-game', 'recipes.json', '{}');
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.errors).toContain(
      '`recipes.json` must contain at least one recipe entry.'
    );
  });

  test('errors when recipe is missing name field', () => {
    makeGameFromBreathedge();
    writeFile('test-game', 'recipes.json', JSON.stringify({
      iron: { type: 'RawMaterial', ingredients: [] }
    }));
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.errors).toContain("Recipe `iron` is missing a `name` field.");
  });

  test('errors when ingredients is not an array', () => {
    makeGameFromBreathedge();
    writeFile('test-game', 'recipes.json', JSON.stringify({
      iron: { name: 'Iron', type: 'RawMaterial', ingredients: null }
    }));
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.errors).toContain(
      "Recipe `iron` has an invalid `ingredients` field (must be an array)."
    );
  });

  test('warns when ingredient key has no recipe entry', () => {
    makeGameFromBreathedge();
    writeFile('test-game', 'recipes.json', JSON.stringify({
      plate: { name: 'Plate', type: 'Raw Materials', ingredients: [{ key: 'rawIron', qty: 2 }] }
    }));
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.warnings.some(w => w.includes('rawIron'))).toBe(true);
  });

  test('warns when recipe uses a type not in recipe-type.json', () => {
    makeGameFromBreathedge();
    writeFile('test-game', 'recipes.json', JSON.stringify({
      iron: { name: 'Iron', type: 'UnknownType', ingredients: [] }
    }));
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.warnings.some(w => w.includes('UnknownType'))).toBe(true);
  });

  test('warns when recipe has no type field', () => {
    makeGameFromBreathedge();
    writeFile('test-game', 'recipes.json', JSON.stringify({
      iron: { name: 'Iron', ingredients: [] }
    }));
    const result = validateGameFolder('test-game', tmpDir);
    expect(result.warnings.some(w => w.includes("no `type` field"))).toBe(true);
  });
});

// ============================================================
// Game ID format
// ============================================================

describe('game ID format', () => {
  test('warns when game ID contains uppercase letters', () => {
    makeGameFromBreathedge('TestGame');
    const result = validateGameFolder('TestGame', tmpDir);
    expect(result.warnings.some(w => w.includes('lowercase'))).toBe(true);
  });

  test('does not warn for valid kebab-case ID', () => {
    makeGameFromBreathedge('my-game');
    const result = validateGameFolder('my-game', tmpDir);
    expect(result.warnings.every(w => !w.includes('lowercase'))).toBe(true);
  });
});

// ============================================================
// buildReport
// ============================================================

describe('buildReport', () => {
  test('contains the validation marker comment', () => {
    const report = buildReport({
      breathedge: { errors: [], warnings: [], stats: { gameName: 'Breathedge', recipeCount: 119, typeCount: 9 } }
    });
    expect(report).toContain('<!-- crafting-companion-validation -->');
  });

  test('shows ✅ for a passing game', () => {
    const report = buildReport({
      breathedge: { errors: [], warnings: [], stats: { gameName: 'Breathedge', recipeCount: 119, typeCount: 9 } }
    });
    expect(report).toContain('✅ `breathedge`');
    expect(report).toContain('Everything looks great!');
  });

  test('shows ❌ for a failing game', () => {
    const report = buildReport({
      'bad-game': { errors: ['Missing required file: `recipes.json`'], warnings: [] }
    });
    expect(report).toContain('❌ `bad-game`');
    expect(report).toContain('Missing required file');
  });

  test('includes warnings section when warnings exist', () => {
    const report = buildReport({
      subnautica: { errors: [], warnings: ['Some ingredient has no recipe entry.'],
        stats: { gameName: 'Subnautica', recipeCount: 170, typeCount: 11 } }
    });
    expect(report).toContain('**Warnings**');
    expect(report).toContain('Some ingredient has no recipe entry.');
  });

  test('handles multiple games in one report', () => {
    const report = buildReport({
      breathedge: { errors: [], warnings: [], stats: { gameName: 'Breathedge', recipeCount: 119, typeCount: 9 } },
      'bad-game':  { errors: ['Bad config.'], warnings: [] },
    });
    expect(report).toContain('✅ `breathedge`');
    expect(report).toContain('❌ `bad-game`');
  });

  test('real breathedge data produces a passing report', () => {
    const result = validateGameFolder('breathedge', REAL_GAMES_DIR);
    const report = buildReport({ breathedge: result });
    expect(report).toContain('✅ `breathedge`');
    expect(report).toContain('Breathedge');
  });
});
