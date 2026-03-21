#!/usr/bin/env node
/**
 * validate-games.js
 *
 * Validates one or more game folders submitted via Pull Request.
 * Core logic is exported for unit testing.
 * CLI entry point only runs when executed directly.
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { writeFileSync }                       from 'fs';
import { join, resolve }                       from 'path';
import { tmpdir }                              from 'os';

export const GAMES_DIR      = resolve('src/games');
export const REPORT_PATH    = join(tmpdir(), 'validation-report.md');
export const REQUIRED_FILES = [
  'game-config.json', 'recipe-type.json',
  'recipes.json', 'theme.css', 'header.html'
];

// ============================================================
// Validation logic (exported for testing)
// ============================================================

export function validateGameFolder(gameId, gamesDir = GAMES_DIR) {
  const errors   = [];
  const warnings = [];
  const dir      = join(gamesDir, gameId);

  // 1. Folder must exist
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    errors.push(`Folder \`src/games/${gameId}/\` does not exist.`);
    return { errors, warnings };
  }

  // 2. All required files must be present
  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(dir, file))) {
      errors.push(`Missing required file: \`${file}\``);
    }
  }

  if (errors.length) return { errors, warnings };

  // 3. game-config.json must be valid JSON with required fields
  let config;
  try {
    config = JSON.parse(readFileSync(join(dir, 'game-config.json'), 'utf8'));
  } catch {
    errors.push('`game-config.json` is not valid JSON.');
    return { errors, warnings };
  }

  for (const key of ['name', 'recipes', 'recipeTypes', 'theme', 'header']) {
    if (!config[key]) errors.push(`\`game-config.json\` is missing required field: \`${key}\``);
  }

  if (config.recipes     && !existsSync(join(dir, config.recipes)))
    errors.push(`\`game-config.json\` references \`${config.recipes}\` but file not found.`);
  if (config.recipeTypes && !existsSync(join(dir, config.recipeTypes)))
    errors.push(`\`game-config.json\` references \`${config.recipeTypes}\` but file not found.`);
  if (config.theme       && !existsSync(join(dir, config.theme)))
    errors.push(`\`game-config.json\` references \`${config.theme}\` but file not found.`);
  if (config.header      && !existsSync(join(dir, config.header)))
    errors.push(`\`game-config.json\` references \`${config.header}\` but file not found.`);

  // 4. recipe-type.json must be valid JSON with at least one entry
  let recipeTypes;
  try {
    recipeTypes = JSON.parse(readFileSync(join(dir, config.recipeTypes || 'recipe-type.json'), 'utf8'));
  } catch {
    errors.push('`recipe-type.json` is not valid JSON.');
    return { errors, warnings };
  }

  if (!recipeTypes || typeof recipeTypes !== 'object' || !Object.keys(recipeTypes).length) {
    errors.push('`recipe-type.json` must contain at least one type entry.');
  }

  // 5. recipes.json must be valid JSON with at least one entry
  let recipes;
  try {
    recipes = JSON.parse(readFileSync(join(dir, config.recipes || 'recipes.json'), 'utf8'));
  } catch {
    errors.push('`recipes.json` is not valid JSON.');
    return { errors, warnings };
  }

  if (!recipes || typeof recipes !== 'object' || !Object.keys(recipes).length) {
    errors.push('`recipes.json` must contain at least one recipe entry.');
    return { errors, warnings };
  }

  // 6. Validate recipe structure and cross-references
  const recipeKeys   = new Set(Object.keys(recipes));
  const typeKeys     = new Set(Object.keys(recipeTypes));
  let   malformed    = 0;
  const missingRefs  = new Set();
  const unknownTypes = new Set();

  for (const [key, recipe] of Object.entries(recipes)) {
    if (!recipe || typeof recipe !== 'object') { malformed++; continue; }
    if (!recipe.name) errors.push(`Recipe \`${key}\` is missing a \`name\` field.`);
    if (recipe.type === undefined) {
      warnings.push(`Recipe \`${key}\` has no \`type\` field — it won't appear in type filtering.`);
    } else if (!typeKeys.has(String(recipe.type))) {
      unknownTypes.add(String(recipe.type));
    }
    if (!Array.isArray(recipe.ingredients)) {
      errors.push(`Recipe \`${key}\` has an invalid \`ingredients\` field (must be an array).`);
      continue;
    }
    for (const ing of recipe.ingredients) {
      if (!ing || typeof ing !== 'object' || !ing.key) continue;
      if (!recipeKeys.has(ing.key))
        missingRefs.add(`\`${ing.key}\` (referenced in \`${key}\`)`);
    }
  }

  if (malformed > 0) errors.push(`${malformed} recipe(s) have invalid structure.`);
  for (const ref of missingRefs)
    warnings.push(`Ingredient ${ref} has no recipe entry — this is fine for raw materials.`);
  for (const t of unknownTypes)
    warnings.push(`Recipe type \`${t}\` is not defined in \`recipe-type.json\`.`);

  // 7. game ID format check
  if (!/^[a-z0-9-]+$/.test(gameId))
    warnings.push(`Game folder name \`${gameId}\` should be lowercase with hyphens only.`);

  return {
    errors,
    warnings,
    stats: {
      recipeCount: Object.keys(recipes).length,
      typeCount:   Object.keys(recipeTypes).length,
      gameName:    config.name,
    }
  };
}

export function buildReport(results) {
  const lines = ['<!-- crafting-companion-validation -->'];
  lines.push('## 🎮 Game Submission Validation\n');

  for (const [gameId, result] of Object.entries(results)) {
    const { errors, warnings, stats } = result;
    const passed = errors.length === 0;

    lines.push(`### ${passed ? '✅' : '❌'} \`${gameId}\`\n`);
    if (stats) lines.push(`**${stats.gameName}** — ${stats.recipeCount} recipes, ${stats.typeCount} types\n`);

    if (errors.length) {
      lines.push('**Errors** (must fix before merging):');
      for (const e of errors) lines.push(`- ${e}`);
      lines.push('');
    }
    if (warnings.length) {
      lines.push('**Warnings** (review recommended):');
      for (const w of warnings) lines.push(`- ${w}`);
      lines.push('');
    }
    if (passed && !warnings.length) lines.push('Everything looks great! 🚀\n');
  }

  lines.push('---');
  lines.push('*Validated by the Crafting Companion game submission bot.*');
  return lines.join('\n');
}

// ============================================================
// CLI entry point — only runs when executed directly
// ============================================================

if (process.argv[1] && process.argv[1].endsWith('validate-games.js')) {
  const gameIds = (process.argv[2] || '').split(',').map(s => s.trim()).filter(Boolean);

  if (!gameIds.length) {
    console.log('No game IDs provided — nothing to validate.');
    process.exit(0);
  }

  const results = {};
  let anyFailed = false;

  for (const gameId of gameIds) {
    results[gameId] = validateGameFolder(gameId);
    if (results[gameId].errors.length) anyFailed = true;
  }

  const report = buildReport(results);
  writeFileSync(REPORT_PATH, report);
  console.log(report);
  process.exit(anyFailed ? 1 : 0);
}
