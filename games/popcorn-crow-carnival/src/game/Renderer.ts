import type { Crow } from "./Crow";
import type { Player } from "./Player";
import type { Powerup } from "./Powerup";
import { drawCrow } from "./CrowActor";
import pickupUrl from "../assets/sprites/powerup_sprite_sheet_ai.webp";
import { PopcornActor } from "./PopcornActor";
import backgroundUrl from "../assets/sprites/carnival_background_v2.webp";
import warningUrl from "../assets/sprites/warning_exclamation.svg";

function sprite(url: string): HTMLImageElement {
  const image = new Image();
  image.src = url;
  return image;
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  private readonly pickups = sprite(pickupUrl);
  private readonly actor = new PopcornActor();
  private readonly background = sprite(backgroundUrl);
  private readonly warning = sprite(warningUrl);

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D unavailable");
    this.ctx = context;
  }

  draw(player: Player, crows: Crow[], pickups: Powerup[]): void {
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    const width = Math.max(
      640,
      Math.min(
        1280,
        Math.round(
          (720 * canvas.clientWidth) / Math.max(1, canvas.clientHeight),
        ),
      ),
    );
    if (canvas.width !== width) canvas.width = width;
    const cameraX = Math.max(
      0,
      Math.min(1280 - width, player.centerX - width / 2),
    );
    ctx.clearRect(0, 0, width, 720);
    ctx.save();
    ctx.translate(-cameraX, 0);
    if (this.background.naturalWidth)
      ctx.drawImage(this.background, 0, 0, 1280, 720);
    for (const pickup of pickups) {
      const frame = { multiplier: 0, hide: 1, life: 2 }[pickup.type];
      this.frame(
        this.pickups,
        frame,
        pickup.x,
        pickup.y + Math.sin(pickup.age * 4) * 5,
        pickup.width,
        pickup.height,
      );
    }
    for (const crow of crows) {
      drawCrow(ctx, crow);
      if (crow.phase === "warning" && this.warning.naturalWidth)
        ctx.drawImage(this.warning, crow.x + 34, crow.y + 65, 28, 44);
    }
    this.actor.draw(ctx, player, crows);
    ctx.restore();
    // Keep warnings visible when a narrow display crops the crow's approach.
    for (const crow of crows) {
      const x = crow.x + crow.width / 2 - cameraX;
      if (
        crow.phase !== "warning" ||
        (x >= 0 && x <= width) ||
        !this.warning.naturalWidth
      )
        continue;
      ctx.drawImage(this.warning, x < 0 ? 9 : width - 37, crow.y + 64, 28, 44);
    }
  }
  private frame(
    sheet: HTMLImageElement,
    frame: number,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    if (!sheet.naturalWidth) return;
    const width = sheet.naturalWidth / 3;
    this.ctx.drawImage(
      sheet,
      frame * width,
      0,
      width,
      sheet.naturalHeight,
      x,
      y,
      w,
      h,
    );
  }
}
