
export interface AbyssObject {
  id: number;
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  isDragging: boolean;
  state: 'SURFACE' | 'FALLING';
  depth: number; // 0 to Infinity
}

export interface Debris {
    x: number;
    y: number;
    size: number;
    speed: number;
    angle: number;
    dist: number;
    color: string;
}
