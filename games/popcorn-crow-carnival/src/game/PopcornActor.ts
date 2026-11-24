import type { Crow } from "./Crow";
import type { Player } from "./Player";
import { WORLD } from "./types";
import bodyUrl from "../assets/sprites/popcorn_body.svg";

const ink = "#252634";
const cream = "#fff6db";
const shoe = new Path2D(
  "M-7 -4 Q-5 -9 1 -7 L4 -4 Q13 -9 17 -3 Q21 4 11 5 L-5 5 Q-10 4 -7 -4Z",
);
const glove = new Path2D(
  "M-5 -4 Q-9 -9 -5 -11 Q-2 -12 0 -6 Q7 -10 9 -5 Q13 -2 9 2 Q8 7 2 7 Q-5 8 -6 3 Q-11 0 -9 -4Z",
);
const grin = new Path2D("M38 66 Q50 70 62 62 Q58 81 43 73Z");

function oval(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  outline = false,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) ctx.stroke();
}

function limb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bendX: number,
  bendY: number,
  endX: number,
  endY: number,
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(bendX, bendY, endX, endY);
  ctx.stroke();
}

export class PopcornActor {
  private readonly body = new Image();
  private gazeX = 0;
  private gazeY = 0;
  private lastTime = 0;
  constructor() {
    this.body.src = bodyUrl;
  }

  draw(ctx: CanvasRenderingContext2D, p: Player, crows: Crow[]): void {
    let threat: Crow | undefined;
    let best = Infinity;
    for (const c of crows) {
      const dx = c.x + c.width / 2 - p.centerX;
      if (Math.abs(dx) > 620) continue;
      const priority = Math.abs(dx) + (c.phase === "flying" ? 640 : 0);
      if (priority < best) {
        best = priority;
        threat = c;
      }
    }
    const alarm = !!threat && threat.phase !== "flying";
    const dx = threat
      ? threat.x + threat.width / 2 - p.centerX
      : p.facing * 100;
    const dy = threat ? threat.y + threat.height / 2 - (p.y + 54) : 0;
    const length = Math.max(1, Math.hypot(dx, dy));
    const dt =
      p.time >= this.lastTime ? Math.min(0.05, p.time - this.lastTime) : 1;
    this.lastTime = p.time;
    const follow = 1 - Math.exp(-18 * dt);
    this.gazeX += ((dx / length) * 3.5 - this.gazeX) * follow;
    this.gazeY += ((dy / length) * 3.8 - this.gazeY) * follow;
    const air = Math.min(1, p.altitude / 32);
    const stride = p.direction ? Math.sin(p.distance / 14) : 0;
    const bob = p.direction
      ? -Math.abs(stride) * 4
      : Math.sin(p.time * 4) * 1.4;
    const squash = Math.sin((Math.PI * p.landing) / 0.13) * 0.12;
    ctx.save();
    oval(
      ctx,
      p.centerX,
      WORLD.groundY - 1,
      27 - air * 12,
      4 - air * 1.5,
      "rgba(32,23,30,.32)",
    );
    ctx.translate(p.x, p.y);
    ctx.strokeStyle = ink;
    ctx.lineCap = ctx.lineJoin = "round";
    if (
      p.hiddenFor > 0 ||
      (p.invulnerableFor > 0 && Math.floor(p.invulnerableFor * 10) % 2 === 0)
    )
      ctx.globalAlpha = 0.58;
    for (const side of [-1, 1]) {
      const hip = 50 + side * 12;
      const swing = stride * side * p.facing;
      const footX = hip + 21 * swing * (1 - air) + side * air * 9;
      const footY =
        94 - Math.max(0, -stride * side) * 13 - air * (12 + 6 * side);
      ctx.lineWidth = 5;
      limb(ctx, hip, 74 + bob, hip + swing * 14 + air * 8, 89, footX, footY);
      ctx.save();
      ctx.translate(footX, footY);
      ctx.scale(p.facing, 1);
      ctx.rotate(stride * side * 0.38 - air * 0.32);
      ctx.lineWidth = 3;
      ctx.fillStyle = "#344254";
      ctx.fill(shoe);
      ctx.stroke(shoe);
      ctx.restore();
    }
    ctx.translate(50, 83 + bob);
    ctx.rotate(
      p.direction * 0.065 - (alarm && !p.direction ? Math.sign(dx) * 0.045 : 0),
    );
    ctx.scale(1 + squash - air * 0.025, 1 - squash + air * 0.035);
    ctx.translate(-50, -83);
    for (const side of [-1, 1]) {
      const shoulder = 50 + side * 30;
      const handX = shoulder + side * (12 + air) - stride * side * 9;
      const handY = alarm ? 38 - air * 5 : 61 + stride * side * 12 - air * 17;
      ctx.lineWidth = 4.5;
      limb(ctx, shoulder, 52, shoulder + side * 15, 68, handX, handY);
      ctx.save();
      ctx.translate(handX, handY);
      ctx.scale(side * 0.78, 0.78);
      ctx.rotate(side * 0.3);
      ctx.lineWidth = 3.2;
      ctx.fillStyle = cream;
      ctx.fill(glove);
      ctx.stroke(glove);
      ctx.restore();
    }
    if (this.body.naturalWidth) ctx.drawImage(this.body, 0, 0, 100, 100);
    const blink = !alarm && (p.time + 0.7) % 3.2 < 0.115;
    ctx.lineWidth = 2.4;
    for (const eye of [40, 57]) {
      if (blink || p.invulnerableFor > 1) {
        limb(ctx, eye - 6, 55, eye, 50, eye + 6, 55);
        continue;
      }
      oval(ctx, eye, 53, 7.1, alarm ? 11 : 8.6, cream, true);
      const px = eye + this.gazeX,
        py = 53 + this.gazeY;
      oval(ctx, px, py, 3.1, alarm ? 4.1 : 5, ink);
      oval(ctx, px - 1, py - 1.8, 1.1, 1.3, "#fff");
    }
    if (alarm || p.invulnerableFor > 1) {
      oval(ctx, 50, 70, 5.3, 6.2, "#552d36", true);
      oval(ctx, 50, 73, 2.7, 1.7, "#fa947b");
    } else {
      ctx.fillStyle = "#562c38";
      ctx.fill(grin);
      ctx.stroke(grin);
    }
    ctx.restore();
  }
}
