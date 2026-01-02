
export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  isActive: boolean;
  // Chaos factors
  jitterPhase: number;
}

export interface RopeState {
  points: Point[];
  angle: number; // Driver angle
}
