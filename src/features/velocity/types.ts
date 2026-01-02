
export interface WarpParticle {
  x: number; // -1 to 1 (normalized screen space)
  y: number; // -1 to 1
  z: number; // distance from camera (starts at FAR, moves to 0)
  char: string;
  color: string;
  angle: number; // rotation
}
