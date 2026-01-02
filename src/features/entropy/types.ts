
export interface FlowParticle {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  energy: number; // 0 to 1, how much it is affected by entropy
  friction: number;
  size: number;
  // For the hidden message effect
  messageX?: number;
  messageY?: number;
}
