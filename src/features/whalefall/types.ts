
export interface ClothPoint {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  pinned: boolean;
  char: string;
}

export interface ClothConstraint {
  p1: number;
  p2: number;
  length: number;
}
