
export interface SandChar {
  char: string;
  x: number; // Grid coordinates, not pixel
  y: number;
  active: boolean; // True if falling
  color: string;
}
