
export interface NeonDrop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  colorH: number; // Hue
  brightness: number;
  fontSize: number;
  length: number;
}

export interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}
