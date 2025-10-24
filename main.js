import { handleKey, loadLevel, state } from "./game.js";

// ---------- boot ----------
window.addEventListener("keydown", handleKey);

loadLevel(state.currentLevel).catch((err) => {
  document.getElementById("game").textContent =
    "Level load error:\n" + err.message;
});
