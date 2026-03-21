# 📜 Changelog

## v3.2.0 – 2026-03-21

### ✨ New Features
- **localStorage persistence** — pinned recipes, checked ingredients, and quantity multipliers all survive page refreshes
- **Quantity multiplier** — each pinned recipe has a `×` input in its header; the materials summary scales all counts automatically
- **Game Config Builder** — browser-based tool at `tools/game-config-builder.html` for creating new game configs with a colour-picker theme generator and zip export
- **GitHub Actions** — automated PR validation and `game.list.json` regeneration on merge, enabling community game submissions
- **Contributing guide** — `CONTRIBUTING.md` with full file format reference, naming conventions, and PR process

### 🔧 Code Quality
- Extracted core logic in GitHub Action scripts into exported functions for unit testing
- Added 60+ tests for `validate-games.js` and `generate-game-list.js`
- Vitest `environmentMatchGlobs` added so Node.js scripts run in the correct test environment
- Fixed Windows compatibility: replaced hardcoded `/tmp/` path with `os.tmpdir()`

### 🐛 Bug Fixes
- Fixed `appState.gameId` never being set after game load (game-loader was setting `appState.currentGame` instead), which prevented localStorage persistence from saving anything
- Fixed test failures caused by enriched `flattenRecipeTree` node shape
- Fixed `version-display.test.js` asserting on `console.warn` instead of `logger.warn`

---

## v3.1.0 – 2026-03-19

### ✨ New Features
- **Pin recipes** — pin any recipe to the top of the page for quick reference
- **Materials summary** — sticky panel showing a consolidated list of all base ingredients needed across all pinned recipes
- **Checkbox tracking** — check off ingredients as you gather them; checking a craftable sub-recipe disables and removes all its children from the summary automatically
- **Collapse/expand toggle** — all recipe cards in the browse list are now collapsed by default with a toggle to expand; pinned cards have their own independent toggle
- **Clear All** — single button to unpin all recipes and reset all state
- **Per-recipe Remove** — remove a single pinned recipe without affecting others

### 🐛 Bug Fixes
- Fixed duplicate event listeners stacking on the game select dropdown each time a game was loaded
- Fixed "Select a Game" option not reloading the fallback theme after a game had been selected
- Fixed pins carrying over when switching between games
- Fixed pin button remaining in "Pinned" state after using Clear All or Remove
- Fixed checkbox interaction collapsing the pinned card tree
- Fixed Subnautica theme missing all new structural styles
- Fixed `position: sticky` on materials summary being overridden by a duplicate `position: relative` declaration in the Subnautica theme
- Fixed checkboxes being stretched by the global input width rule

### 🎨 UI Polish
- New typography: **Orbitron** for display labels, **Share Tech Mono** for body text
- Constrained page to `max-width: 960px` for readability on wide screens
- Controls bar styled as a labelled HUD instrument panel
- Recipe cards use hover glow instead of animated scanline sweep
- Pinned cards distinguished with a gold left-accent bar and gradient header wash
- Materials summary styled as a green "live readout" panel distinct from recipe cards
- Custom styled checkboxes with high-contrast gold checked state
- Custom scrollbar styled to match theme accent colours
- Subnautica theme updated with full parity to Breathedge polish
- ASCII logo rendering restored to correct size and weight with strengthened glow

### 🔧 Code Quality
- Removed ~200 lines of dead/commented-out code across 8 files
- Replaced 96 raw `console.*` calls with a gated `logger.js` utility (`DEBUG` flag)
- Removed false `async` from `loadTheme`
- Moved imports from mid-file to top-level in `game-loader.js`
- Updated test suite to reflect all structural and API changes
- Added `pinState.test.js` with 20 tests covering all pin/checkbox state transitions

---

## v3.0.0 – 2025-07-20
- Major refactor of script
- Added support for games other than Breathedge

## v2.0.0 – 2025-07-07
- Major refactor of script

## v1.1.1 – 2025-07-07
- Bug fix:
    Corrected math in nested recipes.

## v1.1.0 – 2025-06-16
- New Feature:
    Nested recipes have expanded ingredient lists.
- Crafting data and UI fully functional on desktop

## v1.0.0 – 2025-06-15
- Initial release
