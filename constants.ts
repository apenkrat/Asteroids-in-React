export const FPS = 60;
export const SHIP_SIZE = 20;
export const SHIP_THRUST = 0.15; // increased slightly for responsiveness
export const SHIP_TURN_SPEED = 0.08; // radians per frame
export const SHIP_FRICTION = 0.99;
export const BULLET_SPEED = 7;
export const BULLET_LIFETIME = 60; // frames
export const BULLET_COOLDOWN = 15; // frames
export const ASTEROID_SPEED_BASE = 1.5;
export const ASTEROID_VERTICES_MIN = 8;
export const ASTEROID_VERTICES_MAX = 12;
export const PARTICLE_LIFE = 30;
export const SCREEN_PADDING = 20; // For wrapping logic
export const INVULNERABILITY_TIME = 180; // frames (3 seconds)

export const COLORS = {
  BACKGROUND: '#000000',
  VECTOR: '#00ff00', // Classic phosphor green
  VECTOR_GLOW: 'rgba(0, 255, 0, 0.4)',
  SHIP_THRUST: '#ff9900',
  DANGER: '#ff3333',
};

// Points
export const POINTS = {
  LARGE: 20,
  MEDIUM: 50,
  SMALL: 100,
};
