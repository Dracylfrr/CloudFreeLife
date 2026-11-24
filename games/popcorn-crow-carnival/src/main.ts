import "./styles.css";
import { Game } from "./game/Game";
import { GameState } from "./game/GameState";

const element = (id: string) => document.getElementById(id)!;
const dialog = document.querySelector("dialog")!;
dialog.setAttribute("aria-labelledby", "dialog-title");
const score = element("score"),
  best = element("best"),
  lives = element("lives"),
  effect = element("effect");
const play = element("play") as HTMLButtonElement;
const again = element("again");
const status = element("status");
const statuses = {
  start: "Ready to play",
  playing: "On the midway",
  paused: "Intermission",
  gameOver: "Run complete",
};
let previous: GameState | undefined;

function label(node: HTMLElement, value: string): void {
  if (node.textContent !== value) node.textContent = value;
}

function render(game: Game): void {
  label(score, String(game.points));
  label(best, game.highScore.toLocaleString());
  label(lives, "♥".repeat(game.lives));
  label(effect, game.effect);
  if (previous === game.state) return;
  document.documentElement.dataset.gameState = game.state;
  status.textContent = statuses[game.state];
  const initial = previous === undefined;
  previous = game.state;
  if (game.state === GameState.Paused || game.state === GameState.GameOver) {
    const ended = game.state === GameState.GameOver;
    element("result-title").textContent = ended
      ? "That’s all, kernel!"
      : "Intermission";
    element("result-copy").textContent = ended
      ? "Final score " + game.points + "  ·  Personal best " + game.highScore
      : "Score " + game.points + "  ·  " + game.lives + " hearts left";
    again.textContent = ended ? "Play again" : "Resume game";
    again.focus({ preventScroll: true });
  } else if (game.state === GameState.Start && !initial)
    play.focus({ preventScroll: true });
  else if (game.state === GameState.Playing)
    element("pause").focus({ preventScroll: true });
}

const game = new Game(element("game") as HTMLCanvasElement, render);
play.disabled = true;
void game.start().then(() => {
  play.disabled = false;
});
play.onclick = () => game.beginGame();
element("pause").onclick = () => game.togglePause();
again.onclick = () =>
  game.state === GameState.Paused ? game.togglePause() : game.beginGame();
element("menu").onclick = () => game.exitToStart();

function openDialog(kind: "scores" | "help"): void {
  if (game.state === GameState.Playing) game.togglePause();
  const body = element("dialog-body");
  body.replaceChildren();
  element("dialog-title").textContent =
    kind === "help" ? "How to play" : "High scores";
  if (kind === "help") {
    body.innerHTML =
      "<p>Keep your popcorn on the midway for as long as you can. You start with three hearts and earn ten points each second.</p><p><b>Move</b> with the arrow keys, A and D, or the touch buttons. An exclamation mark means a crow is lining up a dive. Once it commits, run aside or jump over its lowest pass. Press Space, W, ↑, or the touch Jump button.</p><p><b>Collect pickups</b> by running through them. Press P or Escape to pause.</p>";
  } else if (game.topScores.length) {
    const list = document.createElement("ol");
    list.className = "scores";
    for (const points of game.topScores) {
      const item = document.createElement("li");
      item.textContent = points.toLocaleString() + " pts";
      list.append(item);
    }
    body.append(list);
  } else
    body.textContent =
      "Your first finished run earns a place here. The midway keeps your five highest scores.";
  dialog.showModal();
}
element("scores").onclick = () => openDialog("scores");
element("help").onclick = () => openDialog("help");
element("close").onclick = () => dialog.close();
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  )
    dialog.close();
});
addEventListener("keydown", (event) => {
  if (
    dialog.open ||
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  if (event.code === "KeyP" || event.code === "Escape") {
    event.preventDefault();
    game.togglePause();
  }
  if (
    event.code === "Enter" &&
    !(event.target instanceof HTMLButtonElement) &&
    !play.disabled
  )
    game.beginGame();
});
function pauseOnLeave(): void {
  if (game.state === GameState.Playing) game.togglePause();
}
window.addEventListener("blur", pauseOnLeave);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseOnLeave();
});

const fullscreen = element("fullscreen") as HTMLButtonElement;
fullscreen.disabled = !document.fullscreenEnabled;
fullscreen.onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    fullscreen.disabled = !document.fullscreenEnabled;
  }
};
document.addEventListener("fullscreenchange", () => {
  const active = !!document.fullscreenElement;
  fullscreen.setAttribute("aria-pressed", String(active));
  fullscreen.textContent = active ? "Exit fullscreen" : "Fullscreen";
});
