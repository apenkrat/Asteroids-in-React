export interface Point {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export enum GameStatus {
  MENU,
  PLAYING,
  GAME_OVER,
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  dead: boolean;
}

export interface Ship extends Entity {
  rotationSpeed: number;
  isThrusting: boolean;
  invulnerableUntil: number;
  lastShot: number;
}

export interface Bullet extends Entity {
  timeLeft: number;
}

export enum AsteroidSize {
  LARGE = 3,
  MEDIUM = 2,
  SMALL = 1,
}

export interface Asteroid extends Entity {
  size: AsteroidSize;
  vertices: Point[]; // For jagged vector look
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  color: string;
}

export interface GameState {
  ship: Ship | null;
  bullets: Bullet[];
  asteroids: Asteroid[];
  particles: Particle[];
  score: number;
  lives: number;
  level: number;
  status: GameStatus;
  screen: { width: number; height: number };
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  shoot: boolean;
}
