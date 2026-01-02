
export interface WavePoint {
  x: number;
  y: number; // Resting Y
  dy: number; // Displacement
  vel: number; // Velocity
  force: number;
}

export interface WaveWire {
  points: WavePoint[];
  y: number;
  tension: number;
  damping: number;
  color: string;
}

export interface NoteParticle {
  char: string;
  wireIndex: number;
  t: number; // 0 to 1 position along wire
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  floating: boolean;
  opacity: number;
}
