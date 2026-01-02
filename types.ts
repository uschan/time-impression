

import React from 'react';

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

export interface Point {
  x: number;
  y: number;
}

export interface RopeState {
  points: Point[];
  angle: number; // Driver angle
}

// Advanced Wire for Wave Simulation
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

// Ripple Grid Point
export interface RipplePoint {
  x: number;
  y: number;
  z: number; // Height (ripple)
  v: number; // Velocity
}

// Spore / Growth
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

// Chasm / Infinite
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

// Neon / Rain
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

// Eclipse / Shadow
export interface ShadowObject {
  text: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
}

export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

// Velocity / Warp
export interface WarpParticle {
  x: number; // -1 to 1 (normalized screen space)
  y: number; // -1 to 1
  z: number; // distance from camera (starts at FAR, moves to 0)
  char: string;
  color: string;
  angle: number; // rotation
}

// Bloom / Flower
export interface BloomParticle {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  baseColor: string;
  bloomColor: string; // HSL string
  rotation: number;
  scale: number;
  bloomState: number; // 0 to 1
  phase: number;
}

// Noir / Smoke
export interface NoirParticle {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  alpha: number;
  blur: number;
  size: number;
}

// Orb / Sphere
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

// Signal / Glitch
export interface SignalRow {
  text: string;
  y: number;
  speed: number;
  offset: number;
  glitchOffset: number;
  rgbSplit: number;
}

// Kinetic / Typography
export interface KineticCell {
  char: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  width: number;
  height: number;
  stretchX: number;
  stretchY: number;
  weight: number;
}

// Textile / Cloth
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

// Erosion / Collapse
export interface ErosionBlock {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  char: string;
  isCollapsed: boolean;
  width: number;
  height: number;
  color: string;
}

// Fluid / Magnetic
export interface FluidCell {
  x: number;
  y: number;
  originX: number;
  originY: number;
  angle: number;
  scale: number;
  color: string;
}

// Vapor / Retro 3D
export interface VaporParticle {
  text: string;
  x: number; // World X
  y: number; // World Y (height)
  z: number; // World Z (depth)
  speed: number;
  color: string;
  size: number;
}

// Rain Drop for Vapor V2
export interface RainDrop {
  x: number;
  y: number;
  vy: number;
  size: number;
  trailLength: number;
}

// Christmas Tree
export interface TreeNode {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  mass: number;
  isFixed: boolean;
  layer: number;
  text: string;
  connections: number[];
}

export interface TreeSpring {
  a: number;
  b: number;
  restLength: number;
  stiffness: number;
}

export interface SnowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

// Gravity / Rigid Body
export interface RigidBody {
  id: number;
  text: string;
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  angularVelocity: number;
  mass: number;
  isDragging: boolean;
  color: string;
}

// Thread
export interface ThreadNode {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  char: string;
}

// Galaxy
export interface GalaxyStar {
  x: number;
  y: number;
  z: number;
  angle: number;
  radius: number;
  speed: number;
  char: string;
  size: number;
  color: string;
}

// Kintsugi
export interface Shard {
  path: Point[];
  center: Point;
  x: number;
  y: number;
  angle: number;
  targetX: number;
  targetY: number;
  targetAngle: number;
  healed: number; // 0 to 1
  vx: number;
  vy: number;
  va: number; // angular velocity
}

// Fix for TypeScript errors regarding R3F intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      color: any;
      ambientLight: any;
      pointLight: any;
      instancedMesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      group: any;
      meshBasicMaterial: any;
      fog: any;
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      color: any;
      ambientLight: any;
      pointLight: any;
      instancedMesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      group: any;
      meshBasicMaterial: any;
      fog: any;
    }
  }
}