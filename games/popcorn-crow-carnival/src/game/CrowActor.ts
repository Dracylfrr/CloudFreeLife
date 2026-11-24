import type { Crow } from "./Crow";

const ink = "#171e29";
const outline = (d: string) => new Path2D(d);
const feathers = outline(
  "M4 3 C-7 6 -23 2 -31 -5 Q-26 -8 -16 -5 Q-30 -15 -27 -18 Q-17 -18 -8 -10 Q-15 -25 -10 -24 Q0 -17 9 -3Z",
);
const tail = outline(
  "M-13 0 Q-33 -5 -49 -12 Q-47 -7 -39 -3 L-53 -6 Q-49 1 -33 4 L-43 4 Q-35 9 -14 7Z",
);
const chest = outline(
  "M-33 1 Q-20 -6 -2 -8 Q8 -22 21 -19 Q31 -16 29 -4 Q29 5 18 9 Q6 15 -8 10 Q-23 9 -33 1Z",
);
const bill = outline("M21 -3 Q32 -12 48 -3 Q42 -2 36 2 Q30 8 25 7Z");
const lowerBill = outline("M23 1 Q32 5 43 0 Q39 9 27 11Z");
const eye = outline(
  "M11 -10 Q15 -18 23 -15 Q29 -12 25 -4 Q21 2 16 -1 Q11 -3 11 -10Z",
);
const hat = outline("M-8 -2 L-12 -15 Q-5 -19 8 -17 L9 -3Z");
const band = outline("M-9 -7 Q0 -10 9 -8 L9 -4 Q0 -5 -9 -2Z");
const brim = outline(
  "M-16 -1 Q-10 -5 0 -5 Q12 -8 17 -4 Q17 -1 5 1 Q-7 5 -16 2Z",
);
const shank = outline("M0 0 Q-2 5 -1 9 L-5 16");
const curledToes = outline(
  "M-5 16 Q-8 18 -10 15 M-5 16 Q-1 20 2 16 M-5 16 Q0 17 2 13 M-5 16 Q-3 15 -2 12",
);
const openToes = outline(
  "M-5 16 Q-10 15 -11 19 M-5 16 Q0 16 4 19 Q5 21 4 22 M-5 16 Q2 14 8 16 Q10 18 9 19 M-5 16 Q1 12 6 12 Q8 12 8 15",
);

function drawFoot(
  ctx: CanvasRenderingContext2D,
  near: boolean,
  extension: number,
  beat: number,
) {
  ctx.save();
  ctx.translate(near ? -7 : -17, near ? 7 : 5);
  ctx.rotate(
    0.92 - extension * 1.55 + 0.07 * Math.sin(beat - (near ? 0.3 : 0.7)),
  );
  const size = near ? 1 : 0.78;
  ctx.scale(size, size);
  ctx.lineWidth = 4.4;
  ctx.strokeStyle = ink;
  ctx.stroke(shank);
  ctx.strokeStyle = near ? "#988671" : "#6b635a";
  ctx.lineWidth = 2.4;
  ctx.stroke(shank);
  const toes = extension > 0.48 ? openToes : curledToes;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.8;
  ctx.stroke(toes);
  ctx.strokeStyle = near ? "#a9957c" : "#797166";
  ctx.lineWidth = 1.3;
  ctx.stroke(toes);
  ctx.restore();
}
const wingInk = outline("M-1 0 Q-14 -4 -21 -10 M0 -3 Q-7 -8 -10 -14");

function paint(ctx: CanvasRenderingContext2D, path: Path2D, color: string) {
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.stroke(path);
}

function wing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  scale: number,
  near: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale * 1.22, scale * 0.86);
  paint(ctx, feathers, near ? "#314354" : "#242f40");
  ctx.strokeStyle = near ? "#769497" : "#52616d";
  ctx.lineWidth = 1.2;
  ctx.stroke(wingInk);
  ctx.restore();
}

export function drawCrow(ctx: CanvasRenderingContext2D, crow: Crow) {
  const dive = crow.phase === "diving";
  const alert = crow.phase === "warning";
  const beat = crow.flapTime;
  const flap = Math.sin(beat);
  ctx.save();
  ctx.translate(
    crow.x + crow.width / 2,
    crow.y + crow.height / 2 + (dive ? 0 : flap * 1.6),
  );
  ctx.rotate(crow.tilt);
  if (crow.side === "right") ctx.scale(-1, 1);
  ctx.strokeStyle = ink;
  ctx.lineJoin = ctx.lineCap = "round";
  ctx.lineWidth = 2.3;
  ctx.save();
  ctx.translate(-2, 3);
  ctx.rotate(dive ? 0.15 : -0.12 * Math.sin(beat - 0.55));
  paint(ctx, tail, "#293444");
  ctx.restore();
  wing(
    ctx,
    1,
    -6,
    dive ? -0.23 : Math.sin(beat + 0.45) * 0.85 + 0.25,
    0.88,
    false,
  );
  // Feet trail behind the hips in cruise; the lower pass opens the toes.
  const extension = dive ? Math.max(0, Math.cos(crow.tilt)) : alert ? 0.28 : 0;
  drawFoot(ctx, false, extension, beat);
  drawFoot(ctx, true, extension, beat);
  paint(ctx, chest, "#243241");

  wing(
    ctx,
    -5,
    -1,
    dive ? -0.38 + 0.08 * flap : flap * 0.98 + 0.13,
    1.13,
    true,
  );
  ctx.save();
  ctx.translate(0, alert ? 1.5 : 0);
  ctx.rotate(alert ? 0.1 : 0);
  paint(ctx, eye, "#fff0c6");
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(22, alert ? -4 : -6, 2.6, 3.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, -13);
  ctx.quadraticCurveTo(19, -13, 25, alert ? -7 : -11);
  ctx.stroke();
  ctx.save();
  ctx.translate(23, 1);
  ctx.rotate(alert ? 0.19 : dive ? 0.08 : 0);
  ctx.translate(-23, -1);
  paint(ctx, lowerBill, "#de873b");
  ctx.restore();
  paint(ctx, bill, "#ffc65c");
  ctx.save();
  ctx.translate(12, -17 - (dive ? 0 : Math.max(0, Math.sin(beat - 0.7)) * 1.5));
  ctx.rotate(dive ? -0.32 : -0.16 + 0.1 * Math.sin(beat - 0.6));
  paint(ctx, hat, "#b83f38");
  ctx.fillStyle = "#fcce63";
  ctx.fill(band);
  paint(ctx, brim, "#743737");
  ctx.restore();
  ctx.restore();
  ctx.restore();
}
