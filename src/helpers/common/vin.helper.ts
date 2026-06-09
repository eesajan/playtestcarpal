const TRANSLIT: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5,
  P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4,
  "5": 5, "6": 6, "7": 7, "8": 8, "9": 9
};

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

// VIN-legal characters (no I, O, Q)
const VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";

function checkDigit(vin: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    if (i === 8) continue;
    sum += (TRANSLIT[vin[i]] ?? 0) * WEIGHTS[i];
  }
  const r = sum % 11;
  return r === 10 ? "X" : String(r);
}

function randChar(rng: () => number): string {
  return VIN_CHARS[Math.floor(rng() * VIN_CHARS.length)];
}

// Simple LCG so callers can produce deterministic sequences with a seed.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    return (s >>> 0) / 4294967296;
  };
}

export function generateVin(seed?: number): string {
  const rng = seed !== undefined ? lcg(seed) : Math.random.bind(Math);
  const chars = Array.from({ length: 17 }, (_, i) => (i === 8 ? "0" : randChar(rng)));
  chars[8] = checkDigit(chars.join(""));
  return chars.join("");
}

export function generateVins(count: number, seed = 42): string[] {
  return Array.from({ length: count }, (_, i) => generateVin(seed + i * 7919));
}

export function isValidVin(vin: string): boolean {
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;
  const expected = checkDigit(vin);
  return vin[8] === expected || (expected === "10" && vin[8] === "X");
}
