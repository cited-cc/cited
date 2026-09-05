const BAYER_4X4 = [
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
] as const;

const PALETTES = [
  { bg: "#fbf7f0", fg: "#15131a" },
  { bg: "#15131a", fg: "#5ce1e6" },
  { bg: "#f1ece4", fg: "#3db8bd" },
  { bg: "#0a3d40", fg: "#5ce1e6" },
  { bg: "#efe9df", fg: "#524e5c" },
  { bg: "#15131a", fg: "#fbf7f0" },
  { bg: "#fdfbf6", fg: "#0a3d40" },
  { bg: "#524e5c", fg: "#5ce1e6" },
] as const;

export type DitherAvatarSpec = {
  gridSize: number;
  /** Row-major hex colors, length gridSize * gridSize */
  pixels: string[];
  seed: string;
};

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(stateSeed: number): () => number {
  let state = stateSeed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bayerThreshold(x: number, y: number): number {
  return BAYER_4X4[(y % 4) * 4 + (x % 4)] / 16;
}

/** Deterministic dither avatar from a stable seed (Clerk user id or email). */
export function buildDitherAvatarSpec(
  seed: string,
  gridSize = 16,
): DitherAvatarSpec {
  const hash = hashSeed(seed || "cited");
  const rand = mulberry32(hash);
  const palette = PALETTES[hash % PALETTES.length];
  const half = gridSize / 2;

  const intensities: number[] = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < half; x += 1) {
      const wave =
        0.45 +
        0.35 * Math.sin((x / half) * Math.PI * 2 + hash * 0.0001) +
        0.2 * Math.cos((y / gridSize) * Math.PI * 4 + hash * 0.0002);
      const noise = rand();
      intensities.push(Math.min(1, Math.max(0, wave * 0.55 + noise * 0.45)));
    }
  }

  const pixels: string[] = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const symX = x < half ? x : gridSize - 1 - x;
      const index = y * half + symX;
      const intensity = intensities[index] ?? 0.5;
      const useForeground = intensity > bayerThreshold(x, y);
      pixels.push(useForeground ? palette.fg : palette.bg);
    }
  }

  return {
    gridSize,
    pixels,
    seed,
  };
}
