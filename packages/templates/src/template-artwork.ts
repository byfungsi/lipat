import { createSvgAsset } from "@lipat-internal/images";
import type { DeckAsset } from "@lipat-internal/model";

/** Original static SVG motifs, assembled from geometry without remote or third-party artwork. */
export function createTemplateArtwork(
  motif: string,
  accent: string,
  secondary: string,
  ink: string,
): DeckAsset {
  const line = (d: string, color = accent, width = 5) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill = accent,
    rx = 0,
  ) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
  const circle = (x: number, y: number, r: number, fill = accent) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
  let body: string;
  switch (motif) {
    case "orbit":
      body =
        [140, 205, 270]
          .map(
            (r) =>
              `<ellipse cx="320" cy="320" rx="${r}" ry="${r * 0.65}" fill="none" stroke="${accent}" stroke-width="3" transform="rotate(-28 320 320)"/>`,
          )
          .join("") +
        circle(512, 164, 30, secondary) +
        circle(205, 425, 16, ink);
      break;
    case "horizon":
      body = [0, 1, 2, 3]
        .map((i) =>
          line(
            `M ${70 + i * 42} 510 V 330 A ${250 - i * 42} ${250 - i * 42} 0 0 1 ${570 - i * 42} 330 V 510`,
            i % 2 ? secondary : accent,
            12,
          ),
        )
        .join("");
      break;
    case "compass":
      body =
        `<circle cx="320" cy="320" r="250" fill="none" stroke="${secondary}" stroke-width="3"/>` +
        line("M 320 45 V 595 M 45 320 H 595", secondary, 2) +
        `<path d="M 320 90 L 388 390 L 320 345 L 252 390 Z" fill="${accent}"/><path d="M 320 550 L 252 390 L 320 435 L 388 390 Z" fill="${secondary}"/>` +
        circle(320, 390, 18, ink);
      break;
    case "bands":
      body = [0, 1, 2, 3, 4]
        .map((i) =>
          rect(
            40 + i * 100,
            80 + (i % 2) * 90,
            76,
            440 - (i % 2) * 90,
            i % 2 ? secondary : accent,
            38,
          ),
        )
        .join("");
      break;
    case "lens":
      body =
        `<circle cx="280" cy="270" r="195" fill="none" stroke="${accent}" stroke-width="42"/>` +
        line("M 425 420 L 570 565", secondary, 58) +
        circle(280, 270, 90, secondary) +
        line("M 130 270 H 430 M 280 120 V 420", ink, 3);
      break;
    case "spark":
      body =
        `<path d="M 340 40 L 490 250 L 600 320 L 440 390 L 330 600 L 240 415 L 40 320 L 250 235 Z" fill="${accent}"/>` +
        circle(130, 120, 38, secondary) +
        circle(540, 510, 24, ink);
      break;
    case "path":
      body =
        line(
          "M 90 535 C 470 535 75 330 390 330 S 350 105 555 105",
          secondary,
          14,
        ) +
        [
          [90, 535],
          [280, 430],
          [390, 330],
          [445, 205],
          [555, 105],
        ]
          .map(([x, y]) => circle(x ?? 0, y ?? 0, 23, accent))
          .join("");
      break;
    case "molecule":
      body =
        line(
          "M 120 320 L 230 130 L 440 130 L 550 320 L 440 510 L 230 510 Z M 230 130 L 440 510 M 120 320 H 550",
          secondary,
          7,
        ) +
        [
          [120, 320],
          [230, 130],
          [440, 130],
          [550, 320],
          [440, 510],
          [230, 510],
        ]
          .map(([x, y], i) => circle(x ?? 0, y ?? 0, i % 2 ? 27 : 40, accent))
          .join("");
      break;
    case "community":
      body = [0, 1, 2]
        .map(
          (i) =>
            circle(
              155 + i * 165,
              210 + (i % 2) * 35,
              55,
              i === 1 ? secondary : accent,
            ) +
            rect(
              85 + i * 165,
              300 + (i % 2) * 35,
              140,
              195,
              i === 1 ? secondary : accent,
              64,
            ),
        )
        .join("");
      break;
    case "contours":
      body = Array.from({ length: 9 }, (_, i) =>
        line(
          `M ${20 + i * 8} ${100 + i * 46} C 180 ${-40 + i * 45} 250 ${420 + i * 8} 620 ${100 + i * 50}`,
          i % 3 === 0 ? secondary : accent,
          4,
        ),
      ).join("");
      break;
    case "leaf":
      body =
        `<path d="M 100 500 C 70 180 330 80 555 80 C 570 390 370 580 100 500 Z" fill="${accent}"/>` +
        line(
          "M 105 500 L 485 150 M 210 390 L 215 230 M 320 280 L 455 290",
          secondary,
          8,
        );
      break;
    case "streets":
      body =
        [100, 240, 380, 520]
          .map((x) => line(`M ${x} 40 V 600 M 40 ${x} H 600`, secondary, 4))
          .join("") +
        rect(255, 255, 110, 110, accent, 18) +
        rect(395, 115, 110, 110, ink, 18) +
        circle(155, 435, 32, accent);
      break;
    case "plan":
      body =
        line(
          "M 75 535 V 110 H 350 V 230 H 565 V 535 Z M 75 335 H 350 M 350 110 V 535 M 350 390 H 565 M 200 110 V 335",
          ink,
          5,
        ) +
        line("M 100 565 H 545 M 100 550 V 580 M 545 550 V 580", secondary, 3) +
        rect(380, 260, 145, 100, accent) +
        rect(105, 365, 210, 130, secondary);
      break;
    case "building":
      body =
        rect(100, 130, 260, 430, accent) +
        rect(380, 260, 160, 300, secondary) +
        [0, 1, 2]
          .flatMap((i) =>
            [0, 1, 2, 3].map((j) =>
              rect(138 + i * 68, 175 + j * 85, 30, 40, ink),
            ),
          )
          .join("") +
        line("M 65 560 H 575", ink, 4);
      break;
    case "waves":
      body =
        circle(435, 200, 120, secondary) +
        [0, 1, 2, 3]
          .map((i) =>
            line(
              `M 30 ${360 + i * 60} C 170 ${250 + i * 60} 390 ${470 + i * 60} 610 ${350 + i * 60}`,
              accent,
              18,
            ),
          )
          .join("");
      break;
    case "ingredient":
      body =
        `<ellipse cx="315" cy="330" rx="225" ry="170" fill="none" stroke="${ink}" stroke-width="5"/>` +
        line(
          "M 75 300 V 130 M 50 130 V 220 Q 75 260 100 220 V 130 M 565 130 V 505",
          secondary,
          9,
        ) +
        [0, 1, 2]
          .map(
            (i) =>
              `<ellipse cx="${245 + i * 70}" cy="${300 + (i % 2) * 60}" rx="45" ry="70" fill="${i % 2 ? accent : secondary}" transform="rotate(${i * 45} ${245 + i * 70} ${300 + (i % 2) * 60})"/>`,
          )
          .join("");
      break;
    case "retail":
      body =
        `<path d="M 140 200 H 500 L 545 550 H 95 Z" fill="${accent}"/>` +
        line("M 240 230 V 150 A 80 80 0 0 1 400 150 V 230", ink, 14) +
        circle(390, 405, 90, secondary) +
        rect(165, 340, 140, 25, ink, 12);
      break;
    case "route":
      body =
        line(
          "M 90 170 H 315 V 440 H 550 M 90 440 H 315 V 170 H 550",
          secondary,
          8,
        ) +
        [
          [90, 170],
          [315, 170],
          [550, 170],
          [90, 440],
          [315, 440],
          [550, 440],
        ]
          .map(([x, y], i) =>
            rect(
              (x ?? 0) - 35,
              (y ?? 0) - 35,
              70,
              70,
              i % 2 ? accent : ink,
              12,
            ),
          )
          .join("");
      break;
    case "ledger":
      body =
        [0, 1, 2, 3]
          .map((i) =>
            rect(
              100 + i * 120,
              490 - i * 100,
              72,
              70 + i * 100,
              i % 2 ? secondary : accent,
              8,
            ),
          )
          .join("") +
        line("M 80 560 H 580 M 100 380 L 250 290 L 385 245 L 530 90", ink, 7);
      break;
    case "shield":
      body =
        `<path d="M 320 55 L 545 145 V 315 Q 545 475 320 590 Q 95 475 95 315 V 145 Z" fill="none" stroke="${accent}" stroke-width="14"/>` +
        line("M 215 325 L 290 400 L 435 225", secondary, 24) +
        line("M 320 85 V 180", ink, 4);
      break;
    case "nodes":
      body =
        line(
          "M 105 315 L 315 120 L 535 315 L 315 520 Z M 105 315 H 535 M 315 120 V 520",
          secondary,
          7,
        ) +
        [
          [105, 315],
          [315, 120],
          [535, 315],
          [315, 520],
        ]
          .map(([x, y], i) => circle(x ?? 0, y ?? 0, i === 1 ? 60 : 40, accent))
          .join("") +
        rect(250, 250, 130, 130, ink, 22);
      break;
    case "studio":
      body =
        rect(70, 100, 330, 410, accent, 165) +
        rect(330, 230, 230, 330, secondary, 115) +
        circle(410, 140, 85, ink) +
        line("M 70 565 H 550", ink, 3);
      break;
    case "stage":
      body =
        [90, 155, 220, 285]
          .map(
            (r, i) =>
              `<circle cx="320" cy="320" r="${r}" fill="none" stroke="${i % 2 ? secondary : accent}" stroke-width="18"/>`,
          )
          .join("") + rect(260, 260, 120, 120, ink, 12);
      break;
    default:
      body =
        rect(80, 80, 480, 480, secondary, 40) +
        rect(145, 145, 350, 350, accent, 175) +
        line("M 175 325 H 465 M 320 180 V 470", ink, 10);
  }
  return createSvgAsset({
    id: "template-artwork",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">${body}</svg>`,
  });
}
