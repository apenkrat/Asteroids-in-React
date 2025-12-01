import React, { useRef, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  GameState, Ship, Bullet, Asteroid, Particle, GameStatus, InputState, AsteroidSize 
} from '../types';
import { 
  FPS, SHIP_SIZE, SHIP_THRUST, SHIP_TURN_SPEED, SHIP_FRICTION,
  BULLET_SPEED, BULLET_LIFETIME, BULLET_COOLDOWN,
  ASTEROID_SPEED_BASE, PARTICLE_LIFE, INVULNERABILITY_TIME, COLORS, POINTS
} from '../constants';
import { generateAsteroidVertices, checkCollision, randomRange, degToRad } from '../utils/gameUtils';
import { soundManager } from '../utils/sound';

export const useAsteroidsGame = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  // We use Refs for mutable game state to avoid React render cycle overhead on the game loop
  const gameStateRef = useRef<GameState>({
    ship: null,
    bullets: [],
    asteroids: [],
    particles: [],
    score: 0,
    lives: 3,
    level: 1,
    status: GameStatus.MENU,
    screen: { width: 0, height: 0 },
  });

  // We use React state only for UI updates (score, lives, game over screen)
  const [uiState, setUiState] = useState({
    score: 0,
    lives: 3,
    status: GameStatus.MENU,
    level: 1,
  });

  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    up: false,
    shoot: false,
  });

  const animationFrameRef = useRef<number>();

  const initGame = useCallback(() => {
    if (!canvasRef.current) return;
    const { width, height } = canvasRef.current;
    
    gameStateRef.current = {
      ship: {
        id: 'ship',
        x: width / 2,
        y: height / 2,
        vx: 0,
        vy: 0,
        angle: -Math.PI / 2, // Facing up
        radius: SHIP_SIZE,
        rotationSpeed: 0,
        isThrusting: false,
        invulnerableUntil: 0,
        lastShot: 0,
        dead: false,
      },
      bullets: [],
      asteroids: [],
      particles: [],
      score: 0,
      lives: 3,
      level: 1,
      status: GameStatus.PLAYING,
      screen: { width, height },
    };

    spawnAsteroids(1);
    setUiState({
      score: 0,
      lives: 3,
      status: GameStatus.PLAYING,
      level: 1,
    });
    soundManager.resume();
  }, [canvasRef]);

  const spawnAsteroids = (level: number) => {
    const count = 2 + level; // Increase asteroids with level
    const { width, height } = gameStateRef.current.screen;
    const newAsteroids: Asteroid[] = [];

    for (let i = 0; i < count; i++) {
      // Spawn away from center (where ship spawns)
      let x, y;
      do {
        x = Math.random() * width;
        y = Math.random() * height;
      } while (Math.abs(x - width/2) < 200 && Math.abs(y - height/2) < 200);

      newAsteroids.push(createAsteroid(x, y, AsteroidSize.LARGE));
    }
    gameStateRef.current.asteroids = [...gameStateRef.current.asteroids, ...newAsteroids];
  };

  const createAsteroid = (x: number, y: number, size: AsteroidSize): Asteroid => {
    const radius = size === AsteroidSize.LARGE ? 40 : size === AsteroidSize.MEDIUM ? 20 : 10;
    return {
      id: uuidv4(),
      x,
      y,
      vx: randomRange(-ASTEROID_SPEED_BASE, ASTEROID_SPEED_BASE) * (4 - size), // Smaller = faster
      vy: randomRange(-ASTEROID_SPEED_BASE, ASTEROID_SPEED_BASE) * (4 - size),
      angle: 0,
      radius,
      size,
      dead: false,
      vertices: generateAsteroidVertices(radius),
    };
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3;
      gameStateRef.current.particles.push({
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: 0,
        radius: 1,
        life: PARTICLE_LIFE,
        maxLife: PARTICLE_LIFE,
        color,
        dead: false,
      });
    }
  };

  const respawnShip = () => {
    const { width, height } = gameStateRef.current.screen;
    if (gameStateRef.current.lives > 0) {
      gameStateRef.current.ship = {
        id: 'ship',
        x: width / 2,
        y: height / 2,
        vx: 0,
        vy: 0,
        angle: -Math.PI / 2,
        radius: SHIP_SIZE,
        rotationSpeed: 0,
        isThrusting: false,
        invulnerableUntil: Date.now() + 3000, // 3 seconds real time logic, but we use frames in loop usually. Using Date.now() for simplicity here.
        lastShot: 0,
        dead: false,
      };
    } else {
      gameStateRef.current.status = GameStatus.GAME_OVER;
      setUiState(prev => ({ ...prev, status: GameStatus.GAME_OVER }));
    }
  };

  const update = () => {
    const state = gameStateRef.current;
    const { width, height } = state.screen;

    if (state.status !== GameStatus.PLAYING) return;

    // --- SHIP LOGIC ---
    if (state.ship && !state.ship.dead) {
      const ship = state.ship;

      // Rotation
      if (inputRef.current.left) ship.angle -= SHIP_TURN_SPEED;
      if (inputRef.current.right) ship.angle += SHIP_TURN_SPEED;

      // Thrust
      ship.isThrusting = inputRef.current.up;
      if (ship.isThrusting) {
        ship.vx += Math.cos(ship.angle) * SHIP_THRUST;
        ship.vy += Math.sin(ship.angle) * SHIP_THRUST;
        
        // Thrust particles
        if (Math.random() > 0.5) {
             state.particles.push({
                id: uuidv4(),
                x: ship.x - Math.cos(ship.angle) * ship.radius,
                y: ship.y - Math.sin(ship.angle) * ship.radius,
                vx: -Math.cos(ship.angle) * 2 + (Math.random() - 0.5),
                vy: -Math.sin(ship.angle) * 2 + (Math.random() - 0.5),
                life: 10,
                maxLife: 10,
                radius: 1,
                angle: 0,
                color: COLORS.SHIP_THRUST,
                dead: false
            });
        }
        
        // Play sound throttled
        if (Math.random() > 0.8) soundManager.playThrust();
      }

      // Physics
      ship.x += ship.vx;
      ship.y += ship.vy;
      ship.vx *= SHIP_FRICTION;
      ship.vy *= SHIP_FRICTION;

      // Screen Wrapping
      if (ship.x < 0) ship.x = width;
      else if (ship.x > width) ship.x = 0;
      if (ship.y < 0) ship.y = height;
      else if (ship.y > height) ship.y = 0;

      // Shooting
      if (inputRef.current.shoot) {
        const now = Date.now();
        if (now - ship.lastShot > BULLET_COOLDOWN * (1000/60)) {
          state.bullets.push({
            id: uuidv4(),
            x: ship.x + Math.cos(ship.angle) * ship.radius,
            y: ship.y + Math.sin(ship.angle) * ship.radius,
            vx: Math.cos(ship.angle) * BULLET_SPEED,
            vy: Math.sin(ship.angle) * BULLET_SPEED,
            angle: ship.angle,
            radius: 2,
            timeLeft: BULLET_LIFETIME,
            dead: false,
          });
          ship.lastShot = now;
          soundManager.playShoot();
        }
      }
    }

    // --- BULLETS LOGIC ---
    state.bullets.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.timeLeft--;
      if (b.timeLeft <= 0) b.dead = true;
      
      // Wrap bullets? Classic Asteroids wraps bullets too.
      if (b.x < 0) b.x = width;
      if (b.x > width) b.x = 0;
      if (b.y < 0) b.y = height;
      if (b.y > height) b.y = 0;
    });

    // --- ASTEROIDS LOGIC ---
    state.asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;

      if (a.x < -a.radius) a.x = width + a.radius;
      if (a.x > width + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = height + a.radius;
      if (a.y > height + a.radius) a.y = -a.radius;
    });

    // --- PARTICLES LOGIC ---
    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) p.dead = true;
    });

    // --- COLLISION DETECTION ---
    
    // Bullet vs Asteroid
    state.bullets.forEach(b => {
      if (b.dead) return;
      state.asteroids.forEach(a => {
        if (a.dead) return;
        if (checkCollision(b, a)) {
          b.dead = true;
          a.dead = true;
          
          // Score
          let points = 0;
          if (a.size === AsteroidSize.LARGE) points = POINTS.LARGE;
          else if (a.size === AsteroidSize.MEDIUM) points = POINTS.MEDIUM;
          else points = POINTS.SMALL;
          
          state.score += points;

          // Sound
          soundManager.playExplosion('small');

          // Split Asteroid
          if (a.size !== AsteroidSize.SMALL) {
            const newSize = a.size === AsteroidSize.LARGE ? AsteroidSize.MEDIUM : AsteroidSize.SMALL;
            state.asteroids.push(createAsteroid(a.x, a.y, newSize));
            state.asteroids.push(createAsteroid(a.x, a.y, newSize));
          }

          // Particles
          createParticles(a.x, a.y, COLORS.VECTOR, 10);
        }
      });
    });

    // Ship vs Asteroid
    if (state.ship && !state.ship.dead && Date.now() > state.ship.invulnerableUntil) {
      state.asteroids.forEach(a => {
        if (a.dead) return;
        if (checkCollision(state.ship!, a)) {
          state.ship!.dead = true;
          state.lives--;
          createParticles(state.ship!.x, state.ship!.y, COLORS.DANGER, 30);
          soundManager.playExplosion('large');
          
          if (state.lives > 0) {
            setTimeout(() => respawnShip(), 1000); // Delay respawn
          } else {
             state.status = GameStatus.GAME_OVER;
          }
        }
      });
    }

    // Level cleanup
    state.bullets = state.bullets.filter(b => !b.dead);
    state.asteroids = state.asteroids.filter(a => !a.dead);
    state.particles = state.particles.filter(p => !p.dead);

    // Level progression
    if (state.asteroids.length === 0) {
        state.level++;
        spawnAsteroids(state.level);
    }

    // Update React UI state occasionally or when events happen
    // To minimize re-renders, we only do this if score/lives changed significantly or via manual sync
    // But since we are inside a requestAnimationFrame loop, we should NOT call setState every frame.
    // Instead, we will only set it if values changed that affect the UI overlay.
    // We can just rely on the GameStatus for major shifts, and maybe a throttled update for score.
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const { width, height } = state.screen;

    // Clear background
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    // Helper for vector drawing
    const drawPath = (vertices: {x: number, y: number}[], x: number, y: number, angle: number, color: string, closed: boolean = true) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        // Glow effect
        ctx.shadowBlur = 4;
        ctx.shadowColor = color;
        
        ctx.beginPath();
        if (vertices.length > 0) {
             ctx.moveTo(vertices[0].x, vertices[0].y);
             for(let i=1; i<vertices.length; i++) {
                 ctx.lineTo(vertices[i].x, vertices[i].y);
             }
        }
        if (closed) ctx.closePath();
        ctx.stroke();
        ctx.restore();
    };

    // Draw Ship
    if (state.ship && !state.ship.dead) {
        // Blink if invulnerable
        if (Date.now() < state.ship.invulnerableUntil && Math.floor(Date.now() / 100) % 2 === 0) {
            // invisible
        } else {
            const shipVertices = [
                {x: state.ship.radius, y: 0},
                {x: -state.ship.radius, y: state.ship.radius * 0.7},
                {x: -state.ship.radius * 0.6, y: 0},
                {x: -state.ship.radius, y: -state.ship.radius * 0.7}
            ];
            drawPath(shipVertices, state.ship.x, state.ship.y, state.ship.angle, COLORS.VECTOR);

            // Draw thrust flame
            if (state.ship.isThrusting) {
                 const flameVertices = [
                    {x: -state.ship.radius * 0.6, y: 0},
                    {x: -state.ship.radius * 1.5 - Math.random() * 10, y: 0}
                 ];
                 drawPath(flameVertices, state.ship.x, state.ship.y, state.ship.angle, COLORS.SHIP_THRUST, false);
            }
        }
    }

    // Draw Asteroids
    state.asteroids.forEach(a => {
        drawPath(a.vertices, a.x, a.y, a.angle, COLORS.VECTOR);
    });

    // Draw Bullets
    ctx.fillStyle = COLORS.VECTOR;
    ctx.shadowBlur = 4;
    ctx.shadowColor = COLORS.VECTOR;
    state.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Particles
    state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // We can update the UI state ref here to ensure the overlay stays in sync, 
    // but actual React state updates should be handled carefully.
    // Let's check if score changed and update only then.
    if (state.score !== uiState.score || state.lives !== uiState.lives || state.status !== uiState.status) {
         setUiState({
            score: state.score,
            lives: state.lives,
            status: state.status,
            level: state.level
         });
    }
  };

  const loop = useCallback(() => {
    update();
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) draw(ctx);
    }
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [uiState]); // uiState dep is just to keep linter happy, usually we don't want deps here but ref handles it.

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [loop]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft': inputRef.current.left = true; break;
        case 'ArrowRight': inputRef.current.right = true; break;
        case 'ArrowUp': inputRef.current.up = true; break;
        case 'Space': inputRef.current.shoot = true; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
       switch (e.code) {
        case 'ArrowLeft': inputRef.current.left = false; break;
        case 'ArrowRight': inputRef.current.right = false; break;
        case 'ArrowUp': inputRef.current.up = false; break;
        case 'Space': inputRef.current.shoot = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return { uiState, initGame };
};
