
export interface OrbNode {
  x: number; // 3D coordinates
  y: number;
  z: number;
  baseX: number; // Original pos on sphere surface
  baseY: number;
  baseZ: number;
  char: string;
  phase: number; // For breathing animation
  ring: number; // Which latitude ring it belongs to
}
