// Level 2 — word motions
export default {
  id: 2,
  map: "levels/level2.txt",
  title: "Level 2 — word motions",
  desc: "Type <strong>:start</strong>, then use <strong>w</strong>/<strong>e</strong>/<strong>b</strong> to jump by words (plus <strong>h j k l</strong>).",
  enableMotions: true, // w/e/b enabled
  onLoad(ctx) {
    ctx.setHint(
      "Tip: w→start of next word, e→end of word, b→start of previous word.",
    );
  },
  onStart(ctx) {
    ctx.setHint("Use hjkl and w/e/b to navigate words. Reach G.");
  },
  onComplete(ctx) {
    ctx.toast("Nice! You mastered word motions.");
    ctx.autoNext(1000);
  },
};
