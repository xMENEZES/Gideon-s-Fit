// Script único (não faz parte do build): gera os ícones PWA a partir de um SVG
// vetorial (a mesma logo Dumbbell usada no TopBar), nas cores reais do tema
// (convertidas de oklch para hex), e salva os PNGs estáticos usados pelo
// manifest e pelas convenções de ícone do Next.js (app/icon.png, app/apple-icon.png).
//
// Uso: node scripts/generate-pwa-icons.mjs

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

function oklchToHex(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const gamma = (c) => {
    c = Math.min(1, Math.max(0, c));
    return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };
  r = gamma(r);
  g = gamma(g);
  bl = gamma(bl);

  const toHex = (c) => Math.round(c * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

// --background e --primary do dark theme em src/app/globals.css
const BG = oklchToHex(0.13, 0.006, 264);
const FG = oklchToHex(0.82, 0.2, 131);

// Path data do ícone "Dumbbell" do lucide-react (viewBox 0 0 24 24)
const DUMBBELL_PATHS = [
  "M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z",
  "m2.5 21.5 1.4-1.4",
  "m20.1 3.9 1.4-1.4",
  "M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z",
  "m9.6 14.4 4.8-4.8",
];

function makeSvg(canvasSize) {
  const iconSize = canvasSize * 0.56; // deixa margem confortável (ícone maskable-safe)
  const offset = (canvasSize - iconSize) / 2;
  const paths = DUMBBELL_PATHS.map((d) => `<path d="${d}" />`).join("");
  return `<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${canvasSize}" height="${canvasSize}" fill="${BG}" />
  <g transform="translate(${offset}, ${offset}) scale(${iconSize / 24})" fill="none" stroke="${FG}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    ${paths}
  </g>
</svg>`;
}

async function render(canvasSize, outPath) {
  const svg = makeSvg(canvasSize);
  await sharp(Buffer.from(svg)).resize(canvasSize, canvasSize).png().toFile(outPath);
  console.log(`gerado: ${outPath} (${canvasSize}x${canvasSize})`);
}

const root = path.resolve(import.meta.dirname, "..");
const publicIconsDir = path.join(root, "public", "icons");
await mkdir(publicIconsDir, { recursive: true });

await render(512, path.join(root, "src", "app", "icon.png"));
await render(180, path.join(root, "src", "app", "apple-icon.png"));
await render(192, path.join(publicIconsDir, "icon-192.png"));
await render(512, path.join(publicIconsDir, "icon-512.png"));

console.log(`Cores usadas — background: ${BG}, primary: ${FG}`);
