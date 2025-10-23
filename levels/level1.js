// Level 1 — hjkl-only maze
export default {
  id: 1,
  map: "levels/level1.txt",
  title: "Level 1 — hjkl-only maze",
  desc: "Type <strong>:start</strong> to begin. Then reach <strong>G</strong> using <strong>h j k l</strong>.",
  enableMotions: false, // w/e/b disabled here
  onLoad(ctx) {
    ctx.setHint(
      "Press <strong>:</strong> to open the command line, type <strong>start</strong>, then Enter.",
    );
  },
  onStart(ctx) {
    ctx.setHint("Move with h j k l.");
  },
  onComplete(ctx) {
    ctx.toast("Level 1 complete!");
    ctx.autoNext(1000); // go to next level after 1s
  },
};
