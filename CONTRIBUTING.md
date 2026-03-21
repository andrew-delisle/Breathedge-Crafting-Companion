# Contributing a Game

Thanks for wanting to add a game to the Crafting Companion! This guide walks you through everything from creating the config files to opening a Pull Request.

---

## Overview

Each game lives in its own folder under `src/games/`. The app automatically picks up any valid game folder — you don't need to edit any JavaScript. You just need five files in the right format.

```
src/games/
  your-game/
    game-config.json    ← points to the other files
    recipes.json        ← all items and their ingredients
    recipe-type.json    ← the filter categories
    theme.css           ← visual styling
    header.html         ← ASCII logo
```

---

## The Easy Way — Use the Config Builder

Open `tools/game-config-builder.html` in your browser (or visit it on GitHub Pages). The tool walks you through all four steps and exports a ready-to-use zip.

You still need to supply the recipe data — the tool provides the structure, not the game data itself. Good sources for recipe data:

- The game's official wiki
- Community-maintained wikis (Fandom, etc.)
- In-game crafting menus

---

## The Manual Way

If you prefer to write the files yourself, here's the exact format for each one.

### `game-config.json`

```json
{
  "name": "No Man's Sky",
  "recipes": "recipes.json",
  "recipeTypes": "recipe-type.json",
  "theme": "theme.css",
  "header": "header.html"
}
```

| Field | Description |
|---|---|
| `name` | Display name shown in the game dropdown |
| `recipes` | Filename of your recipes file |
| `recipeTypes` | Filename of your recipe types file |
| `theme` | Filename of your CSS theme |
| `header` | Filename of your header HTML |

---

### `recipe-type.json`

A flat object mapping type keys to display labels. These appear in the **Type** filter dropdown.

```json
{
  "RawMaterial": "Raw Material",
  "Component":   "Component",
  "Technology":  "Technology",
  "Product":     "Product"
}
```

The key and value can be the same string — the key is what gets stored on each recipe, the value is what the user sees.

---

### `recipes.json`

A flat object where each key is a unique camelCase identifier for an item.

```json
{
  "iron": {
    "name": "Iron",
    "type": "RawMaterial",
    "ingredients": []
  },
  "ironPlate": {
    "name": "Iron Plate",
    "type": "Component",
    "ingredients": [
      { "key": "iron", "qty": 4 }
    ]
  },
  "advancedCircuit": {
    "name": "Advanced Circuit",
    "type": "Component",
    "ingredients": [
      { "key": "ironPlate", "qty": 2 },
      { "key": "copper",    "qty": 3 }
    ]
  }
}
```

**Rules:**
- Every item in the game should have an entry, including raw materials (use `"ingredients": []`)
- The `type` value must match a key in `recipe-type.json`
- Ingredient `key` values must reference other keys in the same file
- `qty` values must be positive integers
- Keys should be camelCase with no spaces or special characters

---

### `theme.css`

The easiest approach is to copy `src/games/breathedge/theme.css` or `src/games/subnautica/theme.css` and change the colour values in the `:root` block at the top. The CSS classes must remain the same — only the variable values need changing.

The config builder tool generates a complete theme from a colour picker if you don't want to write CSS manually.

Key variables to change:

```css
:root {
  --bg:            #08101a;  /* page background */
  --bg-panel:      #0d1a26;  /* card backgrounds */
  --heading-color: #ffcc00;  /* recipe titles, pin buttons */
  --blue:          #1e90ff;  /* accent colour */
  --text:          #d0e8f5;  /* body text */
}
```

---

### `header.html`

The ASCII art banner shown at the top of the page. Copy the structure from an existing header and replace the ASCII art with your own.

```html
<div class="logo-wrapper" id="headerContainer">
<pre class="logo-scaler">
YOUR ASCII ART HERE
</pre>
</div>
```

Good tools for generating ASCII art from text:
- [patorjk.com/software/taag](https://patorjk.com/software/taag) — the most popular, many fonts
- [ascii-art-generator.org](https://www.ascii-art-generator.org)

The `logo-scaler` class handles responsive scaling automatically — you don't need to worry about sizing.

---

## Naming your folder

The folder name becomes the game's internal ID. Use lowercase letters, numbers, and hyphens only:

| ✅ Good | ❌ Bad |
|---|---|
| `no-mans-sky` | `No Man's Sky` |
| `subnautica` | `Subnautica_Game` |
| `satisfactory` | `satisfactory v2` |

---

## Submitting a Pull Request

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. Create a new branch: `git checkout -b add-your-game-name`
4. Add your game folder to `src/games/`
5. Commit and push your branch
6. Open a **Pull Request** against `main`

When you open the PR, a bot will automatically validate your folder and post a comment with the results. If there are errors, fix them and push again — the comment will update automatically.

You do **not** need to edit `game.list.json` — it's regenerated automatically when your PR is merged.

---

## Validation checklist

The bot checks all of the following. You can also run the validator locally:

```bash
node .github/scripts/validate-games.js your-game-id
```

- [ ] Folder exists at `src/games/<your-game-id>/`
- [ ] All five required files are present
- [ ] `game-config.json` is valid JSON with all required fields
- [ ] All files referenced in `game-config.json` exist
- [ ] `recipe-type.json` is valid JSON with at least one entry
- [ ] `recipes.json` is valid JSON with at least one entry
- [ ] Every recipe has a `name` field
- [ ] Every recipe's `ingredients` is an array
- [ ] Every recipe's `type` matches a key in `recipe-type.json`

---

## Questions?

Open an issue and tag it `game-submission`. We're happy to help with data formatting, CSS theming, or anything else.
