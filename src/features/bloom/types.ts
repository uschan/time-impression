
export interface BloomParticle {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  baseColor: string;
  bloomColor: string; // HSL string
  rotation: number;
  scale: number;
  bloomState: number; // 0 to 1
  phase: number;
}
