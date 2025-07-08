// /scripts/utils.js


export function getColorForLevel(level) {
  const colors = [
    "#f2f2f2",
    "#ffcc00",
    "#ffa500",
    "#ff6666",
    "#66ccff"
  ];
  return colors[level] || "#cccccc";
}
