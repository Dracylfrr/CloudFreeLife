const directions: Record<string, number> = {
  ArrowLeft: -1,
  KeyA: -1,
  ArrowRight: 1,
  KeyD: 1,
};

export class InputManager {
  private held = new Map<string, number>();

  private jumpQueued = false;

  consumeJump(): boolean {
    const queued = this.jumpQueued;
    this.jumpQueued = false;
    return queued;
  }

  constructor() {
    document
      .getElementById("jump")!
      .addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.jumpQueued = true;
      });
    addEventListener("keydown", (event) => {
      if (
        document.documentElement.dataset.gameState === "playing" &&
        ["Space", "ArrowUp", "KeyW"].includes(event.code)
      ) {
        event.preventDefault();
        if (!event.repeat) this.jumpQueued = true;
        return;
      }
      if (
        document.documentElement.dataset.gameState !== "playing" ||
        !(event.code in directions)
      )
        return;
      event.preventDefault();
      this.held.set(event.code, directions[event.code]);
    });
    addEventListener("keyup", (event) => this.held.delete(event.code));
    for (const [id, direction] of [
      ["left", -1],
      ["right", 1],
    ] as const) {
      const button = document.getElementById(id)!;
      button.addEventListener("pointerdown", (event) => {
        button.setPointerCapture(event.pointerId);
        this.held.set(id, direction);
      });
      button.addEventListener("lostpointercapture", () => this.held.delete(id));
    }
  }

  clear(): void {
    this.held.clear();
    this.jumpQueued = false;
  }

  axis(): number {
    const active = new Set(this.held.values());
    return Number(active.has(1)) - Number(active.has(-1));
  }
}
