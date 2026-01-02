
export interface EmberChar {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  life: number; // 1.0 = fresh, < 0 = gone
  state: 'STABLE' | 'BURNING' | 'ASH';
  heat: number; // 0 to 1
  delay: number; // Random delay before burning fully
}
