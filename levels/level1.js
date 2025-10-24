// levels/level1.js
export default {
  id: 1,
  title: "Level 1 — hjkl-only maze",
  desc: "Type <strong>:start</strong> to begin. Then reach <strong>🚪</strong> with <strong>h j k l</strong>.",
  hint: `
Press <strong>:</strong> to open command line, then type <strong>start</strong>.<br/><br/>
Type :help for useful information.
`,
  // map
  rows: [
    "🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨",
    "🪨🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🪨",
    "🪨🌊      🪨        🪨    🌊🪨",
    "🪨🌊 🪨🪨🪨 🪨🪨🪨🪨🪨 🪨🪨🪨 🪨 🪨🪨🪨🌊🪨",
    "🪨🌊   🪨     🪨   🪨 🪨   🪨🌊🪨",
    "🪨🌊🪨🪨 🪨 🪨🪨🪨 🪨 🪨 🪨 🪨🪨🪨 🪨🌊🪨",
    "🪨🌊   🪨   🪨   🪨 🪨     🪨🌊🪨",
    "🪨🌊 🪨🪨🪨🪨🪨 🪨🪨🪨🪨🪨🪨🪨 🪨🪨🪨🪨🪨🌊🪨",
    "🪨🌊       🪨       🪨    🌊🪨",
    "🪨🌊🪨🪨🪨🪨🪨🪨🪨🪨 🪨🪨🪨🪨🪨🪨🪨 🪨🪨 🌊🪨",
    "🪨🌊🚪        🪨          🌊🪨",
    "🪨🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🪨",
    "🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨🪨",
  ],
  player: { x: 2, y: 2 }, // initial position (overlay only)
  allowedKeys: new Set(["h", "j", "k", "l"]),
};
