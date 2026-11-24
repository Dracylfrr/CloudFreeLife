import { overlaps } from "./Collision";
import { Crow } from "./Crow";
import { DifficultyManager } from "./DifficultyManager";
import { GameState } from "./GameState";
import { InputManager } from "./InputManager";
import { Player } from "./Player";
import { Powerup, type PowerupType } from "./Powerup";
import { Renderer } from "./Renderer";
import { SaveManager } from "./SaveManager";
import { TUNING, WORLD } from "./types";

export class Game {
  state = GameState.Start;
  highScore = 0;
  topScores: number[] = [];
  private input = new InputManager();
  private player = new Player();
  private crows: Crow[] = [];
  private powerups: Powerup[] = [];
  private difficulty = new DifficultyManager();
  private saves = new SaveManager();
  private renderer?: Renderer;
  private score = 0;
  private powerupIn = 8;
  private lastTime = 0;
  private frameId = 0;
  private muted = false;
  private pendingSave = Promise.resolve();

  constructor(
    private canvas: HTMLCanvasElement,
    private onChange: (game: Game) => void,
  ) {
    new ResizeObserver(() => {
      if (this.state === GameState.Paused || this.state === GameState.GameOver)
        this.renderer?.draw(this.player, this.crows, this.powerups);
    }).observe(canvas);
  }

  get points(): number {
    return Math.floor(this.score);
  }
  get lives(): number {
    return this.player.lives;
  }
  get effect(): string {
    const effects = [];
    if (this.player.hiddenFor > 0)
      effects.push("Disguise " + Math.ceil(this.player.hiddenFor) + "s");
    if (this.player.multiplierFor > 0)
      effects.push("2× score " + Math.ceil(this.player.multiplierFor) + "s");
    return effects.join(" · ");
  }

  async start(): Promise<void> {
    try {
      const save = await this.saves.load();
      this.highScore = save.highScore;
      this.topScores = save.topScores.length
        ? save.topScores
        : save.highScore > 0
          ? [save.highScore]
          : [];
      this.muted = save.settings.muted;
    } catch (error) {
      console.warn("Could not load saved scores", error);
    }
    this.onChange(this);
  }

  private transition(state: GameState): void {
    cancelAnimationFrame(this.frameId);
    this.input.clear();
    this.state = state;
    this.onChange(this);
    if (state === GameState.Playing) {
      this.lastTime = performance.now();
      this.frameId = requestAnimationFrame(this.loop);
    }
  }

  togglePause(): void {
    if (this.state === GameState.Playing) this.transition(GameState.Paused);
    else if (this.state === GameState.Paused)
      this.transition(GameState.Playing);
  }

  beginGame(): void {
    if (this.state !== GameState.Start && this.state !== GameState.GameOver)
      return;
    this.renderer ??= new Renderer(this.canvas);
    this.player.reset();
    this.crows = [];
    this.powerups = [];
    this.score = 0;
    this.powerupIn = 7 + Math.random() * 4;
    this.difficulty.reset();
    this.transition(GameState.Playing);
  }

  exitToStart(): void {
    this.transition(GameState.Start);
  }

  private loop = (time: number): void => {
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.update(dt);
    this.renderer?.draw(this.player, this.crows, this.powerups);
    if (this.state === GameState.Playing) {
      this.onChange(this);
      this.frameId = requestAnimationFrame(this.loop);
    }
  };
  private update(dt: number): void {
    this.player.update(dt, this.input.axis(), this.input.consumeJump());
    this.score +=
      dt * 10 * (this.player.multiplierFor > 0 ? TUNING.scoreMultiplier : 1);
    if (
      this.difficulty.update(dt) &&
      this.crows.length < this.difficulty.activeCap
    )
      this.crows.push(new Crow(Math.random() < 0.5 ? "left" : "right"));
    this.crows.forEach((crow) =>
      crow.update(dt, this.player.centerX, this.player.hiddenFor <= 0),
    );
    for (const crow of this.crows) {
      if (
        crow.canHit &&
        overlaps(crow.bounds, this.player.bounds) &&
        this.player.hit() &&
        this.player.lives <= 0
      ) {
        this.gameOver();
        return;
      }
    }
    this.crows = this.crows.filter((crow) => !crow.expired);
    this.updatePowerups(dt);
  }

  private updatePowerups(dt: number): void {
    this.powerupIn -= dt;
    if (this.powerupIn <= 0 && this.powerups.length === 0) {
      const roll = Math.random();
      const type: PowerupType =
        this.player.lives < 3 && roll < 0.4
          ? "life"
          : roll < 0.7
            ? "multiplier"
            : "hide";
      this.powerups.push(
        new Powerup(type, 100 + Math.random() * (WORLD.width - 280)),
      );
      this.powerupIn =
        TUNING.powerupSpawnMin +
        Math.random() * (TUNING.powerupSpawnMax - TUNING.powerupSpawnMin);
    }
    this.powerups.forEach((powerup) => {
      powerup.update(dt);
      if (!overlaps(powerup.bounds, this.player.bounds)) return;
      if (powerup.type === "multiplier")
        this.player.multiplierFor = TUNING.powerupDuration;
      else if (powerup.type === "hide")
        this.player.hiddenFor = TUNING.powerupDuration;
      else this.player.lives = Math.min(3, this.player.lives + 1);
      powerup.age = 99;
    });
    this.powerups = this.powerups.filter((powerup) => !powerup.expired);
  }

  private gameOver(): void {
    if (this.state === GameState.GameOver) return;

    const finalScore = Math.floor(this.score);
    this.highScore = Math.max(this.highScore, finalScore);
    this.topScores = [...this.topScores, finalScore]
      .sort((a, b) => b - a)
      .slice(0, 5);
    const data = {
      highScore: this.highScore,
      topScores: [...this.topScores],
      settings: { muted: this.muted },
    };
    this.pendingSave = this.pendingSave
      .then(() => this.saves.save(data))
      .catch((error) => console.warn("Could not save score", error));
    this.transition(GameState.GameOver);
  }
}
