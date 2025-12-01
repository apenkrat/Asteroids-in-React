import { Point, AsteroidSize } from '../types';
import { ASTEROID_VERTICES_MIN, ASTEROID_VERTICES_MAX } from '../constants';

export const degToRad = (deg: number) => (deg * Math.PI) / 180;
export const radToDeg = (rad: number) => (rad * 180) / Math.PI;

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const generateAsteroidVertices = (radius: number): Point[] => {
  const vertices: Point[] = [];
  const count = Math.floor(randomRange(ASTEROID_VERTICES_MIN, ASTEROID_VERTICES_MAX));
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    // Vary the radius slightly to create jagged edges
    const r = radius * randomRange(0.8, 1.2);
    vertices.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }
  return vertices;
};

export const dist = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const checkCollision = (e1: { x: number; y: number; radius: number }, e2: { x: number; y: number; radius: number }) => {
  return dist(e1, e2) < e1.radius + e2.radius;
};
