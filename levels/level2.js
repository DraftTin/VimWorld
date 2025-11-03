// Level 2 — word motions
export default {
  id: 2,
  title: "Level 2 — word motions",
  desc: `Word Motions Unlocked. Try to use "w e b" motions`,
  hint: `
“These aren't ordinary paths,” the old robot says.<br/><br/>

“You can walk letter by letter if you wish... but real adventurers 
leap by words.”<br/><br/>

He winks. “Three secret keys — w, e, b — might just help you skip ahead.” <br/><br/>

Type :help for useful information.
`,
  rows: [
    "🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊",
    "🌊🌊  🌊🌊This Lev🪨l 🌊🌊is🌊🌊🌊🌊🌊🌊",
    "🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊",
    "🌊🪨to🌊🌊teach🪨 🌊🌊 peop🪨e🌊🌊🌊🌊🌊",
    "🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊",
    "🌊🪨how to🌊🌊🌊use🪨🌊w🪨rd-b🪨sed🌊",
    "🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊",
    "🌊motio🪨s🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊!! 🚪🌊🌊🌊🌊🌊",
  ],
  player: { x: 2, y: 1 },
  hasCorruption: false,
  allowedKeys: new Set(["h", "j", "k", "l", "b", "w", "e"]),
  winCon(state) {
    const { grid, player } = state;
    return grid[player.y] && grid[player.y][player.x] == "🚪";
  },
};
