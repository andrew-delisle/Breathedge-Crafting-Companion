// /scripts/main.js

import { getColorForLevel } from './utils.js';

let data = {}; // populated dynamically

function expandIngredientsDisplay(key, level = 0, visited = new Set(), multiplier = 1) {
  if (!data[key] || visited.has(key)) return [];
  visited.add(key);
  let result = [];
  data[key].ingredients.forEach(item => {
    const match = item.match(/^(.+?)\s*x(\d+)$/i);
    let name, qty;
    if (match) {
      name = match[1].trim();
      qty = parseInt(match[2]);
    } else {
      name = item.trim();
      qty = 1;
    }
    const totalQty = qty * multiplier;
    result.push({
      text: `${name}${totalQty > 1 ? ` x${totalQty}` : ''}`,
      level: level
    });
    const subKey = getKeyByName(name);
    if (subKey) {
      const subIngredients = expandIngredientsDisplay(
        subKey,
        level + 1,
        new Set(visited),
        totalQty
      );
      result = result.concat(subIngredients);
    }
  });
  return result;
}

function getKeyByName(name) {
  for (const key in data) {
    if (data[key].name.toLowerCase() === name.toLowerCase()) {
      return key;
    }
  }
  return null;
}

function renderList() {
  const search = document.getElementById("searchBox").value.toLowerCase();
  const type = document.getElementById("typeFilter").value;
  const container = document.getElementById("recipeList");
  container.innerHTML = "";
  for (const key in data) {
    const recipe = data[key];
    if (
      (type === "all" || recipe.type.toString() === type) &&
      recipe.name.toLowerCase().includes(search)
    ) {
      try {
        const expanded = expandIngredientsDisplay(key);
        const expandedHtml = expanded.map(line => {
          const color = getColorForLevel(line.level);
          return `<div class="ingredient" style="color:${color}; padding-left:${line.level * 20}px">
            <input type="checkbox"> <label>${line.text}</label></div>`;
        }).join("");
        const html = `<h2>${recipe.name}</h2>${expandedHtml}`;
        const box = document.createElement("div");
        box.classList.add("ingredients");
        box.innerHTML = html;
        container.appendChild(box);
      } catch (err) {
        console.error(`Error rendering recipe: ${recipe.name}`, err);
      }
    }
  }
}

async function init() {
  try {
    const res = await fetch('./games/breathedge/recipes.json');
    data = await res.json();
    document.getElementById("searchBox").addEventListener("input", renderList);
    document.getElementById("typeFilter").addEventListener("change", renderList);
    renderList();
  } catch (err) {
    console.error('Failed to load recipe data', err);
  }
}

init();

export { expandIngredientsDisplay, renderList };
