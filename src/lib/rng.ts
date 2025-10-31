const MAX_UINT32 = 0xffffffff;

export type RNG = {
  next: () => number;
  nextInt: (max: number) => number;
  shuffle: <T>(list: T[]) => T[];
};

// Deterministic hash from string seed to four uint32 numbers
const hashSeed = (seed: string): [number, number, number, number] => {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;

  for (let i = 0; i < seed.length; i += 1) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 597399067);
    h2 = Math.imul(h2 ^ ch, 2869860233);
    h3 = Math.imul(h3 ^ ch, 951274213);
    h4 = Math.imul(h4 ^ ch, 2716044179);
  }

  h1 = (h1 ^ (h2 >>> 18)) >>> 0;
  h2 = (h2 ^ (h3 >>> 22)) >>> 0;
  h3 = (h3 ^ (h4 >>> 17)) >>> 0;
  h4 = (h4 ^ (h1 >>> 19)) >>> 0;

  return [h1, h2, h3, h4];
};

// sfc32 PRNG based on hashed seed
const sfc32 = (a: number, b: number, c: number, d: number): (() => number) => {
  return () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const result = (t + d) | 0;
    return (result >>> 0) / (MAX_UINT32 + 1);
  };
};

export const createRNG = (seed: string): RNG => {
  const [a, b, c, d] = hashSeed(seed);
  const generator = sfc32(a, b, c, d);

  const next = () => generator();
  const nextInt = (max: number) => {
    if (max <= 0) {
      throw new Error("nextInt requires a positive maximum");
    }
    return Math.floor(next() * max);
  };
  const shuffle = <T>(list: T[]) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = nextInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  return { next, nextInt, shuffle };
};
