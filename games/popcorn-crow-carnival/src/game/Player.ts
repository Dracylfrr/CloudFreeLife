import { TUNING, WORLD, type Bounds } from "./types";

export class Player {
  readonly width = 100;
  readonly height = 100;
  x = (WORLD.width - this.width) / 2;
  altitude = 0;
  private verticalSpeed = 0;
  private jumpBuffer = 0;
  landing = 0;
  distance = 0;
  time = 0;
  direction = 0;
  facing = 1;
  lives = 3;
  invulnerableFor = 0;
  multiplierFor = 0;
  hiddenFor = 0;

  reset(): void {
    this.x = (WORLD.width - this.width) / 2;
    this.altitude = this.verticalSpeed = this.jumpBuffer = this.landing = 0;
    this.time = this.distance = this.direction = 0;
    this.facing = 1;
    this.lives = 3;
    this.invulnerableFor = this.multiplierFor = this.hiddenFor = 0;
  }
  update(dt: number, axis: number, jump: boolean): void {
    this.time += dt;
    const oldX = this.x;
    this.x = Math.max(
      24,
      Math.min(
        WORLD.width - this.width - 24,
        oldX + axis * TUNING.playerSpeed * dt,
      ),
    );
    this.direction = Math.sign(this.x - oldX);
    if (this.direction) this.facing = this.direction;
    if (!this.altitude) this.distance += Math.abs(this.x - oldX);
    this.jumpBuffer = jump ? 0.12 : Math.max(0, this.jumpBuffer - dt);
    this.landing = Math.max(0, this.landing - dt);
    if (!this.altitude && this.jumpBuffer > 0) {
      this.verticalSpeed = TUNING.jumpSpeed;
      this.jumpBuffer = 0;
    }
    if (this.altitude > 0 || this.verticalSpeed > 0) {
      this.altitude += this.verticalSpeed * dt - 0.5 * TUNING.gravity * dt * dt;
      this.verticalSpeed -= TUNING.gravity * dt;
      if (this.altitude <= 0) {
        this.altitude = this.verticalSpeed = 0;
        this.landing = 0.13;
      }
    }
    this.invulnerableFor = Math.max(0, this.invulnerableFor - dt);
    this.multiplierFor = Math.max(0, this.multiplierFor - dt);
    this.hiddenFor = Math.max(0, this.hiddenFor - dt);
  }
  hit(): boolean {
    if (this.invulnerableFor > 0) return false;
    this.lives--;
    this.invulnerableFor = TUNING.hitInvulnerability;
    return true;
  }
  get y(): number {
    return WORLD.groundY - this.height - this.altitude;
  }
  get bounds(): Bounds {
    return { x: this.x + 21, y: this.y + 12, width: 57, height: 80 };
  }
  get centerX(): number {
    return this.x + this.width / 2;
  }
}
