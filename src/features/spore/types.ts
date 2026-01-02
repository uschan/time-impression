
export interface Spore {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  life: number;
  state: 'FLOATING' | 'ROOTED';
  angle: number;
  scale: number;
}
